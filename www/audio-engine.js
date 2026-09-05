/**
 * Hafız Muhafız - Gelişmiş Ses, Tekrar ve Ezber Stratejileri Motoru (audio-engine.js)
 * Gruplu Ezber, Kelime Bazlı Ayet Parçalama ve Kümülatif (Eklemeli / Zincirleme) Ezber Desteği
 */

class AudioEngine {
    constructor() {
        this.audio = new Audio();
        
        // 16 Kâri Listesi & Quran.com API Recitation ID Eşleştirmesi
        this.reciters = [
            {
                id: 'husary_muallim',
                name: 'Mahmûd Halîl el-Husarî (Muallim / Eğitim)',
                folder: 'Husary_Muallim_128kbps',
                quranApiId: 12,
                style: 'Ağır & Talim (Eğitim Odaklı)',
                speedRecommended: '0.85x'
            },
            {
                id: 'husary',
                name: 'Mahmûd Halîl el-Husarî (Murattal)',
                folder: 'Husary_128kbps',
                quranApiId: 6,
                style: 'Klasik Murattal (Hafızlık Standardı)',
                speedRecommended: '0.85x'
            },
            {
                id: 'minshawi_mujawwad',
                name: 'Muhammed Sıddîk el-Minşâvî (Mücevved)',
                folder: 'Minshawy_Mujawwad_192kbps',
                quranApiId: 8,
                style: 'Duygulu & Tecvidli (Makamlı)',
                speedRecommended: '0.85x'
            },
            {
                id: 'minshawi',
                name: 'Muhammed Sıddîk el-Minşâvî (Murattal)',
                folder: 'Minshawy_Murattal_128kbps',
                quranApiId: 9,
                style: 'Akıcı & Ruhani Murattal',
                speedRecommended: '1.0x'
            },
            {
                id: 'abdulbaset_mujawwad',
                name: 'Abdussamed (Mücevved)',
                folder: 'AbdulSamad_64kbps_QuranExplorer.Com',
                quranApiId: 1,
                style: 'Klasik Mısır Ekolü (Yüksek Perde)',
                speedRecommended: '0.75x'
            },
            {
                id: 'abdulbaset',
                name: 'Abdussamed (Murattal)',
                folder: 'Abdul_Basit_Murattal_192kbps',
                quranApiId: 2,
                style: 'Hızlı & Düzgün Murattal',
                speedRecommended: '1.0x'
            },
            {
                id: 'afasy',
                name: 'Mişârî Râşid el-Afâsî',
                folder: 'Alafasy_128kbps',
                quranApiId: 7,
                style: 'Modern & Berrak Melodik',
                speedRecommended: '1.0x'
            },
            {
                id: 'shuraym',
                name: 'Suûd eş-Şüraym (Kâbe İmamı)',
                folder: 'Saood_ash-Shuraym_128kbps',
                quranApiId: 10,
                style: 'Akıcı & Seri Hadr/Hafızlık Hızı',
                speedRecommended: '1.25x'
            },
            {
                id: 'ghamdi',
                name: 'Sa\'d el-Gâmidî',
                folder: 'Ghamadi_40kbps',
                quranApiId: null,
                style: 'Duru • Berrak & Sakin',
                speedRecommended: '1.0x'
            },
            {
                id: 'sudais',
                name: 'Abdurrahman es-Sudeys (Kâbe Baş İmamı)',
                folder: 'Abdurrahmaan_As-Sudais_192kbps',
                quranApiId: 3,
                style: 'Meşhur Kâbe Tilaveti',
                speedRecommended: '1.0x'
            },
            {
                id: 'hudhaify',
                name: 'Ali el-Huzeyfî (Mescid-i Nebevî)',
                folder: 'Hudhaify_128kbps',
                quranApiId: 6,
                style: 'Ağırbaşlı • Kristal Netliğinde Tecvid',
                speedRecommended: '0.85x'
            },
            {
                id: 'basfar',
                name: 'Abdullah Basfar',
                folder: 'Abdullah_Basfar_192kbps',
                quranApiId: 4,
                style: 'Eğitim & Talim Odaklı',
                speedRecommended: '1.0x'
            },
            {
                id: 'ayman_suwayd',
                name: 'Dr. Eymen Suveyd (Tecvid & Talim)',
                folder: 'Ayman_Sowaid_64kbps',
                quranApiId: null,
                style: 'Harf Harf Kural ve Mahreç Talimi',
                speedRecommended: '0.75x'
            }
        ];

        this.currentReciter = this.reciters[0];
        this.currentAyahIndex = 0;
        this.ayahQueue = [];
        this.currentRepeatCount = 1;
        this.targetRepeats = 1; // 1, 3, 5, 7, 10, -1 (Sınırsız)
        this.pauseGapSeconds = 0; // Nefes payı
        this.isWaitingGap = false;
        this.gapCountdownTimer = null;
        this.playbackRate = 1.0;

        // Kelime zamanlama önbelleği (Surah:Ayah_Reciter -> Segments)
        this.segmentCache = {};

        // ==========================================
        // Gelişmiş Ezber Stratejileri Durumu
        // ==========================================
        this.strategy = 'standard'; // 'standard' | 'group' | 'slice' | 'reverse'
        
        // 1. Gruplu Ezber Durumu
        this.groupStart = 0;
        this.groupEnd = 0;
        this.groupRepeatCount = 1;
        this.groupTargetRepeats = 3;
        this.autoNextGroup = true;

        // 2. Ayet Dilimleme / Parçalama Durumu (Kümülatif & Kelime Hizalı)
        this.sliceMode = false;
        this.sliceCount = 3; // 2, 3, 4, 5
        this.sliceDirection = 'reverse'; // 'reverse' (Tersten Eklemeli) | 'forward' (Sıralı Eklemeli)
        this.sliceIsCumulative = true; // Kümülatif / Zincirleme Mod
        this.sliceRepeatCount = 1;
        this.sliceTargetRepeats = 3;
        this.sliceBounds = []; // [{ sliceIndex, start, end, fromWord, toWord }]
        this.currentFromSlice = 0;
        this.currentToSlice = 0;
        this.sliceStage = 0;
        this.isCalculatingSlices = false;

        // 3. Sondan Geriye Ezber Durumu
        this.isReverse = false;

        // Olay dinleyicileri
        this.onAyahChange = null;
        this.onStateChange = null;
        this.onTimeUpdate = null;
        this.onGapCountdown = null;
        this.onQueueEnd = null;
        this.onSliceUpdate = null;
        this.onGroupUpdate = null;

        this.initAudioEvents();
    }

