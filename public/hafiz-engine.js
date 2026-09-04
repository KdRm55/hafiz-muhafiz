/**
 * Hafız Muhafız — Türk / Osmanlı Usulü Hafızlık Dönüş Motoru
 * Asırlık Klasik Usul: Her cüzün son sayfasından geriye doğru ezberleme sistemi
 */

class HafizEngine {
    constructor() {
        this.STORAGE_KEY = 'hafiz_muhafiz_matrix_v1';
        this.STATS_KEY = 'hafiz_muhafiz_stats_v1';
        this.matrix = this.loadMatrix();
        this.stats = this.loadStats();
    }

    /**
     * Cüz ve Dönüş numarasına göre Türk Usulü Ders Paketini hesaplar
     * @param {number} juz - Cüz No (1 - 30)
     * @param {number} rotation - Dönüş No (1 - 20)
     * @returns {Object} Ders detayları (Ham sayfa, Has sayfalar, toplam sayfa)
     */
    calculateLesson(juz, rotation) {
        juz = Math.max(1, Math.min(30, parseInt(juz) || 1));
        rotation = Math.max(1, Math.min(20, parseInt(rotation) || 1));

        const juzInfo = QURAN_DATA.juzList[juz - 1];
        const endPage = juzInfo.endPage;
        const startPage = juzInfo.startPage;

        // Türk hafızlık usulü: Aslolan DÖNÜŞTÜR.
        // 1. Dönüşte her cüzün 20. (son) sayfası verilir.
        // 8. Dönüşte her cüzün 13. sayfası (20 - 7) verilir.
        // 20. Dönüşte her cüzün 1. sayfası verilir.
        const pageInJuz = 20 - (rotation - 1);
        let hamPage = endPage - (rotation - 1);
        if (hamPage < startPage) {
            hamPage = startPage;
        }

        // Cüz İçi Has Sayfalar: O cüzün daha önceki dönüşlerinde ezberlenmiş sayfalar (hamPage + 1'den endPage'e kadar)
        const hasPages = [];
        for (let p = hamPage + 1; p <= endPage; p++) {
            hasPages.push(p);
        }

        // Tüm ders sayfaları dizisi (Ham başta, ardından Has sayfalar)
        const allPages = [hamPage, ...hasPages];

        return {
            juz,
            rotation,
            pageInJuz,
            juzName: juzInfo.name,
            juzStartPage: startPage,
            juzEndPage: endPage,
            hamPage,
            hasPages,
            allPages,
            totalPagesCount: allPages.length,
            isCompleted: this.isCellCompleted(juz, rotation),
            hamTitle: `Cüzün ${pageInJuz}. Sayfası`,
            hasTitle: hasPages.length > 0 ? `Cüzün ${pageInJuz + 1} - 20. Sayfaları (${hasPages.length} sayfa)` : 'İlk Dönüş (Haslama yok)',
            description: `${rotation}. Dönüş • ${juz}. Cüz (${juzInfo.name}) | Ham: Cüzün ${pageInJuz}. Sayfası (Mushaf s. ${hamPage}) | Has: ${hasPages.length} sayfa`
        };
    }

    /**
     * Cüzler Arası Zincirleme Dönüş Haslama Hesabı
     * Örneğin: 1. Dönüş seçilirse 1. Cüzden hedef cüze kadar her cüzün 1. dönüş sayfalarını zincirler.
     * @param {number} targetRotation - Haslanacak dönüş no (1 - 20)
     * @param {number} fromJuz - Başlangıç cüzü (varsayılan: 1)
     * @param {number} toJuz - Bitiş cüzü / Hedef Ham (varsayılan: 24 veya 30)
     * @returns {Object} Zincirleme haslama paketi
     */
    calculateCrossJuzHaslama(targetRotation, fromJuz = 1, toJuz = 30) {
        targetRotation = Math.max(1, Math.min(20, parseInt(targetRotation) || 1));
        fromJuz = Math.max(1, Math.min(30, parseInt(fromJuz) || 1));
        toJuz = Math.max(fromJuz, Math.min(30, parseInt(toJuz) || 30));
        const pageInJuz = 20 - (targetRotation - 1);

        const chainItems = [];
        for (let j = fromJuz; j <= toJuz; j++) {
            const juzInfo = QURAN_DATA.juzList[j - 1];
            const page = juzInfo.endPage - (targetRotation - 1);
            if (page >= juzInfo.startPage) {
                chainItems.push({
                    juz: j,
                    juzName: juzInfo.name,
                    page: page,
                    rotation: targetRotation,
                    pageInJuz: pageInJuz,
                    isCompleted: this.isCellCompleted(j, targetRotation)
                });
            }
        }

        const allPages = chainItems.map(item => item.page);

        return {
            targetRotation,
            fromJuz,
            toJuz,
            pageInJuz,
            chainItems,
            allPages,
            totalPagesCount: allPages.length,
            description: `${targetRotation}. Dönüş Haslaması (${fromJuz} - ${toJuz}. Cüzlerin ${pageInJuz}. Sayfaları • Toplam ${allPages.length} Sayfa)`
        };
    }

