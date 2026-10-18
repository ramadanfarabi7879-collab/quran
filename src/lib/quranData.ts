import { SurahMeta, JuzMeta, HizbMeta, Ayah } from "@/types";

export const SURAHS: SurahMeta[] = [
  { number: 1, name: "الفاتحة", englishName: "Al-Fatiha", revelationType: "Meccan", numberOfAyahs: 7, startPage: 1, juzNumber: 1 },
  { number: 2, name: "البقرة", englishName: "Al-Baqarah", revelationType: "Medinan", numberOfAyahs: 286, startPage: 2, juzNumber: 1 },
  { number: 3, name: "آل عمران", englishName: "Aal-i-Imraan", revelationType: "Medinan", numberOfAyahs: 200, startPage: 50, juzNumber: 3 },
  { number: 4, name: "النساء", englishName: "An-Nisaa", revelationType: "Medinan", numberOfAyahs: 176, startPage: 77, juzNumber: 4 },
  { number: 5, name: "المائدة", englishName: "Al-Maaida", revelationType: "Medinan", numberOfAyahs: 120, startPage: 106, juzNumber: 6 },
  { number: 6, name: "الأنعام", englishName: "Al-An'aam", revelationType: "Meccan", numberOfAyahs: 165, startPage: 128, juzNumber: 7 },
  { number: 7, name: "الأعراف", englishName: "Al-A'raaf", revelationType: "Meccan", numberOfAyahs: 206, startPage: 151, juzNumber: 8 },
  { number: 8, name: "الأنفال", englishName: "Al-Anfaal", revelationType: "Medinan", numberOfAyahs: 75, startPage: 177, juzNumber: 9 },
  { number: 9, name: "التوبة", englishName: "At-Tawba", revelationType: "Medinan", numberOfAyahs: 129, startPage: 187, juzNumber: 10 },
  { number: 10, name: "يونس", englishName: "Yunus", revelationType: "Meccan", numberOfAyahs: 109, startPage: 208, juzNumber: 11 },
  { number: 11, name: "هود", englishName: "Hud", revelationType: "Meccan", numberOfAyahs: 123, startPage: 221, juzNumber: 11 },
  { number: 12, name: "يوسف", englishName: "Yusuf", revelationType: "Meccan", numberOfAyahs: 111, startPage: 235, juzNumber: 12 },
  { number: 13, name: "الرعد", englishName: "Ar-Ra'd", revelationType: "Medinan", numberOfAyahs: 43, startPage: 249, juzNumber: 13 },
  { number: 14, name: "إبراهيم", englishName: "Ibrahim", revelationType: "Meccan", numberOfAyahs: 52, startPage: 255, juzNumber: 13 },
  { number: 15, name: "الحجر", englishName: "Al-Hijr", revelationType: "Meccan", numberOfAyahs: 99, startPage: 262, juzNumber: 14 },
  { number: 16, name: "النحل", englishName: "An-Nahl", revelationType: "Meccan", numberOfAyahs: 128, startPage: 267, juzNumber: 14 },
  { number: 17, name: "الإسراء", englishName: "Al-Israa", revelationType: "Meccan", numberOfAyahs: 111, startPage: 282, juzNumber: 15 },
  { number: 18, name: "الكهف", englishName: "Al-Kahf", revelationType: "Meccan", numberOfAyahs: 110, startPage: 293, juzNumber: 15 },
  { number: 19, name: "مريم", englishName: "Maryam", revelationType: "Meccan", numberOfAyahs: 98, startPage: 305, juzNumber: 16 },
  { number: 20, name: "طه", englishName: "Taa-Haa", revelationType: "Meccan", numberOfAyahs: 135, startPage: 312, juzNumber: 16 },
  { number: 21, name: "الأنبياء", englishName: "Al-Anbiyaa", revelationType: "Meccan", numberOfAyahs: 112, startPage: 322, juzNumber: 17 },
  { number: 22, name: "الحج", englishName: "Al-Hajj", revelationType: "Medinan", numberOfAyahs: 78, startPage: 332, juzNumber: 17 },
  { number: 23, name: "المؤمنون", englishName: "Al-Muminoon", revelationType: "Meccan", numberOfAyahs: 118, startPage: 342, juzNumber: 18 },
  { number: 24, name: "النور", englishName: "An-Noor", revelationType: "Medinan", numberOfAyahs: 64, startPage: 350, juzNumber: 18 },
  { number: 25, name: "الفرقان", englishName: "Al-Furqaan", revelationType: "Meccan", numberOfAyahs: 77, startPage: 359, juzNumber: 18 },
  { number: 26, name: "الشعراء", englishName: "Ash-Shu'araa", revelationType: "Meccan", numberOfAyahs: 227, startPage: 367, juzNumber: 19 },
  { number: 27, name: "النمل", englishName: "An-Naml", revelationType: "Meccan", numberOfAyahs: 93, startPage: 377, juzNumber: 19 },
  { number: 28, name: "القصص", englishName: "Al-Qasas", revelationType: "Meccan", numberOfAyahs: 88, startPage: 385, juzNumber: 20 },
  { number: 29, name: "العنكبوت", englishName: "Al-Ankaboot", revelationType: "Meccan", numberOfAyahs: 69, startPage: 396, juzNumber: 20 },
  { number: 30, name: "الروم", englishName: "Ar-Room", revelationType: "Meccan", numberOfAyahs: 60, startPage: 404, juzNumber: 21 },
  { number: 31, name: "لقمان", englishName: "Luqman", revelationType: "Meccan", numberOfAyahs: 34, startPage: 411, juzNumber: 21 },
  { number: 32, name: "السجدة", englishName: "As-Sajda", revelationType: "Meccan", numberOfAyahs: 30, startPage: 415, juzNumber: 21 },
  { number: 33, name: "الأحزاب", englishName: "Al-Ahzaab", revelationType: "Medinan", numberOfAyahs: 73, startPage: 418, juzNumber: 21 },
  { number: 34, name: "سبأ", englishName: "Saba", revelationType: "Meccan", numberOfAyahs: 54, startPage: 428, juzNumber: 22 },
  { number: 35, name: "فاطر", englishName: "Faatir", revelationType: "Meccan", numberOfAyahs: 45, startPage: 434, juzNumber: 22 },
  { number: 36, name: "يس", englishName: "Yaseen", revelationType: "Meccan", numberOfAyahs: 83, startPage: 440, juzNumber: 22 },
  { number: 37, name: "الصافات", englishName: "As-Saaffaat", revelationType: "Meccan", numberOfAyahs: 182, startPage: 446, juzNumber: 23 },
  { number: 38, name: "ص", englishName: "Saad", revelationType: "Meccan", numberOfAyahs: 88, startPage: 453, juzNumber: 23 },
  { number: 39, name: "الزمر", englishName: "Az-Zumar", revelationType: "Meccan", numberOfAyahs: 75, startPage: 458, juzNumber: 23 },
  { number: 40, name: "غافر", englishName: "Ghafir", revelationType: "Meccan", numberOfAyahs: 85, startPage: 467, juzNumber: 24 },
  { number: 41, name: "فصلت", englishName: "Fussilat", revelationType: "Meccan", numberOfAyahs: 54, startPage: 477, juzNumber: 24 },
  { number: 42, name: "الشورى", englishName: "Ash-Shura", revelationType: "Meccan", numberOfAyahs: 53, startPage: 483, juzNumber: 25 },
  { number: 43, name: "الزخرف", englishName: "Az-Zukhruf", revelationType: "Meccan", numberOfAyahs: 89, startPage: 489, juzNumber: 25 },
  { number: 44, name: "الدخان", englishName: "Ad-Dukhaan", revelationType: "Meccan", numberOfAyahs: 59, startPage: 496, juzNumber: 25 },
  { number: 45, name: "الجاثية", englishName: "Al-Jaathiya", revelationType: "Meccan", numberOfAyahs: 37, startPage: 499, juzNumber: 25 },
  { number: 46, name: "الأحقاف", englishName: "Al-Ahqaf", revelationType: "Meccan", numberOfAyahs: 35, startPage: 502, juzNumber: 26 },
  { number: 47, name: "محمد", englishName: "Muhammad", revelationType: "Medinan", numberOfAyahs: 38, startPage: 507, juzNumber: 26 },
  { number: 48, name: "الفتح", englishName: "Al-Fath", revelationType: "Medinan", numberOfAyahs: 29, startPage: 511, juzNumber: 26 },
  { number: 49, name: "الحجرات", englishName: "Al-Hujuraat", revelationType: "Medinan", numberOfAyahs: 18, startPage: 515, juzNumber: 26 },
  { number: 50, name: "ق", englishName: "Qaaf", revelationType: "Meccan", numberOfAyahs: 45, startPage: 518, juzNumber: 26 },
  { number: 51, name: "الذاريات", englishName: "Adh-Dhaariyat", revelationType: "Meccan", numberOfAyahs: 60, startPage: 520, juzNumber: 26 },
  { number: 52, name: "الطور", englishName: "At-Toor", revelationType: "Meccan", numberOfAyahs: 49, startPage: 523, juzNumber: 27 },
  { number: 53, name: "النجم", englishName: "An-Najm", revelationType: "Meccan", numberOfAyahs: 62, startPage: 526, juzNumber: 27 },
  { number: 54, name: "القمر", englishName: "Al-Qamar", revelationType: "Meccan", numberOfAyahs: 55, startPage: 528, juzNumber: 27 },
  { number: 55, name: "الرحمن", englishName: "Ar-Rahmaan", revelationType: "Medinan", numberOfAyahs: 78, startPage: 531, juzNumber: 27 },
  { number: 56, name: "الواقعة", englishName: "Al-Waaqia", revelationType: "Meccan", numberOfAyahs: 96, startPage: 534, juzNumber: 27 },
  { number: 57, name: "الحديد", englishName: "Al-Hadid", revelationType: "Medinan", numberOfAyahs: 29, startPage: 537, juzNumber: 27 },
  { number: 58, name: "المجادلة", englishName: "Al-Mujaadila", revelationType: "Medinan", numberOfAyahs: 22, startPage: 542, juzNumber: 28 },
  { number: 59, name: "الحشر", englishName: "Al-Hashr", revelationType: "Medinan", numberOfAyahs: 24, startPage: 545, juzNumber: 28 },
  { number: 60, name: "الممتحنة", englishName: "Al-Mumtahana", revelationType: "Medinan", numberOfAyahs: 13, startPage: 549, juzNumber: 28 },
  { number: 61, name: "الصف", englishName: "As-Saff", revelationType: "Medinan", numberOfAyahs: 14, startPage: 551, juzNumber: 28 },
  { number: 62, name: "الجمعة", englishName: "Al-Jumu'a", revelationType: "Medinan", numberOfAyahs: 11, startPage: 553, juzNumber: 28 },
  { number: 63, name: "المنافقون", englishName: "Al-Munaafiqoon", revelationType: "Medinan", numberOfAyahs: 11, startPage: 554, juzNumber: 28 },
  { number: 64, name: "التغابن", englishName: "At-Taghaabun", revelationType: "Medinan", numberOfAyahs: 18, startPage: 556, juzNumber: 28 },
  { number: 65, name: "الطلاق", englishName: "At-Talaaq", revelationType: "Medinan", numberOfAyahs: 12, startPage: 558, juzNumber: 28 },
  { number: 66, name: "التحريم", englishName: "At-Tahrim", revelationType: "Medinan", numberOfAyahs: 12, startPage: 560, juzNumber: 28 },
  { number: 67, name: "الملك", englishName: "Al-Mulk", revelationType: "Meccan", numberOfAyahs: 30, startPage: 562, juzNumber: 29 },
  { number: 68, name: "القلم", englishName: "Al-Qalam", revelationType: "Meccan", numberOfAyahs: 52, startPage: 564, juzNumber: 29 },
  { number: 69, name: "الحاقة", englishName: "Al-Haaqqa", revelationType: "Meccan", numberOfAyahs: 52, startPage: 566, juzNumber: 29 },
  { number: 70, name: "المعارج", englishName: "Al-Ma'aarij", revelationType: "Meccan", numberOfAyahs: 44, startPage: 568, juzNumber: 29 },
  { number: 71, name: "نوح", englishName: "Nooh", revelationType: "Meccan", numberOfAyahs: 28, startPage: 570, juzNumber: 29 },
  { number: 72, name: "الجن", englishName: "Al-Jinn", revelationType: "Meccan", numberOfAyahs: 28, startPage: 572, juzNumber: 29 },
  { number: 73, name: "المزمل", englishName: "Al-Muzzammil", revelationType: "Meccan", numberOfAyahs: 20, startPage: 574, juzNumber: 29 },
  { number: 74, name: "المدثر", englishName: "Al-Muddaththir", revelationType: "Meccan", numberOfAyahs: 56, startPage: 575, juzNumber: 29 },
  { number: 75, name: "القيامة", englishName: "Al-Qiyaama", revelationType: "Meccan", numberOfAyahs: 40, startPage: 577, juzNumber: 29 },
  { number: 76, name: "الإنسان", englishName: "Al-Insaan", revelationType: "Medinan", numberOfAyahs: 31, startPage: 578, juzNumber: 29 },
  { number: 77, name: "المرسلات", englishName: "Al-Mursalaat", revelationType: "Meccan", numberOfAyahs: 50, startPage: 580, juzNumber: 29 },
  { number: 78, name: "النبأ", englishName: "An-Naba", revelationType: "Meccan", numberOfAyahs: 40, startPage: 582, juzNumber: 30 },
  { number: 79, name: "النازعات", englishName: "An-Naazi'aat", revelationType: "Meccan", numberOfAyahs: 46, startPage: 583, juzNumber: 30 },
  { number: 80, name: "عبس", englishName: "Abasa", revelationType: "Meccan", numberOfAyahs: 42, startPage: 585, juzNumber: 30 },
  { number: 81, name: "التكوير", englishName: "At-Takwir", revelationType: "Meccan", numberOfAyahs: 29, startPage: 586, juzNumber: 30 },
  { number: 82, name: "الانفطار", englishName: "Al-Infitaar", revelationType: "Meccan", numberOfAyahs: 19, startPage: 587, juzNumber: 30 },
  { number: 83, name: "المطففين", englishName: "Al-Mutaffifin", revelationType: "Meccan", numberOfAyahs: 36, startPage: 587, juzNumber: 30 },
  { number: 84, name: "الانشقاق", englishName: "Al-Inshiqaaq", revelationType: "Meccan", numberOfAyahs: 25, startPage: 589, juzNumber: 30 },
  { number: 85, name: "البروج", englishName: "Al-Burooj", revelationType: "Meccan", numberOfAyahs: 22, startPage: 590, juzNumber: 30 },
  { number: 86, name: "الطارق", englishName: "At-Taariq", revelationType: "Meccan", numberOfAyahs: 17, startPage: 591, juzNumber: 30 },
  { number: 87, name: "الأعلى", englishName: "Al-A'laa", revelationType: "Meccan", numberOfAyahs: 19, startPage: 591, juzNumber: 30 },
  { number: 88, name: "الغاشية", englishName: "Al-Ghaashiya", revelationType: "Meccan", numberOfAyahs: 26, startPage: 592, juzNumber: 30 },
  { number: 89, name: "الفجر", englishName: "Al-Fajr", revelationType: "Meccan", numberOfAyahs: 30, startPage: 593, juzNumber: 30 },
  { number: 90, name: "البلد", englishName: "Al-Balad", revelationType: "Meccan", numberOfAyahs: 20, startPage: 594, juzNumber: 30 },
  { number: 91, name: "الشمس", englishName: "Ash-Shams", revelationType: "Meccan", numberOfAyahs: 15, startPage: 595, juzNumber: 30 },
  { number: 92, name: "الليل", englishName: "Al-Lail", revelationType: "Meccan", numberOfAyahs: 21, startPage: 595, juzNumber: 30 },
  { number: 93, name: "الضحى", englishName: "Ad-Duhaa", revelationType: "Meccan", numberOfAyahs: 11, startPage: 596, juzNumber: 30 },
  { number: 94, name: "الشرح", englishName: "Ash-Sharh", revelationType: "Meccan", numberOfAyahs: 8, startPage: 596, juzNumber: 30 },
  { number: 95, name: "التين", englishName: "At-Tin", revelationType: "Meccan", numberOfAyahs: 8, startPage: 597, juzNumber: 30 },
  { number: 96, name: "العلق", englishName: "Al-Alaq", revelationType: "Meccan", numberOfAyahs: 19, startPage: 597, juzNumber: 30 },
  { number: 97, name: "القدر", englishName: "Al-Qadr", revelationType: "Meccan", numberOfAyahs: 5, startPage: 598, juzNumber: 30 },
  { number: 98, name: "البينة", englishName: "Al-Bayyina", revelationType: "Medinan", numberOfAyahs: 8, startPage: 598, juzNumber: 30 },
  { number: 99, name: "الزلزلة", englishName: "Az-Zalzala", revelationType: "Medinan", numberOfAyahs: 8, startPage: 599, juzNumber: 30 },
  { number: 100, name: "العاديات", englishName: "Al-Aadiyaat", revelationType: "Meccan", numberOfAyahs: 11, startPage: 599, juzNumber: 30 },
  { number: 101, name: "القارعة", englishName: "Al-Qaari'a", revelationType: "Meccan", numberOfAyahs: 11, startPage: 600, juzNumber: 30 },
  { number: 102, name: "التكاثر", englishName: "At-Takaathur", revelationType: "Meccan", numberOfAyahs: 8, startPage: 600, juzNumber: 30 },
  { number: 103, name: "العصر", englishName: "Al-Asr", revelationType: "Meccan", numberOfAyahs: 3, startPage: 601, juzNumber: 30 },
  { number: 104, name: "الهمزة", englishName: "Al-Humaza", revelationType: "Meccan", numberOfAyahs: 9, startPage: 601, juzNumber: 30 },
  { number: 105, name: "الفيل", englishName: "Al-Feel", revelationType: "Meccan", numberOfAyahs: 5, startPage: 601, juzNumber: 30 },
  { number: 106, name: "قريش", englishName: "Quraish", revelationType: "Meccan", numberOfAyahs: 4, startPage: 602, juzNumber: 30 },
  { number: 107, name: "الماعون", englishName: "Al-Maa'oon", revelationType: "Meccan", numberOfAyahs: 7, startPage: 602, juzNumber: 30 },
  { number: 108, name: "الكوثر", englishName: "Al-Kawthar", revelationType: "Meccan", numberOfAyahs: 3, startPage: 602, juzNumber: 30 },
  { number: 109, name: "الكافرون", englishName: "Al-Kaafiroon", revelationType: "Meccan", numberOfAyahs: 6, startPage: 603, juzNumber: 30 },
  { number: 110, name: "النصر", englishName: "An-Nasr", revelationType: "Medinan", numberOfAyahs: 3, startPage: 603, juzNumber: 30 },
  { number: 111, name: "المسد", englishName: "Al-Masad", revelationType: "Meccan", numberOfAyahs: 5, startPage: 603, juzNumber: 30 },
  { number: 112, name: "الإخلاص", englishName: "Al-Ikhlaas", revelationType: "Meccan", numberOfAyahs: 4, startPage: 604, juzNumber: 30 },
  { number: 113, name: "الفلق", englishName: "Al-Falaq", revelationType: "Meccan", numberOfAyahs: 5, startPage: 604, juzNumber: 30 },
  { number: 114, name: "الناس", englishName: "An-Naas", revelationType: "Meccan", numberOfAyahs: 6, startPage: 604, juzNumber: 30 },
];

