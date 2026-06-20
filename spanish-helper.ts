// Helper for Spanish & Armenian numbers to words, and clock times translation

const unitsSp = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
const tensSp = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const teensSp = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
const twentiesSp = ['veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
const hundredsSp = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

export function numberToSpanish(num: number): string {
  if (num === 0) return 'cero';
  if (num === 1000000) return 'un millón';

  function convertGroup(n: number): string {
    let parts: string[] = [];
    
    // Hundreds
    if (n >= 100) {
      const h = Math.floor(n / 100);
      const rem = n % 100;
      if (h === 1 && rem === 0) {
        parts.push('cien');
      } else {
        parts.push(hundredsSp[h]);
      }
      n = rem;
    }
    
    // Tens & Units
    if (n >= 20 && n < 30) {
      parts.push(twentiesSp[n - 20]);
    } else if (n >= 10 && n < 20) {
      parts.push(teensSp[n - 10]);
    } else if (n > 0) {
      const t = Math.floor(n / 10);
      const u = n % 10;
      if (t > 0) {
        if (u > 0) {
          parts.push(`${tensSp[t]} y ${unitsSp[u]}`);
        } else {
          parts.push(tensSp[t]);
        }
      } else {
        parts.push(unitsSp[u]);
      }
    }
    
    return parts.filter(Boolean).join(' ');
  }

  let result = '';
  
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    
    let thousandsStr = '';
    if (thousands === 1) {
      thousandsStr = 'mil';
    } else {
      let words = convertGroup(thousands);
      // If thousands end with 1, like 21.000, in Spanish it changes from "veintiuno mil" to "veintiún mil"
      if (words.endsWith('veintiuno')) {
        words = words.substring(0, words.length - 3) + 'ún';
      } else if (words.endsWith('uno')) {
        words = words.substring(0, words.length - 3) + 'un';
      }
      thousandsStr = `${words} mil`;
    }
    
    const remainderStr = convertGroup(remainder);
    result = remainderStr ? `${thousandsStr} ${remainderStr}` : thousandsStr;
  } else {
    result = convertGroup(num);
  }
  
  return result.trim();
}

const unitsAm = ['', 'մեկ', 'երկու', 'երեք', 'չորս', 'հինգ', 'վեց', 'յոթ', 'ութ', 'ինն'];
const tensAm = ['', 'տաս', 'քսան', 'երեսուն', 'քառասուն', 'հիսուն', 'վաթսուն', 'յոթանասուն', 'ութսուն', 'իննսուն'];

export function numberToArmenian(num: number): string {
  if (num === 0) return 'զրո';
  if (num === 1000000) return 'մեկ միլիոն';

  function convertGroup(n: number): string {
    let parts: string[] = [];
    
    // Hundreds
    if (n >= 100) {
      const h = Math.floor(n / 100);
      const rem = n % 100;
      if (h === 1) {
        parts.push('հարյուր');
      } else {
        parts.push(`${unitsAm[h]} հարյուր`);
      }
      n = rem;
    }
    
    // Tens & Units
    if (n > 0) {
      const t = Math.floor(n / 10);
      const u = n % 10;
      if (t > 0) {
        let tenPrefix = tensAm[t];
        if (t === 1 && u > 0) {
          tenPrefix = 'տասն';
        }
        parts.push(`${tenPrefix}${unitsAm[u]}`);
      } else {
        parts.push(unitsAm[u]);
      }
    }
    
    return parts.filter(Boolean).join(' ');
  }

  let parts: string[] = [];
  
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    
    if (thousands === 1) {
      parts.push('հազար');
    } else {
      parts.push(`${convertGroup(thousands)} հազար`);
    }
    
    if (remainder > 0) {
      parts.push(convertGroup(remainder));
    }
  } else {
    parts.push(convertGroup(num));
  }
  
  return parts.filter(Boolean).join(' ');
}

// Convert numbers to Russian for extra user friendliness
const unitsRu = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
const teensRu = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
const tensRu = ['', 'десять', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
const hundredsRu = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];

