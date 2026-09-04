/**
 * Hafız Muhafız — Çevrim Dışı (Offline) & IndexedDB Motoru (offline-engine.js)
 * Kur'an Ayetleri, Mealler, Sesler ve Sayfaları Cihazda Depolama & Yönetme
 */

class OfflineEngine {
    constructor() {
        this.dbName = 'hafiz_muhafiz_db';
        this.dbVersion = 1;
        this.db = null;
        this.isInitialized = false;
        this.isDownloading = false;
        this.shouldCancelDownload = false;
    }

    async init() {
        if (this.isInitialized && this.db) return this.db;

        return new Promise((resolve, reject) => {
            if (!('indexedDB' in window)) {
                console.warn('Bu tarayıcı IndexedDB desteklemiyor.');
                resolve(null);
                return;
            }

            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('pages')) {
                    db.createObjectStore('pages', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('juz_status')) {
                    db.createObjectStore('juz_status', { keyPath: 'juz' });
                }
                if (!db.objectStoreNames.contains('meta')) {
                    db.createObjectStore('meta', { keyPath: 'key' });
                }
            };

            request.onsuccess = (e) => {
                this.db = e.target.result;
                this.isInitialized = true;
                console.log('[OfflineEngine] IndexedDB başarıyla hazırlandı.');
                resolve(this.db);
            };

            request.onerror = (e) => {
                console.error('[OfflineEngine] IndexedDB başlatılamadı:', e);
                resolve(null);
            };
        });
    }

    // ==========================================
    // Sayfa Kaydetme & Getirme (IndexedDB)
    // ==========================================
    async savePage(pageNumber, imla, ayahs) {
        if (!this.db) await this.init();
        if (!this.db) return false;

        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction('pages', 'readwrite');
                const store = tx.objectStore('pages');
                const id = `${pageNumber}_${imla}`;
                const data = {
                    id: id,
                    pageNumber: parseInt(pageNumber),
                    imla: imla,
                    ayahs: ayahs,
                    savedAt: new Date().toISOString()
                };
                store.put(data);
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
            } catch (err) {
                console.warn('[OfflineEngine] Sayfa kaydedilemedi:', err);
                resolve(false);
            }
        });
    }

    async getPage(pageNumber, imla) {
        if (!this.db) await this.init();
        if (!this.db) return null;

        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction('pages', 'readonly');
                const store = tx.objectStore('pages');
                const id = `${pageNumber}_${imla}`;
                const request = store.get(id);

                request.onsuccess = (e) => {
                    const res = e.target.result;
                    if (res && res.ayahs && res.ayahs.length > 0) {
                        resolve(res.ayahs);
                    } else {
                        resolve(null);
                    }
                };

                request.onerror = () => resolve(null);
            } catch (err) {
                resolve(null);
            }
        });
    }

    // ==========================================
    // Aktif Cüzü Çevrim Dışına İndirme
    // ==========================================
    async downloadJuz(juzNumber, options = { withAudio: true, withImages: true }, onProgress = () => {}) {
        if (this.isDownloading) {
            alert('Halen devam eden bir indirme işlemi var.');
            return false;
        }

        this.isDownloading = true;
        this.shouldCancelDownload = false;

        const juzObj = QURAN_DATA.juzList.find(j => j.juz === parseInt(juzNumber)) || QURAN_DATA.juzList[0];
        const startPage = juzObj.startPage;
        const endPage = juzObj.endPage;
        const totalPages = endPage - startPage + 1;

        let processed = 0;

        try {
            for (let page = startPage; page <= endPage; page++) {
                if (this.shouldCancelDownload) {
                    onProgress({ current: processed, total: totalPages, status: 'canceled', message: 'İndirme iptal edildi.' });
                    this.isDownloading = false;
                    return false;
                }

                // 1. Diyanet İmlâsı ile Metin & Meal Çek ve Kaydet
                const ayahsDiyanet = await this.fetchAndSavePageFromNetwork(page, 'diyanet');
                
                // 2. Uthmani İmlâsı ile Metin Çek ve Kaydet
                await this.fetchAndSavePageFromNetwork(page, 'uthmani');

                // 3. Mushaf Baskı Görselini Önbelleğe Al
                if (options.withImages) {
                    try {
                        const imgUrl = QURAN_DATA.getPageImageUrl(page, 'madani');
                        await fetch(imgUrl, { mode: 'cors' });
                    } catch (e) {
                        // Resim önbellekleme hatası indirmeyi durdurmasın
                    }
                }

                // 4. Ayet Seslerini Önbelleğe Al
                if (options.withAudio && ayahsDiyanet && window.audioEngine) {
                    for (const ayah of ayahsDiyanet) {
                        try {
                            const audioUrl = window.audioEngine.getAyahAudioUrl(ayah);
                            await fetch(audioUrl, { mode: 'cors' });
                        } catch (e) {
                            // Ses önbellekleme hatası indirmeyi durdurmasın
                        }
                    }
                }

                processed++;
                const percent = Math.round((processed / totalPages) * 100);
                onProgress({
                    current: processed,
                    total: totalPages,
                    percentage: percent,
                    page: page,
                    status: 'downloading',
                    message: `${juzObj.name} • Sayfa ${page} indirildi (%${percent})`
                });
            }

            // Cüz durumunu kaydet
            await this.markJuzDownloaded(juzObj.juz, totalPages);

            onProgress({
                current: totalPages,
                total: totalPages,
                percentage: 100,
                status: 'completed',
                message: `🎉 ${juzObj.name} başarıyla çevrim dışına indirildi!`
            });

            this.isDownloading = false;
            return true;

        } catch (error) {
            console.error('[OfflineEngine] Cüz indirilirken hata:', error);
            onProgress({ current: processed, total: totalPages, status: 'error', message: 'İndirme sırasında bir hata oluştu.' });
            this.isDownloading = false;
            return false;
        }
    }

    // ==========================================
    // Tüm 604 Sayfanın Metin & Meallerini İndirme
    // ==========================================
    async downloadAllQuranText(onProgress = () => {}) {
        if (this.isDownloading) return false;

        this.isDownloading = true;
        this.shouldCancelDownload = false;

        const totalPages = 604;
        let processed = 0;

        for (let page = 1; page <= totalPages; page++) {
            if (this.shouldCancelDownload) {
                onProgress({ current: processed, total: totalPages, status: 'canceled', message: 'İndirme durduruldu.' });
                this.isDownloading = false;
                return false;
            }

            // Diyanet ve Uthmani metinlerini kaydet
            await this.fetchAndSavePageFromNetwork(page, 'diyanet');
            await this.fetchAndSavePageFromNetwork(page, 'uthmani');

            processed++;
            if (page % 5 === 0 || page === totalPages) {
                const percent = Math.round((processed / totalPages) * 100);
                onProgress({
                    current: processed,
                    total: totalPages,
                    percentage: percent,
                    page: page,
                    status: 'downloading',
                    message: `Kur'an-ı Kerim Metinleri İndiriliyor: Sayfa ${page} / 604 (%${percent})`
                });
            }
        }

        onProgress({
            current: totalPages,
            total: totalPages,
            percentage: 100,
            status: 'completed',
            message: `🎉 Tüm 604 sayfa ve mealler cihazınıza başarıyla kaydedildi!`
        });

        this.isDownloading = false;
        return true;
    }

    cancelDownload() {
        this.shouldCancelDownload = true;
    }

    async fetchAndSavePageFromNetwork(pageNumber, imlaMode) {
        try {
            const edition = imlaMode === 'diyanet' ? 'quran-simple-enhanced' : 'quran-uthmani';
            const [textRes, mealRes] = await Promise.all([
                fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/${edition}`),
                fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/tr.diyanet`)
            ]);

            const textData = await textRes.json();
            const mealData = await mealRes.json();

            if (textData.status === 'OK' && textData.data.ayahs) {
                const ayahs = textData.data.ayahs.map((a, idx) => {
                    const mealObj = mealData.status === 'OK' && mealData.data.ayahs ? mealData.data.ayahs[idx] : null;
                    const surahInfo = QURAN_DATA.getSurah(a.surah.number);
                    return {
                        surahNumber: a.surah.number,
                        surahNameTr: surahInfo.nameTr,
                        surahNameAr: surahInfo.nameAr || a.surah.name,
                        ayahNumber: a.numberInSurah,
                        globalNumber: a.number,
                        textArabic: a.text,
                        translationTr: mealObj ? mealObj.text : 'Meal yüklenemedi.',
                        pageNumber: pageNumber
                    };
                });

                await this.savePage(pageNumber, imlaMode, ayahs);
                return ayahs;
            }
        } catch (e) {
            console.warn(`[OfflineEngine] Sayfa ${pageNumber} API'den çekilemedi:`, e);
        }
        return null;
    }

    async markJuzDownloaded(juzNumber, pageCount) {
        if (!this.db) await this.init();
        if (!this.db) return;

        try {
            const tx = this.db.transaction('juz_status', 'readwrite');
            tx.objectStore('juz_status').put({
                juz: parseInt(juzNumber),
                isDownloaded: true,
                pageCount: pageCount,
                downloadedAt: new Date().toISOString()
            });
        } catch (e) {
            console.warn('[OfflineEngine] Cüz durumu güncellenemedi:', e);
        }
    }

    // ==========================================
    // Depolama İstatistikleri ve Önbellek Temizleme
    // ==========================================
    async getStorageStats() {
        if (!this.db) await this.init();

        let pageCount = 0;
        let downloadedJuzList = [];

        if (this.db) {
            await new Promise((resolve) => {
                const tx = this.db.transaction(['pages', 'juz_status'], 'readonly');
                const pageReq = tx.objectStore('pages').count();
                const juzReq = tx.objectStore('juz_status').getAll();

                pageReq.onsuccess = () => { pageCount = pageReq.result; };
                juzReq.onsuccess = () => { downloadedJuzList = juzReq.result.map(j => j.juz); };
                tx.oncomplete = () => resolve();
                tx.onerror = () => resolve();
            });
        }

        let estimateUsageMB = '0.0';
        let quotaMB = '0.0';

        if (navigator.storage && navigator.storage.estimate) {
            try {
                const estimate = await navigator.storage.estimate();
                estimateUsageMB = (estimate.usage / (1024 * 1024)).toFixed(1);
                quotaMB = (estimate.quota / (1024 * 1024)).toFixed(0);
            } catch (e) {}
        }

        return {
            pageCount,
            downloadedJuzList,
            estimateUsageMB,
            quotaMB
        };
    }

    async clearAllOfflineData() {
        if (this.db) {
            const tx = this.db.transaction(['pages', 'juz_status'], 'readwrite');
            tx.objectStore('pages').clear();
            tx.objectStore('juz_status').clear();
        }

        if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map(k => caches.delete(k)));
        }

        console.log('[OfflineEngine] Tüm çevrim dışı önbellek temizlendi.');
        return true;
    }
}

// Global olarak başlat
if (typeof window !== 'undefined') {
    window.offlineEngine = new OfflineEngine();
    window.offlineEngine.init();
}