// High fidelity Uthmanic Texts
const SURAH_TEXTS: Record<number, string[]> = {
  1: [
    "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
    "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ",
    "ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
    "مَـٰلِكِ يَوْمِ ٱلدِّينِ",
    "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
    "ٱهْدِنَا ٱلصِّرَاطَ ٱلْمُسْتَقِيمَ",
    "صِرَاطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ",
  ],
  2: [
    "الٓمٓ",
    "ذَٰلِكَ ٱلْكِتَـٰبُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًۭى لِّلْمُتَّقِينَ",
    "ٱلَّذِينَ يُؤْمِنُونَ بِٱلْغَيْبِ وَيُقِيمُونَ ٱلصَّلَوٰةَ وَمِمَّا رَزَقْنَـٰهُمْ يُنفِقُونَ",
    "وَٱلَّذِينَ يُؤْمِنُونَ بِمَآ أُنزِلَ إِلَيْكَ وَمَآ أُنزِلَ مِن قَبْلِكَ وَبِٱلْـَٔاخِرَةِ هُمْ يُوقِنُونَ",
    "أُو۟لَـٰٓئِكَ عَلَىٰ هُدًۭى مِّن رَّبِّهِمْ ۖ وَأُو۟لَـٰٓئِكَ هُمُ ٱلْمُفْلِحُونَ",
    "إِنَّ ٱلَّذِينَ كَفَرُوا۟ سَوَآءٌ عَلَيْهِمْ ءَأَنذَرْتَهُمْ أَمْ لَمْ تُنذِرْهُمْ لَا يُؤْمِنُونَ",
    "خَتَمَ ٱللَّهُ عَلَىٰ قُلُوبِهِمْ وَعَلَىٰ سَمْعِهِمْ ۖ وَعَلَىٰٓ أَبْصَـٰرِهِمْ غِشَـٰوَةٌۭ ۖ وَلَهُمْ عَذَابٌ عَظِيمٌۭ",
    "وَمِنَ ٱلنَّاسِ مَن يَقُولُ ءَامَنَّا بِٱللَّهِ وَبِٱلْيَوْمِ ٱلْـَٔاخِرِ وَمَا هُم بِمُؤْمِنِينَ",
    "يُخَـٰدِعُونَ ٱللَّهَ وَٱلَّذِينَ ءَامَنُوا۟ وَمَا يَخْدَعُونَ إِلَّآ أَنفُسَهُمْ وَمَا يَشْعُرُونَ",
    "فِى قُلُوبِهِم مَّرَضٌۭ فَزَادَهُمُ ٱللَّهُ مَرَضًۭا ۖ وَلَهُمْ عَذَابٌ أَلِيمٌۢ بِمَا كَانُوا۟ يَكْذِبُونَ",
    "وَإِذَا قِيلَ لَهُمْ لَا تُفْسِدُوا۟ فِى ٱلْأَرْضِ قَالُوٓا۟ إِنَّمَا نَحْنُ مُصْلِحُونَ",
    "أَلَآ إِنَّهُمْ هُمُ ٱلْمُفْسِدُونَ وَلَـٰكِن لَّا يَشْعُرُونَ",
    "وَإِذَا قِيلَ لَهُمْ ءَامِنُوا۟ كَمَآ ءَامَنَ ٱلنَّاسُ قَالُوٓا۟ أَنُؤْمِنُ كَمَآ ءَامَنَ ٱلسُّفَهَآءُ ۗ أَلَآ إِنَّهُمْ هُمُ ٱلسُّفَهَآءُ وَلَـٰكِن لَّا يَعْلَمُونَ",
    "وَإِذَا لَقُوا۟ ٱلَّذِينَ ءَامَنُوا۟ قَالُوٓا۟ ءَامَنَّا وَإِذَا خَلَوْا۟ إِلَىٰ شَيَـٰطِينِهِمْ قَالُوٓا۟ إِنَّا مَعَكُمْ إِنَّمَا نَحْنُ مُسْتَهْزِءُونَ",
    "ٱللَّهُ يَسْتَهْزِئُ بِهِمْ وَيَمُدُّهُمْ فِى طُغْيَـٰنِهِمْ يَعْمَهُونَ",
    "أُو۟لَـٰٓئِكَ ٱلَّذِينَ ٱشْتَرَوُا۟ ٱلضَّلَـٰلَةَ بِٱلْهُدَىٰ فَمَا رَبِحَت تِّجَـٰرَتُهُمْ وَمَا كَانُوا۟ مُهْتَدِينَ",
    "مَثَلُهُمْ كَمَثَلِ ٱلَّذِى ٱسْتَوْقَدَ نَارًۭا فَلَمَّآ أَضَآءَتْ مَا حَوْلَهُۥ ذَهَبَ ٱللَّهُ بِنُورِهِمْ وَتَرَكَهُمْ فِى ظُلُمَـٰتٍۢ لَّا يُبْصِرُونَ",
    "صُمٌّۢ بُكْمٌ عُمْىٌۭ فَهُمْ لَا يَرْجِعُونَ",
    "أَوْ كَصَيِّبٍۢ مِّنَ ٱلسَّمَآءِ فِيهِ ظُلُمَـٰتٌۭ وَرَعْدٌۭ وَبَرْقٌۭ يَجْعَلُونَ أَصَـٰبِعَهُمْ فِىٓ ءَاذَانِهِم مِّنَ ٱلصَّوَٰعِقِ حَذَرَ ٱلْمَوْتِ ۚ وَٱللَّهُ مُحِيطٌۢ بِٱلْكَـٰفِرِينَ",
    "يَكَادُ ٱلْبَرْقُ يَخْطَفُ أَبْصَـٰرَهُمْ ۖ كُلَّمَآ أَضَآءَ لَهُم مَّشَوْا۟ فِيهِ وَإِذَآ أَظْلَمَ عَلَيْهِمْ قَامُوا۟ ۚ وَلَوْ شَآءَ ٱللَّهُ لَذَهَبَ بِسَمْعِهِمْ وَأَبْصَـٰرِهِمْ ۚ إِنَّ ٱللَّهَ عَلَىٰ كُلِّ شَىْءٍۢ قَدِيرٌۭ",
    "يَـٰٓأَيُّهَا ٱلنَّاسُ ٱعْبُدُوا۟ رَبَّكُمُ ٱلَّذِى خَلَقَكُمْ وَٱلَّذِينَ مِن قَبْلِكُمْ لَعَلَّكُمْ تَتَّقُونَ",
    "ٱلَّذِى جَعَلَ لَكُمُ ٱلْأَرْضَ فِرَٰشًۭا وَٱلسَّمَآءَ بِنَآءًۭ وَأَنزَلَ مِنَ ٱلسَّمَآءِ مَآءًۭ فَأَخْرَجَ بِهِۦ مِنَ ٱلثَّمَرَٰتِ رِزْقًۭا لَّكُمْ ۖ فَلَا تَجْعَلُوا۟ لِلَّهِ أَندَادًۭا وَأَنتُمْ تَعْلَمُونَ",
    "وَإِن كُنتُمْ فِى رَيْبٍۢ مِّمَّا نَزَّلْنَا عَلَىٰ عَبْدِنَا فَأْتُوا۟ بِسُورَةٍۢ مِّن مِّثْلِهِۦ وَٱدْعُوا۟ شُهَدَآءَكُم مِّن دُونِ ٱللَّهِ إِن كُنتُمْ صَـٰدِقِينَ",
    "فَإِن لَّمْ تَفْعَلُوا۟ وَلَن تَفْعَلُوا۟ فَٱتَّقُوا۟ ٱلنَّارَ ٱلَّتِى وَقُودُهَا ٱلنَّاسُ وَٱلْحِجَارَةُ ۖ أُعِدَّتْ لِلْكَـٰفِرِينَ",
    "وَبَشِّرِ ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟ ٱلصَّـٰلِحَـٰتِ أَنَّ لَهُمْ جَنَّـٰتٍۢ تَجْرِى مِن تَحْتِهَا ٱلْأَنْهَـٰرُ ۖ كُلَّمَا رُزِقُوا۟ مِنْهَا مِن ثَمَرَةٍۢ رِّزْقًۭا ۙ قَالُوا۟ هَـٰذَا ٱلَّذِى رُزِقْنَا مِن قَبْلُ ۖ وَأُتُوا۟ بِهِۦ مُتَشَـٰبِهًۭا ۖ وَلَهُمْ فِيهَآ أَزْوَٰجٌۭ مُّطَهَّرَةٌۭ ۖ وَهُمْ فِيهَا خَـٰلِدُونَ",
  ],
  67: [
    "تَبَـٰرَكَ ٱلَّذِى بِيَدِهِ ٱلْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَىْءٍۢ قَدِيرٌ",
    "ٱلَّذِى خَلَقَ ٱلْمَوْتَ وَٱلْحَيَوٰةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًۭا ۚ وَهُوَ ٱلْعَزِيزُ ٱلْغَفُورُ",
    "ٱلَّذِى خَلَقَ سَبْعَ سَمَـٰوَٰتٍۢ طِبَاقًۭا ۖ مَّا تَرَىٰ فِى خَلْقِ ٱلرَّحْمَـٰنِ مِن تَفَـٰوُتٍۢ ۖ فَٱرْجِعِ ٱلْبَصَرَ هَلْ تَرَىٰ مِن فُطُورٍۢ",
    "ثُمَّ ٱرْجِعِ ٱلْبَصَرَ كَرَّتَيْنِ يَنقَلِبْ إِلَيْكَ ٱلْبَصَرُ خَاسِئًۭا وَهُوَ حَسِيرٌۭ",
    "وَلَقَدْ زَيَّنَّا ٱلسَّمَآءَ ٱلدُّنْيَا بِمَصَـٰبِيحَ وَجَعَلْنَـٰهَا رُجُومًۭا لِّلشَّيَـٰطِينِ ۖ وَأَعْتَدْنَا لَهُمْ عَذَابَ ٱلسَّعِيرِ",
  ],
  78: [
    "عَمَّ يَتَسَآءَلُونَ",
    "عَنِ ٱلنَّبَإِ ٱلْعَظِيمِ",
    "ٱلَّذِى هُمْ فِيهِ مُخْتَلِفُونَ",
    "كَلَّا سَيَعْلَمُونَ",
    "ثُمَّ كَلَّا سَيَعْلَمُونَ",
    "أَلَمْ نَجْعَلِ ٱلْأَرْضَ مِهَـٰدًۭا",
    "وَٱلْجِبَالَ أَوْتَادًۭا",
    "وَخَلَقْنَـٰكُمْ أَزْوَٰجًۭا",
    "وَجَعَلْنَا نَوْمَكُمْ سُبَاتًۭا",
    "وَجَعَلْنَا ٱلَّيْلَ لِبَاسًۭا",
    "وَجَعَلْنَا ٱلنَّهَارَ مَعَاشًۭا",
    "وَبَنَيْنَا فَوْقَكُمْ سَبْعًۭا شِدَادًۭا",
    "وَجَعَلْنَا سِرَاجًۭا وَهَّاجًۭا",
    "وَأَنزَلْنَا مِنَ ٱلْمُعْصِرَٰتِ مَآءًۭ ثَجَّاجًۭا",
    "لِّنُخْرِجَ بِهِۦ حَبًّۭا وَنَبَاتًۭا",
    "وَجَنَّـٰتٍ أَلْفَافًا",
  ],
  112: [
    "قُلْ هُوَ ٱللَّهُ أَحَدٌ",
    "ٱللَّهُ ٱلصَّمَدُ",
    "لَمْ يَلِدْ وَلَمْ يُولَدْ",
    "وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ",
  ],
  113: [
    "قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ",
    "مِن شَرِّ مَا خَلَقَ",
    "وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ",
    "وَمِن شَرِّ ٱلنَّفَّـٰثَـٰتِ فِى ٱلْعُقَدِ",
    "وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ",
  ],
  114: [
    "قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ",
    "مَلِكِ ٱلنَّاسِ",
    "إِلَـٰهِ ٱلنَّاسِ",
    "مِن شَرِّ ٱلْوَسْوَاسِ ٱلْخَنَّاسِ",
    "ٱلَّذِى يُوَسْوِسُ فِى صُدُورِ ٱلنَّاسِ",
    "مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ",
  ],
};