export function numberToRussian(num: number): string {
  if (num === 0) return 'ноль';
  if (num === 1000000) return 'один миллион';

  function convertGroup(n: number, isFemaleThousand: boolean = false): string {
    let parts: string[] = [];
    
    if (n >= 100) {
      const h = Math.floor(n / 100);
      parts.push(hundredsRu[h]);
      n = n % 100;
    }
    
    if (n >= 10 && n < 20) {
      parts.push(teensRu[n - 10]);
    } else if (n > 0) {
      const t = Math.floor(n / 10);
      const u = n % 10;
      if (t > 0) {
        parts.push(tensRu[t]);
      }
      if (u > 0) {
        if (isFemaleThousand) {
          if (u === 1) parts.push('одна');
          else if (u === 2) parts.push('две');
          else parts.push(unitsRu[u]);
        } else {
          parts.push(unitsRu[u]);
        }
      }
    }
    
    return parts.filter(Boolean).join(' ');
  }

  let parts: string[] = [];
  
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    
    let thousandsStr = '';
    const groupSec = convertGroup(thousands, true);
    
    const lastDigit = thousands % 10;
    const lastTwo = thousands % 100;
    
    if (lastTwo >= 11 && lastTwo <= 19) {
      thousandsStr = `${groupSec} тысяч`;
    } else if (lastDigit === 1) {
      thousandsStr = `${groupSec} тысяча`;
    } else if (lastDigit >= 2 && lastDigit <= 4) {
      thousandsStr = `${groupSec} тысячи`;
    } else {
      thousandsStr = `${groupSec} тысяч`;
    }
    
    parts.push(thousandsStr);
    if (remainder > 0) {
      parts.push(convertGroup(remainder));
    }
  } else {
    parts.push(convertGroup(num));
  }
  
  return parts.filter(Boolean).join(' ');
}

// SPANISH CLOCK TEXT TRANSLATION ENGINE
export function timeToSpanish(hours: number, minutes: number): string {
  // Normalize hours to 1-12
  let h = hours % 12;
  if (h === 0) h = 12;

  // Next hour for "menos" cases
  let nextH = (h % 12) + 1;
  
  const spanNums = [
    '', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 
    'siete', 'ocho', 'nueve', 'diez', 'once', 'doce'
  ];

  if (minutes === 0) {
    const verb = h === 1 ? 'Es la' : 'Son las';
    return `${verb} ${spanNums[h]} en punto`;
  }
  
  if (minutes === 15) {
    const verb = h === 1 ? 'Es la' : 'Son las';
    return `${verb} ${spanNums[h]} y cuarto`;
  }
  
  if (minutes === 30) {
    const verb = h === 1 ? 'Es la' : 'Son las';
    return `${verb} ${spanNums[h]} y media`;
  }
  
  if (minutes < 30) {
    const verb = h === 1 ? 'Es la' : 'Son las';
    return `${verb} ${spanNums[h]} y ${numberToSpanish(minutes)}`;
  }
  
  if (minutes === 45) {
    const verb = nextH === 1 ? 'Es la' : 'Son las';
    return `${verb} ${spanNums[nextH]} menos cuarto`;
  }
  
  // menos min
  const remMinutes = 60 - minutes;
  const verbNext = nextH === 1 ? 'Es la' : 'Son las';
  return `${verbNext} ${spanNums[nextH]} menos ${numberToSpanish(remMinutes)}`;
}