    /**
     * Hafızlık İlerleme Matrisini Yükler (30 Cüz x 20 Dönüş = 600 Hücre)
     */
    loadMatrix() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY) || localStorage.getItem('hafiz_nuru_matrix_v1');
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.warn('LocalStorage okunamadı:', e);
        }

        // Varsayılan boş matris oluştur
        const matrix = {};
        for (let j = 1; j <= 30; j++) {
            matrix[j] = {};
            for (let r = 1; r <= 20; r++) {
                matrix[j][r] = {
                    completed: false,
                    hasCompleted: false,
                    timestamp: null
                };
            }
        }
        return matrix;
    }

    saveMatrix() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.matrix));
        } catch (e) {
            console.warn('LocalStorage yazılamadı:', e);
        }
    }

    isCellCompleted(juz, rotation) {
        return !!(this.matrix[juz] && this.matrix[juz][rotation] && this.matrix[juz][rotation].completed);
    }

    toggleCellCompleted(juz, rotation) {
        if (!this.matrix[juz]) this.matrix[juz] = {};
        if (!this.matrix[juz][rotation]) {
            this.matrix[juz][rotation] = { completed: false, hasCompleted: false, timestamp: null };
        }

        const current = this.matrix[juz][rotation].completed;
        this.matrix[juz][rotation].completed = !current;
        this.matrix[juz][rotation].timestamp = !current ? new Date().toISOString() : null;
        this.saveMatrix();

        if (!current) {
            this.recordProgressStat();
        }

        return this.matrix[juz][rotation].completed;
    }

    /**
     * Genel Hafızlık İstatistiklerini hesaplar
     */
    getMatrixStats() {
        let totalCells = 30 * 20; // 600
        let completedCells = 0;
        const juzProgress = [];

        for (let j = 1; j <= 30; j++) {
            let jDone = 0;
            for (let r = 1; r <= 20; r++) {
                if (this.matrix[j] && this.matrix[j][r] && this.matrix[j][r].completed) {
                    completedCells++;
                    jDone++;
                }
            }
            juzProgress.push({
                juz: j,
                completedRotations: jDone,
                percentage: Math.round((jDone / 20) * 100)
            });
        }

        const overallPercentage = ((completedCells / totalCells) * 100).toFixed(1);

        return {
            totalCells,
            completedCells,
            remainingCells: totalCells - completedCells,
            overallPercentage,
            juzProgress
        };
    }

    loadStats() {
        try {
            const saved = localStorage.getItem(this.STATS_KEY) || localStorage.getItem('hafiz_nuru_stats_v1');
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.warn('LocalStorage stats okunamadı:', e);
        }
        return {
            todayListeningMinutes: 0,
            totalListeningMinutes: 0,
            completedLessonsCount: 0,
            lastDate: new Date().toDateString()
        };
    }

    saveStats() {
        try {
            localStorage.setItem(this.STATS_KEY, JSON.stringify(this.stats));
        } catch (e) {
            console.warn('Stats yazılamadı:', e);
        }
    }

    addListeningTime(seconds) {
        const today = new Date().toDateString();
        if (this.stats.lastDate !== today) {
            this.stats.todayListeningMinutes = 0;
            this.stats.lastDate = today;
        }

        const mins = seconds / 60;
        this.stats.todayListeningMinutes = parseFloat((this.stats.todayListeningMinutes + mins).toFixed(1));
        this.stats.totalListeningMinutes = parseFloat((this.stats.totalListeningMinutes + mins).toFixed(1));
        this.saveStats();
    }

    recordProgressStat() {
        this.stats.completedLessonsCount = (this.stats.completedLessonsCount || 0) + 1;
        this.saveStats();
    }
}

if (typeof window !== 'undefined') {
    window.hafizEngine = new HafizEngine();
}