    get isPlaying() {
        return this.audio && !this.audio.paused && !this.audio.ended;
    }

    initAudioEvents() {
        this.audio.addEventListener('ended', () => this.handleAyahEnded());
        this.audio.addEventListener('timeupdate', () => {
            if (this.onTimeUpdate) {
                this.onTimeUpdate(this.audio.currentTime, this.audio.duration || 0);
            }

            // Dilimleme / Parça Modu Zaman Kontrolü
            if (this.sliceMode && this.audio.duration && !this.isWaitingGap && !this.isCalculatingSlices) {
                this.checkSliceProgress();
            }

            if (window.hafizEngine && !this.audio.paused) {
                window.hafizEngine.addListeningTime(0.25);
            }
        });

        this.audio.addEventListener('play', () => {
            if (this.onStateChange) this.onStateChange(true);
        });
        this.audio.addEventListener('pause', () => {
            if (this.onStateChange && !this.isWaitingGap) this.onStateChange(false);
        });
        this.audio.addEventListener('error', (e) => {
            console.warn('Ses yüklenirken hata:', e);
            setTimeout(() => this.nextAyah(), 1000);
        });
    }

    // ==========================================
    // Kelime Zamanlama (Segments) & Akustik Sessizlik Tespiti
    // ==========================================

    /**
     * Quran.com API'den kelime kelime milisaniye zamanlamalarını çeker.
     * Bu sayede kelimeler ASLA ortadan bölünmez; tam kelime başında başlar, kelime sonunda biter.
     */
    async fetchVerseWordSegments(surahNumber, ayahNumber) {
        const qId = (this.currentReciter && this.currentReciter.quranApiId) ? this.currentReciter.quranApiId : 7;
        const cacheKey = `${surahNumber}_${ayahNumber}_${qId}`;
        if (this.segmentCache[cacheKey]) {
            return this.segmentCache[cacheKey];
        }

        try {
            const url = `https://api.quran.com/api/v4/verses/by_key/${surahNumber}:${ayahNumber}?words=true&audio=${qId}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            if (data && data.verse && data.verse.audio && Array.isArray(data.verse.audio.segments) && data.verse.audio.segments.length > 0) {
                const rawSegments = data.verse.audio.segments;
                const parsed = rawSegments.map((seg, idx) => {
                    let startMs, endMs, wordNum;
                    if (seg.length >= 4) {
                        wordNum = seg[1];
                        startMs = seg[2];
                        endMs = seg[3];
                    } else if (seg.length === 3) {
                        wordNum = seg[0];
                        startMs = seg[1];
                        endMs = seg[2];
                    } else {
                        startMs = seg[0];
                        endMs = seg[1];
                        wordNum = idx + 1;
                    }

                    return {
                        wordIndex: idx,
                        wordNum: wordNum,
                        // Kelimenin ilk harfinin (mahrecinin) kesilmemesi için 40ms ön pay
                        start: Math.max(0, (startMs / 1000) - 0.04),
                        end: (endMs / 1000) + 0.05
                    };
                });

                this.segmentCache[cacheKey] = parsed;
                return parsed;
            }
        } catch (err) {
            console.warn(`[AudioEngine] Kelime zamanlaması API'den alınamadı (${surahNumber}:${ayahNumber}):`, err);
        }
        return null;
    }

