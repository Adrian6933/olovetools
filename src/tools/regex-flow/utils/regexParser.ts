export interface ParsedToken {
  text: string;
  type: 'anchor' | 'character_class' | 'quantifier' | 'group_start' | 'group_end' | 'alternation' | 'literal' | 'escaped_literal' | 'character_set';
  depth: number;
  description: string;
}

const TOKEN_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    anchor_start: "Beginning of string/line (^)",
    anchor_end: "End of string/line ($)",
    word_boundary: "Word boundary (\\b)",
    non_word_boundary: "Non-word boundary (\\B)",
    digit: "Digit character (0-9)",
    non_digit: "Any character that is not a digit",
    word_char: "Word character (alphanumeric + underscore)",
    non_word_char: "Any character that is not a word character",
    whitespace: "Whitespace character (space, tab, newline)",
    non_whitespace: "Any character that is not whitespace",
    any_char: "Any single character except newline (.)",
    escaped: "Escaped character '{char}' (treated literally)",
    literal: "Literal character '{char}'",
    quantifier_star: "Matches 0 or more times (greedy)",
    quantifier_plus: "Matches 1 or more times (greedy)",
    quantifier_question: "Matches 0 or 1 time (greedy)",
    quantifier_exact: "Matches exactly {count} times",
    quantifier_min: "Matches {min} or more times",
    quantifier_range: "Matches between {min} and {max} times",
    lazy: "Matches lazily (as few times as possible)",
    group_capturing: "Start of Capturing Group",
    group_non_capturing: "Start of Non-capturing Group",
    group_pos_lookahead: "Start of Positive Lookahead (asserts what follows matches)",
    group_neg_lookahead: "Start of Negative Lookahead (asserts what follows does not match)",
    group_pos_lookbehind: "Start of Positive Lookbehind (asserts what precedes matches)",
    group_neg_lookbehind: "Start of Negative Lookbehind (asserts what precedes does not match)",
    group_end: "End of Group",
    alternation: "Alternation / OR operator",
    set_match: "Character set matching '{chars}'",
    set_match_negated: "Negated character set matching any character except '{chars}'"
  },
  es: {
    anchor_start: "Inicio de cadena/línea (^)",
    anchor_end: "Fin de cadena/línea ($)",
    word_boundary: "Límite de palabra (\\b)",
    non_word_boundary: "Límite de no-palabra (\\B)",
    digit: "Dígito (0-9)",
    non_digit: "Cualquier carácter que no sea un dígito",
    word_char: "Carácter de palabra (alfanumérico + guion bajo)",
    non_word_char: "Cualquier carácter que no sea de palabra",
    whitespace: "Carácter de espacio en blanco (espacio, tabulador, salto de línea)",
    non_whitespace: "Cualquier carácter que no sea espacio en blanco",
    any_char: "Cualquier carácter excepto salto de línea (.)",
    escaped: "Carácter escapado '{char}' (tratado literalmente)",
    literal: "Carácter literal '{char}'",
    quantifier_star: "Coincide 0 o más veces (codicioso/greedy)",
    quantifier_plus: "Coincide 1 o más veces (codicioso/greedy)",
    quantifier_question: "Coincide 0 o 1 vez (codicioso/greedy)",
    quantifier_exact: "Coincide exactamente {count} veces",
    quantifier_min: "Coincide {min} o más veces",
    quantifier_range: "Coincide entre {min} y {max} veces",
    lazy: "Coincide de manera perezosa (lo menos posible)",
    group_capturing: "Inicio de Grupo de Captura",
    group_non_capturing: "Inicio de Grupo de No Captura",
    group_pos_lookahead: "Inicio de Lookahead Positivo (asegura que lo que sigue coincide)",
    group_neg_lookahead: "Inicio de Lookahead Negativo (asegura que lo que sigue no coincide)",
    group_pos_lookbehind: "Inicio de Lookbehind Positivo (asegura que lo que antecede coincide)",
    group_neg_lookbehind: "Inicio de Lookbehind Negativo (asegura que lo que antecede no coincide)",
    group_end: "Fin de Grupo",
    alternation: "Alternancia / Operador O (OR)",
    set_match: "Clase de caracteres que coincide con '{chars}'",
    set_match_negated: "Clase de caracteres negada que coincide con cualquier carácter excepto '{chars}'"
  },
  fr: {
    anchor_start: "Début de chaîne/ligne (^)",
    anchor_end: "Fin de chaîne/ligne ($)",
    word_boundary: "Limite de mot (\\b)",
    non_word_boundary: "Limite de non-mot (\\B)",
    digit: "Chiffre (0-9)",
    non_digit: "N'importe quel caractère sauf un chiffre",
    word_char: "Caractère de mot (alphanumérique + souligné)",
    non_word_char: "N'importe quel caractère sauf de mot",
    whitespace: "Espace blanc (espace, tab, saut de ligne)",
    non_whitespace: "N'importe quel caractère sauf espace blanc",
    any_char: "N'importe quel caractère sauf saut de ligne (.)",
    escaped: "Caractère échappé '{char}' (traité littéralement)",
    literal: "Caractère littéral '{char}'",
    quantifier_star: "Correspond 0 fois ou plus (glouton/greedy)",
    quantifier_plus: "Correspond 1 fois ou plus (glouton/greedy)",
    quantifier_question: "Correspond 0 ou 1 fois (glouton/greedy)",
    quantifier_exact: "Correspond exactement {count} fois",
    quantifier_min: "Correspond {min} fois ou plus",
    quantifier_range: "Correspond entre {min} et {max} fois",
    lazy: "Correspondance paresseuse (le moins possible)",
    group_capturing: "Début de Groupe de Capture",
    group_non_capturing: "Début de Groupe non capturant",
    group_pos_lookahead: "Début de Lookahead Positif (assure que ce qui suit correspond)",
    group_neg_lookahead: "Début de Lookahead Négatif (assure que ce qui suit ne correspond pas)",
    group_pos_lookbehind: "Début de Lookbehind Positif (assure que ce qui précède correspond)",
    group_neg_lookbehind: "Début de Lookbehind Négatif (assure que ce qui précède ne correspond pas)",
    group_end: "Fin de Groupe",
    alternation: "Alternance / Opérateur OU (OR)",
    set_match: "Classe de caractères correspondant à '{chars}'",
    set_match_negated: "Classe de caractères négative excluant '{chars}'"
  },
  de: {
    anchor_start: "Anfang der Zeichenkette/Zeile (^)",
    anchor_end: "Ende der Zeichenkette/Zeile ($)",
    word_boundary: "Wortgrenze (\\b)",
    non_word_boundary: "Nicht-Wortgrenze (\\B)",
    digit: "Ziffer (0-9)",
    non_digit: "Keine Ziffer",
    word_char: "Wortzeichen (alphanumerisch + Unterstrich)",
    non_word_char: "Kein Wortzeichen",
    whitespace: "Whitespace-Zeichen (Leerzeichen, Tab, Zeilenumbruch)",
    non_whitespace: "Kein Whitespace-Zeichen",
    any_char: "Beliebiges Zeichen außer Zeilenumbruch (.)",
    escaped: "Escaptes Zeichen '{char}' (wird wörtlich genommen)",
    literal: "Literal-Zeichen '{char}'",
    quantifier_star: "Treffer 0 oder mehr Mal (gierig/greedy)",
    quantifier_plus: "Treffer 1 oder mehr Mal (gierig/greedy)",
    quantifier_question: "Treffer 0 oder 1 Mal (gierig/greedy)",
    quantifier_exact: "Trifft genau {count} Mal zu",
    quantifier_min: "Trifft {min} oder mehr Mal zu",
    quantifier_range: "Trifft zwischen {min} und {max} Mal zu",
    lazy: "Trifft träge zu (so selten wie möglich)",
    group_capturing: "Start der Erfassungsgruppe",
    group_non_capturing: "Start der Nicht-Erfassungsgruppe",
    group_pos_lookahead: "Start von Positivem Lookahead (prüft, ob das Folgende übereinstimmt)",
    group_neg_lookahead: "Start von Negativem Lookahead (prüft, ob das Folgende nicht übereinstimmt)",
    group_pos_lookbehind: "Start von Positivem Lookbehind (prüft, ob das Vorhergehende übereinstimmt)",
    group_neg_lookbehind: "Start von Negativem Lookbehind (prüft, ob das Vorhergehende nicht übereinstimmt)",
    group_end: "Ende der Gruppe",
    alternation: "Alternative / ODER-Operator",
    set_match: "Zeichenklasse, die auf '{chars}' passt",
    set_match_negated: "Negierte Zeichenklasse, die auf alles außer '{chars}' passt"
  },
  pt: {
    anchor_start: "Início de string/linha (^)",
    anchor_end: "Fim de string/linha ($)",
    word_boundary: "Limite de palavra (\\b)",
    non_word_boundary: "Limite de não-palavra (\\B)",
    digit: "Dígito (0-9)",
    non_digit: "Qualquer caractere que não seja um dígito",
    word_char: "Caractere de palavra (alfanumérico + sublinhado)",
    non_word_char: "Qualquer caractere que não seja de palavra",
    whitespace: "Espaço em branco (espaço, tab, quebra de linha)",
    non_whitespace: "Qualquer caractere que não seja espaço em branco",
    any_char: "Qualquer caractere exceto quebra de linha (.)",
    escaped: "Caractere escapado '{char}' (tratado literalmente)",
    literal: "Caractere literal '{char}'",
    quantifier_star: "Corresponde 0 ou mais vezes (ganancioso/greedy)",
    quantifier_plus: "Corresponde 1 ou mais vezes (ganancioso/greedy)",
    quantifier_question: "Corresponde 0 ou 1 vez (ganancioso/greedy)",
    quantifier_exact: "Corresponde exatamente {count} vezes",
    quantifier_min: "Corresponde {min} ou mais vezes",
    quantifier_range: "Corresponde entre {min} e {max} vezes",
    lazy: "Corresponde de forma preguiçosa/lazy (o mínimo possível)",
    group_capturing: "Início do Grupo de Captura",
    group_non_capturing: "Início do Grupo sem Captura",
    group_pos_lookahead: "Início do Lookahead Positivo (afirma que o que segue corresponde)",
    group_neg_lookahead: "Início do Lookahead Negativo (afirma que o que segue não corresponde)",
    group_pos_lookbehind: "Início do Lookbehind Positivo (afirma que o que antecede corresponde)",
    group_neg_lookbehind: "Início do Lookbehind Negativo (afirma que o que antecede não corresponde)",
    group_end: "Fim do Grupo",
    alternation: "Alternância / Operador OU (OR)",
    set_match: "Classe de caracteres que corresponde a '{chars}'",
    set_match_negated: "Classe de caracteres negada que corresponde a qualquer caractere exceto '{chars}'"
  },
  ru: {
    anchor_start: "Начало строки/строк (^)",
    anchor_end: "Конец строки/строк ($)",
    word_boundary: "Граница слова (\\b)",
    non_word_boundary: "Не граница слова (\\B)",
    digit: "Цифра (0-9)",
    non_digit: "Любой символ, кроме цифры",
    word_char: "Символ слова (буквенно-цифровой + подчеркивание)",
    non_word_char: "Любой символ, кроме символов слова",
    whitespace: "Пробельный символ (пробел, табуляция, перевод строки)",
    non_whitespace: "Любой не пробельный символ",
    any_char: "Любой одиночный символ, кроме перевода строки (.)",
    escaped: "Экранированный символ '{char}' (буквально)",
    literal: "Литеральный символ '{char}'",
    quantifier_star: "Совпадение 0 или более раз (жадный)",
    quantifier_plus: "Совпадение 1 или более раз (жадный)",
    quantifier_question: "Совпадение 0 или 1 раз (жадный)",
    quantifier_exact: "Совпадение ровно {count} раз(а)",
    quantifier_min: "Совпадение {min} или более раз(а)",
    quantifier_range: "Совпадение от {min} до {max} раз(а)",
    lazy: "Ленивое совпадение (как можно меньше раз)",
    group_capturing: "Начало захватывающей группы",
    group_non_capturing: "Начало незахватывающей группы",
    group_pos_lookahead: "Начало опережающей положительной проверки (lookahead)",
    group_neg_lookahead: "Начало опережающей отрицательной проверки (lookahead)",
    group_pos_lookbehind: "Начало ретроспективной положительной проверки (lookbehind)",
    group_neg_lookbehind: "Начало ретроспективной отрицательной проверки (lookbehind)",
    group_end: "Конец группы",
    alternation: "Альтернатива (ИЛИ)",
    set_match: "Символьный класс, соответствующий '{chars}'",
    set_match_negated: "Отрицающий символьный класс, соответствующий любому символу, кроме '{chars}'"
  },
  hi: {
    anchor_start: "स्ट्रिंग/लाइन की शुरुआत (^)",
    anchor_end: "स्ट्रिंग/लाइन का अंत ($)",
    word_boundary: "शब्द सीमा (\\b)",
    non_word_boundary: "गैर-शब्द सीमा (\\B)",
    digit: "अंक वर्ण (0-9)",
    non_digit: "कोई भी वर्ण जो अंक नहीं है",
    word_char: "शब्द वर्ण (अल्फ़ान्यूमेरिक + अंडरस्कोर)",
    non_word_char: "कोई भी वर्ण जो शब्द वर्ण नहीं है",
    whitespace: "व्हाइटस्पेस वर्ण (स्थान, टैब, नई पंक्ति)",
    non_whitespace: "कोई भी वर्ण जो व्हाइटस्पेस नहीं है",
    any_char: "नई पंक्ति को छोड़कर कोई भी एकल वर्ण (.)",
    escaped: "एस्केप किया गया वर्ण '{char}' (शाब्दिक रूप से माना जाता है)",
    literal: "शाब्दिक वर्ण '{char}'",
    quantifier_star: "0 या अधिक बार मेल खाता है (लालची/greedy)",
    quantifier_plus: "1 या अधिक बार मेल खाता है (लालची/greedy)",
    quantifier_question: "0 या 1 बार मेल खाता है (लालची/greedy)",
    quantifier_exact: "सटीक रूप से {count} बार मेल खाता है",
    quantifier_min: "{min} या अधिक बार मेल खाता है",
    quantifier_range: "{min} और {max} बार के बीच मेल खाता है",
    lazy: "आलसी (lazy) रूप से मेल खाता है (जितना कम संभव हो)",
    group_capturing: "कैप्चरिंग समूह की शुरुआत",
    group_non_capturing: "गैर-कैप्चरिंग समूह की शुरुआत",
    group_pos_lookahead: "सकारात्मक लुकअहेड की शुरुआत",
    group_neg_lookahead: "नकारात्मक लुकअहेड की शुरुआत",
    group_pos_lookbehind: "सकारात्मक लुकबिहाइंड की शुरुआत",
    group_neg_lookbehind: "नकारात्मक लुकबिहाइंड की शुरुआत",
    group_end: "समूह का अंत",
    alternation: "विकल्प / या (OR) ऑपरेटर",
    set_match: "वर्ण सेट जो '{chars}' से मेल खाता है",
    set_match_negated: "नकारात्मक वर्ण सेट जो '{chars}' को छोड़कर किसी भी वर्ण से मेल खाता है"
  },
  ja: {
    anchor_start: "行または文字列の先頭 (^)",
    anchor_end: "行または文字列の末尾 ($)",
    word_boundary: "単語の境界 (\\b)",
    non_word_boundary: "単語以外の境界 (\\B)",
    digit: "数字キャラクタ (0-9)",
    non_digit: "数字以外の文字",
    word_char: "単語構成文字 (英数字 + アンダーバー)",
    non_word_char: "単語構成文字以外の文字",
    whitespace: "空白文字 (スペース、タブ、改行)",
    non_whitespace: "空白以外の文字",
    any_char: "改行を除く任意の1文字 (.)",
    escaped: "エスケープ文字 '{char}' (文字通りに処理)",
    literal: "文字通り '{char}'",
    quantifier_star: "0回以上の繰り返しに一致 (最長一致)",
    quantifier_plus: "1回以上の繰り返しに一致 (最長一致)",
    quantifier_question: "0回または1回一致 (最長一致)",
    quantifier_exact: "ちょうど {count} 回一致",
    quantifier_min: "{min} 回以上一致",
    quantifier_range: "{min} 回から {max} 回の間で一致",
    lazy: "最短一致 (一致する回数を最小限にする)",
    group_capturing: "キャプチャグループの開始",
    group_non_capturing: "非キャプチャグループの開始",
    group_pos_lookahead: "肯定先読み (Positive Lookahead) の開始",
    group_neg_lookahead: "否定先読み (Negative Lookahead) の開始",
    group_pos_lookbehind: "肯定戻り読み (Positive Lookbehind) の開始",
    group_neg_lookbehind: "否定戻り読み (Negative Lookbehind) の开始",
    group_end: "グループの終了",
    alternation: "選択 / OR 演算子",
    set_match: "文字クラス '{chars}' に一致",
    set_match_negated: "否定文字クラス '{chars}' 以外の任意の文字に一致"
  },
  zh: {
    anchor_start: "行或字符串的开始位置 (^)",
    anchor_end: "行或字符串的结束位置 ($)",
    word_boundary: "单词边界 (\\b)",
    non_word_boundary: "非单词边界 (\\B)",
    digit: "数字字符 (0-9)",
    non_digit: "除数字之外的任意字符",
    word_char: "单词字符 (英数字 + 下划线)",
    non_word_char: "非单词字符",
    whitespace: "空白字符 (空格、制表符、换行符)",
    non_whitespace: "非空白字符",
    any_char: "除换行符外的任意单个字符 (.)",
    escaped: "转义字符 '{char}' (按字面量对待)",
    literal: "字面字符 '{char}'",
    quantifier_star: "匹配 0 次或多次 (贪婪模式)",
    quantifier_plus: "匹配 1 次或多次 (贪婪模式)",
    quantifier_question: "匹配 0 次或 1 次 (贪婪模式)",
    quantifier_exact: "精确 group 匹配 {count} 次",
    quantifier_min: "匹配至少 {min} 次",
    quantifier_range: "匹配 {min} 到 {max} 次之间",
    lazy: "非贪婪模式 (尽可能少地匹配)",
    group_capturing: "捕获分组开始",
    group_non_capturing: "非捕获分组开始",
    group_pos_lookahead: "正向先行断言 positive lookahead 开始",
    group_neg_lookahead: "负向先行断言 negative lookahead 开始",
    group_pos_lookbehind: "正向后行断言 positive lookbehind 开始",
    group_neg_lookbehind: "负向后行断言 negative lookbehind 开始",
    group_end: "分组结束",
    alternation: "分支/逻辑或 OR 运算符",
    set_match: "匹配字符集合中的任意字符 '{chars}'",
    set_match_negated: "排除字符集合，匹配除 '{chars}' 之外的任意字符"
  }
};

