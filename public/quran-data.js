/**
 * Hafız Nuru TR - Kur'an-ı Kerim Veri Haritası
 * 114 Sure, 30 Cüz ve 604 Sayfa Eşleştirme Verileri
 */

const QURAN_DATA = {
    // 30 Cüzün Sayfa Aralıkları (Standart 604 Sayfalık Mushaf)
    juzList: [
        { juz: 1, startPage: 1, endPage: 21, totalPages: 21, name: "1. Cüz (Elif-Lâm-Mîm)", shortName: "1. Cüz" },
        { juz: 2, startPage: 22, endPage: 41, totalPages: 20, name: "2. Cüz (Seyekûl)", shortName: "2. Cüz" },
        { juz: 3, startPage: 42, endPage: 61, totalPages: 20, name: "3. Cüz (Tilker-Rusul)", shortName: "3. Cüz" },
        { juz: 4, startPage: 62, endPage: 81, totalPages: 20, name: "4. Cüz (Len Tenâlû)", shortName: "4. Cüz" },
        { juz: 5, startPage: 82, endPage: 101, totalPages: 20, name: "5. Cüz (Vel-Muhsanât)", shortName: "5. Cüz" },
        { juz: 6, startPage: 102, endPage: 121, totalPages: 20, name: "6. Cüz (Lâ Yühibbullâh)", shortName: "6. Cüz" },
        { juz: 7, startPage: 122, endPage: 141, totalPages: 20, name: "7. Cüz (Ve İzemis-Semîû)", shortName: "7. Cüz" },
        { juz: 8, startPage: 142, endPage: 161, totalPages: 20, name: "8. Cüz (Ve Lev Ennenâ)", shortName: "8. Cüz" },
        { juz: 9, startPage: 162, endPage: 181, totalPages: 20, name: "9. Cüz (Kâlel-Meleu)", shortName: "9. Cüz" },
        { juz: 10, startPage: 182, endPage: 201, totalPages: 20, name: "10. Cüz (Va'lemû)", shortName: "10. Cüz" },
        { juz: 11, startPage: 202, endPage: 221, totalPages: 20, name: "11. Cüz (Ya'tezirûn)", shortName: "11. Cüz" },
        { juz: 12, startPage: 222, endPage: 241, totalPages: 20, name: "12. Cüz (Ve Mâ Min Dâbbeh)", shortName: "12. Cüz" },
        { juz: 13, startPage: 242, endPage: 261, totalPages: 20, name: "13. Cüz (Ve Mâ Überriü)", shortName: "13. Cüz" },
        { juz: 14, startPage: 262, endPage: 281, totalPages: 20, name: "14. Cüz (Rubemâ)", shortName: "14. Cüz" },
        { juz: 15, startPage: 282, endPage: 301, totalPages: 20, name: "15. Cüz (Sübhânellezî)", shortName: "15. Cüz" },
        { juz: 16, startPage: 302, endPage: 321, totalPages: 20, name: "16. Cüz (Kâle Elem)", shortName: "16. Cüz" },
        { juz: 17, startPage: 322, endPage: 341, totalPages: 20, name: "17. Cüz (İkterabe)", shortName: "17. Cüz" },
        { juz: 18, startPage: 342, endPage: 361, totalPages: 20, name: "18. Cüz (Kad Eflaha)", shortName: "18. Cüz" },
        { juz: 19, startPage: 362, endPage: 381, totalPages: 20, name: "19. Cüz (Ve Kâlellezîne)", shortName: "19. Cüz" },
        { juz: 20, startPage: 382, endPage: 401, totalPages: 20, name: "20. Cüz (Ehmen Halaka)", shortName: "20. Cüz" },
        { juz: 21, startPage: 402, endPage: 421, totalPages: 20, name: "21. Cüz (Utlu Mâ Ûhiye)", shortName: "21. Cüz" },
        { juz: 22, startPage: 422, endPage: 441, totalPages: 20, name: "22. Cüz (Ve Men Yaknut)", shortName: "22. Cüz" },
        { juz: 23, startPage: 442, endPage: 461, totalPages: 20, name: "23. Cüz (Ve Mâ Liye)", shortName: "23. Cüz" },
        { juz: 24, startPage: 462, endPage: 481, totalPages: 20, name: "24. Cüz (Femen Ezlem)", shortName: "24. Cüz" },
        { juz: 25, startPage: 482, endPage: 501, totalPages: 20, name: "25. Cüz (İleyhi Yüraddü)", shortName: "25. Cüz" },
        { juz: 26, startPage: 502, endPage: 521, totalPages: 20, name: "26. Cüz (Hâ-Mîm)", shortName: "26. Cüz" },
        { juz: 27, startPage: 522, endPage: 541, totalPages: 20, name: "27. Cüz (Kâle Femâ Hatbukum)", shortName: "27. Cüz" },
        { juz: 28, startPage: 542, endPage: 561, totalPages: 20, name: "28. Cüz (Kad Semiallâh)", shortName: "28. Cüz" },
        { juz: 29, startPage: 562, endPage: 581, totalPages: 20, name: "29. Cüz (Tebâreke)", shortName: "29. Cüz" },
        { juz: 30, startPage: 582, endPage: 604, totalPages: 23, name: "30. Cüz (Amme)", shortName: "30. Cüz" }
    ],

    // 114 Sure Temel Bilgileri
    surahs: [
        { id: 1, nameAr: "الفاتحة", nameTr: "Fâtiha", ayahs: 7, startPage: 1 },
        { id: 2, nameAr: "البقرة", nameTr: "Bakara", ayahs: 286, startPage: 2 },
        { id: 3, nameAr: "آل عمران", nameTr: "Âl-i İmrân", ayahs: 200, startPage: 50 },
        { id: 4, nameAr: "النساء", nameTr: "Nisâ", ayahs: 176, startPage: 77 },
        { id: 5, nameAr: "المائدة", nameTr: "Mâide", ayahs: 120, startPage: 106 },
        { id: 6, nameAr: "الأنعام", nameTr: "En'âm", ayahs: 165, startPage: 128 },
        { id: 7, nameAr: "الأعراف", nameTr: "A'râf", ayahs: 206, startPage: 151 },
        { id: 8, nameAr: "الأنفال", nameTr: "Enfâl", ayahs: 75, startPage: 177 },
        { id: 9, nameAr: "التوبة", nameTr: "Tevbe", ayahs: 129, startPage: 187 },
        { id: 10, nameAr: "يونس", nameTr: "Yûnus", ayahs: 109, startPage: 208 },
        { id: 11, nameAr: "هود", nameTr: "Hûd", ayahs: 123, startPage: 221 },
        { id: 12, nameAr: "يوسف", nameTr: "Yûsuf", ayahs: 111, startPage: 235 },
        { id: 13, nameAr: "الرعد", nameTr: "Ra'd", ayahs: 43, startPage: 249 },
        { id: 14, nameAr: "إبراهيم", nameTr: "İbrâhîm", ayahs: 52, startPage: 255 },
        { id: 15, nameAr: "الحجر", nameTr: "Hicr", ayahs: 99, startPage: 262 },
        { id: 16, nameAr: "النحل", nameTr: "Nahl", ayahs: 128, startPage: 267 },
        { id: 17, nameAr: "الإسراء", nameTr: "İsrâ", ayahs: 111, startPage: 282 },
        { id: 18, nameAr: "الكهف", nameTr: "Kehf", ayahs: 110, startPage: 293 },
        { id: 19, nameAr: "مريم", nameTr: "Meryem", ayahs: 98, startPage: 305 },
        { id: 20, nameAr: "طه", nameTr: "Tâhâ", ayahs: 135, startPage: 312 },
        { id: 21, nameAr: "الأنبياء", nameTr: "Enbiyâ", ayahs: 112, startPage: 322 },
        { id: 22, nameAr: "الحج", nameTr: "Hac", ayahs: 78, startPage: 332 },
        { id: 23, nameAr: "المؤمنون", nameTr: "Mü'minûn", ayahs: 118, startPage: 342 },
        { id: 24, nameAr: "النور", nameTr: "Nûr", ayahs: 64, startPage: 350 },
        { id: 25, nameAr: "الفرقان", nameTr: "Furkân", ayahs: 77, startPage: 359 },
        { id: 26, nameAr: "الشعراء", nameTr: "Şuarâ", ayahs: 227, startPage: 367 },
        { id: 27, nameAr: "النمل", nameTr: "Neml", ayahs: 93, startPage: 377 },
        { id: 28, nameAr: "القصص", nameTr: "Kasas", ayahs: 88, startPage: 385 },
        { id: 29, nameAr: "العنكبوت", nameTr: "Ankebût", ayahs: 69, startPage: 396 },
        { id: 30, nameAr: "الروم", nameTr: "Rûm", ayahs: 60, startPage: 404 },
        { id: 31, nameAr: "لقمان", nameTr: "Lokmân", ayahs: 34, startPage: 411 },
        { id: 32, nameAr: "السجدة", nameTr: "Secde", ayahs: 30, startPage: 415 },
        { id: 33, nameAr: "الأحزاب", nameTr: "Ahzâb", ayahs: 73, startPage: 418 },
        { id: 34, nameAr: "سبإ", nameTr: "Sebe'", ayahs: 54, startPage: 428 },
        { id: 35, nameAr: "فاطر", nameTr: "Fâtır", ayahs: 45, startPage: 434 },
        { id: 36, nameAr: "يس", nameTr: "Yâsîn", ayahs: 83, startPage: 440 },
        { id: 37, nameAr: "الصافات", nameTr: "Sâffât", ayahs: 182, startPage: 446 },
        { id: 38, nameAr: "ص", nameTr: "Sâd", ayahs: 88, startPage: 453 },
        { id: 39, nameAr: "الزمر", nameTr: "Zümer", ayahs: 75, startPage: 458 },
        { id: 40, nameAr: "غافر", nameTr: "Mü'min (Gâfir)", ayahs: 85, startPage: 467 },
        { id: 41, nameAr: "فصلت", nameTr: "Fussilet", ayahs: 54, startPage: 477 },
        { id: 42, nameAr: "الشورى", nameTr: "Şûrâ", ayahs: 53, startPage: 483 },
        { id: 43, nameAr: "الزخرف", nameTr: "Zuhruf", ayahs: 89, startPage: 489 },
        { id: 44, nameAr: "الدخان", nameTr: "Duhân", ayahs: 59, startPage: 496 },
        { id: 45, nameAr: "الجاثية", nameTr: "Câsiye", ayahs: 37, startPage: 499 },
        { id: 46, nameAr: "الأحقاف", nameTr: "Ahkâf", ayahs: 35, startPage: 502 },
        { id: 47, nameAr: "محمد", nameTr: "Muhammed", ayahs: 38, startPage: 507 },
        { id: 48, nameAr: "الفتح", nameTr: "Fetih", ayahs: 29, startPage: 511 },
        { id: 49, nameAr: "الحجرات", nameTr: "Hucurât", ayahs: 18, startPage: 515 },
        { id: 50, nameAr: "ق", nameTr: "Kâf", ayahs: 45, startPage: 518 },
        { id: 51, nameAr: "الذاريات", nameTr: "Zâriyât", ayahs: 60, startPage: 520 },
        { id: 52, nameAr: "الطور", nameTr: "Tûr", ayahs: 49, startPage: 523 },
        { id: 53, nameAr: "النجم", nameTr: "Necm", ayahs: 62, startPage: 526 },
        { id: 54, nameAr: "القمر", nameTr: "Kamer", ayahs: 55, startPage: 528 },
        { id: 55, nameAr: "الرحمن", nameTr: "Rahmân", ayahs: 78, startPage: 531 },
        { id: 56, nameAr: "الواقعة", nameTr: "Vâkıa", ayahs: 96, startPage: 534 },
        { id: 57, nameAr: "الحديد", nameTr: "Hadîd", ayahs: 29, startPage: 537 },
        { id: 58, nameAr: "المجادلة", nameTr: "Mücâdele", ayahs: 22, startPage: 542 },
        { id: 59, nameAr: "الحشر", nameTr: "Haşr", ayahs: 24, startPage: 545 },
        { id: 60, nameAr: "الممتحنة", nameTr: "Mümtehine", ayahs: 13, startPage: 549 },
        { id: 61, nameAr: "الصف", nameTr: "Saff", ayahs: 14, startPage: 551 },
        { id: 62, nameAr: "الجمعة", nameTr: "Cuma", ayahs: 11, startPage: 553 },
        { id: 63, nameAr: "المنافقون", nameTr: "Münâfikûn", ayahs: 11, startPage: 554 },
        { id: 64, nameAr: "التغابن", nameTr: "Teğâbün", ayahs: 18, startPage: 556 },
        { id: 65, nameAr: "الطلاق", nameTr: "Talâk", ayahs: 12, startPage: 558 },
        { id: 66, nameAr: "التحريم", nameTr: "Tahrîm", ayahs: 12, startPage: 560 },
        { id: 67, nameAr: "الملك", nameTr: "Mülk (Tebâreke)", ayahs: 30, startPage: 562 },
        { id: 68, nameAr: "القلم", nameTr: "Kalem", ayahs: 52, startPage: 564 },
        { id: 69, nameAr: "الحاقة", nameTr: "Hâkka", ayahs: 52, startPage: 566 },
        { id: 70, nameAr: "المعارج", nameTr: "Meâric", ayahs: 44, startPage: 568 },
        { id: 71, nameAr: "نوح", nameTr: "Nûh", ayahs: 28, startPage: 570 },
        { id: 72, nameAr: "الجن", nameTr: "Cin", ayahs: 28, startPage: 572 },
        { id: 73, nameAr: "المزمل", nameTr: "Müzzemmil", ayahs: 20, startPage: 574 },
        { id: 74, nameAr: "المدثر", nameTr: "Müddessir", ayahs: 56, startPage: 575 },
        { id: 75, nameAr: "القيامة", nameTr: "Kıyâme", ayahs: 40, startPage: 577 },
        { id: 76, nameAr: "الإنسان", nameTr: "İnsân", ayahs: 31, startPage: 578 },
        { id: 77, nameAr: "المرسلات", nameTr: "Mürselât", ayahs: 50, startPage: 580 },
        { id: 78, nameAr: "النبإ", nameTr: "Nebe' (Amme)", ayahs: 40, startPage: 582 },
        { id: 79, nameAr: "النازعات", nameTr: "Nâziât", ayahs: 46, startPage: 583 },
        { id: 80, nameAr: "عبس", nameTr: "Abese", ayahs: 42, startPage: 585 },
        { id: 81, nameAr: "التكوير", nameTr: "Tekvîr", ayahs: 29, startPage: 586 },
        { id: 82, nameAr: "الانفطار", nameTr: "İnfitâr", ayahs: 19, startPage: 587 },
        { id: 83, nameAr: "المطففين", nameTr: "Mutaffifîn", ayahs: 36, startPage: 587 },
        { id: 84, nameAr: "الانشقاق", nameTr: "İnşikâk", ayahs: 25, startPage: 589 },
        { id: 85, nameAr: "البروج", nameTr: "Bürûc", ayahs: 22, startPage: 590 },
        { id: 86, nameAr: "الطارق", nameTr: "Târık", ayahs: 17, startPage: 591 },
        { id: 87, nameAr: "الأعلى", nameTr: "A'lâ", ayahs: 19, startPage: 591 },
        { id: 88, nameAr: "الغاشية", nameTr: "Gâşiye", ayahs: 26, startPage: 592 },
        { id: 89, nameAr: "الفجر", nameTr: "Fecr", ayahs: 30, startPage: 593 },
        { id: 90, nameAr: "البلد", nameTr: "Beled", ayahs: 20, startPage: 594 },
        { id: 91, nameAr: "الشمس", nameTr: "Şems", ayahs: 15, startPage: 595 },
        { id: 92, nameAr: "الليل", nameTr: "Leyl", ayahs: 21, startPage: 595 },
        { id: 93, nameAr: "الضحى", nameTr: "Duhâ", ayahs: 11, startPage: 596 },
        { id: 94, nameAr: "الشرح", nameTr: "İnşirâh", ayahs: 8, startPage: 596 },
        { id: 95, nameAr: "التين", nameTr: "Tîn", ayahs: 8, startPage: 597 },
        { id: 96, nameAr: "العلق", nameTr: "Alak", ayahs: 19, startPage: 597 },
        { id: 97, nameAr: "القدر", nameTr: "Kadr", ayahs: 5, startPage: 598 },
        { id: 98, nameAr: "البينة", nameTr: "Beyyine", ayahs: 8, startPage: 598 },
        { id: 99, nameAr: "الزلزلة", nameTr: "Zilzâl", ayahs: 8, startPage: 599 },
        { id: 100, nameAr: "العاديات", nameTr: "Âdiyât", ayahs: 11, startPage: 599 },
        { id: 101, nameAr: "القارعة", nameTr: "Kâria", ayahs: 11, startPage: 600 },
        { id: 102, nameAr: "التكاثر", nameTr: "Tekâsür", ayahs: 8, startPage: 600 },
        { id: 103, nameAr: "العصر", nameTr: "Asr", ayahs: 3, startPage: 601 },
        { id: 104, nameAr: "الهمزة", nameTr: "Hümeze", ayahs: 9, startPage: 601 },
        { id: 105, nameAr: "الفيل", nameTr: "Fîl", ayahs: 5, startPage: 601 },
        { id: 106, nameAr: "قريش", nameTr: "Kureyş", ayahs: 4, startPage: 602 },
        { id: 107, nameAr: "الماعون", nameTr: "Mâûn", ayahs: 7, startPage: 602 },
        { id: 108, nameAr: "الكوثر", nameTr: "Kevser", ayahs: 3, startPage: 602 },
        { id: 109, nameAr: "الكافرون", nameTr: "Kâfirûn", ayahs: 6, startPage: 603 },
        { id: 110, nameAr: "النصر", nameTr: "Nasr", ayahs: 3, startPage: 603 },
        { id: 111, nameAr: "المسد", nameTr: "Mesed (Tebbet)", ayahs: 5, startPage: 603 },
        { id: 112, nameAr: "الإخلاص", nameTr: "İhlâs", ayahs: 4, startPage: 604 },
        { id: 113, nameAr: "الفلق", nameTr: "Felak", ayahs: 5, startPage: 604 },
        { id: 114, nameAr: "الناس", nameTr: "Nâs", ayahs: 6, startPage: 604 }
    ],

    getSurah(surahNumber) {
        const id = parseInt(surahNumber);
        return this.surahs.find(s => s.id === id) || { id, nameTr: `${id}. Sure`, nameAr: "" };
    },

    // Sayfa numarasına göre hangi cüze ait olduğunu bulma
    getJuzByPage(pageNumber) {
        return this.juzList.find(j => pageNumber >= j.startPage && pageNumber <= j.endPage) || this.juzList[0];
    },

    // Yüksek Çözünürlüklü Mushaf Sayfası Görsel URL'si (Diyanet 15 Satır, Medine & Tecvidli)
    getPageImageUrl(pageNumber, type = 'diyanet') {
        if (type === 'tajweed') {
            return `https://cdn.jsdelivr.net/gh/QuranHub/quran-pages-images@main/easyquran.com/hafs-tajweed/${pageNumber}.jpg`;
        } else if (type === 'warsh') {
            return `https://cdn.jsdelivr.net/gh/QuranHub/quran-pages-images@main/kfgqpc/warsh/${pageNumber}.jpg`;
        } else if (type === 'madani') {
            return `https://cdn.jsdelivr.net/gh/QuranHub/quran-pages-images@main/kfgqpc/hafs-wasat/${pageNumber}.jpg`;
        }
        // 'diyanet' - Diyanet İşleri Başkanlığı 15 Satır Standart Âyet-Berkenar Mushafı
        return `https://cdn.jsdelivr.net/gh/QuranHub/quran-pages-images@main/kfgqpc/hafs-wasat/${pageNumber}.jpg`;
    },

    getFallbackPageImageUrl(pageNumber, type = 'diyanet') {
        if (type === 'tajweed') {
            return `https://raw.githubusercontent.com/QuranHub/quran-pages-images/main/easyquran.com/hafs-tajweed/${pageNumber}.jpg`;
        } else if (type === 'warsh') {
            return `https://raw.githubusercontent.com/QuranHub/quran-pages-images/main/kfgqpc/warsh/${pageNumber}.jpg`;
        } else if (type === 'madani') {
            return `https://raw.githubusercontent.com/QuranHub/quran-pages-images/main/kfgqpc/hafs-wasat/${pageNumber}.jpg`;
        }
        return `https://raw.githubusercontent.com/QuranHub/quran-pages-images/main/kfgqpc/hafs-wasat/${pageNumber}.jpg`;
    }
};

if (typeof window !== 'undefined') {
    window.QURAN_DATA = QURAN_DATA;
}