    /**
     * API verisi yoksa veya çevrim dışıysa Web Audio API ile doğal nefes/durak noktalarını tespit eder.
     */
    async detectAcousticSilenceSlices(audioUrl, duration, sliceCount) {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return null;
            const audioCtx = new AudioCtx();
            const resp = await fetch(audioUrl);
            const arrayBuf = await resp.arrayBuffer();
            const audioBuf = await audioCtx.decodeAudioData(arrayBuf);
            const channel = audioBuf.getChannelData(0);
            const sampleRate = audioBuf.sampleRate;
            const totalSamples = channel.length;

            const frameSize = Math.floor(sampleRate * 0.05); // 50ms pencereler
            const cutTimes = [];

            for (let i = 1; i < sliceCount; i++) {
                const idealTime = (i * duration) / sliceCount;
                // İdeal kesim noktası etrafında ±1.4 saniye aralığında en sessiz aralığı ara
                const searchStartSec = Math.max(0.4, idealTime - 1.4);
                const searchEndSec = Math.min(duration - 0.4, idealTime + 1.4);
                const startFrame = Math.floor(searchStartSec * sampleRate);
                const endFrame = Math.floor(searchEndSec * sampleRate);

                let minEnergy = Infinity;
                let bestSample = Math.floor(idealTime * sampleRate);

                for (let s = startFrame; s < endFrame; s += frameSize) {
                    let energy = 0;
                    const limit = Math.min(s + frameSize, totalSamples);
                    for (let k = s; k < limit; k++) {
                        energy += Math.abs(channel[k]);
                    }
                    if (energy < minEnergy) {
                        minEnergy = energy;
                        bestSample = s + Math.floor(frameSize / 2);
                    }
                }
                cutTimes.push(bestSample / sampleRate);
            }

            const bounds = [];
            let prev = 0;
            for (let i = 0; i < cutTimes.length; i++) {
                bounds.push({
                    sliceIndex: i,
                    start: prev,
                    end: cutTimes[i],
                    fromWord: null,
                    toWord: null
                });
                prev = cutTimes[i];
            }
            bounds.push({
                sliceIndex: cutTimes.length,
                start: prev,
                end: duration,
                fromWord: null,
                toWord: null
            });
            return bounds;
        } catch (e) {
            console.warn('[AudioEngine] Akustik sessizlik analizi hatası:', e);
            return null;
        }
    }

    /**
     * Ayeti bütün kelimelere bölerek parça sınırlarını (sliceBounds) oluşturur.
     */
    async buildAyahSlices(ayah, sliceCount) {
        const count = Math.max(2, Math.min(6, parseInt(sliceCount) || 3));

        // 1. Quran API'den tam kelime sınırlarını al
        if (ayah && ayah.surahNumber && ayah.ayahNumber) {
            const segments = await this.fetchVerseWordSegments(ayah.surahNumber, ayah.ayahNumber);
            if (segments && segments.length >= 2) {
                const totalWords = segments.length;
                const actualSlices = Math.min(count, totalWords);
                const wordsPerSlice = Math.ceil(totalWords / actualSlices);

                const bounds = [];
                for (let i = 0; i < actualSlices; i++) {
                    const startWordIdx = i * wordsPerSlice;
                    const endWordIdx = Math.min(totalWords - 1, (i + 1) * wordsPerSlice - 1);
                    const nextSliceWordIdx = (i + 1) * wordsPerSlice;

                    const startSec = (i === 0) ? 0 : segments[startWordIdx].start;

                    // Son parça için endSec daima ses dosyasının sonuna kadar (Infinity / tam süre) çalar.
                    // Ara parçalar için ise bir sonraki parçanın ilk kelimesinin başlangıç milisaniyesine kadar akar.
                    let endSec;
                    if (i === actualSlices - 1) {
                        endSec = Infinity; // Son kelimeyi (örn: dâhirîn) ASLA erken kesme, dosya sonuna kadar çal!
                    } else if (nextSliceWordIdx < totalWords && segments[nextSliceWordIdx]) {
                        endSec = segments[nextSliceWordIdx].start;
                    } else {
                        endSec = segments[endWordIdx].end;
                    }

                    bounds.push({
                        sliceIndex: i,
                        start: Math.max(0, startSec),
                        end: endSec,
                        fromWord: startWordIdx,
                        toWord: endWordIdx,
                        totalWords: totalWords
                    });
                }
                return bounds;
            }
        }

        const duration = (this.audio.duration && !isNaN(this.audio.duration) && this.audio.duration > 0) ? this.audio.duration : 15;

        // 2. Yedek: Akustik sessizlik analizi
        if (this.audio.src && duration > 2) {
            const acousticBounds = await this.detectAcousticSilenceSlices(this.audio.src, duration, count);
            if (acousticBounds && acousticBounds.length === count) {
                acousticBounds[acousticBounds.length - 1].end = Infinity;
                return acousticBounds;
            }
        }

        // 3. Basit matematiksel yedek
        const sliceDuration = duration / count;
        const fallbackBounds = [];
        for (let i = 0; i < count; i++) {
            fallbackBounds.push({
                sliceIndex: i,
                start: i * sliceDuration,
                end: (i === count - 1) ? Infinity : (i + 1) * sliceDuration,
                fromWord: null,
                toWord: null
            });
        }
        return fallbackBounds;
    }

    // ==========================================
    // Ayet Parçalama & Kümülatif (Eklemeli) İlerleme Motoru
    // ==========================================

    /**
     * Kümülatif parça sınırlarını döndürür.
     * Örneğin Tersten Kümülatifte:
     * - Aşama 1: [P_son .. P_son] (Sadece son parça)
     * - Aşama 2: [P_{son-1} .. P_son] (Son iki parça birlikte)
     * - Aşama 3: [P_0 .. P_son] (Tüm ayet)
     */
    getCurrentSliceBounds() {
        if (!this.sliceBounds || this.sliceBounds.length === 0) {
            return { start: 0, end: Infinity, fromWord: null, toWord: null };
        }

        const startBound = this.sliceBounds[this.currentFromSlice] || this.sliceBounds[0];
        const endBound = this.sliceBounds[this.currentToSlice] || this.sliceBounds[this.sliceBounds.length - 1];

        return {
            start: startBound.start,
            end: endBound.end,
            fromWord: startBound.fromWord,
            toWord: endBound.toWord,
            fromSlice: this.currentFromSlice,
            toSlice: this.currentToSlice,
            totalSlices: this.sliceBounds.length
        };
    }

    checkSliceProgress() {
        if (!this.sliceMode || this.isWaitingGap || this.isCalculatingSlices) return;

        const bounds = this.getCurrentSliceBounds();
        if (!bounds) return;

        const total = this.sliceBounds ? this.sliceBounds.length : 1;

        // EĞER SON PARÇAYI İÇEREN BİR AŞAMADAYSAK (toSlice === total - 1):
        // Asla yapay bir saniyede kesme! Ses dosyasının doğal olarak bitmesini bekle (ended event)
        if (this.currentToSlice >= total - 1 || bounds.end === Infinity) {
            return;
        }

        // Ara parçalar için: Bir sonraki parçanın başlangıç anına gelindiğinde dur
        if (this.audio.currentTime >= bounds.end) {
            this.handleSliceEnded();
        }
    }

    handleSliceEnded() {
        this.audio.pause();

        // 1. Mevcut aşamanın tekrarı devam ediyorsa
        if (this.sliceRepeatCount < this.sliceTargetRepeats) {
            this.sliceRepeatCount++;
            this.triggerGapOrPlay(() => {
                const bounds = this.getCurrentSliceBounds();
                this.audio.currentTime = bounds.start;
                this.audio.play().catch(e => console.warn(e));
                this.emitSliceUpdate();
            });
        } else {
            // 2. Mevcut aşamanın tekrarları bitti! Sıradaki kümülatif aşamaya geç
            const hasNextStage = this.advanceSliceStage();
            if (hasNextStage) {
                this.sliceRepeatCount = 1;
                this.triggerGapOrPlay(() => {
                    const bounds = this.getCurrentSliceBounds();
                    this.audio.currentTime = bounds.start;
                    this.audio.play().catch(e => console.warn(e));
                    this.emitSliceUpdate();
                });
            } else {
                // 3. Bu ayetteki tüm kümülatif aşamalar başarıyla bitti!
                this.handleAyahSliceFinished();
            }
        }
    }

    /**
     * Kümülatif aşamayı ilerletir.
     * @returns {boolean} Sıradaki bir aşama varsa true, ayet tamamen bittiyse false
     */
    advanceSliceStage() {
        const total = this.sliceBounds.length;
        if (total <= 1) return false;

        if (this.sliceIsCumulative) {
            if (this.sliceDirection === 'reverse') {
                // Tersten Eklemeli Usul: [P_son] -> [P_{son-1}..P_son] -> ... -> [P_0..P_son]
                if (this.currentFromSlice > 0) {
                    this.currentFromSlice--;
                    this.sliceStage++;
                    return true;
                }
                return false;
            } else {
                // Sıralı Eklemeli Usul: [P_0] -> [P_0..P_1] -> ... -> [P_0..P_son]
                if (this.currentToSlice < total - 1) {
                    this.currentToSlice++;
                    this.sliceStage++;
                    return true;
                }
                return false;
            }
        } else {
            // Tekil / Bağımsız Parça Modu (İsteğe bağlı)
            if (this.sliceDirection === 'reverse') {
                if (this.currentFromSlice > 0) {
                    this.currentFromSlice--;
                    this.currentToSlice = this.currentFromSlice;
                    this.sliceStage++;
                    return true;
                }
                return false;
            } else {
                if (this.currentFromSlice < total - 1) {
                    this.currentFromSlice++;
                    this.currentToSlice = this.currentFromSlice;
                    this.sliceStage++;
                    return true;
                }
                return false;
            }
        }
    }

    handleAyahSliceFinished() {
        const isReverseQueue = (this.sliceDirection === 'reverse' || this.isReverse);
        const hasNextAyah = isReverseQueue
            ? (this.currentAyahIndex > 0)
            : (this.currentAyahIndex < this.ayahQueue.length - 1);

        if (hasNextAyah) {
            this.triggerGapOrPlay(() => {
                this.currentAyahIndex += isReverseQueue ? -1 : 1;
                const nextAyah = this.currentAyah;
                this.loadAyah(nextAyah, false);
                this.setSliceMode(this.sliceCount, this.sliceTargetRepeats, this.sliceDirection, this.sliceIsCumulative);
            });
        } else {
            if (this.onQueueEnd) this.onQueueEnd();
        }
    }

    emitSliceUpdate() {
        if (!this.onSliceUpdate) return;
        const bounds = this.getCurrentSliceBounds();
        const total = this.sliceBounds ? this.sliceBounds.length : this.sliceCount;
        const fromNum = this.currentFromSlice + 1;
        const toNum = this.currentToSlice + 1;
        const isFull = (fromNum === 1 && toNum === total);

        this.onSliceUpdate({
            fromSlice: fromNum,
            toSlice: toNum,
            totalSlices: total,
            repeatCount: this.sliceRepeatCount,
            targetRepeats: this.sliceTargetRepeats,
            direction: this.sliceDirection,
            isCumulative: this.sliceIsCumulative,
            isFullAyah: isFull,
            fromWord: bounds.fromWord,
            toWord: bounds.toWord
        });
    }

    async setSliceMode(sliceCount = 3, targetRepeats = 3, direction = 'reverse', isCumulative = true) {
        this.strategy = 'slice';
        this.sliceMode = true;
        this.sliceCount = parseInt(sliceCount) || 3;
        this.sliceTargetRepeats = parseInt(targetRepeats) || 3;
        this.sliceDirection = direction === 'reverse' ? 'reverse' : 'forward';
        this.sliceIsCumulative = !!isCumulative;
        this.sliceRepeatCount = 1;
        this.sliceStage = 0;
        this.isCalculatingSlices = true;

        if (this.currentAyah) {
            this.sliceBounds = await this.buildAyahSlices(this.currentAyah, this.sliceCount);
        } else {
            this.sliceBounds = [];
        }

        const total = this.sliceBounds.length || this.sliceCount;

        // Başlangıç aşamasını ayarla
        if (this.sliceDirection === 'reverse') {
            this.currentFromSlice = total - 1;
            this.currentToSlice = total - 1;
        } else {
            this.currentFromSlice = 0;
            this.currentToSlice = 0;
        }

        this.isCalculatingSlices = false;

        const bounds = this.getCurrentSliceBounds();
        this.audio.currentTime = bounds.start;
        this.play();
        this.emitSliceUpdate();
    }

    // ==========================================
    // Kâri, Hız, Tekrar ve Kuyruk Yönetimi
    // ==========================================
    setReciter(reciterId) {
        const found = this.reciters.find(r => r.id === reciterId);
        if (found) {
            this.currentReciter = found;
            const wasPlaying = !this.audio.paused;
            if (this.currentAyah) {
                this.loadAyah(this.currentAyah, wasPlaying);
            }
            return true;
        }
        return false;
    }

    setPlaybackRate(rate) {
        this.playbackRate = parseFloat(rate) || 1.0;
        this.audio.playbackRate = this.playbackRate;
    }

    setRepeats(repeats) {
        this.targetRepeats = parseInt(repeats) || 1;
        this.currentRepeatCount = 1;
    }

    setPauseGap(seconds) {
        this.pauseGapSeconds = parseInt(seconds) || 0;
    }

    get currentAyah() {
        return this.ayahQueue[this.currentAyahIndex] || null;
    }

    setQueue(ayahList, startIndex = 0, autoPlay = false) {
        this.stopGapTimer();
        this.ayahQueue = ayahList || [];
        
        if (this.isReverse && startIndex === 0 && this.ayahQueue.length > 0) {
            this.currentAyahIndex = this.ayahQueue.length - 1;
        } else {
            this.currentAyahIndex = Math.max(0, Math.min(this.ayahQueue.length - 1, startIndex));
        }

        this.currentRepeatCount = 1;
        if (this.ayahQueue.length > 0) {
            this.loadAyah(this.currentAyah, autoPlay);
        }
    }

    getAyahAudioUrl(surahNumber, ayahNumber) {
        const s = String(surahNumber).padStart(3, '0');
        const a = String(ayahNumber).padStart(3, '0');
        return `https://everyayah.com/data/${this.currentReciter.folder}/${s}${a}.mp3`;
    }

    loadAyah(ayah, autoPlay = false) {
        if (!ayah) return;
        this.stopGapTimer();
        this.isWaitingGap = false;

        const audioUrl = this.getAyahAudioUrl(ayah.surahNumber, ayah.ayahNumber);
        this.audio.src = audioUrl;
        this.audio.playbackRate = this.playbackRate;

        // Dilimleme Modu Açıksa Yeni Ayet İçin Dilimleri Hesapla
        if (this.sliceMode) {
            this.buildAyahSlices(ayah, this.sliceCount).then(bounds => {
                this.sliceBounds = bounds;
                const total = this.sliceBounds.length || this.sliceCount;
                if (this.sliceDirection === 'reverse') {
                    this.currentFromSlice = total - 1;
                    this.currentToSlice = total - 1;
                } else {
                    this.currentFromSlice = 0;
                    this.currentToSlice = 0;
                }
                this.sliceRepeatCount = 1;
                const initialBounds = this.getCurrentSliceBounds();
                this.audio.currentTime = initialBounds.start;
                this.emitSliceUpdate();
                if (autoPlay) {
                    this.audio.play().catch(e => console.log('Otomatik oynatma bekliyor:', e));
                }
            });
        }

        this.updateMediaSession(ayah);

        if (this.onAyahChange) {
            this.onAyahChange(ayah, this.currentAyahIndex, this.currentRepeatCount, this.targetRepeats);
        }

        if (autoPlay && !this.sliceMode) {
            this.audio.play().catch(e => console.log('Otomatik oynatma bekliyor:', e));
        }
    }

    updateMediaSession(ayah) {
        if (!('mediaSession' in navigator) || !ayah) return;

        try {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: `${ayah.surahNumber}. ${ayah.surahNameTr} Suresi • ${ayah.ayahNumber}. Ayet`,
                artist: this.currentReciter.name,
                album: `Hafız Muhafız • Sayfa ${ayah.pageNumber}`,
                artwork: [
                    { src: 'https://images.quran.com/page/001.png', sizes: '192x192', type: 'image/png' },
                    { src: 'https://images.quran.com/page/001.png', sizes: '512x512', type: 'image/png' }
                ]
            });

            navigator.mediaSession.setActionHandler('play', () => this.play());
            navigator.mediaSession.setActionHandler('pause', () => this.pause());
            navigator.mediaSession.setActionHandler('previoustrack', () => this.prevAyah());
            navigator.mediaSession.setActionHandler('nexttrack', () => this.nextAyah());
        } catch (e) {}
    }

    play() {
        if (this.isWaitingGap) {
            this.stopGapTimer();
            this.nextAyah();
            return;
        }
        if (this.audio.src) {
            this.audio.play().catch(e => console.warn('Oynatma hatası:', e));
        } else if (this.currentAyah) {
            this.loadAyah(this.currentAyah, true);
        }
    }

    pause() {
        this.stopGapTimer();
        this.audio.pause();
    }

    togglePlay() {
        if (this.audio.paused && !this.isWaitingGap) {
            this.play();
        } else {
            this.pause();
        }
    }

    jumpToAyah(index, autoPlay = true) {
        if (index >= 0 && index < this.ayahQueue.length) {
            this.currentAyahIndex = index;
            this.currentRepeatCount = 1;
            this.loadAyah(this.ayahQueue[index], autoPlay);
        }
    }

    // ==========================================
    // Gruplu & Ters Ezber Modları
    // ==========================================
    setGroupMode(startIdx, endIdx, groupRepeats = 3, direction = 'forward') {
        this.strategy = 'group';
        this.groupStart = Math.min(startIdx, endIdx);
        this.groupEnd = Math.max(startIdx, endIdx);
        this.groupTargetRepeats = parseInt(groupRepeats) || 3;
        this.groupRepeatCount = 1;
        this.currentRepeatCount = 1;
        this.sliceMode = false;
        this.isReverse = (direction === 'reverse');

        this.jumpToAyah(this.isReverse ? this.groupEnd : this.groupStart);

        if (this.onGroupUpdate) {
            this.onGroupUpdate(this.groupStart, this.groupEnd, this.groupRepeatCount, this.groupTargetRepeats, this.isReverse);
        }
    }

    setReverseMode(enabled) {
        this.isReverse = !!enabled;
        if (this.isReverse) {
            this.strategy = 'reverse';
        } else if (this.strategy === 'reverse') {
            this.strategy = 'standard';
        }
    }

    clearSpecialModes() {
        this.strategy = 'standard';
        this.sliceMode = false;
        this.isReverse = false;
        this.sliceDirection = 'forward';
        this.groupStart = 0;
        this.groupEnd = this.ayahQueue.length - 1;
    }

    // ==========================================
    // Ayet Bitişinde İlerleme & Tekrar Yönetimi (Standart & Grup)
    // ==========================================
    handleAyahEnded() {
        if (this.sliceMode) {
            this.handleSliceEnded();
            return;
        }

        // 1. GRUPLU EZBER MODU
        if (this.strategy === 'group') {
            const isGroupEnd = this.isReverse 
                ? (this.currentAyahIndex <= this.groupStart)
                : (this.currentAyahIndex >= this.groupEnd);

            if (!isGroupEnd) {
                this.triggerGapOrPlay(() => {
                    this.currentAyahIndex += this.isReverse ? -1 : 1;
                    this.loadAyah(this.currentAyah, true);
                });
            } else {
                if (this.groupRepeatCount < this.groupTargetRepeats) {
                    this.groupRepeatCount++;
                    this.triggerGapOrPlay(() => {
                        this.currentAyahIndex = this.isReverse ? this.groupEnd : this.groupStart;
                        this.loadAyah(this.currentAyah, true);
                        if (this.onGroupUpdate) {
                            this.onGroupUpdate(this.groupStart, this.groupEnd, this.groupRepeatCount, this.groupTargetRepeats, this.isReverse);
                        }
                    });
                } else {
                    if (this.autoNextGroup) {
                        const span = (this.groupEnd - this.groupStart) + 1;
                        if (this.isReverse) {
                            if (this.groupStart > 0) {
                                const prevEnd = this.groupStart - 1;
                                const prevStart = Math.max(0, prevEnd - span + 1);
                                this.setGroupMode(prevStart, prevEnd, this.groupTargetRepeats, 'reverse');
                            } else if (this.onQueueEnd) {
                                this.onQueueEnd();
                            }
                        } else {
                            if (this.groupEnd < this.ayahQueue.length - 1) {
                                const nextStart = this.groupEnd + 1;
                                const nextEnd = Math.min(this.ayahQueue.length - 1, nextStart + span - 1);
                                this.setGroupMode(nextStart, nextEnd, this.groupTargetRepeats, 'forward');
                            } else if (this.onQueueEnd) {
                                this.onQueueEnd();
                            }
                        }
                    } else if (this.onQueueEnd) {
                        this.onQueueEnd();
                    }
                }
            }
            return;
        }

        // 2. STANDART / TEKİL AYET TEKRAR MODU
        const isInfinite = this.targetRepeats === -1;
        const reachedTarget = !isInfinite && this.currentRepeatCount >= this.targetRepeats;

        if (!reachedTarget) {
            this.currentRepeatCount++;
            this.triggerGapOrPlay(() => {
                this.audio.currentTime = 0;
                this.audio.playbackRate = this.playbackRate;
                if (this.onAyahChange) {
                    this.onAyahChange(this.currentAyah, this.currentAyahIndex, this.currentRepeatCount, this.targetRepeats);
                }
                this.audio.play().catch(e => console.warn(e));
            });
        } else {
            this.currentRepeatCount = 1;
            const hasNext = this.isReverse 
                ? (this.currentAyahIndex > 0)
                : (this.currentAyahIndex < this.ayahQueue.length - 1);

            if (hasNext) {
                this.triggerGapOrPlay(() => {
                    this.currentAyahIndex += this.isReverse ? -1 : 1;
                    this.loadAyah(this.currentAyah, true);
                });
            } else {
                if (this.onQueueEnd) this.onQueueEnd();
            }
        }
    }

    triggerGapOrPlay(callback) {
        if (this.pauseGapSeconds > 0) {
            this.isWaitingGap = true;
            let countdown = this.pauseGapSeconds;
            if (this.onGapCountdown) this.onGapCountdown(countdown);

            this.gapCountdownTimer = setInterval(() => {
                countdown--;
                if (this.onGapCountdown) this.onGapCountdown(countdown);

                if (countdown <= 0) {
                    this.stopGapTimer();
                    this.isWaitingGap = false;
                    callback();
                }
            }, 1000);
        } else {
            callback();
        }
    }

    stopGapTimer() {
        if (this.gapCountdownTimer) {
            clearInterval(this.gapCountdownTimer);
            this.gapCountdownTimer = null;
        }
        this.isWaitingGap = false;
        if (this.onGapCountdown) this.onGapCountdown(0);
    }

    nextAyah() {
        if (this.isReverse) {
            if (this.currentAyahIndex > 0) {
                this.currentRepeatCount = 1;
                this.currentAyahIndex--;
                this.loadAyah(this.currentAyah, true);
            }
        } else {
            if (this.currentAyahIndex < this.ayahQueue.length - 1) {
                this.currentRepeatCount = 1;
                this.currentAyahIndex++;
                this.loadAyah(this.currentAyah, true);
            }
        }
    }

    prevAyah() {
        if (this.isReverse) {
            if (this.currentAyahIndex < this.ayahQueue.length - 1) {
                this.currentRepeatCount = 1;
                this.currentAyahIndex++;
                this.loadAyah(this.currentAyah, true);
            }
        } else {
            if (this.currentAyahIndex > 0) {
                this.currentRepeatCount = 1;
                this.currentAyahIndex--;
                this.loadAyah(this.currentAyah, true);
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.audioEngine = new AudioEngine();
}