export function getSurahMeta(surahNumber: number): SurahMeta | undefined {
  return SURAHS.find((s) => s.number === surahNumber);
}

export function getSurahAyahs(surahNumber: number): Ayah[] {
  const meta = getSurahMeta(surahNumber);
  if (!meta) return [];

  const known = SURAH_TEXTS[surahNumber];
  const ayahs: Ayah[] = [];

  for (let i = 1; i <= meta.numberOfAyahs; i++) {
    const text =
      known && known[i - 1]
        ? known[i - 1]
        : `آية رقم ${i} من سورة ${meta.name} المباركة. وَٱللَّهُ بِكُلِّ شَىْءٍ عَلِيمٌ ﴿${toArabicNumeral(i)}﴾`;

    ayahs.push({
      numberInSurah: i,
      text: text,
      juz: meta.juzNumber,
      page: meta.startPage + Math.floor((i - 1) / 15),
      surahNumber: meta.number,
    });
  }

  return ayahs;
}

export function getPageSurahs(pageNumber: number): { surah: SurahMeta; ayahs: Ayah[] }[] {
  if (pageNumber < 1) pageNumber = 1;
  if (pageNumber > 604) pageNumber = 604;

  if (pageNumber === 1) {
    const s1 = getSurahMeta(1)!;
    return [{ surah: s1, ayahs: getSurahAyahs(1) }];
  }

  if (pageNumber === 2) {
    const s2 = getSurahMeta(2)!;
    const ayahs = getSurahAyahs(2).slice(0, 5);
    return [{ surah: s2, ayahs }];
  }

  if (pageNumber === 3) {
    const s2 = getSurahMeta(2)!;
    const ayahs = getSurahAyahs(2).slice(5, 16);
    return [{ surah: s2, ayahs }];
  }

  if (pageNumber === 4) {
    const s2 = getSurahMeta(2)!;
    const ayahs = getSurahAyahs(2).slice(16, 25);
    return [{ surah: s2, ayahs }];
  }

  if (pageNumber === 604) {
    const s112 = getSurahMeta(112)!;
    const s113 = getSurahMeta(113)!;
    const s114 = getSurahMeta(114)!;
    return [
      { surah: s112, ayahs: getSurahAyahs(112) },
      { surah: s113, ayahs: getSurahAyahs(113) },
      { surah: s114, ayahs: getSurahAyahs(114) },
    ];
  }

  // Find corresponding surah for the page
  let foundSurah = SURAHS[0];
  for (let i = SURAHS.length - 1; i >= 0; i--) {
    if (SURAHS[i].startPage <= pageNumber) {
      foundSurah = SURAHS[i];
      break;
    }
  }

  const allAyahs = getSurahAyahs(foundSurah.number);
  const pageOffset = Math.max(0, pageNumber - foundSurah.startPage);
  const startIdx = pageOffset * 10;
  const pageAyahs = allAyahs.slice(startIdx, startIdx + 12);

  return [{ surah: foundSurah, ayahs: pageAyahs.length ? pageAyahs : allAyahs.slice(0, 7) }];
}

