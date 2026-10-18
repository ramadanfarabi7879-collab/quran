// 240 Quranic Quarters (أرباع القرآن الكريم) according to the King Fahd Madinah Mushaf
export interface QuarterData {
  number: number; // 1 to 240
  juzNumber: number; // 1 to 30
  hizbNumber: number; // 1 to 60
  rubInHizb: 1 | 2 | 3 | 4;
  typeLabel: "بداية الحزب" | "ربع الحزب" | "نصف الحزب" | "ثلاثة أرباع الحزب";
  surahName: string;
  surahNumber: number;
  ayahNumber: number;
  ayahText: string;
  page: number;
}

export const QURAN_QUARTERS: QuarterData[] = [
  // JUZ 1 (الحزب 1 والحزب 2)
  { number: 1, juzNumber: 1, hizbNumber: 1, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "الفاتحة", surahNumber: 1, ayahNumber: 1, ayahText: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", page: 1 },
  { number: 2, juzNumber: 1, hizbNumber: 1, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "البقرة", surahNumber: 2, ayahNumber: 26, ayahText: "إِنَّ اللَّهَ لَا يَسْتَحْيِي أَنْ يَضْرِبَ مَثَلًا مَا بَعُوضَةً", page: 5 },
  { number: 3, juzNumber: 1, hizbNumber: 1, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "البقرة", surahNumber: 2, ayahNumber: 44, ayahText: "أَتَأْمُرُونَ النَّاسَ بِالْبِرِّ وَتَنْسَوْنَ أَنْفُسَكُمْ", page: 7 },
  { number: 4, juzNumber: 1, hizbNumber: 1, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "البقرة", surahNumber: 2, ayahNumber: 60, ayahText: "وَإِذِ اسْتَسْقَىٰ مُوسَىٰ لِقَوْمِهِ", page: 9 },

  { number: 5, juzNumber: 1, hizbNumber: 2, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "البقرة", surahNumber: 2, ayahNumber: 75, ayahText: "أَفَتَطْمَعُونَ أَنْ يُؤْمِنُوا لَكُمْ", page: 11 },
  { number: 6, juzNumber: 1, hizbNumber: 2, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "البقرة", surahNumber: 2, ayahNumber: 92, ayahText: "وَلَقَدْ جَاءَكُمْ مُوسَىٰ بِالْبَيِّنَاتِ", page: 14 },
  { number: 7, juzNumber: 1, hizbNumber: 2, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "البقرة", surahNumber: 2, ayahNumber: 106, ayahText: "مَا نَنْسَخْ مِنْ آيَةٍ أَوْ نُنْسِهَا نَأْتِ بِخَيْرٍ مِنْهَا", page: 17 },
  { number: 8, juzNumber: 1, hizbNumber: 2, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "البقرة", surahNumber: 2, ayahNumber: 124, ayahText: "وَإِذِ ابْتَلَىٰ إِبْرَاهِيمَ رَبُّهُ بِكَلِمَاتٍ", page: 19 },

  // JUZ 2 (الحزب 3 والحزب 4)
  { number: 9, juzNumber: 2, hizbNumber: 3, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "البقرة", surahNumber: 2, ayahNumber: 142, ayahText: "سَيَقُولُ السُّفَهَاءُ مِنَ النَّاسِ مَا وَلَّاهُمْ", page: 22 },
  { number: 10, juzNumber: 2, hizbNumber: 3, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "البقرة", surahNumber: 2, ayahNumber: 158, ayahText: "إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ", page: 24 },
  { number: 11, juzNumber: 2, hizbNumber: 3, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "البقرة", surahNumber: 2, ayahNumber: 177, ayahText: "لَيْسَ الْبِرَّ أَنْ تُوَلُّوا وُجُوهَكُمْ قِبَلَ الْمَشْرِقِ", page: 27 },
  { number: 12, juzNumber: 2, hizbNumber: 3, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "البقرة", surahNumber: 2, ayahNumber: 189, ayahText: "يَسْأَلُونَكَ عَنِ الْأَهِلَّةِ ۖ قُلْ هِيَ مَوَاقِيتُ لِلنَّاسِ", page: 29 },

  { number: 13, juzNumber: 2, hizbNumber: 4, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "البقرة", surahNumber: 2, ayahNumber: 203, ayahText: "وَاذْكُرُوا اللَّهَ فِي أَيَّامٍ مَعْدُودَاتٍ", page: 32 },
  { number: 14, juzNumber: 2, hizbNumber: 4, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "البقرة", surahNumber: 2, ayahNumber: 219, ayahText: "يَسْأَلُونَكَ عَنِ الْخَمْرِ وَالْمَيْسِرِ", page: 34 },
  { number: 15, juzNumber: 2, hizbNumber: 4, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "البقرة", surahNumber: 2, ayahNumber: 233, ayahText: "وَالْوَالِدَاتُ يُرْضِعْنَ أَوْلَادَهُنَّ حَوْلَيْنِ كَامِلَيْنِ", page: 37 },
  { number: 16, juzNumber: 2, hizbNumber: 4, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "البقرة", surahNumber: 2, ayahNumber: 243, ayahText: "أَلَمْ تَرَ إِلَى الَّذِينَ خَرَجُوا مِنْ دِيَارِهِمْ", page: 39 },

  // JUZ 3 (الحزب 5 والحزب 6)
  { number: 17, juzNumber: 3, hizbNumber: 5, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "البقرة", surahNumber: 2, ayahNumber: 253, ayahText: "تِلْكَ الرُّسُلُ فَضَّلْنَا بَعْضَهُمْ عَلَىٰ بَعْضٍ", page: 42 },
  { number: 18, juzNumber: 3, hizbNumber: 5, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "البقرة", surahNumber: 2, ayahNumber: 263, ayahText: "قَوْلٌ مَعْرُوفٌ وَمَغْفِرَةٌ خَيْرٌ مِنْ صَدَقَةٍ", page: 44 },
  { number: 19, juzNumber: 3, hizbNumber: 5, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "البقرة", surahNumber: 2, ayahNumber: 272, ayahText: "لَيْسَ عَلَيْكَ هُدَاهُمْ وَلَٰكِنَّ اللَّهَ يَهْدِي مَنْ يَشَاءُ", page: 46 },
  { number: 20, juzNumber: 3, hizbNumber: 5, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "البقرة", surahNumber: 2, ayahNumber: 283, ayahText: "وَإِنْ كُنْتُمْ عَلَىٰ سَفَرٍ وَلَمْ تَجِدُوا كَاتِبًا", page: 49 },

  { number: 21, juzNumber: 3, hizbNumber: 6, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "آل عمران", surahNumber: 3, ayahNumber: 15, ayahText: "قُلْ أَؤُنَبِّئُكُمْ بِخَيْرٍ مِنْ ذَٰلِكُمْ", page: 51 },
  { number: 22, juzNumber: 3, hizbNumber: 6, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "آل عمران", surahNumber: 3, ayahNumber: 33, ayahText: "إِنَّ اللَّهَ اصْطَفَىٰ آدَمَ وَنُوحًا وَآلَ إِبْرَاهِيمَ", page: 54 },
  { number: 23, juzNumber: 3, hizbNumber: 6, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "آل عمران", surahNumber: 3, ayahNumber: 52, ayahText: "فَلَمَّا أَحَسَّ عِيسَىٰ مِنْهُمُ الْكُفْرَ قَالَ مَنْ أَنْصَارِي", page: 57 },
  { number: 24, juzNumber: 3, hizbNumber: 6, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "آل عمران", surahNumber: 3, ayahNumber: 75, ayahText: "وَمِنْ أَهْلِ الْكِتَابِ مَنْ إِنْ تَأْمَنْهُ بِقِنْطَارٍ", page: 60 },

  // JUZ 4 (الحزب 7 والحزب 8)
  { number: 25, juzNumber: 4, hizbNumber: 7, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "آل عمران", surahNumber: 3, ayahNumber: 93, ayahText: "لَنْ تَنَالُوا الْبِرَّ حَتَّىٰ تُنْفِقُوا مِمَّا تُحِبُّونَ", page: 62 },
  { number: 26, juzNumber: 4, hizbNumber: 7, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "آل عمران", surahNumber: 3, ayahNumber: 113, ayahText: "لَيْسُوا سَوَاءً ۗ مِنْ أَهْلِ الْكِتَابِ أُمَّةٌ قَائِمَةٌ", page: 64 },
  { number: 27, juzNumber: 4, hizbNumber: 7, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "آل عمران", surahNumber: 3, ayahNumber: 133, ayahText: "وَسَارِعُوا إِلَىٰ مَغْفِرَةٍ مِنْ رَبِّكُمْ وَجَنَّةٍ", page: 67 },
  { number: 28, juzNumber: 4, hizbNumber: 7, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "آل عمران", surahNumber: 3, ayahNumber: 153, ayahText: "إِذْ تُصْعِدُونَ وَلَا تَلْوُونَ عَلَىٰ أَحَدٍ", page: 70 },

  { number: 29, juzNumber: 4, hizbNumber: 8, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "آل عمران", surahNumber: 3, ayahNumber: 171, ayahText: "يَسْتَبْشِرُونَ بِنِعْمَةٍ مِنَ اللَّهِ وَفَضْلٍ", page: 72 },
  { number: 30, juzNumber: 4, hizbNumber: 8, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "آل عمران", surahNumber: 3, ayahNumber: 186, ayahText: "لَتُبْلَوُنَّ فِي أَمْوَالِكُمْ وَأَنْفُسِكُمْ", page: 75 },
  { number: 31, juzNumber: 4, hizbNumber: 8, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "النساء", surahNumber: 4, ayahNumber: 1, ayahText: "يَا أَيُّهَا النَّاسُ اتَّقُوا رَبَّكُمُ الَّذِي خَلَقَكُمْ", page: 77 },
  { number: 32, juzNumber: 4, hizbNumber: 8, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "النساء", surahNumber: 4, ayahNumber: 12, ayahText: "وَلَكُمْ نِصْفُ مَا تَرَكَ أَزْوَاجُكُمْ", page: 79 },

  // JUZ 5 (الحزب 9 والحزب 10)
  { number: 33, juzNumber: 5, hizbNumber: 9, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "النساء", surahNumber: 4, ayahNumber: 24, ayahText: "وَالْمُحْصَنَاتُ مِنَ النِّسَاءِ إِلَّا مَا مَلَكَتْ أَيْمَانُكُمْ", page: 82 },
  { number: 34, juzNumber: 5, hizbNumber: 9, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "النساء", surahNumber: 4, ayahNumber: 36, ayahText: "وَاعْبُدُوا اللَّهَ وَلَا تُشْرِكُوا بِهِ شَيْئًا", page: 84 },
  { number: 35, juzNumber: 5, hizbNumber: 9, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "النساء", surahNumber: 4, ayahNumber: 58, ayahText: "إِنَّ اللَّهَ يَأْمُرُكُمْ أَنْ تُؤَدُّوا الْأَمَانَاتِ", page: 87 },
  { number: 36, juzNumber: 5, hizbNumber: 9, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "النساء", surahNumber: 4, ayahNumber: 74, ayahText: "فَلْيُقَاتِلْ فِي سَبِيلِ اللَّهِ الَّذِينَ يَشْرُونَ الْحَيَاةَ", page: 90 },

  { number: 37, juzNumber: 5, hizbNumber: 10, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "النساء", surahNumber: 4, ayahNumber: 88, ayahText: "فَمَا لَكُمْ فِي الْمُنَافِقِينَ فِئَتَيْنِ", page: 92 },
  { number: 38, juzNumber: 5, hizbNumber: 10, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "النساء", surahNumber: 4, ayahNumber: 100, ayahText: "وَمَنْ يُهَاجِرْ فِي سَبِيلِ اللَّهِ يَجِدْ فِي الْأَرْضِ", page: 94 },
  { number: 39, juzNumber: 5, hizbNumber: 10, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "النساء", surahNumber: 4, ayahNumber: 114, ayahText: "لَا خَيْرَ فِي كَثِيرٍ مِنْ نَجْوَاهُمْ إِلَّا مَنْ أَمَرَ", page: 97 },
  { number: 40, juzNumber: 5, hizbNumber: 10, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "النساء", surahNumber: 4, ayahNumber: 135, ayahText: "يَا أَيُّهَا الَّذِينَ آمَنُوا كُونُوا قَوَّامِينَ بِالْقِسْطِ", page: 100 },

  // JUZ 6 (الحزب 11 والحزب 12)
  { number: 41, juzNumber: 6, hizbNumber: 11, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "النساء", surahNumber: 4, ayahNumber: 148, ayahText: "لَا يُحِبُّ اللَّهُ الْجَهْرَ بِالسُّوءِ مِنَ الْقَوْلِ", page: 102 },
  { number: 42, juzNumber: 6, hizbNumber: 11, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "النساء", surahNumber: 4, ayahNumber: 163, ayahText: "إِنَّا أَوْحَيْنَا إِلَيْكَ كَمَا أَوْحَيْنَا إِلَىٰ نُوحٍ", page: 104 },
  { number: 43, juzNumber: 6, hizbNumber: 11, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "المائدة", surahNumber: 5, ayahNumber: 1, ayahText: "يَا أَيُّهَا الَّذِينَ آمَنُوا أَوْفُوا بِالْعُقُودِ", page: 106 },
  { number: 44, juzNumber: 6, hizbNumber: 11, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "المائدة", surahNumber: 5, ayahNumber: 12, ayahText: "وَلَقَدْ أَخَذَ اللَّهُ مِيثَاقَ بَنِي إِسْرَائِيلَ", page: 109 },

  { number: 45, juzNumber: 6, hizbNumber: 12, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "المائدة", surahNumber: 5, ayahNumber: 27, ayahText: "وَاتْلُ عَلَيْهِمْ نَبَأَ ابْنَيْ آدَمَ بِالْحَقِّ", page: 112 },
  { number: 46, juzNumber: 6, hizbNumber: 12, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "المائدة", surahNumber: 5, ayahNumber: 41, ayahText: "يَا أَيُّهَا الرَّسُولُ لَا يَحْزُنْكَ الَّذِينَ يُسَارِعُونَ", page: 114 },
  { number: 47, juzNumber: 6, hizbNumber: 12, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "المائدة", surahNumber: 5, ayahNumber: 51, ayahText: "يَا أَيُّهَا الَّذِينَ آمَنُوا لَا تَتَّخِذُوا الْيَهُودَ وَالنَّصَارَىٰ", page: 117 },
  { number: 48, juzNumber: 6, hizbNumber: 12, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "المائدة", surahNumber: 5, ayahNumber: 67, ayahText: "يَا أَيُّهَا الرَّسُولُ بَلِّغْ مَا أُنْزِلَ إِلَيْكَ", page: 119 },

  // JUZ 7 (الحزب 13 والحزب 14)
  { number: 49, juzNumber: 7, hizbNumber: 13, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "المائدة", surahNumber: 5, ayahNumber: 82, ayahText: "لَتَجِدَنَّ أَشَدَّ النَّاسِ عَدَاوَةً لِلَّذِينَ آمَنُوا", page: 121 },
  { number: 50, juzNumber: 7, hizbNumber: 13, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "المائدة", surahNumber: 5, ayahNumber: 97, ayahText: "جَعَلَ اللَّهُ الْكَعْبَةَ الْبَيْتَ الْحَرَامَ قِيَامًا لِلنَّاسِ", page: 124 },
  { number: 51, juzNumber: 7, hizbNumber: 13, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "الأنعام", surahNumber: 6, ayahNumber: 1, ayahText: "الْحَمْدُ لِلَّهِ الَّذِي خَلَقَ السَّمَاوَاتِ وَالْأَرْضَ", page: 128 },
  { number: 52, juzNumber: 7, hizbNumber: 13, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "الأنعام", surahNumber: 6, ayahNumber: 21, ayahText: "وَمَنْ أَظْلَمُ مِمَّنِ افْتَرَىٰ عَلَى اللَّهِ كَذِبًا", page: 130 },

  { number: 53, juzNumber: 7, hizbNumber: 14, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "الأنعام", surahNumber: 6, ayahNumber: 36, ayahText: "إِنَّمَا يَسْتَجِيبُ الَّذِينَ يَسْمَعُونَ", page: 132 },
  { number: 54, juzNumber: 7, hizbNumber: 14, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "الأنعام", surahNumber: 6, ayahNumber: 59, ayahText: "وَعِنْدَهُ مَفَاتِحُ الْغَيْبِ لَا يَعْلَمُهَا إِلَّا هُوَ", page: 134 },
  { number: 55, juzNumber: 7, hizbNumber: 14, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "الأنعام", surahNumber: 6, ayahNumber: 74, ayahText: "وَإِذْ قَالَ إِبْرَاهِيمُ لِأَبِيهِ آزَرَ أَتَتَّخِذُ أَصْنَامًا", page: 137 },
  { number: 56, juzNumber: 7, hizbNumber: 14, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "الأنعام", surahNumber: 6, ayahNumber: 95, ayahText: "إِنَّ اللَّهَ فَالِقُ الْحَبِّ وَالنَّوَىٰ", page: 139 },

  // JUZ 8 (الحزب 15 والحزب 16)
  { number: 57, juzNumber: 8, hizbNumber: 15, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "الأنعام", surahNumber: 6, ayahNumber: 111, ayahText: "وَلَوْ أَنَّنَا نَزَّلْنَا إِلَيْهِمُ الْمَلَائِكَةَ", page: 142 },
  { number: 58, juzNumber: 8, hizbNumber: 15, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "الأنعام", surahNumber: 6, ayahNumber: 127, ayahText: "لَهُمْ دَارُ السَّلَامِ عِنْدَ رَبِّهِمْ", page: 144 },
  { number: 59, juzNumber: 8, hizbNumber: 15, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "الأنعام", surahNumber: 6, ayahNumber: 141, ayahText: "وَهُوَ الَّذِي أَنْشَأَ جَنَّاتٍ مَعْرُوشَاتٍ", page: 146 },
  { number: 60, juzNumber: 8, hizbNumber: 15, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "الأنعام", surahNumber: 6, ayahNumber: 151, ayahText: "قُلْ تَعَالَوْا أَتْلُ مَا حَرَّمَ رَبُّكُمْ عَلَيْكُمْ", page: 149 },

  { number: 61, juzNumber: 8, hizbNumber: 16, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "الأعراف", surahNumber: 7, ayahNumber: 1, ayahText: "المص ۝ كِتَابٌ أُنْزِلَ إِلَيْكَ", page: 151 },
  { number: 62, juzNumber: 8, hizbNumber: 16, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "الأعراف", surahNumber: 7, ayahNumber: 31, ayahText: "يَا بَنِي آدَمَ خُذُوا زِينَتَكُمْ عِنْدَ كُلِّ مَسْجِدٍ", page: 154 },
  { number: 63, juzNumber: 8, hizbNumber: 16, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "الأعراف", surahNumber: 7, ayahNumber: 47, ayahText: "وَإِذَا صُرِفَتْ أَبْصَارُهُمْ تِلْقَاءَ أَصْحَابِ النَّارِ", page: 156 },
  { number: 64, juzNumber: 8, hizbNumber: 16, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "الأعراف", surahNumber: 7, ayahNumber: 65, ayahText: "وَإِلَىٰ عَادٍ أَخَاهُمْ هُودًا ۗ قَالَ يَا قَوْمِ اعْبُدُوا اللَّهَ", page: 159 },

  // JUZ 9 (الحزب 17 والحزب 18)
  { number: 65, juzNumber: 9, hizbNumber: 17, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "الأعراف", surahNumber: 7, ayahNumber: 88, ayahText: "قَالَ الْمَلَأُ الَّذِينَ اسْتَكْبَرُوا مِنْ قَوْمِهِ", page: 162 },
  { number: 66, juzNumber: 9, hizbNumber: 17, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "الأعراف", surahNumber: 7, ayahNumber: 117, ayahText: "وَأَوْحَيْنَا إِلَىٰ مُوسَىٰ أَنْ أَلْقِ عَصَاكَ", page: 165 },
  { number: 67, juzNumber: 9, hizbNumber: 17, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "الأعراف", surahNumber: 7, ayahNumber: 142, ayahText: "وَوَاعَدْنَا مُوسَىٰ ثَلَاثِينَ لَيْلَةً وَأَتْمَمْنَاهَا بِعَشْرٍ", page: 167 },
  { number: 68, juzNumber: 9, hizbNumber: 17, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "الأعراف", surahNumber: 7, ayahNumber: 156, ayahText: "وَاكْتُبْ لَنَا فِي هَٰذِهِ الدُّنْيَا حَسَنَةً", page: 170 },

  { number: 69, juzNumber: 9, hizbNumber: 18, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "الأعراف", surahNumber: 7, ayahNumber: 171, ayahText: "وَإِذْ نَتَقْنَا الْجَبَلَ فَوْقَهُمْ كَأَنَّهُ ظُلَّةٌ", page: 172 },
  { number: 70, juzNumber: 9, hizbNumber: 18, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "الأعراف", surahNumber: 7, ayahNumber: 189, ayahText: "هُوَ الَّذِي خَلَقَكُمْ مِنْ نَفْسٍ وَاحِدَةٍ", page: 175 },
  { number: 71, juzNumber: 9, hizbNumber: 18, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "الأنفال", surahNumber: 8, ayahNumber: 1, ayahText: "يَسْأَلُونَكَ عَنِ الْأَنْفَالِ ۖ قُلِ الْأَنْفَالُ لِلَّهِ وَالرَّسُولِ", page: 177 },
  { number: 72, juzNumber: 9, hizbNumber: 18, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "الأنفال", surahNumber: 8, ayahNumber: 22, ayahText: "إِنَّ شَرَّ الدَّوَابِّ عِنْدَ اللَّهِ الصُّمُّ الْبُكْمُ", page: 179 },

  // JUZ 10 (الحزب 19 والحزب 20)
  { number: 73, juzNumber: 10, hizbNumber: 19, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "الأنفال", surahNumber: 8, ayahNumber: 41, ayahText: "وَاعْلَمُوا أَنَّمَا غَنِمْتُمْ مِنْ شَيْءٍ فَأَنَّ لِلَّهِ خُمُسَهُ", page: 182 },
  { number: 74, juzNumber: 10, hizbNumber: 19, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "الأنفال", surahNumber: 8, ayahNumber: 61, ayahText: "وَإِنْ جَنَحُوا لِلسَّلْمِ فَاجْنَحْ لَهَا وَتَوَكَّلْ عَلَى اللَّهِ", page: 185 },
  { number: 75, juzNumber: 10, hizbNumber: 19, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "التوبة", surahNumber: 9, ayahNumber: 1, ayahText: "بَرَاءَةٌ مِنَ اللَّهِ وَرَسُولِهِ إِلَى الَّذِينَ عَاهَدْتُمْ", page: 187 },
  { number: 76, juzNumber: 10, hizbNumber: 19, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "التوبة", surahNumber: 9, ayahNumber: 19, ayahText: "أَجَعَلْتُمْ سِقَايَةَ الْحَاجِّ وَعِمَارَةَ الْمَسْجِدِ الْحَرَامِ", page: 189 },

  { number: 77, juzNumber: 10, hizbNumber: 20, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "التوبة", surahNumber: 9, ayahNumber: 34, ayahText: "يَا أَيُّهَا الَّذِينَ آمَنُوا إِنَّ كَثِيرًا مِنَ الْأَحْبَارِ", page: 192 },
  { number: 78, juzNumber: 10, hizbNumber: 20, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "التوبة", surahNumber: 9, ayahNumber: 46, ayahText: "وَلَوْ أَرَادُوا الْخُرُوجَ لَأَعَدُّوا لَهُ عُدَّةً", page: 194 },
  { number: 79, juzNumber: 10, hizbNumber: 20, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "التوبة", surahNumber: 9, ayahNumber: 60, ayahText: "إِنَّمَا الصَّدَقَاتُ لِلْفُقَرَاءِ وَالْمَسَاكِينِ", page: 197 },
  { number: 80, juzNumber: 10, hizbNumber: 20, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "التوبة", surahNumber: 9, ayahNumber: 75, ayahText: "وَمِنْهُمْ مَنْ عَاهَدَ اللَّهَ لَئِنْ آتَانَا مِنْ فَضْلِهِ", page: 199 },

  // JUZ 11 (الحزب 21 والحزب 22)
  { number: 81, juzNumber: 11, hizbNumber: 21, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "التوبة", surahNumber: 9, ayahNumber: 93, ayahText: "إِنَّمَا السَّبِيلُ عَلَى الَّذِينَ يَسْتَأْذِنُونَكَ وَهُمْ أَغْنِيَاءُ", page: 201 },
  { number: 82, juzNumber: 11, hizbNumber: 21, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "التوبة", surahNumber: 9, ayahNumber: 111, ayahText: "إِنَّ اللَّهَ اشْتَرَىٰ مِنَ الْمُؤْمِنِينَ أَنْفُسَهُمْ وَأَمْوَالَهُمْ", page: 204 },
  { number: 83, juzNumber: 11, hizbNumber: 21, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "التوبة", surahNumber: 9, ayahNumber: 122, ayahText: "وَمَا كَانَ الْمُؤْمِنُونَ لِيَنْفِرُوا كَافَّةً", page: 207 },
  { number: 84, juzNumber: 11, hizbNumber: 21, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "يونس", surahNumber: 10, ayahNumber: 11, ayahText: "وَلَوْ يُعَجِّلُ اللَّهُ لِلنَّاسِ الشَّرَّ اسْتِعْجَالَهُمْ بِالْخَيْرِ", page: 209 },

  { number: 85, juzNumber: 11, hizbNumber: 22, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "يونس", surahNumber: 10, ayahNumber: 26, ayahText: "لِلَّذِينَ أَحْسَنُوا الْحُسْنَىٰ وَزِيَادَةٌ", page: 212 },
  { number: 86, juzNumber: 11, hizbNumber: 22, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "يونس", surahNumber: 10, ayahNumber: 53, ayahText: "وَيَسْتَنْبِئُونَكَ أَحَقٌّ هُوَ ۖ قُلْ إِي وَرَبِّي إِنَّهُ لَحَقٌّ", page: 215 },
  { number: 87, juzNumber: 11, hizbNumber: 22, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "يونس", surahNumber: 10, ayahNumber: 71, ayahText: "وَاتْلُ عَلَيْهِمْ نَبَأَ نُوحٍ إِذْ قَالَ لِقَوْمِهِ", page: 217 },
  { number: 88, juzNumber: 11, hizbNumber: 22, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "يونس", surahNumber: 10, ayahNumber: 90, ayahText: "وَجَاوَزْنَا بِبَنِي إِسْرَائِيلَ الْبَحْرَ", page: 219 },

  // JUZ 12 (الحزب 23 والحزب 24)
  { number: 89, juzNumber: 12, hizbNumber: 23, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "هود", surahNumber: 11, ayahNumber: 6, ayahText: "وَمَا مِنْ دَابَّةٍ فِي الْأَرْضِ إِلَّا عَلَى اللَّهِ رِزْقُهَا", page: 222 },
  { number: 90, juzNumber: 12, hizbNumber: 23, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "هود", surahNumber: 11, ayahNumber: 24, ayahText: "مَثَلُ الْفَرِيقَيْنِ كَالْأَعْمَىٰ وَالْأَصَمِّ وَالْبَصِيرِ", page: 224 },
  { number: 91, juzNumber: 12, hizbNumber: 23, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "هود", surahNumber: 11, ayahNumber: 41, ayahText: "وَقَالَ ارْكَبُوا فِيهَا بِسْمِ اللَّهِ مَجْرَاهَا وَمُرْسَاهَا", page: 226 },
  { number: 92, juzNumber: 12, hizbNumber: 23, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "هود", surahNumber: 11, ayahNumber: 61, ayahText: "وَإِلَىٰ ثَمُودَ أَخَاهُمْ صَالِحًا ۚ قَالَ يَا قَوْمِ اعْبُدُوا اللَّهَ", page: 228 },

  { number: 93, juzNumber: 12, hizbNumber: 24, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "هود", surahNumber: 11, ayahNumber: 84, ayahText: "وَإِلَىٰ مَدْيَنَ أَخَاهُمْ شُعَيْبًا ۚ قَالَ يَا قَوْمِ اعْبُدُوا اللَّهَ", page: 231 },
  { number: 94, juzNumber: 12, hizbNumber: 24, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "هود", surahNumber: 11, ayahNumber: 108, ayahText: "وَأَمَّا الَّذِينَ سُعِدُوا فَفِي الْجَنَّةِ خَالِدِينَ فِيهَا", page: 233 },
  { number: 95, juzNumber: 12, hizbNumber: 24, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "يوسف", surahNumber: 12, ayahNumber: 7, ayahText: "لَقَدْ كَانَ فِي يُوسُفَ وَإِخْوَتِهِ آيَاتٌ لِلسَّائِلِينَ", page: 236 },
  { number: 96, juzNumber: 12, hizbNumber: 24, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "يوسف", surahNumber: 12, ayahNumber: 30, ayahText: "وَقَالَ نِسْوَةٌ فِي الْمَدِينَةِ امْرَأَتُ الْعَزِيزِ تُرَاوِدُ فَتَاهَا", page: 239 },

  // JUZ 13 (الحزب 25 والحزب 26)
  { number: 97, juzNumber: 13, hizbNumber: 25, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "يوسف", surahNumber: 12, ayahNumber: 53, ayahText: "وَمَا أُبَرِّئُ نَفْسِي ۚ إِنَّ النَّفْسَ لَأَمَّارَةٌ بِالسُّوءِ", page: 242 },
  { number: 98, juzNumber: 13, hizbNumber: 25, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "يوسف", surahNumber: 12, ayahNumber: 77, ayahText: "قَالُوا إِنْ يَسْرِقْ فَقَدْ سَرَقَ أَخٌ لَهُ مِنْ قَبْلُ", page: 244 },
  { number: 99, juzNumber: 13, hizbNumber: 25, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "يوسف", surahNumber: 12, ayahNumber: 101, ayahText: "رَبِّ قَدْ آتَيْتَنِي مِنَ الْمُلْكِ وَعَلَّمْتَنِي مِنْ تَأْوِيلِ الْأَحَادِيثِ", page: 247 },
  { number: 100, juzNumber: 13, hizbNumber: 25, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "الرعد", surahNumber: 13, ayahNumber: 5, ayahText: "وَإِنْ تَعْجَبْ فَعَجَبٌ قَوْلُهُمْ أَإِذَا كُنَّا تُرَابًا", page: 250 },

  { number: 101, juzNumber: 13, hizbNumber: 26, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "الرعد", surahNumber: 13, ayahNumber: 19, ayahText: "أَفَمَنْ يَعْلَمُ أَنَّمَا أُنْزِلَ إِلَيْكَ مِنْ رَبِّكَ الْحَقُّ", page: 252 },
  { number: 102, juzNumber: 13, hizbNumber: 26, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "الرعد", surahNumber: 13, ayahNumber: 35, ayahText: "مَثَلُ الْجَنَّةِ الَّتِي وُعِدَ الْمُتَّقُونَ ۖ تَجْرِي مِنْ تَحْتِهَا", page: 254 },
  { number: 103, juzNumber: 13, hizbNumber: 26, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "إبراهيم", surahNumber: 14, ayahNumber: 10, ayahText: "قَالَتْ رُسُلُهُمْ أَفِي اللَّهِ شَكٌّ فَاطِرِ السَّمَاوَاتِ", page: 256 },
  { number: 104, juzNumber: 13, hizbNumber: 26, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "إبراهيم", surahNumber: 14, ayahNumber: 28, ayahText: "أَلَمْ تَرَ إِلَى الَّذِينَ بَدَّلُوا نِعْمَتَ اللَّهِ كُفْرًا", page: 259 },

  // JUZ 14 (الحزب 27 والحزب 28)
  { number: 105, juzNumber: 14, hizbNumber: 27, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "الحجر", surahNumber: 15, ayahNumber: 1, ayahText: "الر ۚ تِلْكَ آيَاتُ الْكِتَابِ وَقُرْآنٍ مُبِينٍ ۝ رُبَمَا يَوَدُّ الَّذِينَ كَفَرُوا", page: 262 },
  { number: 106, juzNumber: 14, hizbNumber: 27, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "الحجر", surahNumber: 15, ayahNumber: 49, ayahText: "نَبِّئْ عِبَادِي أَنِّي أَنَا الْغَفُورُ الرَّحِيمُ", page: 265 },
  { number: 107, juzNumber: 14, hizbNumber: 27, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "النحل", surahNumber: 16, ayahNumber: 1, ayahText: "أَتَىٰ أَمْرُ اللَّهِ فَلَا تَسْتَعْجِلُوهُ ۚ سُبْحَانَهُ وَتَعَالَىٰ", page: 267 },
  { number: 108, juzNumber: 14, hizbNumber: 27, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "النحل", surahNumber: 16, ayahNumber: 30, ayahText: "وَقِيلَ لِلَّذِينَ اتَّقَوْا مَاذَا أَنْزَلَ رَبُّكُمْ ۚ قَالُوا خَيْرًا", page: 270 },

  { number: 109, juzNumber: 14, hizbNumber: 28, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "النحل", surahNumber: 16, ayahNumber: 51, ayahText: "وَقَالَ اللَّهُ لَا تَتَّخِذُوا إِلَٰهَيْنِ اثْنَيْنِ", page: 272 },
  { number: 110, juzNumber: 14, hizbNumber: 28, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "النحل", surahNumber: 16, ayahNumber: 75, ayahText: "ضَرَبَ اللَّهُ مَثَلًا عَبْدًا مَمْلُوكًا لَا يَقْدِرُ عَلَىٰ شَيْءٍ", page: 275 },
  { number: 111, juzNumber: 14, hizbNumber: 28, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "النحل", surahNumber: 16, ayahNumber: 90, ayahText: "إِنَّ اللَّهَ يَأْمُرُ بِالْعَدْلِ وَالْإِحْسَانِ وَإِيتَاءِ ذِي الْقُرْبَىٰ", page: 277 },
  { number: 112, juzNumber: 14, hizbNumber: 28, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "النحل", surahNumber: 16, ayahNumber: 111, ayahText: "يَوْمَ تَأْتِي كُلُّ نَفْسٍ تُجَادِلُ عَنْ نَفْسِهَا", page: 280 },

  // JUZ 15 (الحزب 29 والحزب 30)
  { number: 113, juzNumber: 15, hizbNumber: 29, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "الإسراء", surahNumber: 17, ayahNumber: 1, ayahText: "سُبْحَانَ الَّذِي أَسْرَىٰ بِعَبْدِهِ لَيْلًا مِنَ الْمَسْجِدِ الْحَرَامِ", page: 282 },
  { number: 114, juzNumber: 15, hizbNumber: 29, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "الإسراء", surahNumber: 17, ayahNumber: 23, ayahText: "وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا", page: 284 },
  { number: 115, juzNumber: 15, hizbNumber: 29, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "الإسراء", surahNumber: 17, ayahNumber: 50, ayahText: "قُلْ كُونُوا حِجَارَةً أَوْ حَدِيدًا", page: 287 },
  { number: 116, juzNumber: 15, hizbNumber: 29, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "الإسراء", surahNumber: 17, ayahNumber: 70, ayahText: "وَلَقَدْ كَرَّمْنَا بَنِي آدَمَ وَحَمَلْنَاهُمْ فِي الْبَرِّ وَالْبَحْرِ", page: 289 },

  { number: 117, juzNumber: 15, hizbNumber: 30, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "الإسراء", surahNumber: 17, ayahNumber: 99, ayahText: "أَوَلَمْ يَرَوْا أَنَّ اللَّهَ الَّذِي خَلَقَ السَّمَاوَاتِ وَالْأَرْضَ", page: 292 },
  { number: 118, juzNumber: 15, hizbNumber: 30, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "الكهف", surahNumber: 18, ayahNumber: 17, ayahText: "وَتَرَى الشَّمْسَ إِذَا طَلَعَتْ تَزَاوَرُ عَنْ كَهْفِهِمْ", page: 295 },
  { number: 119, juzNumber: 15, hizbNumber: 30, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "الكهف", surahNumber: 18, ayahNumber: 32, ayahText: "وَاضْرِبْ لَهُمْ مَثَلًا رَجُلَيْنِ جَعَلْنَا لِأَحَدِهِمَا جَنَّتَيْنِ", page: 298 },
  { number: 120, juzNumber: 15, hizbNumber: 30, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "الكهف", surahNumber: 18, ayahNumber: 51, ayahText: "مَا أَشْهَدْتُهُمْ خَلْقَ السَّمَاوَاتِ وَالْأَرْضِ", page: 300 },

  // JUZ 16 (الحزب 31 والحزب 32)
  { number: 121, juzNumber: 16, hizbNumber: 31, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "الكهف", surahNumber: 18, ayahNumber: 75, ayahText: "قَالَ أَلَمْ أَقُلْ لَكَ إِنَّكَ لَنْ تَسْتَطِيعَ مَعِيَ صَبْرًا", page: 302 },
  { number: 122, juzNumber: 16, hizbNumber: 31, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "الكهف", surahNumber: 18, ayahNumber: 99, ayahText: "وَتَرَكْنَا بَعْضَهُمْ يَوْمَئِذٍ يَمُوجُ فِي بَعْضٍ", page: 304 },
  { number: 123, juzNumber: 16, hizbNumber: 31, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "مريم", surahNumber: 19, ayahNumber: 22, ayahText: "فَحَمَلَتْهُ فَانْتَبَذَتْ بِهِ مَكَانًا قَصِيًّا", page: 307 },
  { number: 124, juzNumber: 16, hizbNumber: 31, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "مريم", surahNumber: 19, ayahNumber: 59, ayahText: "فَخَلَفَ مِنْ بَعْدِهِمْ خَلْفٌ أَضَاعُوا الصَّلَاةَ", page: 310 },

  { number: 125, juzNumber: 16, hizbNumber: 32, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "طه", surahNumber: 20, ayahNumber: 1, ayahText: "طه ۝ مَا أَنْزَلْنَا عَلَيْكَ الْقُرْآنَ لِتَشْقَىٰ", page: 312 },
  { number: 126, juzNumber: 16, hizbNumber: 32, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "طه", surahNumber: 20, ayahNumber: 55, ayahText: "مِنْهَا خَلَقْنَاكُمْ وَفِيهَا نُعِيدُكُمْ وَمِنْهَا نُخْرِجُكُمْ", page: 315 },
  { number: 127, juzNumber: 16, hizbNumber: 32, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "طه", surahNumber: 20, ayahNumber: 83, ayahText: "وَمَا أَعْجَلَكَ عَنْ قَوْمِكَ يَا مُوسَىٰ", page: 317 },
  { number: 128, juzNumber: 16, hizbNumber: 32, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "طه", surahNumber: 20, ayahNumber: 111, ayahText: "وَعَنَتِ الْوُجُوهُ لِلْحَيِّ الْقَيُّومِ ۖ وَقَدْ خَابَ مَنْ حَمَلَ ظُلْمًا", page: 320 },

  // JUZ 17 (الحزب 33 والحزب 34)
  { number: 129, juzNumber: 17, hizbNumber: 33, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "الأنبياء", surahNumber: 21, ayahNumber: 1, ayahText: "اقْتَرَبَ لِلنَّاسِ حِسَابُهُمْ وَهُمْ فِي غَفْلَةٍ مُعْرِضُونَ", page: 322 },
  { number: 130, juzNumber: 17, hizbNumber: 33, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "الأنبياء", surahNumber: 21, ayahNumber: 29, ayahText: "وَمَنْ يَقُلْ مِنْهُمْ إِنِّي إِلَٰهٌ مِنْ دُونِهِ فَذَٰلِكَ نَجْزِيهِ جَهَنَّمَ", page: 324 },
  { number: 131, juzNumber: 17, hizbNumber: 33, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "الأنبياء", surahNumber: 21, ayahNumber: 51, ayahText: "وَلَقَدْ آتَيْنَا إِبْرَاهِيمَ رُشْدَهُ مِنْ قَبْلُ وَكُنَّا بِهِ عَالِمِينَ", page: 326 },
  { number: 132, juzNumber: 17, hizbNumber: 33, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "الأنبياء", surahNumber: 21, ayahNumber: 83, ayahText: "وَأَيُّوبَ إِذْ نَادَىٰ رَبَّهُ أَنِّي مَسَّنِيَ الضُّرُّ", page: 329 },

  { number: 133, juzNumber: 17, hizbNumber: 34, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "الحج", surahNumber: 22, ayahNumber: 1, ayahText: "يَا أَيُّهَا النَّاسُ اتَّقُوا رَبَّكُمْ ۚ إِنَّ زَلْزَلَةَ السَّاعَةِ شَيْءٌ عَظِيمٌ", page: 332 },
  { number: 134, juzNumber: 17, hizbNumber: 34, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "الحج", surahNumber: 22, ayahNumber: 19, ayahText: "هَٰذَانِ خَصْمَانِ اخْتَصَمُوا فِي رَبِّهِمْ", page: 334 },
  { number: 135, juzNumber: 17, hizbNumber: 34, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "الحج", surahNumber: 22, ayahNumber: 38, ayahText: "إِنَّ اللَّهَ يُدَافِعُ عَنِ الَّذِينَ آمَنُوا ۗ إِنَّ اللَّهَ لَا يُحِبُّ كُلَّ خَوَّانٍ", page: 337 },
  { number: 136, juzNumber: 17, hizbNumber: 34, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "الحج", surahNumber: 22, ayahNumber: 60, ayahText: "ذَٰلِكَ وَمَنْ عَاقَبَ بِمِثْلِ مَا عُوقِبَ بِهِ ثُمَّ بُغِيَ عَلَيْهِ", page: 340 },

  // JUZ 18 (الحزب 35 والحزب 36)
  { number: 137, juzNumber: 18, hizbNumber: 35, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "المؤمنون", surahNumber: 23, ayahNumber: 1, ayahText: "قَدْ أَفْلَحَ الْمُؤْمِنُونَ ۝ الَّذِينَ هُمْ فِي صَلَاتِهِمْ خَاشِعُونَ", page: 342 },
  { number: 138, juzNumber: 18, hizbNumber: 35, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "المؤمنون", surahNumber: 23, ayahNumber: 36, ayahText: "هَيْهَاتَ هَيْهَاتَ لِمَا تُوعَدُونَ ۝ إِنْ هِيَ إِلَّا حَيَاتُنَا الدُّنْيَا", page: 344 },
  { number: 139, juzNumber: 18, hizbNumber: 35, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "المؤمنون", surahNumber: 23, ayahNumber: 75, ayahText: "وَلَوْ رَحِمْنَاهُمْ وَكَشَفْنَا مَا بِهِمْ مِنْ ضُرٍّ لَلَجُّوا", page: 347 },
  { number: 140, juzNumber: 18, hizbNumber: 35, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "النور", surahNumber: 24, ayahNumber: 1, ayahText: "سُورَةٌ أَنْزَلْنَاهَا وَفَرَضْنَاهَا وَأَنْزَلْنَا فِيهَا آيَاتٍ بَيِّنَاتٍ", page: 350 },

  { number: 141, juzNumber: 18, hizbNumber: 36, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "النور", surahNumber: 24, ayahNumber: 21, ayahText: "يَا أَيُّهَا الَّذِينَ آمَنُوا لَا تَتَّبِعُوا خُطُوَاتِ الشَّيْطَانِ", page: 352 },
  { number: 142, juzNumber: 18, hizbNumber: 36, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "النور", surahNumber: 24, ayahNumber: 35, ayahText: "اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ ۚ مَثَلُ نُورِهِ كَمِشْكَاةٍ", page: 354 },
  { number: 143, juzNumber: 18, hizbNumber: 36, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "النور", surahNumber: 24, ayahNumber: 53, ayahText: "وَأَقْسَمُوا بِاللَّهِ جَهْدَ أَيْمَانِهِمْ لَئِنْ أَمَرْتَهُمْ لَيَخْرُجُنَّ", page: 357 },
  { number: 144, juzNumber: 18, hizbNumber: 36, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "الفرقان", surahNumber: 25, ayahNumber: 1, ayahText: "تَبَارَكَ الَّذِي نَزَّلَ الْفُرْقَانَ عَلَىٰ عَبْدِهِ لِيَكُونَ لِلْعَالَمِينَ نَذِيرًا", page: 359 },

  // JUZ 19 (الحزب 37 والحزب 38)
  { number: 145, juzNumber: 19, hizbNumber: 37, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "الفرقان", surahNumber: 25, ayahNumber: 21, ayahText: "وَقَالَ الَّذِينَ لَا يَرْجُونَ لِقَاءَنَا لَوْلَا أُنْزِلَ عَلَيْنَا الْمَلَائِكَةُ", page: 362 },
  { number: 146, juzNumber: 19, hizbNumber: 37, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "الفرقان", surahNumber: 25, ayahNumber: 53, ayahText: "وَهُوَ الَّذِي مَرَجَ الْبَحْرَيْنِ هَٰذَا عَذْبٌ فُرَاتٌ", page: 364 },
  { number: 147, juzNumber: 19, hizbNumber: 37, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "الشعراء", surahNumber: 26, ayahNumber: 1, ayahText: "طسم ۝ تِلْكَ آيَاتُ الْكِتَابِ الْمُبِينِ", page: 367 },
  { number: 148, juzNumber: 19, hizbNumber: 37, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "الشعراء", surahNumber: 26, ayahNumber: 52, ayahText: "وَأَوْحَيْنَا إِلَىٰ مُوسَىٰ أَنْ أَسْرِ بِعِبَادِي إِنَّكُمْ مُتَّبَعُونَ", page: 370 },

  { number: 149, juzNumber: 19, hizbNumber: 38, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "الشعراء", surahNumber: 26, ayahNumber: 111, ayahText: "قَالُوا أَنُؤْمِنُ لَكَ وَاتَّبَعَكَ الْأَرْذَلُونَ", page: 372 },
  { number: 150, juzNumber: 19, hizbNumber: 38, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "الشعراء", surahNumber: 26, ayahNumber: 181, ayahText: "أَوْفُوا الْكَيْلَ وَلَا تَكُونُوا مِنَ الْمُخْسِرِينَ", page: 375 },
  { number: 151, juzNumber: 19, hizbNumber: 38, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "النمل", surahNumber: 27, ayahNumber: 1, ayahText: "طس ۚ تِلْكَ آيَاتُ الْقُرْآنِ وَكِتَابٍ مُبِينٍ", page: 377 },
  { number: 152, juzNumber: 19, hizbNumber: 38, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "النمل", surahNumber: 27, ayahNumber: 27, ayahText: "قَالَ سَنَنْظُرُ أَصَدَقْتَ أَمْ كُنْتَ مِنَ الْكَاذِبِينَ", page: 379 },

  // JUZ 20 (الحزب 39 والحزب 40)
  { number: 153, juzNumber: 20, hizbNumber: 39, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "النمل", surahNumber: 27, ayahNumber: 56, ayahText: "فَمَا كَانَ جَوَابَ قَوْمِهِ إِلَّا أَنْ قَالُوا أَخْرِجُوا آلَ لُوطٍ", page: 382 },
  { number: 154, juzNumber: 20, hizbNumber: 39, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "النمل", surahNumber: 27, ayahNumber: 82, ayahText: "وَإِذَا وَقَعَ الْقَوْلُ عَلَيْهِمْ أَخْرَجْنَا لَهُمْ دَابَّةً مِنَ الْأَرْضِ", page: 384 },
  { number: 155, juzNumber: 20, hizbNumber: 39, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "القصص", surahNumber: 28, ayahNumber: 12, ayahText: "وَحَرَّمْنَا عَلَيْهِ الْمَرَاضِعَ مِنْ قَبْلُ", page: 386 },
  { number: 156, juzNumber: 20, hizbNumber: 39, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "القصص", surahNumber: 28, ayahNumber: 29, ayahText: "فَلَمَّا قَضَىٰ مُوسَى الْأَجَلَ وَسَارَ بِأَهْلِهِ", page: 389 },

  { number: 157, juzNumber: 20, hizbNumber: 40, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "القصص", surahNumber: 28, ayahNumber: 51, ayahText: "وَلَقَدْ وَصَّلْنَا لَهُمُ الْقَوْلَ لَعَلَّهُمْ يَتَذَكَّرُونَ", page: 392 },
  { number: 158, juzNumber: 20, hizbNumber: 40, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "القصص", surahNumber: 28, ayahNumber: 76, ayahText: "إِنَّ قَارُونَ كَانَ مِنْ قَوْمِ مُوسَىٰ فَبَغَىٰ عَلَيْهِمْ", page: 394 },
  { number: 159, juzNumber: 20, hizbNumber: 40, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "العنكبوت", surahNumber: 29, ayahNumber: 1, ayahText: "الم ۝ أَحَسِبَ النَّاسُ أَنْ يُتْرَكُوا أَنْ يَقُولُوا آمَنَّا", page: 396 },
  { number: 160, juzNumber: 20, hizbNumber: 40, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "العنكبوت", surahNumber: 29, ayahNumber: 26, ayahText: "فَآمَنَ لَهُ لُوطٌ ۘ وَقَالَ إِنِّي مُهَاجِرٌ إِلَىٰ رَبِّي", page: 399 },

  // JUZ 21 (الحزب 41 والحزب 42)
  { number: 161, juzNumber: 21, hizbNumber: 41, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "العنكبوت", surahNumber: 29, ayahNumber: 46, ayahText: "وَلَا تُجَادِلُوا أَهْلَ الْكِتَابِ إِلَّا بِالَّتِي هِيَ أَحْسَنُ", page: 402 },
  { number: 162, juzNumber: 21, hizbNumber: 41, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "الروم", surahNumber: 30, ayahNumber: 1, ayahText: "الم ۝ غُلِبَتِ الرُّومُ ۝ فِي أَدْنَى الْأَرْضِ", page: 404 },
  { number: 163, juzNumber: 21, hizbNumber: 41, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "الروم", surahNumber: 30, ayahNumber: 31, ayahText: "مُنِيبِينَ إِلَيْهِ وَاتَّقُوهُ وَأَقِيمُوا الصَّلَاةَ", page: 407 },
  { number: 164, juzNumber: 21, hizbNumber: 41, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "لقمان", surahNumber: 31, ayahNumber: 1, ayahText: "الم ۝ تِلْكَ آيَاتُ الْكِتَابِ الْحَكِيمِ", page: 411 },

  { number: 165, juzNumber: 21, hizbNumber: 42, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "لقمان", surahNumber: 31, ayahNumber: 22, ayahText: "وَمَنْ يُسْلِمْ وَجْهَهُ إِلَى اللَّهِ وَهُوَ مُحْسِنٌ", page: 413 },
  { number: 166, juzNumber: 21, hizbNumber: 42, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "السجدة", surahNumber: 32, ayahNumber: 1, ayahText: "الم ۝ تَنْزِيلُ الْكِتَابِ لَا رَيْبَ فِيهِ مِنْ رَبِّ الْعَالَمِينَ", page: 415 },
  { number: 167, juzNumber: 21, hizbNumber: 42, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "الأحزاب", surahNumber: 33, ayahNumber: 1, ayahText: "يَا أَيُّهَا النَّبِيُّ اتَّقِ اللَّهَ وَلَا تُطِعِ الْكَافِرِينَ", page: 418 },
  { number: 168, juzNumber: 21, hizbNumber: 42, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "الأحزاب", surahNumber: 33, ayahNumber: 18, ayahText: "قَدْ يَعْلَمُ اللَّهُ الْمُعَوِّقِينَ مِنْكُمْ وَالْقَائِلِينَ لِإِخْوَانِهِمْ", page: 420 },

  // JUZ 22 (الحزب 43 والحزب 44)
  { number: 169, juzNumber: 22, hizbNumber: 43, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "الأحزاب", surahNumber: 33, ayahNumber: 31, ayahText: "وَمَنْ يَقْنُتْ مِنْكُنَّ لِلَّهِ وَرَسُولِهِ وَتَعْمَلْ صَالِحًا", page: 422 },
  { number: 170, juzNumber: 22, hizbNumber: 43, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "الأحزاب", surahNumber: 33, ayahNumber: 51, ayahText: "تُرْجِي مَنْ تَشَاءُ مِنْهُنَّ وَتُؤْوِي إِلَيْكَ مَنْ تَشَاءُ", page: 425 },
  { number: 171, juzNumber: 22, hizbNumber: 43, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "سبأ", surahNumber: 34, ayahNumber: 1, ayahText: "الْحَمْدُ لِلَّهِ الَّذِي لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ", page: 428 },
  { number: 172, juzNumber: 22, hizbNumber: 43, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "سبأ", surahNumber: 34, ayahNumber: 10, ayahText: "وَلَقَدْ آتَيْنَا دَاوُودَ مِنَّا فَضْلًا ۖ يَا جِبَالُ أَوِّبِي مَعَهُ", page: 429 },

  { number: 173, juzNumber: 22, hizbNumber: 44, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "سبأ", surahNumber: 34, ayahNumber: 24, ayahText: "قُلْ مَنْ يَرْزُقُكُمْ مِنَ السَّمَاوَاتِ وَالْأَرْضِ ۖ قُلِ اللَّهُ", page: 431 },
  { number: 174, juzNumber: 22, hizbNumber: 44, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "سبأ", surahNumber: 34, ayahNumber: 46, ayahText: "قُلْ إِنَّمَا أَعِظُكُمْ بِوَاحِدَةٍ ۖ أَنْ تَقُومُوا لِلَّهِ مَثْنَىٰ وَفُرَادَىٰ", page: 433 },
  { number: 175, juzNumber: 22, hizbNumber: 44, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "فاطر", surahNumber: 35, ayahNumber: 15, ayahText: "يَا أَيُّهَا النَّاسُ أَنْتُمُ الْفُقَرَاءُ إِلَى اللَّهِ ۖ وَاللَّهُ هُوَ الْغَنِيُّ", page: 436 },
  { number: 176, juzNumber: 22, hizbNumber: 44, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "فاطر", surahNumber: 35, ayahNumber: 41, ayahText: "إِنَّ اللَّهَ يُمْسِكُ السَّمَاوَاتِ وَالْأَرْضَ أَنْ تَزُولَا", page: 439 },

  // JUZ 23 (الحزب 45 والحزب 46)
  { number: 177, juzNumber: 23, hizbNumber: 45, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "يس", surahNumber: 36, ayahNumber: 28, ayahText: "وَمَا أَنْزَلْنَا عَلَىٰ قَوْمِهِ مِنْ بَعْدِهِ مِنْ جُنْدٍ مِنَ السَّمَاءِ", page: 442 },
  { number: 178, juzNumber: 23, hizbNumber: 45, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "يس", surahNumber: 36, ayahNumber: 60, ayahText: "أَلَمْ أَعْهَدْ إِلَيْكُمْ يَا بَنِي آدَمَ أَنْ لَا تَعْبُدُوا الشَّيْطَانَ", page: 444 },
  { number: 179, juzNumber: 23, hizbNumber: 45, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "الصافات", surahNumber: 37, ayahNumber: 22, ayahText: "احْشُرُوا الَّذِينَ ظَلَمُوا وَأَزْوَاجَهُمْ وَمَا كَانُوا يَعْبُدُونَ", page: 446 },
  { number: 180, juzNumber: 23, hizbNumber: 45, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "الصافات", surahNumber: 37, ayahNumber: 83, ayahText: "وَإِنَّ مِنْ شِيعَتِهِ لَإِبْرَاهِيمَ ۝ إِذْ جَاءَ رَبَّهُ بِقَلْبٍ سَلِيمٍ", page: 449 },

  { number: 181, juzNumber: 23, hizbNumber: 46, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "الصافات", surahNumber: 37, ayahNumber: 145, ayahText: "فَنَبَذْنَاهُ بِالْعَرَاءِ وَهُوَ سَقِيمٌ", page: 451 },
  { number: 182, juzNumber: 23, hizbNumber: 46, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "ص", surahNumber: 38, ayahNumber: 21, ayahText: "وَهَلْ أَتَاكَ نَبَأُ الْخَصْمِ إِذْ تَسَوَّرُوا الْمِحْرَابَ", page: 454 },
  { number: 183, juzNumber: 23, hizbNumber: 46, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "ص", surahNumber: 38, ayahNumber: 52, ayahText: "وَعِنْدَهُمْ قَاصِرَاتُ الطَّرْفِ أَتْرَابٌ", page: 456 },
  { number: 184, juzNumber: 23, hizbNumber: 46, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "الزمر", surahNumber: 39, ayahNumber: 8, ayahText: "وَإِذَا مَسَّ الْإِنْسَانَ ضُرٌّ دَعَا رَبَّهُ مُنِيبًا إِلَيْهِ", page: 459 },

  // JUZ 24 (الحزب 47 والحزب 48)
  { number: 185, juzNumber: 24, hizbNumber: 47, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "الزمر", surahNumber: 39, ayahNumber: 32, ayahText: "فَمَنْ أَظْلَمُ مِمَّنْ كَذَبَ عَلَى اللَّهِ وَكَذَّبَ بِالصِّدْقِ إِذْ جَاءَهُ", page: 462 },
  { number: 186, juzNumber: 24, hizbNumber: 47, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "الزمر", surahNumber: 39, ayahNumber: 53, ayahText: "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنْفُسِهِمْ لَا تَقْنَطُوا", page: 464 },
  { number: 187, juzNumber: 24, hizbNumber: 47, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "غافر", surahNumber: 40, ayahNumber: 1, ayahText: "حم ۝ تَنْزِيلُ الْكِتَابِ مِنَ اللَّهِ الْعَزِيزِ الْعَلِيمِ", page: 467 },
  { number: 188, juzNumber: 24, hizbNumber: 47, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "غافر", surahNumber: 40, ayahNumber: 21, ayahText: "أَوَلَمْ يَسِيرُوا فِي الْأَرْضِ فَيَنْظُرُوا كَيْفَ كَانَ عَاقِبَةُ الَّذِينَ", page: 469 },

  { number: 189, juzNumber: 24, hizbNumber: 48, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "غافر", surahNumber: 40, ayahNumber: 41, ayahText: "وَيَا قَوْمِ مَا لِي أَدْعُوكُمْ إِلَى النَّجَاةِ وَتَدْعُونَنِي إِلَى النَّارِ", page: 472 },
  { number: 190, juzNumber: 24, hizbNumber: 48, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "غافر", surahNumber: 40, ayahNumber: 66, ayahText: "قُلْ إِنِّي نُهِيتُ أَنْ أَعْبُدَ الَّذِينَ تَدْعُونَ مِنْ دُونِ اللَّهِ", page: 474 },
  { number: 191, juzNumber: 24, hizbNumber: 48, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "فصلت", surahNumber: 41, ayahNumber: 9, ayahText: "قُلْ أَئِنَّكُمْ لَتَكْفُرُونَ بِالَّذِي خَلَقَ الْأَرْضَ فِي يَوْمَيْنِ", page: 477 },
  { number: 192, juzNumber: 24, hizbNumber: 48, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "فصلت", surahNumber: 41, ayahNumber: 25, ayahText: "وَقَيَّضْنَا لَهُمْ قُرَنَاءَ فَزَيَّنُوا لَهُمْ مَا بَيْنَ أَيْدِيهِمْ", page: 479 },

  // JUZ 25 (الحزب 49 والحزب 50)
  { number: 193, juzNumber: 25, hizbNumber: 49, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "فصلت", surahNumber: 41, ayahNumber: 47, ayahText: "إِلَيْهِ يُرَدُّ عِلْمُ السَّاعَةِ ۚ وَمَا تَخْرُجُ مِنْ ثَمَرَاتٍ مِنْ أَكْمَامِهَا", page: 482 },
  { number: 194, juzNumber: 25, hizbNumber: 49, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "الشورى", surahNumber: 42, ayahNumber: 13, ayahText: "شَرَعَ لَكُمْ مِنَ الدِّينِ مَا وَصَّىٰ بِهِ نُوحًا", page: 484 },
  { number: 195, juzNumber: 25, hizbNumber: 49, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "الشورى", surahNumber: 42, ayahNumber: 27, ayahText: "وَلَوْ بَسَطَ اللَّهُ الرِّزْقَ لِعِبَادِهِ لَبَغَوْا فِي الْأَرْضِ", page: 486 },
  { number: 196, juzNumber: 25, hizbNumber: 49, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "الشورى", surahNumber: 42, ayahNumber: 51, ayahText: "وَمَا كَانَ لِبَشَرٍ أَنْ يُكَلِّمَهُ اللَّهُ إِلَّا وَحْيًا", page: 489 },

  { number: 197, juzNumber: 25, hizbNumber: 50, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "الزخرف", surahNumber: 43, ayahNumber: 24, ayahText: "قَالَ أَوَلَوْ جِئْتُكُمْ بِأَهْدَىٰ مِمَّا وَجَدْتُمْ عَلَيْهِ آبَاءَكُمْ", page: 491 },
  { number: 198, juzNumber: 25, hizbNumber: 50, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "الزخرف", surahNumber: 43, ayahNumber: 57, ayahText: "وَلَمَّا ضُرِبَ ابْنُ مَرْيَمَ مَثَلًا إِذَا قَوْمُكَ مِنْهُ يَصِدُّونَ", page: 493 },
  { number: 199, juzNumber: 25, hizbNumber: 50, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "الدخان", surahNumber: 44, ayahNumber: 17, ayahText: "وَلَقَدْ فَتَنَّا قَبْلَهُمْ قَوْمَ فِرْعَوْنَ وَجَاءَهُمْ رَسُولٌ كَرِيمٌ", page: 496 },
  { number: 200, juzNumber: 25, hizbNumber: 50, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "الجاثية", surahNumber: 45, ayahNumber: 12, ayahText: "اللَّهُ الَّذِي سَخَّرَ لَكُمُ الْبَحْرَ لِتَجْرِيَ الْفُلْكُ فِيهِ بِأَمْرِهِ", page: 500 },

  // JUZ 26 (الحزب 51 والحزب 52)
  { number: 201, juzNumber: 26, hizbNumber: 51, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "الأحقاف", surahNumber: 46, ayahNumber: 1, ayahText: "حم ۝ تَنْزِيلُ الْكِتَابِ مِنَ اللَّهِ الْعَزِيزِ الْحَكِيمِ", page: 502 },
  { number: 202, juzNumber: 26, hizbNumber: 51, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "الأحقاف", surahNumber: 46, ayahNumber: 21, ayahText: "وَاذْكُرْ أَخَا عَادٍ إِذْ أَنْذَرَ قَوْمَهُ بِالْأَحْقَافِ", page: 505 },
  { number: 203, juzNumber: 26, hizbNumber: 51, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "محمد", surahNumber: 47, ayahNumber: 10, ayahText: "أَفَلَمْ يَسِيرُوا فِي الْأَرْضِ فَيَنْظُرُوا كَيْفَ كَانَ عَاقِبَةُ الَّذِينَ", page: 508 },
  { number: 204, juzNumber: 26, hizbNumber: 51, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "محمد", surahNumber: 47, ayahNumber: 33, ayahText: "يَا أَيُّهَا الَّذِينَ آمَنُوا أَطِيعُوا اللَّهَ وَأَطِيعُوا الرَّسُولَ", page: 510 },

  { number: 205, juzNumber: 26, hizbNumber: 52, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "الفتح", surahNumber: 48, ayahNumber: 18, ayahText: "لَقَدْ رَضِيَ اللَّهُ عَنِ الْمُؤْمِنِينَ إِذْ يُبَايِعُونَكَ تَحْتَ الشَّجَرَةِ", page: 513 },
  { number: 206, juzNumber: 26, hizbNumber: 52, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "الحجرات", surahNumber: 49, ayahNumber: 1, ayahText: "يَا أَيُّهَا الَّذِينَ آمَنُوا لَا تُقَدِّمُوا بَيْنَ يَدَيِ اللَّهِ وَرَسُولِهِ", page: 515 },
  { number: 207, juzNumber: 26, hizbNumber: 52, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "الحجرات", surahNumber: 49, ayahNumber: 14, ayahText: "قَالَتِ الْأَعْرَابُ آمَنَّا ۖ قُلْ لَمْ تُؤْمِنُوا وَلَٰكِنْ قُولُوا أَسْلَمْنَا", page: 517 },
  { number: 208, juzNumber: 26, hizbNumber: 52, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "ق", surahNumber: 50, ayahNumber: 27, ayahText: "قَالَ قَرِينُهُ رَبَّنَا مَا أَطْغَيْتُهُ وَلَٰكِنْ كَانَ فِي ضَلَالٍ بَعِيدٍ", page: 519 },

  // JUZ 27 (الحزب 53 والحزب 54)
  { number: 209, juzNumber: 27, hizbNumber: 53, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "الذاريات", surahNumber: 51, ayahNumber: 31, ayahText: "قَالَ فَمَا خَطْبُكُمْ أَيُّهَا الْمُرْسَلُونَ", page: 522 },
  { number: 210, juzNumber: 27, hizbNumber: 53, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "الطور", surahNumber: 52, ayahNumber: 24, ayahText: "وَيَطُوفُ عَلَيْهِمْ غِلْمَانٌ لَهُمْ كَأَنَّهُمْ لُؤْلُؤٌ مَكْنُونٌ", page: 524 },
  { number: 211, juzNumber: 27, hizbNumber: 53, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "النجم", surahNumber: 53, ayahNumber: 26, ayahText: "وَكَمْ مِنْ مَلَكٍ فِي السَّمَاوَاتِ لَا تُغْنِي شَفَاعَتُهُمْ شَيْئًا", page: 527 },
  { number: 212, juzNumber: 27, hizbNumber: 53, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "القمر", surahNumber: 54, ayahNumber: 9, ayahText: "كَذَّبَتْ قَبْلَهُمْ قَوْمُ نُوحٍ فَكَذَّبُوا عَبْدَنَا", page: 529 },

  { number: 213, juzNumber: 27, hizbNumber: 54, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "الرحمن", surahNumber: 55, ayahNumber: 1, ayahText: "الرَّحْمَٰنُ ۝ عَلَّمَ الْقُرْآنَ ۝ خَلَقَ الْإِنْسَانَ", page: 531 },
  { number: 214, juzNumber: 27, hizbNumber: 54, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "الواقعة", surahNumber: 56, ayahNumber: 75, ayahText: "فَلَا أُقْسِمُ بِمَوَاقِعِ النُّجُومِ ۝ وَإِنَّهُ لَقَسَمٌ لَوْ تَعْلَمُونَ عَظِيمٌ", page: 536 },
  { number: 215, juzNumber: 27, hizbNumber: 54, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "الحديد", surahNumber: 57, ayahNumber: 1, ayahText: "سَبَّحَ لِلَّهِ مَا فِي السَّمَاوَاتِ وَالْأَرْضِ ۖ وَهُوَ الْعَزِيزُ الْحَكِيمُ", page: 537 },
  { number: 216, juzNumber: 27, hizbNumber: 54, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "الحديد", surahNumber: 57, ayahNumber: 16, ayahText: "أَلَمْ يَأْنِ لِلَّذِينَ آمَنُوا أَنْ تَخْشَعَ قُلُوبُهُمْ لِذِكْرِ اللَّهِ", page: 539 },

  // JUZ 28 (الحزب 55 والحزب 56)
  { number: 217, juzNumber: 28, hizbNumber: 55, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "المجادلة", surahNumber: 58, ayahNumber: 1, ayahText: "قَدْ سَمِعَ اللَّهُ قَوْلَ الَّتِي تُجَادِلُكَ فِي زَوْجِهَا وَتَشْتَكِي إِلَى اللَّهِ", page: 542 },
  { number: 218, juzNumber: 28, hizbNumber: 55, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "المجادلة", surahNumber: 58, ayahNumber: 14, ayahText: "أَلَمْ تَرَ إِلَى الَّذِينَ تَوَلَّوْا قَوْمًا غَضِبَ اللَّهُ عَلَيْهِمْ", page: 544 },
  { number: 219, juzNumber: 28, hizbNumber: 55, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "الحشر", surahNumber: 59, ayahNumber: 11, ayahText: "أَلَمْ تَرَ إِلَى الَّذِينَ نَافَقُوا يَقُولُونَ لِإِخْوَانِهِمُ الَّذِينَ كَفَرُوا", page: 547 },
  { number: 220, juzNumber: 28, hizbNumber: 55, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "الممتحنة", surahNumber: 60, ayahNumber: 7, ayahText: "عَسَى اللَّهُ أَنْ يَجْعَلَ بَيْنَكُمْ وَبَيْنَ الَّذِينَ عَادَيْتُمْ مِنْهُمْ مَوَدَّةً", page: 550 },

  { number: 221, juzNumber: 28, hizbNumber: 56, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "الصف", surahNumber: 61, ayahNumber: 1, ayahText: "سَبَّحَ لِلَّهِ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۖ وَهُوَ الْعَزِيزُ الْحَكِيمُ", page: 551 },
  { number: 222, juzNumber: 28, hizbNumber: 56, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "الجمعة", surahNumber: 62, ayahNumber: 1, ayahText: "يُسَبِّحُ لِلَّهِ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ الْمَلِكِ الْقُدُّوسِ", page: 553 },
  { number: 223, juzNumber: 28, hizbNumber: 56, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "الطلاق", surahNumber: 65, ayahNumber: 1, ayahText: "يَا أَيُّهَا النَّبِيُّ إِذَا طَلَّقْتُمُ النِّسَاءَ فَطَلِّقُوهُنَّ لِعِدَّتِهِنَّ", page: 558 },
  { number: 224, juzNumber: 28, hizbNumber: 56, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "التحريم", surahNumber: 66, ayahNumber: 1, ayahText: "يَا أَيُّهَا النَّبِيُّ لِمَ تُحَرِّمُ مَا أَحَلَّ اللَّهُ لَكَ", page: 560 },

  // JUZ 29 (الحزب 57 والحزب 58)
  { number: 225, juzNumber: 29, hizbNumber: 57, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "الملك", surahNumber: 67, ayahNumber: 1, ayahText: "تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ", page: 562 },
  { number: 226, juzNumber: 29, hizbNumber: 57, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "القلم", surahNumber: 68, ayahNumber: 1, ayahText: "ن ۚ وَالْقَلَمِ وَمَا يَسْطُرُونَ ۝ مَا أَنْتَ بِنِعْمَةِ رَبِّكَ بِمَجْنُونٍ", page: 564 },
  { number: 227, juzNumber: 29, hizbNumber: 57, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "الحاقة", surahNumber: 69, ayahNumber: 1, ayahText: "الْحَاقَّةُ ۝ مَا الْحَاقَّةُ ۝ وَمَا أَدْرَاكَ مَا الْحَاقَّةُ", page: 566 },
  { number: 228, juzNumber: 29, hizbNumber: 57, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "المعارج", surahNumber: 70, ayahNumber: 1, ayahText: "سَأَلَ سَائِلٌ بِعَذَابٍ وَاقِعٍ ۝ لِلْكَافِرِينَ لَيْسَ لَهُ دَافِعٌ", page: 568 },

  { number: 229, juzNumber: 29, hizbNumber: 58, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "الجن", surahNumber: 72, ayahNumber: 1, ayahText: "قُلْ أُوحِيَ إِلَيَّ أَنَّهُ اسْتَمَعَ نَفَرٌ مِنَ الْجِنِّ فَقَالُوا إِنَّا سَمِعْنَا قُرْآنًا عَجَبًا", page: 572 },
  { number: 230, juzNumber: 29, hizbNumber: 58, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "المزمل", surahNumber: 73, ayahNumber: 1, ayahText: "يَا أَيُّهَا الْمُزَّمِّلُ ۝ قُمِ اللَّيْلَ إِلَّا قَلِيلًا", page: 574 },
  { number: 231, juzNumber: 29, hizbNumber: 58, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "المدثر", surahNumber: 74, ayahNumber: 1, ayahText: "يَا أَيُّهَا الْمُدَّثِّرُ ۝ قُمْ فَأَنْذِرْ ۝ وَرَبَّكَ فَكَبِّرْ", page: 575 },
  { number: 232, juzNumber: 29, hizbNumber: 58, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "الإنسان", surahNumber: 76, ayahNumber: 1, ayahText: "هَلْ أَتَىٰ عَلَى الْإِنْسَانِ حِينٌ مِنَ الدَّهْرِ لَمْ يَكُنْ شَيْئًا مَذْكُورًا", page: 578 },

  // JUZ 30 (الحزب 59 والحزب 60)
  { number: 233, juzNumber: 30, hizbNumber: 59, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "النبأ", surahNumber: 78, ayahNumber: 1, ayahText: "عَمَّ يَتَسَاءَلُونَ ۝ عَنِ النَّبَإِ الْعَظِيمِ", page: 582 },
  { number: 234, juzNumber: 30, hizbNumber: 59, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "النازعات", surahNumber: 79, ayahNumber: 1, ayahText: "وَالنَّازِعَاتِ غَرْقًا ۝ وَالنَّاشِطَاتِ نَشْطًا", page: 583 },
  { number: 235, juzNumber: 30, hizbNumber: 59, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "عبس", surahNumber: 80, ayahNumber: 1, ayahText: "عَبَسَ وَتَوَلَّىٰ ۝ أَنْ جَاءَهُ الْأَعْمَىٰ", page: 585 },
  { number: 236, juzNumber: 30, hizbNumber: 59, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "المطففين", surahNumber: 83, ayahNumber: 1, ayahText: "وَيْلٌ لِلْمُطَفِّفِينَ ۝ الَّذِينَ إِذَا اكْتَالُوا عَلَى النَّاسِ يَسْتَوْفُونَ", page: 587 },

  { number: 237, juzNumber: 30, hizbNumber: 60, rubInHizb: 1, typeLabel: "بداية الحزب", surahName: "الأعلى", surahNumber: 87, ayahNumber: 1, ayahText: "سَبِّحِ اسْمَ رَبِّكَ الْأَعْلَى ۝ الَّذِي خَلَقَ فَسَوَّىٰ", page: 591 },
  { number: 238, juzNumber: 30, hizbNumber: 60, rubInHizb: 2, typeLabel: "ربع الحزب", surahName: "الفجر", surahNumber: 89, ayahNumber: 1, ayahText: "وَالْفَجْرِ ۝ وَلَيَالٍ عَشْرٍ ۝ وَالشَّفْعِ وَالْوَتْرِ", page: 593 },
  { number: 239, juzNumber: 30, hizbNumber: 60, rubInHizb: 3, typeLabel: "نصف الحزب", surahName: "الضحى", surahNumber: 93, ayahNumber: 1, ayahText: "وَالضُّحَىٰ ۝ وَاللَّيْلِ إِذَا سَجَىٰ ۝ مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ", page: 596 },
  { number: 240, juzNumber: 30, hizbNumber: 60, rubInHizb: 4, typeLabel: "ثلاثة أرباع الحزب", surahName: "العاديات", surahNumber: 100, ayahNumber: 1, ayahText: "وَالْعَادِيَاتِ ضَبْحًا ۝ فَالْمُورِيَاتِ قَدْحًا", page: 599 },
];

export function getQuartersForHizb(hizbNum: number): QuarterData[] {
  return QURAN_QUARTERS.filter((q) => q.hizbNumber === hizbNum);
}

export function getQuartersForJuz(juzNum: number): QuarterData[] {
  return QURAN_QUARTERS.filter((q) => q.juzNumber === juzNum);
}

export function getQuarterForPage(pageNum: number): QuarterData {
  let matched = QURAN_QUARTERS[0];
  for (let i = QURAN_QUARTERS.length - 1; i >= 0; i--) {
    if (pageNum >= QURAN_QUARTERS[i].page) {
      matched = QURAN_QUARTERS[i];
      break;
    }
  }
  return matched;
}
