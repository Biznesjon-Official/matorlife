// O'zbekcha lotin → kirill transliteratsiya
const latinToCyrillicMap: Record<string, string> = {
  // Maxsus harflar (2 belgili)
  "O'": "Ў", "o'": "ў",
  "G'": "Ғ", "g'": "ғ",
  "Sh": "Ш", "sh": "ш",
  "Ch": "Ч", "ch": "ч",
  "Ng": "Нг", "ng": "нг",
  "Ya": "Я", "ya": "я",
  "Yo": "Ё", "yo": "ё",
  "Yu": "Ю", "yu": "ю",
  "Ye": "Е", "ye": "е",
  
  // Oddiy harflar
  "A": "А", "a": "а",
  "B": "Б", "b": "б",
  "D": "Д", "d": "д",
  "E": "Э", "e": "э",
  "F": "Ф", "f": "ф",
  "G": "Г", "g": "г",
  "H": "Ҳ", "h": "ҳ",
  "I": "И", "i": "и",
  "J": "Ж", "j": "ж",
  "K": "К", "k": "к",
  "L": "Л", "l": "л",
  "M": "М", "m": "м",
  "N": "Н", "n": "н",
  "O": "О", "o": "о",
  "P": "П", "p": "п",
  "Q": "Қ", "q": "қ",
  "R": "Р", "r": "р",
  "S": "С", "s": "с",
  "T": "Т", "t": "т",
  "U": "У", "u": "у",
  "V": "В", "v": "в",
  "X": "Х", "x": "х",
  "Y": "Й", "y": "й",
  "Z": "З", "z": "з",
};

// O'zbekcha kirill → lotin transliteratsiya
const cyrillicToLatinMap: Record<string, string> = {
  "Ў": "O'", "ў": "o'",
  "Ғ": "G'", "ғ": "g'",
  "Ш": "Sh", "ш": "sh",
  "Ч": "Ch", "ч": "ch",
  "Я": "Ya", "я": "ya",
  "Ё": "Yo", "ё": "yo",
  "Ю": "Yu", "ю": "yu",
  "Е": "Ye", "е": "ye",
  
  "А": "A", "а": "a",
  "Б": "B", "б": "b",
  "Д": "D", "д": "d",
  "Э": "E", "э": "e",
  "Ф": "F", "ф": "f",
  "Г": "G", "г": "g",
  "Ҳ": "H", "ҳ": "h",
  "И": "I", "и": "i",
  "Ж": "J", "ж": "j",
  "К": "K", "к": "k",
  "Л": "L", "л": "l",
  "М": "M", "м": "m",
  "Н": "N", "н": "n",
  "О": "O", "о": "o",
  "П": "P", "п": "p",
  "Қ": "Q", "қ": "q",
  "Р": "R", "р": "r",
  "С": "S", "с": "s",
  "Т": "T", "т": "t",
  "У": "U", "у": "u",
  "В": "V", "в": "v",
  "Х": "X", "х": "x",
  "Й": "Y", "й": "y",
  "З": "Z", "з": "z",
};

/**
 * Lotin harflarini kirillga o'giradi
 * @param text - Lotin harflaridagi matn
 * @returns Kirill harflaridagi matn
 */
export function latinToCyrillic(text: string): string {
  if (!text) return '';
  
  let result = text;
  
  // Avval 2 belgili harflarni almashtirish (o', g', sh, ch, ng)
  const twoCharPatterns = ['O\'', 'o\'', 'G\'', 'g\'', 'Sh', 'sh', 'Ch', 'ch', 'Ng', 'ng', 'Ya', 'ya', 'Yo', 'yo', 'Yu', 'yu', 'Ye', 'ye'];
  
  for (const pattern of twoCharPatterns) {
    if (latinToCyrillicMap[pattern]) {
      result = result.split(pattern).join(latinToCyrillicMap[pattern]);
    }
  }
  
  // Keyin 1 belgili harflarni almashtirish
  result = result.split('').map(char => latinToCyrillicMap[char] || char).join('');
  
  return result;
}

/**
 * Kirill harflarini lotinga o'giradi
 * @param text - Kirill harflaridagi matn
 * @returns Lotin harflaridagi matn
 */
export function cyrillicToLatin(text: string): string {
  if (!text) return '';
  
  let result = text;
  
  // Har bir kirill harfni lotin harfga almashtirish
  result = result.split('').map(char => cyrillicToLatinMap[char] || char).join('');
  
  return result;
}

/**
 * Matnning qaysi alifboda ekanligini aniqlaydi
 * @param text - Tekshiriladigan matn
 * @returns 'latin' | 'cyrillic' | 'mixed'
 */
export function detectScript(text: string): 'latin' | 'cyrillic' | 'mixed' {
  if (!text) return 'latin';
  
  const cyrillicChars = text.match(/[а-яА-ЯўғҳқўҒҲҚЎёЁ]/g);
  const latinChars = text.match(/[a-zA-Z]/g);
  
  const hasCyrillic = cyrillicChars && cyrillicChars.length > 0;
  const hasLatin = latinChars && latinChars.length > 0;
  
  if (hasCyrillic && hasLatin) return 'mixed';
  if (hasCyrillic) return 'cyrillic';
  return 'latin';
}

/**
 * Avtomatik transliteratsiya - matn alifbosini aniqlaydi va o'giradi
 * @param text - Transliteratsiya qilinadigan matn
 * @returns Transliteratsiya qilingan matn
 */
export function autoTransliterate(text: string): string {
  const script = detectScript(text);
  
  if (script === 'cyrillic') {
    return cyrillicToLatin(text);
  } else if (script === 'latin') {
    return latinToCyrillic(text);
  }
  
  return text; // mixed yoki bo'sh bo'lsa o'zgartirmaslik
}

/**
 * Helper funksiya - matnni til bo'yicha qaytaradi
 * @param latinText - Lotin harflaridagi matn
 * @param language - 'latin' yoki 'cyrillic'
 * @returns Tanlangan tildagi matn
 */
export function t(latinText: string, language: 'latin' | 'cyrillic'): string {
  if (language === 'cyrillic') {
    return latinToCyrillic(latinText);
  }
  return latinText;
}

// Test funksiyasi
export function testTransliteration() {
  const tests = [
    { input: "salom", expected: "салом" },
    { input: "kitob", expected: "китоб" },
    { input: "o'qituvchi", expected: "ўқитувчи" },
    { input: "maktab", expected: "мактаб" },
    { input: "O'zbekiston", expected: "Ўзбекистон" },
    { input: "sho'rva", expected: "шўрва" },
    { input: "choyxona", expected: "чойхона" },
    { input: "g'alaba", expected: "ғалаба" },
  ];
  
  tests.forEach(({ input, expected }) => {
    const result = latinToCyrillic(input);
    // Test result check
    if (result !== expected) {
      console.warn(`Translation mismatch: ${input} -> ${result} (expected: ${expected})`);
    }
  });
}
