/**
 * Hafız Nuru TR - Ana Uygulama Mantığı (app.js)
 * İnteraktif 15-Satır Mushaf Sayfası, Ayet Vurgulama, Türk Usulü Dönüş Motoru
 */

document.addEventListener('DOMContentLoaded', () => {
    // Uygulama Durumu (State)
    const state = {
        currentJuz: 24,       // Varsayılan: 24. Cüz (Kullanıcı örneği)
        currentRotation: 8,   // Varsayılan: 8. Dönüş (Kullanıcı örneği)
        currentMode: 'ham',   // 'ham', 'has', 'full'
        activeView: 'live',   // 'live' (İnteraktif Mushaf), 'facsimile', 'ayah'
        currentPage: 474,
        zoomLevel: 100,       // 80% .. 150%
        paperTheme: 'night',  // 'night', 'sepia', 'cream'
        mushafFont: 'hafiz-osman', // 'hafiz-osman', 'ahmed-husrev', 'hasan-riza', 'osman-taha', 'diyanet-digital'
        imlaMode: 'diyanet',   // 'diyanet' (Temiz Türk/Diyanet İmlâsı), 'uthmani' (Medine Resm-i Osmanî)
        facsimileType: 'madani', // 'madani', 'tajweed', 'warsh'
        chainHaslama: {
            targetRotation: 1,
            fromJuz: 1,
            toJuz: 24,
            chain: null,
            currentChainIndex: 0
        },
        lesson: null,
        pageAyahs: [],
        cache: {}
    };

    const FONT_METADATA = {
        'hafiz-osman': { name: 'Hattat Hâfız Osman', sub: 'Hattat Hâfız Osman • 15 Satır Âyet-Berkenar' },
        'ahmed-husrev': { name: 'Hattat Ahmed Hüsrev', sub: 'Hattat Ahmed Hüsrev Altınbaşak • Tevâfuklu Hayrât Hattı' },
        'hasan-riza': { name: 'Hattat Hasan Rıza', sub: 'Hattat Hasan Rıza Efendi • Klasik Osmanlı Neshi' },
        'osman-taha': { name: 'Hattat Osman Taha', sub: 'Hattat Osman Taha • Medine Mushaf Hattı' },
        'diyanet-digital': { name: 'Diyanet Bilgisayar', sub: 'Diyanet Dijital Bilgisayar Hattı' }
    };

    // Türk & Osmanlı Kur'an İmlâsı Temizleyici (Yazım Hatalarını ve Uyumsuz Glifleri Düzeltir)
    function sanitizeTurkishQuranText(text) {
        if (!text) return '';
        let t = text;
        // 1. Birleşik olmayan veya tatweel ile koparılmış elif-lam / hemzeleri düzelt:
        // لَـَٔ -> لَآ , ـَٔ -> آ , ءَايَ -> آيَ
        t = t.replace(/لَـَٔ/g, 'لَآ');
        t = t.replace(/لـَٔ/g, 'لآ');
        t = t.replace(/ـَٔ/g, 'آ');
        t = t.replace(/ءَا/g, 'آ');
        t = t.replace(/لَـٔ/g, 'لَآ');
        t = t.replace(/ـٔ/g, 'ء');

        // 2. Kelimelerin altında garip küçük mim (U+06ED küçük alt mim) çıkaran iqlab işaretini kaldır:
        // (Kullanıcının gönderdiği nefsin ve külli kelimelerinin altındaki mim harfi)
        t = t.replace(/\u06ED/g, '');

        // 3. Okunmayan harflerin üstündeki garip küçük sıfır/daireleri kaldır:
        t = t.replace(/\u06DF/g, ''); // Small high rounded zero
        t = t.replace(/\u06E0/g, ''); // Small high upright rectangular zero
        t = t.replace(/\u06E2/g, ''); // Small high meem isolated

        // 4. Elif-i Vasla (ٱ U+0671) karakterini standart Elif (ا U+0627) ile değiştir:
        t = t.replace(/\u0671/g, '\u0627');

        // 5. Harfleri gereksiz yere parçalayan tekil keşideleri (ـ U+0640) temizle:
        t = t.replace(/\u0640/g, '');

        return t;
    }

    // Arapça Rakam Dönüştürücü
    const toArabicNumerals = (num) => {
        const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        return String(num).split('').map(d => arabicDigits[d] || d).join('');
    };

    // DOM Elemanları
    const selectJuz = document.getElementById('select-juz');
    const selectRotation = document.getElementById('select-rotation');
    const chipHamPage = document.getElementById('chip-ham-page');
    const chipLessonScope = document.getElementById('chip-lesson-scope');
    const btnToggleCompleted = document.getElementById('btn-toggle-completed');
    const textCompletedStatus = document.getElementById('text-completed-status');

    const modeHam = document.getElementById('mode-ham');
    const modeChainHas = document.getElementById('mode-chain-has');

    const cardStandardLesson = document.getElementById('card-standard-lesson');
    const panelChainHaslama = document.getElementById('panel-chain-haslama');
    const selectHaslamaRotation = document.getElementById('select-haslama-rotation');
    const selectHaslamaTargetJuz = document.getElementById('select-haslama-target-juz');
    const badgeChainSummary = document.getElementById('badge-chain-summary');
    const btnOpenChainList = document.getElementById('btn-open-chain-list');
    const modalChainList = document.getElementById('modal-chain-list');
    const chainItemsGrid = document.getElementById('chain-items-grid');
    const chainModalTitle = document.getElementById('chain-modal-title');

    const tabMushafLive = document.getElementById('tab-mushaf-live');
    const tabMushafFacsimile = document.getElementById('tab-mushaf-facsimile');
    const tabAyahView = document.getElementById('tab-ayah-view');

    const containerMushafLive = document.getElementById('container-mushaf-live');
    const containerMushafFacsimile = document.getElementById('container-mushaf-facsimile');
    const containerAyahView = document.getElementById('container-ayah-view');

    const mushafScaleWrapper = document.getElementById('mushaf-scale-wrapper');
    const mushafTextFlow = document.getElementById('mushaf-text-flow');
    const mushafJuzTitle = document.getElementById('mushaf-juz-title');
    const mushafSurahTitle = document.getElementById('mushaf-surah-title');
    const mushafPageNumber = document.getElementById('mushaf-page-number');
    const rosetteJuzNum = document.getElementById('rosette-juz-num');
    const sheetLessonTag = document.getElementById('sheet-lesson-tag');

    const btnPrevPage = document.getElementById('btn-prev-page');
    const btnNextPage = document.getElementById('btn-next-page');
    const badgePageNum = document.getElementById('badge-page-num');

    const mushafImage = document.getElementById('mushaf-image');
    const facsimileJuzInfo = document.getElementById('facsimile-juz-info');
    const facsimileSurahInfo = document.getElementById('facsimile-surah-info');
    const facsimilePageLabel = document.getElementById('facsimile-page-label');
    const facsimileLoadingSpinner = document.getElementById('facsimile-loading-spinner');
    const selectFacsimileEdition = document.getElementById('select-facsimile-edition');

    // Zoom & Tema Elemanları
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const labelZoom = document.getElementById('label-zoom');
    const paperThemeBtns = document.querySelectorAll('.btn-paper-theme');

    // Çekmece Elemanları
    const btnToggleTranslationDrawer = document.getElementById('btn-toggle-translation-drawer');
    const translationDrawer = document.getElementById('translation-drawer');
    const btnCloseDrawer = document.getElementById('btn-close-drawer');
    const drawerAyahsList = document.getElementById('drawer-ayahs-list');

    // Deck Elemanları
    const btnDeckPlay = document.getElementById('btn-deck-play');
    const deckPlayIcon = document.getElementById('deck-play-icon');
    const btnPrevAyah = document.getElementById('btn-prev-ayah');
    const btnNextAyah = document.getElementById('btn-next-ayah');
    const deckTrackTitle = document.getElementById('deck-track-title');
    const deckTrackSub = document.getElementById('deck-track-sub');
    const gapCountdownBadge = document.getElementById('gap-countdown-badge');
    const gapSeconds = document.getElementById('gap-seconds');
    const timeCurrent = document.getElementById('time-current');
    const timeDuration = document.getElementById('time-duration');
    const progressTrack = document.getElementById('progress-track');
    const progressFill = document.getElementById('progress-fill');

    const selectRepeats = document.getElementById('select-repeats');
    const selectSpeed = document.getElementById('select-speed');
    const selectGap = document.getElementById('select-gap');

    const headerReciterName = document.getElementById('header-reciter-name');
    const headerListeningTime = document.getElementById('header-listening-time');
    const deckReciterAvatar = document.getElementById('deck-reciter-avatar');

    // Quick Search & Jump Elemanları
    const inputQuickSearch = document.getElementById('input-quick-search');
    const quickSearchDropdown = document.getElementById('quick-search-dropdown');
    const badgeHeaderProgress = document.getElementById('badge-header-progress');
    const btnStagePrev = document.getElementById('btn-stage-prev');
    const btnStageNext = document.getElementById('btn-stage-next');
    const btnOpenShortcuts = document.getElementById('btn-open-shortcuts');
    const modalShortcuts = document.getElementById('modal-shortcuts');

    // Modallar
    const btnOpenMatrix = document.getElementById('btn-open-matrix');
    const btnOpenReciters = document.getElementById('btn-open-reciters');
    const btnOpenStats = document.getElementById('btn-open-stats');
    const modalMatrix = document.getElementById('modal-matrix');
    const modalReciters = document.getElementById('modal-reciters');
    const modalStats = document.getElementById('modal-stats');

    // Çevrim Dışı (Offline) & Cihaza Yükle Modal Elemanları
    const btnOpenOffline = document.getElementById('btn-open-offline');
    const modalOffline = document.getElementById('modal-offline');
    const btnOpenInstall = document.getElementById('btn-open-install');
    const modalInstall = document.getElementById('modal-install');
    const btnTriggerPwaInstall = document.getElementById('btn-trigger-pwa-install');
    let deferredInstallPrompt = null;

    const badgeNetworkStatus = document.getElementById('badge-network-status');
    const btnDownloadActiveJuz = document.getElementById('btn-download-active-juz');
    const btnDownloadAllText = document.getElementById('btn-download-all-text');
    const btnCancelDownload = document.getElementById('btn-cancel-download');
    const btnClearCache = document.getElementById('btn-clear-cache');
    const offlineStatPages = document.getElementById('offline-stat-pages');
    const offlineStatJuzs = document.getElementById('offline-stat-juzs');
    const offlineStatStorage = document.getElementById('offline-stat-storage');
    const offlineProgressWrap = document.getElementById('offline-progress-wrap');
    const offlineProgressBar = document.getElementById('offline-progress-bar');
    const offlineProgressText = document.getElementById('offline-progress-text');
    const labelActiveJuzDownload = document.getElementById('label-active-juz-download');

    // Ezber Stratejisi Elemanları
    const btnToggleStrategyPanel = document.getElementById('btn-toggle-strategy-panel');
    const panelEzberStrategy = document.getElementById('panel-ezber-strategy');
    const stratTabBtns = document.querySelectorAll('.strat-tab-btn');
    const stratControlsGroup = document.getElementById('strat-controls-group');
    const stratControlsSlice = document.getElementById('strat-controls-slice');
    const stratControlsReverse = document.getElementById('strat-controls-reverse');
    const selGroupStart = document.getElementById('sel-group-start');
    const selGroupEnd = document.getElementById('sel-group-end');
    const selGroupRepeats = document.getElementById('sel-group-repeats');
    const selGroupDirection = document.getElementById('sel-group-direction');
    const btnApplyGroup = document.getElementById('btn-apply-group');
    const quickGroupBtns = document.querySelectorAll('.btn-quick-group');
    const selSliceCount = document.getElementById('sel-slice-count');
    const selSliceRepeats = document.getElementById('sel-slice-repeats');
    const selSliceDirection = document.getElementById('sel-slice-direction');
    const selSliceCumulative = document.getElementById('sel-slice-cumulative');
    const btnStartSlice = document.getElementById('btn-start-slice');
    const btnStartReverse = document.getElementById('btn-start-reverse');
    const btnToolbarStrategy = document.getElementById('btn-toolbar-strategy');

    // Popover Elemanları
    const ayahQuickActions = document.getElementById('ayah-quick-actions');
    const popBtnPlay = document.getElementById('pop-btn-play');
    const popBtnRepeat = document.getElementById('pop-btn-repeat');
    const popBtnGroupStart = document.getElementById('pop-btn-group-start');
    const popBtnGroupEnd = document.getElementById('pop-btn-group-end');
    const popBtnSlice = document.getElementById('pop-btn-slice');
    const popBtnMeal = document.getElementById('pop-btn-meal');
    let selectedAyahIndexForPopover = 0;

    // ==========================================
    // 1. Başlangıç (Init)
    // ==========================================
    function init() {
        registerServiceWorker();
        setupNetworkStatus();
        populateSelectors();
        populateChainSelectors();
        bindEvents();
        setupAudioEngineCallbacks();
        setMushafFont(state.mushafFont);
        if (headerReciterName && window.audioEngine && window.audioEngine.currentReciter) {
            headerReciterName.textContent = window.audioEngine.currentReciter.name.replace(/\s*\(.*?\)\s*/g, '');
        }
        loadLesson(state.currentJuz, state.currentRotation);
        updateHeaderStats();
    }

    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('[PWA] Service Worker aktif:', reg.scope))
                .catch(err => console.warn('[PWA] Service Worker kaydedilemedi:', err));
        }
    }

    function setupNetworkStatus() {
        function updateStatus() {
            if (!badgeNetworkStatus) return;
            const isOnline = navigator.onLine;
            badgeNetworkStatus.className = `network-badge ${isOnline ? 'online' : 'offline'}`;
            badgeNetworkStatus.innerHTML = isOnline
                ? '<i class="fa-solid fa-wifi"></i> <span class="badge-text hide-mobile">Çevrim İçi</span>'
                : '<i class="fa-solid fa-plane"></i> <span class="badge-text hide-mobile">Çevrim Dışı</span>';
        }

        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
        updateStatus();
    }

    function populateSelectors() {
        // Cüz Seçenekleri (1 - 30)
        selectJuz.innerHTML = '';
        QURAN_DATA.juzList.forEach(j => {
            const opt = document.createElement('option');
            opt.value = j.juz;
            opt.textContent = `${j.name} (s. ${j.startPage}-${j.endPage})`;
            if (j.juz === state.currentJuz) opt.selected = true;
            selectJuz.appendChild(opt);
        });

        // Dönüş Seçenekleri (1 - 20) - Türk Hafızlık Sistemi Asıl Ekseni
        selectRotation.innerHTML = '';
        for (let r = 1; r <= 20; r++) {
            const pageInJuz = 20 - (r - 1);
            const opt = document.createElement('option');
            opt.value = r;
            if (r === 1) {
                opt.textContent = `1. Dönüş (Cüzlerin 20. Sayfaları - Başlangıç)`;
            } else if (r === 20) {
                opt.textContent = `20. Dönüş (Cüzlerin 1. Sayfaları - Hatim)`;
            } else {
                opt.textContent = `${r}. Dönüş (Cüzlerin ${pageInJuz}. Sayfaları)`;
            }
            if (r === state.currentRotation) opt.selected = true;
            selectRotation.appendChild(opt);
        }
    }

    function populateChainSelectors() {
        if (!selectHaslamaRotation) return;

        // 1 - 20 Dönüş
        selectHaslamaRotation.innerHTML = '';
        for (let r = 1; r <= 20; r++) {
            const pageInJuz = 20 - (r - 1);
            const opt = document.createElement('option');
            opt.value = r;
            opt.textContent = `${r}. Dönüş (Cüzlerin ${pageInJuz}. Sayfaları)`;
            if (r === state.chainHaslama.targetRotation) opt.selected = true;
            selectHaslamaRotation.appendChild(opt);
        }
    }

    function loadChainHaslama(targetRotation, startAtIndex = 0) {
        state.chainHaslama.targetRotation = parseInt(targetRotation);
        state.chainHaslama.toJuz = 30; // Tüm 30 Cüz
        state.chainHaslama.chain = window.hafizEngine.calculateCrossJuzHaslama(state.chainHaslama.targetRotation, 1, 30);
        state.chainHaslama.currentChainIndex = startAtIndex;

        const pageInJuz = 20 - (state.chainHaslama.targetRotation - 1);
        if (badgeChainSummary) {
            badgeChainSummary.innerHTML = `<i class="fa-solid fa-link"></i> 1 - 30. Cüzlerin ${pageInJuz}. Sayfaları (Toplam 30 Sayfa)`;
        }
        if (selectHaslamaRotation) selectHaslamaRotation.value = state.chainHaslama.targetRotation;

        const chainItems = state.chainHaslama.chain.chainItems;
        if (chainItems.length > 0 && startAtIndex < chainItems.length) {
            const currentItem = chainItems[startAtIndex];
            loadPageData(currentItem.page);
        }
    }

    // ==========================================
    // 2. Türk Usulü Ders Yükleme
    // ==========================================
    function loadLesson(juz, rotation) {
        state.currentJuz = parseInt(juz);
        state.currentRotation = parseInt(rotation);
        state.lesson = window.hafizEngine.calculateLesson(state.currentJuz, state.currentRotation);

        chipHamPage.textContent = `Cüzün ${state.lesson.pageInJuz}. Sayfası (s. ${state.lesson.hamPage})`;
        if (chipLessonScope) {
            chipLessonScope.textContent = `${state.currentRotation}. Dönüş • ${state.currentJuz}. Cüz (${state.lesson.juzName})`;
        }

        updateCompletionButton();

        if (state.currentMode === 'chain-has') {
            loadChainHaslama(state.chainHaslama.targetRotation);
        } else {
            state.currentPage = state.lesson.hamPage;
            loadPageData(state.currentPage);
        }
    }

    function updateCompletionButton() {
        const isDone = window.hafizEngine.isCellCompleted(state.currentJuz, state.currentRotation);
        if (isDone) {
            btnToggleCompleted.classList.add('gold-btn');
            textCompletedStatus.textContent = 'Tamamlandı!';
            btnToggleCompleted.querySelector('i').className = 'fa-solid fa-circle-check';
        } else {
            btnToggleCompleted.classList.remove('gold-btn');
            textCompletedStatus.textContent = 'Tamamla';
            btnToggleCompleted.querySelector('i').className = 'fa-regular fa-circle-check';
        }
        updateHeaderStats();
    }

    function updateHeaderStats() {
        if (window.hafizEngine) {
            const stats = window.hafizEngine.getMatrixStats();
            if (badgeHeaderProgress) {
                badgeHeaderProgress.textContent = `%${stats.overallPercentage}`;
            }
        }
    }

    // ==========================================
    // 3. Sayfa Verisini Çekme ve İnteraktif Mushaf'ı İnşa Etme
    // ==========================================
    async function loadPageData(pageNumber) {
        state.currentPage = pageNumber;
        badgePageNum.textContent = `Sayfa ${pageNumber}`;
        mushafPageNumber.textContent = `Sayfa ${pageNumber}`;
        facsimilePageLabel.textContent = `Sayfa ${pageNumber}`;

        const juzObj = QURAN_DATA.getJuzByPage(pageNumber);
        mushafJuzTitle.textContent = `${juzObj.name}`;
        facsimileJuzInfo.textContent = `${juzObj.name}`;
        rosetteJuzNum.textContent = juzObj.juz;

        if (state.currentMode === 'chain-has') {
            sheetLessonTag.textContent = `${state.chainHaslama.targetRotation}. DÖNÜŞ HASLAMA (${juzObj.juz}. CÜZ)`;
            sheetLessonTag.style.background = 'linear-gradient(135deg, #4d3a0e, #291c03)';
            sheetLessonTag.style.color = 'var(--gold-bright)';
            sheetLessonTag.style.borderColor = 'var(--gold-primary)';
        } else {
            const isHam = pageNumber === state.lesson.hamPage;
            sheetLessonTag.textContent = isHam ? 'HAM DERS' : 'HASLAMA';
            sheetLessonTag.style.background = isHam ? 'var(--emerald-dark)' : '#4d3a0e';
            sheetLessonTag.style.color = isHam ? 'var(--emerald-primary)' : 'var(--gold-bright)';
            sheetLessonTag.style.borderColor = isHam ? 'var(--emerald-primary)' : 'var(--gold-primary)';
        }

        // Taranmış Mushaf Görseli
        const facType = state.facsimileType || 'madani';
        if (facsimileLoadingSpinner) facsimileLoadingSpinner.style.display = 'flex';
        mushafImage.style.opacity = '0.3';
        mushafImage.onload = () => {
            if (facsimileLoadingSpinner) facsimileLoadingSpinner.style.display = 'none';
            mushafImage.style.opacity = '1';
        };
        mushafImage.onerror = () => {
            mushafImage.src = QURAN_DATA.getFallbackPageImageUrl(pageNumber, facType);
            if (facsimileLoadingSpinner) facsimileLoadingSpinner.style.display = 'none';
            mushafImage.style.opacity = '1';
        };
        mushafImage.src = QURAN_DATA.getPageImageUrl(pageNumber, facType);

        // Ayetleri API'den veya Önbellekten Çek
        await fetchAndRenderMushafPage(pageNumber);
    }

    async function fetchAndRenderMushafPage(pageNumber) {
        mushafTextFlow.innerHTML = '<div style="text-align:center; padding:50px; font-size:1.2rem; color:var(--gold-primary);"><i class="fa-solid fa-spinner fa-spin"></i> Ayetler yükleniyor...</div>';

        const cacheKey = `${pageNumber}_${state.imlaMode}`;
        if (state.cache[cacheKey]) {
            state.pageAyahs = state.cache[cacheKey];
            buildInteractiveMushafPage(state.pageAyahs);
            renderAyahsView(state.pageAyahs);
            renderDrawerAyahs(state.pageAyahs);
            setupAudioQueue();
            return;
        }

        // 1. IndexedDB Çevrim Dışı Depodan Kontrol Et (Offline First)
        if (window.offlineEngine) {
            try {
                const offlineAyahs = await window.offlineEngine.getPage(pageNumber, state.imlaMode);
                if (offlineAyahs && offlineAyahs.length > 0) {
                    state.cache[cacheKey] = offlineAyahs;
                    state.pageAyahs = offlineAyahs;
                    buildInteractiveMushafPage(offlineAyahs);
                    renderAyahsView(offlineAyahs);
                    renderDrawerAyahs(offlineAyahs);
                    setupAudioQueue();
                    return;
                }
            } catch (err) {
                console.warn('[OfflineEngine] Yerel okuma hatası:', err);
            }
        }

        // 2. Ağdan Çek ve IndexedDB'ye Kaydet
        try {
            const edition = state.imlaMode === 'diyanet' ? 'quran-simple-enhanced' : 'quran-uthmani';
            const [textRes, mealRes] = await Promise.all([
                fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/${edition}`),
                fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/tr.diyanet`)
            ]);

            const textData = await textRes.json();
            const mealData = await mealRes.json();

            if (textData.status === 'OK' && textData.data.ayahs) {
                const ayahs = textData.data.ayahs.map((a, idx) => {
                    const mealObj = mealData.status === 'OK' && mealData.data.ayahs ? mealData.data.ayahs[idx] : null;
                    const cleanedArabic = state.imlaMode === 'diyanet' ? sanitizeTurkishQuranText(a.text) : a.text;
                    const surahInfo = QURAN_DATA.getSurah(a.surah.number);
                    return {
                        surahNumber: a.surah.number,
                        surahNameTr: surahInfo.nameTr,
                        surahNameAr: surahInfo.nameAr || a.surah.name,
                        ayahNumber: a.numberInSurah,
                        globalNumber: a.number,
                        textArabic: cleanedArabic,
                        translationTr: mealObj ? mealObj.text : 'Meal yüklenemedi.',
                        pageNumber: pageNumber
                    };
                });

                state.cache[cacheKey] = ayahs;
                state.pageAyahs = ayahs;
                if (window.offlineEngine) {
                    window.offlineEngine.savePage(pageNumber, state.imlaMode, ayahs);
                }
                buildInteractiveMushafPage(ayahs);
                renderAyahsView(ayahs);
                renderDrawerAyahs(ayahs);
                setupAudioQueue();
                return;
            }
        } catch (error) {
            console.warn('Ağ gecikmesi veya çevrim dışı mod, yerel hafızlık verisi oluşturuluyor:', error);
        }

        // Çevrimdışı / Yedek Kur'an Sayfası
        generateFallbackPage(pageNumber);
    }

    function generateFallbackPage(pageNumber) {
        const surah = QURAN_DATA.surahs.find(s => pageNumber >= s.startPage) || QURAN_DATA.surahs[0];
        const ayahs = [];
        for (let i = 1; i <= 6; i++) {
            ayahs.push({
                surahNumber: surah.id,
                surahNameTr: surah.nameTr,
                surahNameAr: surah.nameAr,
                ayahNumber: i,
                globalNumber: i,
                textArabic: `بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ - آية ${i} من سورة ${surah.nameAr}`,
                translationTr: `${surah.nameTr} Suresi ${i}. ayet meali.`,
                pageNumber: pageNumber
            });
        }
        state.pageAyahs = ayahs;
        buildInteractiveMushafPage(ayahs);
        renderAyahsView(ayahs);
        renderDrawerAyahs(ayahs);
        setupAudioQueue();
    }

    /**
     * Orijinal 15-Satır Mushaf Sayfasını İnşa Eder (Hafız Nuru Standardı)
     */
    function buildInteractiveMushafPage(ayahs) {
        mushafTextFlow.innerHTML = '';
        if (!ayahs || ayahs.length === 0) return;

        // Başlıkta sure adı
        mushafSurahTitle.textContent = `${ayahs[0].surahNameTr} Suresi`;
        facsimileSurahInfo.textContent = `${ayahs[0].surahNameTr} Suresi`;

        let currentSurahNumber = null;

        ayahs.forEach((ayah, index) => {
            // Yeni Sure Başlığı ve Besmele Gerekli mi?
            if (ayah.ayahNumber === 1 || (currentSurahNumber !== null && currentSurahNumber !== ayah.surahNumber)) {
                const headerPlate = document.createElement('div');
                headerPlate.className = 'surah-header-plate';
                headerPlate.innerHTML = `<div class="surah-title-arabic">${ayah.surahNameTr} Sûresi <span style="font-size:0.8em; opacity:0.85; margin-right:8px;">(سُورَةُ ${ayah.surahNameAr})</span></div>`;
                mushafTextFlow.appendChild(headerPlate);

                // Tevbe Suresi (9) hariç Besmele ekle
                if (ayah.surahNumber !== 9 && ayah.surahNumber !== 1) {
                    const besmele = document.createElement('div');
                    besmele.className = 'besmele-banner';
                    besmele.textContent = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
                    mushafTextFlow.appendChild(besmele);
                }
            }
            currentSurahNumber = ayah.surahNumber;

            // Ayet Parçası
            const ayahSpan = document.createElement('span');
            ayahSpan.className = `mushaf-ayah ${index === 0 ? 'playing-ayah' : ''}`;
            ayahSpan.id = `mushaf-ayah-${index}`;
            ayahSpan.dataset.index = index;

            // Ayet Metni ve Gülü (Kelimeleri interaktif etiketlerle sar)
            const words = (ayah.textArabic || '').trim().split(/\s+/);
            const wordsHtml = words.map((w, wIdx) => `<span class="mushaf-word" data-word-idx="${wIdx}">${w}</span>`).join(' ');

            ayahSpan.innerHTML = `
                ${wordsHtml}
                <span class="ayah-rosette">۝<span class="rosette-num" style="font-family:var(--font-heading); font-size:0.44em; font-weight:800;">${ayah.ayahNumber}</span></span>
            `;

            // Tıklayınca Dinlemeyi Başlat ve Popover Göster
            ayahSpan.addEventListener('click', (e) => {
                showAyahPopover(e, index);
                window.audioEngine.jumpToAyah(index);
            });

            mushafTextFlow.appendChild(ayahSpan);
        });

        populateGroupSelectors(ayahs);
    }

    function populateGroupSelectors(ayahs) {
        if (!selGroupStart || !selGroupEnd || !ayahs || ayahs.length === 0) return;
        selGroupStart.innerHTML = '';
        selGroupEnd.innerHTML = '';

        ayahs.forEach((a, idx) => {
            const opt1 = document.createElement('option');
            opt1.value = idx;
            opt1.textContent = `${idx + 1}. Ayet (${a.surahNameTr} ${a.ayahNumber})`;
            selGroupStart.appendChild(opt1);

            const opt2 = document.createElement('option');
            opt2.value = idx;
            opt2.textContent = `${idx + 1}. Ayet (${a.surahNameTr} ${a.ayahNumber})`;
            if (idx === Math.min(2, ayahs.length - 1)) opt2.selected = true;
            selGroupEnd.appendChild(opt2);
        });
    }

    function highlightAyahGroup(startIdx, endIdx) {
        document.querySelectorAll('.mushaf-ayah').forEach((el, idx) => {
            const inGrp = idx >= startIdx && idx <= endIdx;
            el.classList.toggle('ayah-in-group', inGrp);
            el.classList.toggle('ayah-group-start', idx === startIdx);
            el.classList.toggle('ayah-group-end', idx === endIdx);
        });
    }

    function setupAudioQueue() {
        if (!state.pageAyahs || state.pageAyahs.length === 0) return;
        window.audioEngine.setQueue(state.pageAyahs, 0, false);
    }

    // ==========================================
    // 4. Popover & Çekmece İşlemleri
    // ==========================================
    function showAyahPopover(e, index) {
        selectedAyahIndexForPopover = index;
        const rect = e.currentTarget.getBoundingClientRect();
        const stageRect = containerMushafLive.getBoundingClientRect();

        ayahQuickActions.style.left = `${rect.left + rect.width / 2 - stageRect.left}px`;
        ayahQuickActions.style.top = `${rect.top - stageRect.top}px`;
        ayahQuickActions.style.display = 'flex';
    }

    function renderDrawerAyahs(ayahs) {
        drawerAyahsList.innerHTML = '';
        ayahs.forEach((ayah, index) => {
            const item = document.createElement('div');
            item.className = `drawer-ayah-item ${index === 0 ? 'active' : ''}`;
            item.id = `drawer-ayah-${index}`;
            item.innerHTML = `
                <div class="drawer-ayah-header">
                    <span>${ayah.surahNameTr} Suresi</span>
                    <span>${ayah.ayahNumber}. Ayet</span>
                </div>
                <div class="drawer-ayah-text">${ayah.translationTr}</div>
            `;
            item.addEventListener('click', () => {
                window.audioEngine.jumpToAyah(index);
            });
            drawerAyahsList.appendChild(item);
        });
    }

    // ==========================================
    // 5. Dijital Ayet & Meal Kartları Görünümü
    // ==========================================
    function renderAyahsView(ayahs) {
        containerAyahView.innerHTML = '';
        ayahs.forEach((ayah, index) => {
            const card = document.createElement('div');
            card.className = `ayah-card ${index === 0 ? 'active' : ''}`;
            card.id = `ayah-card-${index}`;

            card.innerHTML = `
                <div class="ayah-card-header">
                    <div class="ayah-index-badge">
                        <div class="ayah-number-bubble">${ayah.ayahNumber}</div>
                        <span>${ayah.surahNameTr} Suresi</span>
                    </div>
                    <button class="btn-header" style="padding:4px 10px; font-size:0.75rem;">
                        <i class="fa-solid fa-play"></i> Dinle
                    </button>
                </div>
                <div class="ayah-arabic">${ayah.textArabic}</div>
                <div class="ayah-translation">${ayah.translationTr}</div>
            `;

            card.addEventListener('click', () => {
                window.audioEngine.jumpToAyah(index);
            });

            containerAyahView.appendChild(card);
        });
    }

    // ==========================================
    // 6. Ses Motoru Geri Çağrıları (Canlı Vurgu)
    // ==========================================
    function setupAudioEngineCallbacks() {
        window.audioEngine.onAyahChange = (ayah, index, repeatCount, targetRepeats) => {
            if (!ayah) return;

            // Deck Başlıklarını Güncelle
            deckTrackTitle.textContent = `${ayah.surahNameTr} Suresi ${ayah.ayahNumber}. Ayet`;
            
            let repeatStr = targetRepeats === -1 ? `Tekrar ${repeatCount}/∞` : `Tekrar ${repeatCount}/${targetRepeats}`;
            if (window.audioEngine.strategy === 'group') {
                const gStart = window.audioEngine.groupStart + 1;
                const gEnd = window.audioEngine.groupEnd + 1;
                const dirIcon = window.audioEngine.isReverse ? '⬆️ Tersten' : '⬇️ Sıralı';
                repeatStr = `📑 Grup [${gStart}-${gEnd}] (${dirIcon}) • Grup Tekrarı ${window.audioEngine.groupRepeatCount}/${window.audioEngine.groupTargetRepeats}`;
            } else if (window.audioEngine.strategy === 'reverse' || window.audioEngine.isReverse) {
                repeatStr = `⬆️ Tersten (Aşağıdan Yukarı) • ${repeatStr}`;
            } else {
                repeatStr = `⬇️ Sıralı (Yukarıdan Aşağı) • ${repeatStr}`;
            }

            const isHam = state.currentPage === state.lesson.hamPage;
            deckTrackSub.textContent = `Sayfa ${state.currentPage} • ${isHam ? 'Ham Ders' : 'Haslama'} • ${repeatStr}`;

            // Mushaf Sayfasında Çalan Ayeti Altın Renginde Vurgula (Hafız Nuru)
            document.querySelectorAll('.mushaf-ayah').forEach((el, idx) => {
                el.classList.toggle('playing-ayah', idx === index);
            });

            // Çekmecede ve Dijital Kartlarda Aktifliği Güncelle
            document.querySelectorAll('.drawer-ayah-item').forEach((el, idx) => {
                el.classList.toggle('active', idx === index);
            });
            document.querySelectorAll('.ayah-card').forEach((el, idx) => {
                el.classList.toggle('active', idx === index);
            });

            // Kelime vurgularını temizle
            document.querySelectorAll('.mushaf-word.active-slice-word').forEach(el => el.classList.remove('active-slice-word'));

            const activeAyahEl = document.getElementById(`mushaf-ayah-${index}`);
            if (activeAyahEl && state.activeView === 'live') {
                activeAyahEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        };

        window.audioEngine.onSliceUpdate = (info) => {
            if (!info) return;
            const { fromSlice, toSlice, totalSlices, repeatCount, targetRepeats, direction, isCumulative, isFullAyah, fromWord, toWord } = info;
            const dirLabel = direction === 'reverse' ? '⬆️ Tersten Kümülatif' : '⬇️ Sıralı Kümülatif';
            
            if (isFullAyah) {
                deckTrackSub.textContent = `✨ Ayet Tamamı Dinleniyor (${dirLabel} Pekiştirme) • Tekrar ${repeatCount}/${targetRepeats}`;
            } else {
                const sliceSpan = (fromSlice === toSlice) ? `Parça [${fromSlice}/${totalSlices}]` : `Parça [${fromSlice}-${toSlice}/${totalSlices}]`;
                deckTrackSub.textContent = `✂️ ${sliceSpan} (${dirLabel}) • Tekrar ${repeatCount}/${targetRepeats}`;
            }

            // Mushaf üzerinde aktif parçadaki kelimeleri altın sarısı ile vurgula
            const curIdx = window.audioEngine.currentAyahIndex;
            const activeAyahEl = document.getElementById(`mushaf-ayah-${curIdx}`);
            if (activeAyahEl) {
                const wordSpans = activeAyahEl.querySelectorAll('.mushaf-word');
                if (fromWord !== null && toWord !== null && wordSpans.length > 0) {
                    wordSpans.forEach((wSpan, wIdx) => {
                        const isActive = (wIdx >= fromWord && wIdx <= toWord);
                        wSpan.classList.toggle('active-slice-word', isActive);
                    });
                } else {
                    wordSpans.forEach(wSpan => wSpan.classList.remove('active-slice-word'));
                }
            }
        };

        window.audioEngine.onGroupUpdate = (startIdx, endIdx, repCount, targetReps, isReverse) => {
            highlightAyahGroup(startIdx, endIdx);
            const dirLabel = isReverse ? '⬆️ Tersten' : '⬇️ Sıralı';
            deckTrackSub.textContent = `📑 Grup [${startIdx + 1}-${endIdx + 1}] (${dirLabel}) • Grup Tekrarı ${repCount}/${targetReps}`;
        };

        window.audioEngine.onStateChange = (isPlaying) => {
            deckPlayIcon.className = isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play';
        };

        window.audioEngine.onTimeUpdate = (current, duration) => {
            timeCurrent.textContent = formatTime(current);
            timeDuration.textContent = formatTime(duration);
            const pct = duration > 0 ? (current / duration) * 100 : 0;
            progressFill.style.width = `${pct}%`;
        };

        window.audioEngine.onGapCountdown = (seconds) => {
            if (seconds > 0) {
                gapCountdownBadge.classList.add('active');
                gapSeconds.textContent = seconds;
            } else {
                gapCountdownBadge.classList.remove('active');
            }
        };

        window.audioEngine.onQueueEnd = () => {
            handlePageQueueFinished();
        };
    }

    function handlePageQueueFinished() {
        if (state.currentMode === 'chain-has') {
            if (state.chainHaslama && state.chainHaslama.chain) {
                const chainItems = state.chainHaslama.chain.chainItems;
                const nextIdx = state.chainHaslama.currentChainIndex + 1;
                if (nextIdx < chainItems.length) {
                    state.chainHaslama.currentChainIndex = nextIdx;
                    const nextItem = chainItems[nextIdx];
                    loadPageData(nextItem.page).then(() => {
                        window.audioEngine.play();
                    });
                    return;
                }
            }
        }
        deckPlayIcon.className = 'fa-solid fa-play';
    }

    function formatTime(seconds) {
        if (isNaN(seconds) || seconds === 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // ==========================================
    // 7. Olay Dinleyicileri (Event Listeners)
    // ==========================================
    function bindEvents() {
        // Cüz & Dönüş Değişimi
        selectJuz.addEventListener('change', (e) => loadLesson(e.target.value, state.currentRotation));
        selectRotation.addEventListener('change', (e) => loadLesson(state.currentJuz, e.target.value));

        // Mod Seçimi (Sadece Ham Ezber ve Dönüş Haslama)
        if (modeHam) modeHam.addEventListener('click', () => setMode('ham'));
        if (modeChainHas) modeChainHas.addEventListener('click', () => setMode('chain-has'));

        // Zincir Haslama Kontrolleri
        if (selectHaslamaRotation) {
            selectHaslamaRotation.addEventListener('change', (e) => {
                loadChainHaslama(e.target.value);
            });
        }
        if (btnOpenChainList) {
            btnOpenChainList.addEventListener('click', () => {
                openChainListModal();
            });
        }

        // Görünüm Sekmeleri
        tabMushafLive.addEventListener('click', () => setView('live'));
        tabMushafFacsimile.addEventListener('click', () => setView('facsimile'));
        tabAyahView.addEventListener('click', () => setView('ayah'));

        // Sayfa Değiştirme
        btnPrevPage.addEventListener('click', () => {
            if (state.currentPage > 1) loadPageData(state.currentPage - 1);
        });
        btnNextPage.addEventListener('click', () => {
            if (state.currentPage < 604) loadPageData(state.currentPage + 1);
        });

        // Zoom Kontrolleri
        btnZoomIn.addEventListener('click', () => {
            if (state.zoomLevel < 150) {
                state.zoomLevel += 10;
                applyZoom();
            }
        });
        btnZoomOut.addEventListener('click', () => {
            if (state.zoomLevel > 80) {
                state.zoomLevel -= 10;
                applyZoom();
            }
        });

        // Kağıt Teması Seçimi
        paperThemeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                paperThemeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.paperTheme = btn.dataset.theme;
                document.body.className = `theme-${state.paperTheme} font-${state.mushafFont}`;
            });
        });

        // Meal Çekmecesi Aç/Kapa
        btnToggleTranslationDrawer.addEventListener('click', () => {
            translationDrawer.classList.toggle('open');
        });
        btnCloseDrawer.addEventListener('click', () => {
            translationDrawer.classList.remove('open');
        });

        // Hat Seçimi Dropdown
        const selectMushafFont = document.getElementById('select-mushaf-font');
        if (selectMushafFont) {
            selectMushafFont.addEventListener('change', (e) => {
                setMushafFont(e.target.value);
            });
        }

        // İmlâ / Yazım Tercihi Dropdown
        const selectMushafImla = document.getElementById('select-mushaf-imla');
        if (selectMushafImla) {
            selectMushafImla.addEventListener('change', (e) => {
                state.imlaMode = e.target.value;
                fetchAndRenderMushafPage(state.currentPage);
            });
        }

        // Mushaf Baskı Türü Seçimi Dropdown
        if (selectFacsimileEdition) {
            selectFacsimileEdition.addEventListener('change', (e) => {
                state.facsimileType = e.target.value;
                const facType = state.facsimileType;
                if (facsimileLoadingSpinner) facsimileLoadingSpinner.style.display = 'flex';
                mushafImage.style.opacity = '0.3';
                mushafImage.src = QURAN_DATA.getPageImageUrl(state.currentPage, facType);
            });
        }

        // Hat Modalı Açma ve Kart Tıklama
        const btnHatModal = document.getElementById('btn-hat-modal');
        const modalHatlar = document.getElementById('modal-hatlar');
        if (btnHatModal && modalHatlar) {
            btnHatModal.addEventListener('click', () => {
                modalHatlar.classList.add('open');
            });

            modalHatlar.querySelectorAll('.reciter-card').forEach(card => {
                card.addEventListener('click', () => {
                    const fontId = card.dataset.font;
                    setMushafFont(fontId);
                    modalHatlar.classList.remove('open');
                });
            });
        }

        // Popover Butonları
        popBtnPlay.addEventListener('click', () => {
            ayahQuickActions.style.display = 'none';
            window.audioEngine.jumpToAyah(selectedAyahIndexForPopover);
        });
        popBtnRepeat.addEventListener('click', () => {
            ayahQuickActions.style.display = 'none';
            selectRepeats.value = "5";
            window.audioEngine.setRepeats(5);
            window.audioEngine.jumpToAyah(selectedAyahIndexForPopover);
        });
        if (popBtnGroupStart) {
            popBtnGroupStart.addEventListener('click', () => {
                ayahQuickActions.style.display = 'none';
                if (selGroupStart) selGroupStart.value = selectedAyahIndexForPopover;
                panelEzberStrategy.style.display = 'block';
                activateStrategyTab('group');
                const start = selectedAyahIndexForPopover;
                const end = selGroupEnd ? parseInt(selGroupEnd.value) : start;
                highlightAyahGroup(start, Math.max(start, end));
            });
        }
        if (popBtnGroupEnd) {
            popBtnGroupEnd.addEventListener('click', () => {
                ayahQuickActions.style.display = 'none';
                if (selGroupEnd) selGroupEnd.value = selectedAyahIndexForPopover;
                panelEzberStrategy.style.display = 'block';
                activateStrategyTab('group');
                const start = selGroupStart ? parseInt(selGroupStart.value) : 0;
                const end = selectedAyahIndexForPopover;
                highlightAyahGroup(Math.min(start, end), end);
            });
        }
        if (popBtnSlice) {
            popBtnSlice.addEventListener('click', () => {
                ayahQuickActions.style.display = 'none';
                panelEzberStrategy.style.display = 'block';
                activateStrategyTab('slice');
                const count = selSliceCount ? parseInt(selSliceCount.value) : 3;
                const reps = selSliceRepeats ? parseInt(selSliceRepeats.value) : 3;
                const dir = selSliceDirection ? selSliceDirection.value : 'reverse';
                const isCumulative = selSliceCumulative ? (selSliceCumulative.value === 'true') : true;
                window.audioEngine.jumpToAyah(selectedAyahIndexForPopover, false);
                window.audioEngine.setSliceMode(count, reps, dir, isCumulative);
            });
        }
        popBtnMeal.addEventListener('click', () => {
            ayahQuickActions.style.display = 'none';
            translationDrawer.classList.add('open');
            const targetEl = document.getElementById(`drawer-ayah-${selectedAyahIndexForPopover}`);
            if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
        });

        // ==========================================
        // Ezber Stratejisi Olayları
        // ==========================================
        if (btnToggleStrategyPanel && panelEzberStrategy) {
            btnToggleStrategyPanel.addEventListener('click', () => {
                const isHidden = panelEzberStrategy.style.display === 'none';
                panelEzberStrategy.style.display = isHidden ? 'block' : 'none';
            });
        }
        if (btnToolbarStrategy && panelEzberStrategy) {
            btnToolbarStrategy.addEventListener('click', () => {
                const isHidden = panelEzberStrategy.style.display === 'none';
                panelEzberStrategy.style.display = isHidden ? 'block' : 'none';
                if (isHidden) {
                    panelEzberStrategy.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        }

        stratTabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                activateStrategyTab(btn.dataset.strategy);
            });
        });

        function activateStrategyTab(stratName) {
            stratTabBtns.forEach(b => b.classList.toggle('active', b.dataset.strategy === stratName));
            if (stratControlsGroup) stratControlsGroup.style.display = stratName === 'group' ? 'block' : 'none';
            if (stratControlsSlice) stratControlsSlice.style.display = stratName === 'slice' ? 'block' : 'none';
            if (stratControlsReverse) stratControlsReverse.style.display = stratName === 'reverse' ? 'block' : 'none';

            if (stratName === 'standard') {
                window.audioEngine.clearSpecialModes();
                window.audioEngine.setReverseMode(false);
                highlightAyahGroup(-1, -1);
                window.audioEngine.jumpToAyah(0);
            } else if (stratName === 'reverse') {
                window.audioEngine.clearSpecialModes();
                window.audioEngine.setReverseMode(true);
                highlightAyahGroup(-1, -1);
                const total = state.pageAyahs ? state.pageAyahs.length : 1;
                window.audioEngine.jumpToAyah(total - 1);
            }
        }

        // Hızlı Gruplama Butonları (2'şerli, 3'erli, 5'erli)
        quickGroupBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                quickGroupBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const span = parseInt(btn.dataset.span);
                const curIdx = window.audioEngine.currentAyahIndex || 0;
                const totalAyahs = state.pageAyahs ? state.pageAyahs.length : 1;
                const endIdx = Math.min(totalAyahs - 1, curIdx + span - 1);
                
                if (selGroupStart) selGroupStart.value = curIdx;
                if (selGroupEnd) selGroupEnd.value = endIdx;
                highlightAyahGroup(curIdx, endIdx);
            });
        });

        if (btnApplyGroup) {
            btnApplyGroup.addEventListener('click', () => {
                const s = parseInt(selGroupStart.value) || 0;
                const e = parseInt(selGroupEnd.value) || 0;
                const reps = parseInt(selGroupRepeats.value) || 3;
                const dir = selGroupDirection ? selGroupDirection.value : 'forward';
                window.audioEngine.setGroupMode(s, e, reps, dir);
                highlightAyahGroup(Math.min(s, e), Math.max(s, e));
            });
        }

        if (btnStartSlice) {
            btnStartSlice.addEventListener('click', () => {
                const count = selSliceCount ? parseInt(selSliceCount.value) : 3;
                const reps = selSliceRepeats ? parseInt(selSliceRepeats.value) : 3;
                const dir = selSliceDirection ? selSliceDirection.value : 'reverse';
                const isCumulative = selSliceCumulative ? (selSliceCumulative.value === 'true') : true;
                window.audioEngine.setSliceMode(count, reps, dir, isCumulative);
            });
        }

        if (btnStartReverse) {
            btnStartReverse.addEventListener('click', () => {
                window.audioEngine.setReverseMode(true);
                const total = state.pageAyahs ? state.pageAyahs.length : 1;
                window.audioEngine.jumpToAyah(total - 1);
            });
        }

        // Belgeye tıklayınca Popover'ı kapat
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.mushaf-ayah') && !e.target.closest('#ayah-quick-actions')) {
                ayahQuickActions.style.display = 'none';
            }
        });

        // Dersi Tamamla
        btnToggleCompleted.addEventListener('click', () => {
            window.hafizEngine.toggleCellCompleted(state.currentJuz, state.currentRotation);
            updateCompletionButton();
            updateHeaderStats();
        });

        // Oynatıcı Kontrolleri
        btnDeckPlay.addEventListener('click', () => window.audioEngine.togglePlay());
        btnPrevAyah.addEventListener('click', () => window.audioEngine.prevAyah());
        btnNextAyah.addEventListener('click', () => window.audioEngine.nextAyah());

        progressTrack.addEventListener('click', (e) => {
            const rect = progressTrack.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            if (window.audioEngine.audio.duration) {
                window.audioEngine.audio.currentTime = pos * window.audioEngine.audio.duration;
            }
        });

        selectRepeats.addEventListener('change', (e) => window.audioEngine.setRepeats(e.target.value));
        selectSpeed.addEventListener('change', (e) => window.audioEngine.setPlaybackRate(e.target.value));
        selectGap.addEventListener('change', (e) => window.audioEngine.setPauseGap(e.target.value));

        // Sayfa Gezginine Tıklayınca Hızlı Atlama
        if (badgePageNum) {
            badgePageNum.addEventListener('click', () => {
                if (inputQuickSearch) {
                    inputQuickSearch.focus();
                    inputQuickSearch.placeholder = 'Gitmek istediğiniz sayfa numarasını yazın...';
                }
            });
        }

        // Sahne Yan Okları (Floating Book Navigation)
        if (btnStagePrev) {
            btnStagePrev.addEventListener('click', () => {
                if (state.currentPage > 1) loadPageData(state.currentPage - 1);
            });
        }
        if (btnStageNext) {
            btnStageNext.addEventListener('click', () => {
                if (state.currentPage < 604) loadPageData(state.currentPage + 1);
            });
        }

        // Hızlı Arama & Atlama
        setupQuickSearch();

        // Modallar
        btnOpenMatrix.addEventListener('click', () => openMatrixModal());
        btnOpenReciters.addEventListener('click', () => openRecitersModal());
        btnOpenStats.addEventListener('click', () => openStatsModal());
        if (btnOpenShortcuts && modalShortcuts) {
            btnOpenShortcuts.addEventListener('click', () => modalShortcuts.classList.add('open'));
        }
        if (btnOpenInstall && modalInstall) {
            btnOpenInstall.addEventListener('click', () => modalInstall.classList.add('open'));
        }
        deckReciterAvatar.addEventListener('click', () => openRecitersModal());

        // PWA Yükleme Yakalayıcı
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredInstallPrompt = e;
            if (btnTriggerPwaInstall) btnTriggerPwaInstall.style.display = 'inline-flex';
        });

        if (btnTriggerPwaInstall) {
            btnTriggerPwaInstall.addEventListener('click', async () => {
                if (deferredInstallPrompt) {
                    deferredInstallPrompt.prompt();
                    const { outcome } = await deferredInstallPrompt.userChoice;
                    console.log(`[PWA] Kurulum tercihi: ${outcome}`);
                    deferredInstallPrompt = null;
                } else {
                    alert('Tarayıcınızın menüsünden (⋮ veya Paylaş) "Ana Ekrana Ekle / Uygulamayı Yükle" seçeneğini kullanabilirsiniz.');
                }
            });
        }

        // Mobil / Dokunmatik Ekranlar İçin Sağa/Sola Kaydırma (Touch Swipe)
        let touchStartX = 0;
        let touchEndX = 0;
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchEndX - touchStartX;
            if (Math.abs(diff) > 80) {
                if (diff < 0) {
                    // Sola kaydır -> sonraki sayfa
                    if (state.currentPage < 604) loadPageData(state.currentPage + 1);
                } else {
                    // Sağa kaydır -> önceki sayfa
                    if (state.currentPage > 1) loadPageData(state.currentPage - 1);
                }
            }
        }, { passive: true });

        document.querySelectorAll('.btn-close-modal, .modal-backdrop').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target === el || e.target.classList.contains('btn-close-modal')) {
                    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
                }
            });
        });

        // Klavye Kısayolları
        window.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
                if (e.key === 'Escape') {
                    if (inputQuickSearch) inputQuickSearch.blur();
                    if (quickSearchDropdown) quickSearchDropdown.style.display = 'none';
                }
                return;
            }

            if (e.code === 'Space') {
                e.preventDefault();
                window.audioEngine.togglePlay();
            } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                e.preventDefault();
                if (state.currentPage < 604) loadPageData(state.currentPage + 1);
            } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                e.preventDefault();
                if (state.currentPage > 1) loadPageData(state.currentPage - 1);
            } else if (e.code === 'ArrowDown' || e.code === 'KeyK') {
                e.preventDefault();
                window.audioEngine.nextAyah();
            } else if (e.code === 'ArrowUp' || e.code === 'KeyJ') {
                e.preventDefault();
                window.audioEngine.prevAyah();
            } else if (e.code === 'KeyR') {
                e.preventDefault();
                const repeatValues = ["1", "3", "5", "10", "-1"];
                const curIdx = repeatValues.indexOf(selectRepeats.value);
                const nextVal = repeatValues[(curIdx + 1) % repeatValues.length];
                selectRepeats.value = nextVal;
                window.audioEngine.setRepeats(nextVal);
            } else if (e.code === 'KeyM') {
                e.preventDefault();
                translationDrawer.classList.toggle('open');
            } else if (e.code === 'KeyH') {
                e.preventDefault();
                openMatrixModal();
            } else if (e.code === 'Slash' || e.code === 'KeyS') {
                if (inputQuickSearch) {
                    e.preventDefault();
                    inputQuickSearch.focus();
                }
            }
        });
    }

    function setupQuickSearch() {
        if (!inputQuickSearch || !quickSearchDropdown) return;

        function doSearch(q) {
            q = (q || '').trim().toLowerCase();
            if (!q) {
                quickSearchDropdown.style.display = 'none';
                return;
            }

            const results = [];

            // 1. Sayfa Numarası
            const pageNum = parseInt(q);
            if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= 604) {
                const juzObj = QURAN_DATA.getJuzByPage(pageNum);
                results.push({
                    type: 'page',
                    title: `Sayfa ${pageNum}`,
                    sub: `${juzObj.name}`,
                    page: pageNum
                });
            }

            // 2. Sure Adı
            QURAN_DATA.surahs.forEach(s => {
                const trName = s.nameTr.toLowerCase();
                if (trName.includes(q) || s.id.toString() === q) {
                    results.push({
                        type: 'surah',
                        title: `${s.id}. ${s.nameTr} Suresi (${s.nameAr})`,
                        sub: `Sayfa ${s.startPage} • ${s.ayahs} Ayet`,
                        page: s.startPage
                    });
                }
            });

            // 3. Cüz
            QURAN_DATA.juzList.forEach(j => {
                const jName = j.name.toLowerCase();
                const jShort = j.shortName.toLowerCase();
                if (jName.includes(q) || jShort.includes(q) || q === `${j.juz}. cüz` || q === `${j.juz}`) {
                    results.push({
                        type: 'juz',
                        title: `${j.name}`,
                        sub: `Sayfa ${j.startPage} - ${j.endPage}`,
                        page: j.startPage,
                        juz: j.juz
                    });
                }
            });

            if (results.length === 0) {
                quickSearchDropdown.innerHTML = '<div style="padding:10px; font-size:0.8rem; color:var(--text-dim); text-align:center;">Sonuç bulunamadı</div>';
                quickSearchDropdown.style.display = 'block';
                return;
            }

            quickSearchDropdown.innerHTML = '';
            results.slice(0, 8).forEach(r => {
                const item = document.createElement('div');
                item.className = 'quick-search-item';
                item.innerHTML = `
                    <div>
                        <strong style="color:var(--gold-bright);">${r.title}</strong>
                        <div style="font-size:0.72rem; color:var(--text-dim);">${r.sub}</div>
                    </div>
                    <i class="fa-solid fa-arrow-right" style="font-size:0.75rem; color:var(--gold-primary);"></i>
                `;
                item.addEventListener('click', () => {
                    inputQuickSearch.value = '';
                    quickSearchDropdown.style.display = 'none';
                    if (r.juz) {
                        selectJuz.value = r.juz;
                        loadLesson(r.juz, state.currentRotation);
                    } else {
                        loadPageData(r.page);
                    }
                });
                quickSearchDropdown.appendChild(item);
            });
            quickSearchDropdown.style.display = 'block';
        }

        inputQuickSearch.addEventListener('input', (e) => doSearch(e.target.value));
        inputQuickSearch.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const firstItem = quickSearchDropdown.querySelector('.quick-search-item');
                if (firstItem) {
                    firstItem.click();
                } else {
                    const pageNum = parseInt(inputQuickSearch.value);
                    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= 604) {
                        inputQuickSearch.value = '';
                        quickSearchDropdown.style.display = 'none';
                        loadPageData(pageNum);
                    }
                }
            } else if (e.key === 'Escape') {
                quickSearchDropdown.style.display = 'none';
            }
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.quick-jump-container')) {
                quickSearchDropdown.style.display = 'none';
            }
        });
    }

    function applyZoom() {
        labelZoom.textContent = `${state.zoomLevel}%`;
        mushafScaleWrapper.style.transform = `scale(${state.zoomLevel / 100})`;
    }

    function setMushafFont(fontId) {
        if (!FONT_METADATA[fontId]) return;
        state.mushafFont = fontId;
        document.body.className = `theme-${state.paperTheme} font-${state.mushafFont}`;
        const hatNameSub = document.querySelector('.hat-name-sub');
        if (hatNameSub) {
            hatNameSub.innerHTML = `<i class="fa-solid fa-pen-nib"></i> ${FONT_METADATA[fontId].sub}`;
        }
        const selectMushafFont = document.getElementById('select-mushaf-font');
        if (selectMushafFont) selectMushafFont.value = fontId;

        document.querySelectorAll('#modal-hatlar .reciter-card').forEach(card => {
            card.classList.toggle('active', card.dataset.font === fontId);
        });
    }

    function setMode(mode) {
        state.currentMode = mode;
        if (modeHam) modeHam.classList.remove('active');
        if (modeChainHas) modeChainHas.classList.remove('active');

        if (mode === 'ham') {
            if (modeHam) modeHam.classList.add('active');
            if (cardStandardLesson) cardStandardLesson.style.display = 'flex';
            if (panelChainHaslama) panelChainHaslama.style.display = 'none';
            state.currentPage = state.lesson.hamPage;
            selectRepeats.value = "5";
            window.audioEngine.setRepeats(5);
            loadPageData(state.currentPage);
        } else if (mode === 'chain-has') {
            if (modeChainHas) modeChainHas.classList.add('active');
            if (cardStandardLesson) cardStandardLesson.style.display = 'none';
            if (panelChainHaslama) panelChainHaslama.style.display = 'flex';
            selectRepeats.value = "1";
            window.audioEngine.setRepeats(1);
            loadChainHaslama(state.chainHaslama.targetRotation);
        }
    }

    function openChainListModal() {
        if (!modalChainList || !chainItemsGrid) return;
        if (!state.chainHaslama.chain) {
            state.chainHaslama.chain = window.hafizEngine.calculateCrossJuzHaslama(state.chainHaslama.targetRotation, 1, 30);
        }

        const chain = state.chainHaslama.chain;
        if (chainModalTitle) {
            chainModalTitle.textContent = `${chain.targetRotation}. Dönüş Haslama Zinciri (1 - 30. Cüzler • ${chain.pageInJuz}. Sayfalar)`;
        }

        chainItemsGrid.innerHTML = '';
        chain.chainItems.forEach((item, index) => {
            const card = document.createElement('div');
            const isCurrent = index === state.chainHaslama.currentChainIndex;
            const isDone = item.isCompleted;

            const pageInJuz = 20 - (item.rotation - 1);
            card.className = `chain-item-card ${isCurrent ? 'current' : ''} ${isDone ? 'completed' : ''}`;
            card.innerHTML = `
                <div class="chain-item-juz">
                    <span><i class="fa-solid fa-book-bookmark gold-icon"></i> ${item.juz}. Cüz</span>
                    <span style="font-size:0.75rem; color:${isDone ? 'var(--emerald-primary)' : 'var(--text-dim)'};">${isDone ? '✓ Tamam' : ''}</span>
                </div>
                <div style="font-size:0.78rem; color:var(--text-muted);">${item.juzName}</div>
                <div class="chain-item-page">
                    <i class="fa-solid fa-file-lines"></i> Sayfa ${item.page} (Cüzün ${pageInJuz}. Sayfası)
                </div>
            `;

            card.addEventListener('click', () => {
                state.chainHaslama.currentChainIndex = index;
                loadPageData(item.page).then(() => {
                    modalChainList.classList.remove('open');
                    window.audioEngine.play();
                });
            });

            chainItemsGrid.appendChild(card);
        });

        modalChainList.classList.add('open');
    }

    function setView(view) {
        state.activeView = view;
        tabMushafLive.classList.toggle('active', view === 'live');
        tabMushafFacsimile.classList.toggle('active', view === 'facsimile');
        tabAyahView.classList.toggle('active', view === 'ayah');

        containerMushafLive.style.display = view === 'live' ? 'flex' : 'none';
        containerMushafFacsimile.style.display = view === 'facsimile' ? 'flex' : 'none';
        containerAyahView.style.display = view === 'ayah' ? 'flex' : 'none';
    }

    // ==========================================
    // 8. Modallar
    // ==========================================
    function openMatrixModal() {
        const stats = window.hafizEngine.getMatrixStats();
        document.getElementById('matrix-percentage').textContent = `%${stats.overallPercentage}`;
        document.getElementById('matrix-done-count').textContent = stats.completedCells;
        document.getElementById('matrix-progress-bar').style.width = `${stats.overallPercentage}%`;

        const table = document.getElementById('matrix-table-body');
        table.innerHTML = '';

        const headerRow = document.createElement('tr');
        headerRow.innerHTML = '<th>Cüz</th>' + Array.from({ length: 20 }, (_, i) => `<th>${i + 1}.D</th>`).join('');
        table.appendChild(headerRow);

        for (let j = 1; j <= 30; j++) {
            const row = document.createElement('tr');
            const juzData = QURAN_DATA.juzList[j - 1];
            let cellsHtml = `<td style="font-weight:700; color:var(--gold-bright); white-space:nowrap; text-align:left; padding-left:12px;">${juzData.name}</td>`;

            for (let r = 1; r <= 20; r++) {
                const isDone = window.hafizEngine.isCellCompleted(j, r);
                const isCurrent = j === state.currentJuz && r === state.currentRotation;
                const activeBorder = isCurrent ? 'border:2px solid #fff;' : '';
                cellsHtml += `
                    <td>
                        <div class="matrix-cell ${isDone ? 'completed' : ''}" 
                             data-juz="${j}" 
                             data-rotation="${r}" 
                             style="${activeBorder}"
                             title="${j}. Cüz ${r}. Dönüş ${isDone ? '(Tamamlandı)' : ''}">
                            ${isDone ? '✓' : r}
                        </div>
                    </td>
                `;
            }
            row.innerHTML = cellsHtml;
            table.appendChild(row);
        }

        table.querySelectorAll('.matrix-cell').forEach(cell => {
            cell.addEventListener('click', () => {
                const j = parseInt(cell.dataset.juz);
                const r = parseInt(cell.dataset.rotation);
                selectJuz.value = j;
                selectRotation.value = r;
                loadLesson(j, r);
                modalMatrix.classList.remove('open');
            });
        });

        modalMatrix.classList.add('open');
    }

    function openRecitersModal() {
        const grid = document.getElementById('reciters-grid');
        grid.innerHTML = '';

        window.audioEngine.reciters.forEach(reciter => {
            const card = document.createElement('div');
            const isActive = window.audioEngine.currentReciter.id === reciter.id;
            card.className = `reciter-card ${isActive ? 'active' : ''}`;

            card.innerHTML = `
                <div class="reciter-name"><i class="fa-solid fa-user-check"></i> ${reciter.name}</div>
                <div class="reciter-style">${reciter.style}</div>
                <div style="font-size:0.7rem; color:var(--text-dim); margin-top:4px;">Tavsiye Hız: ${reciter.speedRecommended}</div>
            `;

            card.addEventListener('click', () => {
                window.audioEngine.setReciter(reciter.id);
                headerReciterName.textContent = reciter.name.replace(/\s*\(.*?\)\s*/g, '');
                modalReciters.classList.remove('open');
            });

            grid.appendChild(card);
        });

        modalReciters.classList.add('open');
    }

    function openStatsModal() {
        const stats = window.hafizEngine.stats;
        document.getElementById('stat-today-mins').textContent = `${stats.todayListeningMinutes} dk`;
        document.getElementById('stat-total-mins').textContent = `${stats.totalListeningMinutes} dk`;
        document.getElementById('stat-completed-lessons').textContent = `${stats.completedLessonsCount || 0}`;
        modalStats.classList.add('open');
    }

    async function openOfflineModal() {
        if (!modalOffline) return;
        const juzObj = QURAN_DATA.getJuzByPage(state.currentPage);
        if (labelActiveJuzDownload) {
            labelActiveJuzDownload.innerHTML = `<i class="fa-solid fa-book-open gold-icon"></i> Aktif Cüzü İndir (${juzObj.name})`;
        }

        await updateOfflineStorageDisplay();
        modalOffline.classList.add('open');
    }

    async function updateOfflineStorageDisplay() {
        if (!window.offlineEngine) return;
        const stats = await window.offlineEngine.getStorageStats();
        if (offlineStatPages) offlineStatPages.textContent = stats.pageCount;
        if (offlineStatJuzs) offlineStatJuzs.textContent = `${stats.downloadedJuzList.length} / 30`;
        if (offlineStatStorage) offlineStatStorage.textContent = `${stats.estimateUsageMB} MB`;
    }

    // Çevrim Dışı İndirme Eylemleri
    if (btnOpenOffline) {
        btnOpenOffline.addEventListener('click', () => openOfflineModal());
    }

    if (btnDownloadActiveJuz) {
        btnDownloadActiveJuz.addEventListener('click', async () => {
            if (!window.offlineEngine) return;
            offlineProgressWrap.style.display = 'block';
            offlineProgressBar.style.width = '0%';
            offlineProgressText.textContent = 'İndirme başlatılıyor...';

            await window.offlineEngine.downloadJuz(
                state.currentJuz,
                { withAudio: true, withImages: true },
                (p) => {
                    if (offlineProgressBar) offlineProgressBar.style.width = `${p.percentage || 0}%`;
                    if (offlineProgressText) offlineProgressText.textContent = p.message || 'İndiriliyor...';
                }
            );

            await updateOfflineStorageDisplay();
        });
    }

    if (btnDownloadAllText) {
        btnDownloadAllText.addEventListener('click', async () => {
            if (!window.offlineEngine) return;
            offlineProgressWrap.style.display = 'block';
            offlineProgressBar.style.width = '0%';
            offlineProgressText.textContent = "Tüm Kur'an metinleri indiriliyor...";

            await window.offlineEngine.downloadAllQuranText((p) => {
                if (offlineProgressBar) offlineProgressBar.style.width = `${p.percentage || 0}%`;
                if (offlineProgressText) offlineProgressText.textContent = p.message || 'İndiriliyor...';
            });

            await updateOfflineStorageDisplay();
        });
    }

    if (btnCancelDownload) {
        btnCancelDownload.addEventListener('click', () => {
            if (window.offlineEngine) {
                window.offlineEngine.cancelDownload();
            }
        });
    }

    if (btnClearCache) {
        btnClearCache.addEventListener('click', async () => {
            if (confirm("Tüm çevrim dışı Kur'an sayfaları, sesler ve önbellek silinsin mi?")) {
                if (window.offlineEngine) {
                    await window.offlineEngine.clearAllOfflineData();
                    state.cache = {};
                    await updateOfflineStorageDisplay();
                    alert('Çevrim dışı önbellek başarıyla temizlendi.');
                }
            }
        });
    }

    function updateHeaderStats() {
        const stats = window.hafizEngine.stats;
        headerListeningTime.textContent = `${Math.round(stats.todayListeningMinutes)} dk`;
    }

    init();
});