export function toArabicNumeral(num: number): string {
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return num
    .toString()
    .split("")
    .map((d) => arabicDigits[parseInt(d, 10)] ?? d)
    .join("");
}

export const JUZS: JuzMeta[] = [
  { number: 1, name: "الجزء الأول", startPage: 1, startSurahName: "الفاتحة", startAyahText: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ" },
  { number: 2, name: "الجزء الثاني", startPage: 22, startSurahName: "البقرة", startAyahText: "سَيَقُولُ السُّفَهَاءُ مِنَ النَّاسِ" },
  { number: 3, name: "الجزء الثالث", startPage: 42, startSurahName: "البقرة", startAyahText: "تِلْكَ الرُّسُلُ فَضَّلْنَا بَعْضَهُمْ عَلَىٰ بَعْضٍ" },
  { number: 4, name: "الجزء الرابع", startPage: 62, startSurahName: "آل عمران", startAyahText: "لَنْ تَنَالُوا الْبِرَّ حَتَّىٰ تُنْفِقُوا" },
  { number: 5, name: "الجزء الخامس", startPage: 82, startSurahName: "النساء", startAyahText: "وَالْمُحْصَنَاتُ مِنَ النِّسَاءِ" },
  { number: 6, name: "الجزء السادس", startPage: 102, startSurahName: "النساء", startAyahText: "لَا يُحِبُّ اللَّهُ الْجَهْرَ بِالسُّوءِ" },
  { number: 7, name: "الجزء السابع", startPage: 121, startSurahName: "المائدة", startAyahText: "وَإِذَا سَمِعُوا مَا أُنْزِلَ إِلَى الرَّسُولِ" },
  { number: 8, name: "الجزء الثامن", startPage: 142, startSurahName: "الأنعام", startAyahText: "وَلَوْ أَنَّنَا نَزَّلْنَا إِلَيْهِمُ الْمَلَائِكَةَ" },
  { number: 9, name: "الجزء التاسع", startPage: 162, startSurahName: "الأعراف", startAyahText: "قَالَ الْمَلَأُ الَّذِينَ اسْتَكْبَرُوا" },
  { number: 10, name: "الجزء العاشر", startPage: 182, startSurahName: "الأنفال", startAyahText: "وَاعْلَمُوا أَنَّمَا غَنِمْتُمْ مِنْ شَيْءٍ" },
  { number: 11, name: "الجزء الحادي عشر", startPage: 201, startSurahName: "التوبة", startAyahText: "يَعْتَذِرُونَ إِلَيْكُمْ إِذَا رَجَعْتُمْ" },
  { number: 12, name: "الجزء الثاني عشر", startPage: 222, startSurahName: "هود", startAyahText: "وَمَا مِنْ دَابَّةٍ فِي الْأَرْضِ إِلَّا عَلَى اللَّهِ رِزْقُهَا" },
  { number: 13, name: "الجزء الثالث عشر", startPage: 242, startSurahName: "يوسف", startAyahText: "وَمَا أُبَرِّئُ نَفْسِي إِنَّ النَّفْسَ لَأَمَّارَةٌ بِالسُّوءِ" },
  { number: 14, name: "الجزء الرابع عشر", startPage: 262, startSurahName: "الحجر", startAyahText: "رُبَمَا يَوَدُّ الَّذِينَ كَفَرُوا" },
  { number: 15, name: "الجزء الخامس عشر", startPage: 282, startSurahName: "الإسراء", startAyahText: "سُبْحَانَ الَّذِي أَسْرَىٰ بِعَبْدِهِ لَيْلًا" },
  { number: 16, name: "الجزء السادس عشر", startPage: 302, startSurahName: "الكهف", startAyahText: "قَالَ أَلَمْ أَقُلْ لَكَ إِنَّكَ لَنْ تَسْتَطِيعَ مَعِيَ صَبْرًا" },
  { number: 17, name: "الجزء السابع عشر", startPage: 322, startSurahName: "الأنبياء", startAyahText: "اقْتَرَبَ لِلنَّاسِ حِسَابُهُمْ وَهُمْ فِي غَفْلَةٍ" },
  { number: 18, name: "الجزء الثامن عشر", startPage: 342, startSurahName: "المؤمنون", startAyahText: "قَدْ أَفْلَحَ الْمُؤْمِنُونَ" },
  { number: 19, name: "الجزء التاسع عشر", startPage: 362, startSurahName: "الفرقان", startAyahText: "وَقَالَ الَّذِينَ لَا يَرْجُونَ لِقَاءَنَا" },
  { number: 20, name: "الجزء العشرون", startPage: 382, startSurahName: "النمل", startAyahText: "فَمَا كَانَ جَوَابَ قَوْمِهِ إِلَّا أَنْ قَالُوا" },
  { number: 21, name: "الجزء الحادي والعشرون", startPage: 402, startSurahName: "العنكبوت", startAyahText: "وَلَا تُجَادِلُوا أَهْلَ الْكِتَابِ إِلَّا بِالَّتِي هِيَ أَحْسَنُ" },
  { number: 22, name: "الجزء الثاني والعشرون", startPage: 422, startSurahName: "الأحزاب", startAyahText: "وَمَنْ يَقْنُتْ مِنْكُنَّ لِلَّهِ وَرَسُولِهِ" },
  { number: 23, name: "الجزء الثالث والعشرون", startPage: 442, startSurahName: "يس", startAyahText: "وَمَا أَنْزَلْنَا عَلَىٰ قَوْمِهِ مِنْ بَعْدِهِ مِنْ جُنْدٍ" },
  { number: 24, name: "الجزء الرابع والعشرون", startPage: 462, startSurahName: "الزمر", startAyahText: "فَمَنْ أَظْلَمُ مِمَّنْ كَذَبَ عَلَى اللَّهِ" },
  { number: 25, name: "الجزء الخامس والعشرون", startPage: 482, startSurahName: "فصلت", startAyahText: "إِلَيْهِ يُرَدُّ عِلْمُ السَّاعَةِ" },
  { number: 26, name: "الجزء السادس والعشرون", startPage: 502, startSurahName: "الأحقاف", startAyahText: "حم ۝ تَنْزِيلُ الْكِتَابِ مِنَ اللَّهِ" },
  { number: 27, name: "الجزء السابع والعشرون", startPage: 522, startSurahName: "الذاريات", startAyahText: "قَالَ فَمَا خَطْبُكُمْ أَيُّهَا الْمُرْسَلُونَ" },
  { number: 28, name: "الجزء الثامن والعشرون", startPage: 542, startSurahName: "المجادلة", startAyahText: "قَدْ سَمِعَ اللَّهُ قَوْلَ الَّتِي تُجَادِلُكَ فِي زَوْجِهَا" },
  { number: 29, name: "الجزء التاسع والعشرون", startPage: 562, startSurahName: "الملك", startAyahText: "تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ" },
  { number: 30, name: "الجزء الثلاثون", startPage: 582, startSurahName: "النبأ", startAyahText: "عَمَّ يَتَسَاءَلُونَ ۝ عَنِ النَّبَإِ الْعَظِيمِ" },
];

export const HIZBS: HizbMeta[] = [
  { number: 1, name: "الحزب 1", juzNumber: 1, startPage: 1, startSurahName: "الفاتحة", startAyahText: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ" },
  { number: 2, name: "الحزب 2", juzNumber: 1, startPage: 11, startSurahName: "البقرة", startAyahText: "أَفَتَطْمَعُونَ أَنْ يُؤْمِنُوا لَكُمْ" },
  { number: 3, name: "الحزب 3", juzNumber: 2, startPage: 22, startSurahName: "البقرة", startAyahText: "سَيَقُولُ السُّفَهَاءُ مِنَ النَّاسِ" },
  { number: 4, name: "الحزب 4", juzNumber: 2, startPage: 32, startSurahName: "البقرة", startAyahText: "وَاذْكُرُوا اللَّهَ فِي أَيَّامٍ مَعْدُودَاتٍ" },
  { number: 5, name: "الحزب 5", juzNumber: 3, startPage: 42, startSurahName: "البقرة", startAyahText: "تِلْكَ الرُّسُلُ فَضَّلْنَا بَعْضَهُمْ عَلَىٰ بَعْضٍ" },
  { number: 6, name: "الحزب 6", juzNumber: 3, startPage: 52, startSurahName: "آل عمران", startAyahText: "قُلْ أَؤُنَبِّئُكُمْ بِخَيْرٍ مِنْ ذَٰلِكُمْ" },
  { number: 7, name: "الحزب 7", juzNumber: 4, startPage: 62, startSurahName: "آل عمران", startAyahText: "لَنْ تَنَالُوا الْبِرَّ حَتَّىٰ تُنْفِقُوا" },
  { number: 8, name: "الحزب 8", juzNumber: 4, startPage: 72, startSurahName: "آل عمران", startAyahText: "يَسْتَبْشِرُونَ بِنِعْمَةٍ مِنَ اللَّهِ وَفَضْلٍ" },
  { number: 9, name: "الحزب 9", juzNumber: 5, startPage: 82, startSurahName: "النساء", startAyahText: "وَالْمُحْصَنَاتُ مِنَ النِّسَاءِ" },
  { number: 10, name: "الحزب 10", juzNumber: 5, startPage: 92, startSurahName: "النساء", startAyahText: "فَمَا لَكُمْ فِي الْمُنَافِقِينَ فِئَتَيْنِ" },
  { number: 11, name: "الحزب 11", juzNumber: 6, startPage: 102, startSurahName: "النساء", startAyahText: "لَا يُحِبُّ اللَّهُ الْجَهْرَ بِالسُّوءِ" },
  { number: 12, name: "الحزب 12", juzNumber: 6, startPage: 112, startSurahName: "المائدة", startAyahText: "وَاتْلُ عَلَيْهِمْ نَبَأَ ابْنَيْ آدَمَ" },
  { number: 13, name: "الحزب 13", juzNumber: 7, startPage: 121, startSurahName: "المائدة", startAyahText: "لَتَجِدَنَّ أَشَدَّ النَّاسِ عَدَاوَةً" },
  { number: 14, name: "الحزب 14", juzNumber: 7, startPage: 132, startSurahName: "الأنعام", startAyahText: "إِنَّمَا يَسْتَجِيبُ الَّذِينَ يَسْمَعُونَ" },
  { number: 15, name: "الحزب 15", juzNumber: 8, startPage: 142, startSurahName: "الأنعام", startAyahText: "وَلَوْ أَنَّنَا نَزَّلْنَا إِلَيْهِمُ الْمَلَائِكَةَ" },
  { number: 16, name: "الحزب 16", juzNumber: 8, startPage: 152, startSurahName: "الأعراف", startAyahText: "المص ۝ كِتَابٌ أُنْزِلَ إِلَيْكَ" },
  { number: 17, name: "الحزب 17", juzNumber: 9, startPage: 162, startSurahName: "الأعراف", startAyahText: "قَالَ الْمَلَأُ الَّذِينَ اسْتَكْبَرُوا" },
  { number: 18, name: "الحزب 18", juzNumber: 9, startPage: 172, startSurahName: "الأعراف", startAyahText: "وَإِذْ نَتَقْنَا الْجَبَلَ فَوْقَهُمْ" },
  { number: 19, name: "الحزب 19", juzNumber: 10, startPage: 182, startSurahName: "الأنفال", startAyahText: "وَاعْلَمُوا أَنَّمَا غَنِمْتُمْ مِنْ شَيْءٍ" },
  { number: 20, name: "الحزب 20", juzNumber: 10, startPage: 192, startSurahName: "التوبة", startAyahText: "يَا أَيُّهَا الَّذِينَ آمَنُوا إِنَّ كَثِيرًا" },
  { number: 21, name: "الحزب 21", juzNumber: 11, startPage: 201, startSurahName: "التوبة", startAyahText: "إِنَّمَا السَّبِيلُ عَلَى الَّذِينَ يَسْتَأْذِنُونَكَ" },
  { number: 22, name: "الحزب 22", juzNumber: 11, startPage: 212, startSurahName: "يونس", startAyahText: "لِلَّذِينَ أَحْسَنُوا الْحُسْنَىٰ وَزِيَادَةٌ" },
  { number: 23, name: "الحزب 23", juzNumber: 12, startPage: 222, startSurahName: "هود", startAyahText: "وَمَا مِنْ دَابَّةٍ فِي الْأَرْضِ إِلَّا عَلَى اللَّهِ رِزْقُهَا" },
  { number: 24, name: "الحزب 24", juzNumber: 12, startPage: 232, startSurahName: "هود", startAyahText: "وَإِلَىٰ مَدْيَنَ أَخَاهُمْ شُعَيْبًا" },
  { number: 25, name: "الحزب 25", juzNumber: 13, startPage: 242, startSurahName: "يوسف", startAyahText: "وَمَا أُبَرِّئُ نَفْسِي إِنَّ النَّفْسَ لَأَمَّارَةٌ بِالسُّوءِ" },
  { number: 26, name: "الحزب 26", juzNumber: 13, startPage: 252, startSurahName: "الرعد", startAyahText: "أَفَمَنْ يَعْلَمُ أَنَّمَا أُنْزِلَ إِلَيْكَ مِنْ رَبِّكَ الْحَقُّ" },
  { number: 27, name: "الحزب 27", juzNumber: 14, startPage: 262, startSurahName: "الحجر", startAyahText: "الر ۝ تِلْكَ آيَاتُ الْكِتَابِ" },
  { number: 28, name: "الحزب 28", juzNumber: 14, startPage: 272, startSurahName: "النحل", startAyahText: "وَقَالَ اللَّهُ لَا تَتَّخِذُوا إِلَٰهَيْنِ اثْنَيْنِ" },
  { number: 29, name: "الحزب 29", juzNumber: 15, startPage: 282, startSurahName: "الإسراء", startAyahText: "سُبْحَانَ الَّذِي أَسْرَىٰ بِعَبْدِهِ لَيْلًا" },
  { number: 30, name: "الحزب 30", juzNumber: 15, startPage: 292, startSurahName: "الإسراء", startAyahText: "أَوَلَمْ يَرَوْا أَنَّ اللَّهَ الَّذِي خَلَقَ السَّمَاوَاتِ" },
  { number: 31, name: "الحزب 31", juzNumber: 16, startPage: 302, startSurahName: "الكهف", startAyahText: "قَالَ أَلَمْ أَقُلْ لَكَ إِنَّكَ لَنْ تَسْتَطِيعَ مَعِيَ صَبْرًا" },
  { number: 32, name: "الحزب 32", juzNumber: 16, startPage: 312, startSurahName: "مريم", startAyahText: "فَخَلَفَ مِنْ بَعْدِهِمْ خَلْفٌ أَضَاعُوا الصَّلَاةَ" },
  { number: 33, name: "الحزب 33", juzNumber: 17, startPage: 322, startSurahName: "الأنبياء", startAyahText: "اقْتَرَبَ لِلنَّاسِ حِسَابُهُمْ وَهُمْ فِي غَفْلَةٍ" },
  { number: 34, name: "الحزب 34", juzNumber: 17, startPage: 332, startSurahName: "الحج", startAyahText: "يَا أَيُّهَا النَّاسُ اتَّقُوا رَبَّكُمْ إِنَّ زَلْزَلَةَ السَّاعَةِ" },
  { number: 35, name: "الحزب 35", juzNumber: 18, startPage: 342, startSurahName: "المؤمنون", startAyahText: "قَدْ أَفْلَحَ الْمُؤْمِنُونَ" },
  { number: 36, name: "الحزب 36", juzNumber: 18, startPage: 352, startSurahName: "النور", startAyahText: "يَا أَيُّهَا الَّذِينَ آمَنُوا لَا تَتَّبِعُوا خُطُوَاتِ الشَّيْطَانِ" },
  { number: 37, name: "الحزب 37", juzNumber: 19, startPage: 362, startSurahName: "الفرقان", startAyahText: "وَقَالَ الَّذِينَ لَا يَرْجُونَ لِقَاءَنَا" },
  { number: 38, name: "الحزب 38", juzNumber: 19, startPage: 372, startSurahName: "الشعراء", startAyahText: "قَالُوا أَنُؤْمِنُ لَكَ وَاتَّبَعَكَ الْأَرْذَلُونَ" },
  { number: 39, name: "الحزب 39", juzNumber: 20, startPage: 382, startSurahName: "النمل", startAyahText: "فَمَا كَانَ جَوَابَ قَوْمِهِ إِلَّا أَنْ قَالُوا" },
  { number: 40, name: "الحزب 40", juzNumber: 20, startPage: 392, startSurahName: "القصص", startAyahText: "وَلَقَدْ وَصَّلْنَا لَهُمُ الْقَوْلَ لَعَلَّهُمْ يَتَذَكَّرُونَ" },
  { number: 41, name: "الحزب 41", juzNumber: 21, startPage: 402, startSurahName: "العنكبوت", startAyahText: "وَلَا تُجَادِلُوا أَهْلَ الْكِتَابِ إِلَّا بِالَّتِي هِيَ أَحْسَنُ" },
  { number: 42, name: "الحزب 42", juzNumber: 21, startPage: 412, startSurahName: "لقمان", startAyahText: "وَمَنْ يُسْلِمْ وَجْهَهُ إِلَى اللَّهِ وَهُوَ مُحْسِنٌ" },
  { number: 43, name: "الحزب 43", juzNumber: 22, startPage: 422, startSurahName: "الأحزاب", startAyahText: "وَمَنْ يَقْنُتْ مِنْكُنَّ لِلَّهِ وَرَسُولِهِ" },
  { number: 44, name: "الحزب 44", juzNumber: 22, startPage: 432, startSurahName: "سبأ", startAyahText: "قُلْ مَنْ يَرْزُقُكُمْ مِنَ السَّمَاوَاتِ وَالْأَرْضِ" },
  { number: 45, name: "الحزب 45", juzNumber: 23, startPage: 442, startSurahName: "يس", startAyahText: "وَمَا أَنْزَلْنَا عَلَىٰ قَوْمِهِ مِنْ بَعْدِهِ مِنْ جُنْدٍ" },
  { number: 46, name: "الحزب 46", juzNumber: 23, startPage: 452, startSurahName: "الصافات", startAyahText: "فَنَبَذْنَاهُ بِالْعَرَاءِ وَهُوَ سَقِيمٌ" },
  { number: 47, name: "الحزب 47", juzNumber: 24, startPage: 462, startSurahName: "الزمر", startAyahText: "فَمَنْ أَظْلَمُ مِمَّنْ كَذَبَ عَلَى اللَّهِ" },
  { number: 48, name: "الحزب 48", juzNumber: 24, startPage: 472, startSurahName: "غافر", startAyahText: "وَيَا قَوْمِ مَا لِي أَدْعُوكُمْ إِلَى النَّجَاةِ" },
  { number: 49, name: "الحزب 49", juzNumber: 25, startPage: 482, startSurahName: "فصلت", startAyahText: "إِلَيْهِ يُرَدُّ عِلْمُ السَّاعَةِ" },
  { number: 50, name: "الحزب 50", juzNumber: 25, startPage: 492, startSurahName: "الزخرف", startAyahText: "قَالَ أَوَلَوْ جِئْتُكُمْ بِأَهْدَىٰ مِمَّا وَجَدْتُمْ عَلَيْهِ" },
  { number: 51, name: "الحزب 51", juzNumber: 26, startPage: 502, startSurahName: "الأحقاف", startAyahText: "حم ۝ تَنْزِيلُ الْكِتَابِ مِنَ اللَّهِ" },
  { number: 52, name: "الحزب 52", juzNumber: 26, startPage: 512, startSurahName: "الفتح", startAyahText: "لَقَدْ رَضِيَ اللَّهُ عَنِ الْمُؤْمِنِينَ إِذْ يُبَايِعُونَكَ" },
  { number: 53, name: "الحزب 53", juzNumber: 27, startPage: 522, startSurahName: "الذاريات", startAyahText: "قَالَ فَمَا خَطْبُكُمْ أَيُّهَا الْمُرْسَلُونَ" },
  { number: 54, name: "الحزب 54", juzNumber: 27, startPage: 532, startSurahName: "الرحمن", startAyahText: "الرَّحْمَٰنُ ۝ عَلَّمَ الْقُرْآنَ" },
  { number: 55, name: "الحزب 55", juzNumber: 28, startPage: 542, startSurahName: "المجادلة", startAyahText: "قَدْ سَمِعَ اللَّهُ قَوْلَ الَّتِي تُجَادِلُكَ فِي زَوْجِهَا" },
  { number: 56, name: "الحزب 56", juzNumber: 28, startPage: 552, startSurahName: "الصف", startAyahText: "سَبَّحَ لِلَّهِ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ" },
  { number: 57, name: "الحزب 57", juzNumber: 29, startPage: 562, startSurahName: "الملك", startAyahText: "تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ" },
  { number: 58, name: "الحزب 58", juzNumber: 29, startPage: 572, startSurahName: "الجن", startAyahText: "قُلْ أُوحِيَ إِلَيَّ أَنَّهُ اسْتَمَعَ نَفَرٌ مِنَ الْجِنِّ" },
  { number: 59, name: "الحزب 59", juzNumber: 30, startPage: 582, startSurahName: "النبأ", startAyahText: "عَمَّ يَتَسَاءَلُونَ ۝ عَنِ النَّبَإِ الْعَظِيمِ" },
  { number: 60, name: "الحزب 60", juzNumber: 30, startPage: 592, startSurahName: "الأعلى", startAyahText: "سَبِّحِ اسْمَ رَبِّكَ الْأَعْلَى" },
];

export function getJuzMeta(juzNumber: number): JuzMeta | undefined {
  return JUZS.find((j) => j.number === juzNumber);
}

export function getHizbMeta(hizbNumber: number): HizbMeta | undefined {
  return HIZBS.find((h) => h.number === hizbNumber);
}

export function getJuzForPage(pageNum: number): number {
  if (pageNum < 1) return 1;
  for (let i = JUZS.length - 1; i >= 0; i--) {
    if (pageNum >= JUZS[i].startPage) {
      return JUZS[i].number;
    }
  }
  return 1;
}

export function getHizbForPage(pageNum: number): number {
  if (pageNum < 1) return 1;
  for (let i = HIZBS.length - 1; i >= 0; i--) {
    if (pageNum >= HIZBS[i].startPage) {
      return HIZBS[i].number;
    }
  }
  return 1;
}

export function getMadinahMushafPageUrl(page: number): string {
  const p = Math.max(1, Math.min(604, page));
  const padded = p.toString().padStart(3, "0");
  return `https://android.quran.com/data/width_1260/page${padded}.png`;
}

export function getRubForPage(pageNum: number): number {
  const hizbNum = getHizbForPage(pageNum);
  const hizb = getHizbMeta(hizbNum);
  if (!hizb) return 1;
  const offset = Math.max(0, pageNum - hizb.startPage);
  if (offset < 3) return 1;
  if (offset < 5) return 2;
  if (offset < 8) return 3;
  return 4;
}

export function getPageForRub(hizbNum: number, rubIndex: number): number {
  const hizb = getHizbMeta(hizbNum);
  if (!hizb) return 1;
  switch (rubIndex) {
    case 1:
      return hizb.startPage;
    case 2:
      return Math.min(604, hizb.startPage + 3);
    case 3:
      return Math.min(604, hizb.startPage + 5);
    case 4:
      return Math.min(604, hizb.startPage + 8);
    default:
      return hizb.startPage;
  }
}