// ARMENIAN CLOCK TEXT TRANSLATION ENGINE
export function timeToArmenian(hours: number, minutes: number): string {
  let h = hours % 12;
  if (h === 0) h = 12;
  let nextH = (h % 12) + 1;

  const armHrs = [
    '', 'մեկ', 'երկու', 'երեխ', 'չորս', 'հինգ', 'վեց',
    'յոթ', 'ութ', 'ինն', 'տաս', 'տասնմեկ', 'տասներկու'
  ];
  
  // phonetic/grammatic hour suffix for o'clock e.g. "մեկն է", "երկուսն է", "երեքն է", "չորսն է", "հինգն է", "վեցն է", "յոթն է", "ութն է", "ինն է", "տասն է", "տասնմեկն է", "տասներկուսն է"
  const getHourWithSuffix = (hr: number): string => {
    switch (hr) {
      case 1: return 'մեկն է';
      case 2: return 'երկուսն է';
      case 3: return 'երեքն է';
      case 4: return 'չորսն է';
      case 5: return 'հինգն է';
      case 6: return 'վեցն է';
      case 7: return 'յոթն է';
      case 8: return 'ութն է';
      case 9: return 'ինն է';
      case 10: return 'տասն է';
      case 11: return 'տասնմեկն է';
      case 12: return 'տասներկուսն է';
      default: return '';
    }
  };

  const getHourGenitive = (hr: number): string => {
    switch (hr) {
      case 1: return 'մեկին';
      case 2: return 'երկուսին';
      case 3: return 'երեքին';
      case 4: return 'չորսին';
      case 5: return 'հինգին';
      case 6: return 'վեցին';
      case 7: return 'յոթին';
      case 8: return 'ութին';
      case 9: return 'իննին';
      case 10: return 'տասին';
      case 11: return 'տասնմեկին';
      case 12: return 'տասներկուսին';
      default: return '';
    }
  };

  if (minutes === 0) {
    return `Ժամը ${getHourWithSuffix(h)}`;
  }
  
  if (minutes === 30) {
    return `Ժամը ${armHrs[h]} անց կես`;
  }
  
  if (minutes < 30) {
    return `Ժամը ${armHrs[h]} անց ${numberToArmenian(minutes)} րոպե`;
  }
  
  // menos case: e.g. 5:40 is 20 min before 6 -> ժամը վեցից քսան րոպե պակաս
  const remMinutes = 60 - minutes;
  return `Ժամը ${getHourGenitive(nextH)} պակաս ${numberToArmenian(remMinutes)} րոպե`;
}

// RUSSIAN CLOCK TEXT TRANSLATION ENGINE
export function timeToRussian(hours: number, minutes: number): string {
  let h = hours % 12;
  if (h === 0) h = 12;
  let nextH = (h % 12) + 1;

  const ruHrsNominative = [
    '', 'один', 'два', 'три', 'четыре', 'пять', 'шесть',
    'семь', 'восемь', 'девять', 'десять', 'одиннадцать', 'двенадцать'
  ];

  const ruHrsGenitive = [
    '', 'первого', 'второго', 'третьего', 'четвертого', 'пятого', 'шестого',
    'седьмого', 'восьмого', 'девятого', 'десятого', 'одиннадцатого', 'двенадцатого', 'первого'
  ];

  const getHourWordNominative = (hr: number): string => {
    if (hr === 1) return 'час';
    if (hr >= 2 && hr <= 4) return `${ruHrsNominative[hr]} часа`;
    return `${ruHrsNominative[hr]} часов`;
  };

  if (minutes === 0) {
    return `${getHourWordNominative(h)} ровно`;
  }
  
  if (minutes === 30) {
    return `половина ${ruHrsGenitive[h]}`;
  }
  
  if (minutes < 30) {
    let minText = 'минут';
    const lastDigit = minutes % 10;
    const lastTwo = minutes % 100;
    if (!(lastTwo >= 11 && lastTwo <= 19)) {
      if (lastDigit === 1) minText = 'минута';
      else if (lastDigit >= 2 && lastDigit <= 4) minText = 'минуты';
    }
    
    // e.g. 10 minutes of 5th hour: "десять минут пятого"
    return `${numberToRussian(minutes)} ${minText} ${ruHrsGenitive[h]}`;
  }
  
  // menos: "без двадцати пяти шесть"
  const remMin = 60 - minutes;
  let pre = '';
  if (remMin === 5) pre = 'пяти';
  else if (remMin === 10) pre = 'десяти';
  else if (remMin === 15) pre = 'пятнадцати';
  else if (remMin === 20) pre = 'двадцати';
  else if (remMin === 25) pre = 'двадцати пяти';
  else {
    pre = numberToRussian(remMin); // fallback simplified
  }
  
  const targetHour = ruHrsNominative[nextH];
  return `без ${pre} ${targetHour}`;
}