function translate(lang: string, key: string, params: Record<string, string | number> = {}): string {
  const dictionary = TOKEN_TRANSLATIONS[lang] || TOKEN_TRANSLATIONS.en;
  let text = dictionary[key] || TOKEN_TRANSLATIONS.en[key] || key;
  for (const [pk, pv] of Object.entries(params)) {
    text = text.replace(`{${pk}}`, String(pv));
  }
  return text;
}

export function parseRegex(pattern: string, lang: string = 'en'): ParsedToken[] {
  const tokens: ParsedToken[] = [];
  let depth = 0;
  let i = 0;

  while (i < pattern.length) {
    const char = pattern[i];

    // Alternation
    if (char === '|') {
      tokens.push({
        text: '|',
        type: 'alternation',
        depth,
        description: translate(lang, 'alternation')
      });
      i++;
      continue;
    }

    // Anchors
    if (char === '^') {
      tokens.push({
        text: '^',
        type: 'anchor',
        depth,
        description: translate(lang, 'anchor_start')
      });
      i++;
      continue;
    }
    if (char === '$') {
      tokens.push({
        text: '$',
        type: 'anchor',
        depth,
        description: translate(lang, 'anchor_end')
      });
      i++;
      continue;
    }

    // Escaped character sequence or standard character classes
    if (char === '\\') {
      if (i + 1 < pattern.length) {
        const nextChar = pattern[i + 1];
        const tokenText = '\\' + nextChar;
        let type: ParsedToken['type'] = 'character_class';
        let descKey = '';

        switch (nextChar) {
          case 'd': descKey = 'digit'; break;
          case 'D': descKey = 'non_digit'; break;
          case 'w': descKey = 'word_char'; break;
          case 'W': descKey = 'non_word_char'; break;
          case 's': descKey = 'whitespace'; break;
          case 'S': descKey = 'non_whitespace'; break;
          case 'b': 
            descKey = 'word_boundary'; 
            type = 'anchor';
            break;
          case 'B': 
            descKey = 'non_word_boundary'; 
            type = 'anchor';
            break;
          default:
            descKey = 'escaped';
            type = 'escaped_literal';
            break;
        }

        tokens.push({
          text: tokenText,
          type,
          depth,
          description: descKey === 'escaped' ? translate(lang, 'escaped', { char: nextChar }) : translate(lang, descKey)
        });
        i += 2;
        continue;
      } else {
        tokens.push({
          text: '\\',
          type: 'literal',
          depth,
          description: translate(lang, 'literal', { char: '\\' })
        });
        i++;
        continue;
      }
    }

    // Any character class '.'
    if (char === '.') {
      tokens.push({
        text: '.',
        type: 'character_class',
        depth,
        description: translate(lang, 'any_char')
      });
      i++;
      continue;
    }

    // Groups (starts)
    if (char === '(') {
      let type: ParsedToken['type'] = 'group_start';
      let textToken = '(';
      let descKey = 'group_capturing';
      
      if (pattern.startsWith('(?:', i)) {
        textToken = '(?:';
        descKey = 'group_non_capturing';
        i += 3;
      } else if (pattern.startsWith('(?=', i)) {
        textToken = '(?=';
        descKey = 'group_pos_lookahead';
        i += 3;
      } else if (pattern.startsWith('(?!', i)) {
        textToken = '(?!';
        descKey = 'group_neg_lookahead';
        i += 3;
      } else if (pattern.startsWith('(?<=', i)) {
        textToken = '(?<=';
        descKey = 'group_pos_lookbehind';
        i += 4;
      } else if (pattern.startsWith('(?<!', i)) {
        textToken = '(?<!';
        descKey = 'group_neg_lookbehind';
        i += 4;
      } else {
        i++;
      }

      tokens.push({
        text: textToken,
        type,
        depth,
        description: translate(lang, descKey)
      });
      depth++;
      continue;
    }

    // Group ends
    if (char === ')') {
      if (depth > 0) depth--;
      tokens.push({
        text: ')',
        type: 'group_end',
        depth,
        description: translate(lang, 'group_end')
      });
      i++;
      continue;
    }

    // Character Sets
    if (char === '[') {
      let setContent = '';
      let isNegated = false;
      let startIdx = i;
      i++; // skip '['
      if (i < pattern.length && pattern[i] === '^') {
        isNegated = true;
        i++;
      }
      
      while (i < pattern.length && pattern[i] !== ']') {
        if (pattern[i] === '\\' && i + 1 < pattern.length) {
          setContent += '\\' + pattern[i + 1];
          i += 2;
        } else {
          setContent += pattern[i];
          i++;
        }
      }
      
      if (i < pattern.length && pattern[i] === ']') {
        i++; // skip ']'
      }
      
      const fullText = pattern.slice(startIdx, i);
      tokens.push({
        text: fullText,
        type: 'character_set',
        depth,
        description: isNegated 
          ? translate(lang, 'set_match_negated', { chars: setContent }) 
          : translate(lang, 'set_match', { chars: setContent })
      });
      continue;
    }

    // Quantifiers
    if (char === '*' || char === '+' || char === '?') {
      const isLazy = i + 1 < pattern.length && pattern[i + 1] === '?';
      const quantifierText = char + (isLazy ? '?' : '');
      let descKey = '';
      if (char === '*') descKey = 'quantifier_star';
      else if (char === '+') descKey = 'quantifier_plus';
      else descKey = 'quantifier_question';

      let description = translate(lang, descKey);
      if (isLazy) {
        description += ' - ' + translate(lang, 'lazy');
      }

      tokens.push({
        text: quantifierText,
        type: 'quantifier',
        depth,
        description
      });
      i += isLazy ? 2 : 1;
      continue;
    }

    // Quantifier range e.g. {2,4}
    if (char === '{') {
      const closingIdx = pattern.indexOf('}', i);
      if (closingIdx !== -1) {
        const rangeText = pattern.slice(i + 1, closingIdx);
        // Validate it's a range sequence like 2, 2, or 2,4
        if (/^\d+(,\d*)?$/.test(rangeText)) {
          const parts = rangeText.split(',');
          let description = '';
          if (parts.length === 1) {
            description = translate(lang, 'quantifier_exact', { count: parts[0] });
          } else if (parts[1] === '') {
            description = translate(lang, 'quantifier_min', { min: parts[0] });
          } else {
            description = translate(lang, 'quantifier_range', { min: parts[0], max: parts[1] });
          }
          
          const isLazy = closingIdx + 1 < pattern.length && pattern[closingIdx + 1] === '?';
          const fullText = pattern.slice(i, closingIdx + 1) + (isLazy ? '?' : '');
          if (isLazy) {
            description += ' - ' + translate(lang, 'lazy');
          }

          tokens.push({
            text: fullText,
            type: 'quantifier',
            depth,
            description
          });
          i = closingIdx + (isLazy ? 2 : 1);
          continue;
        }
      }
    }

    // Literal characters
    tokens.push({
      text: char,
      type: 'literal',
      depth,
      description: translate(lang, 'literal', { char })
    });
    i++;
  }

  return tokens;
}
