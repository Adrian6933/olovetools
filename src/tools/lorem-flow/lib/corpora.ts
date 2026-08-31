import type { Script, ScriptMeta } from '../types';

// ============================================================================
// Word pools
// ----------------------------------------------------------------------------
// Ordinary, harmless words in each script — never machine gibberish, because
// the point is to see how real glyphs, word lengths and line breaks behave.
// Every pool is deduplicated: the old Latin list repeated two dozen entries,
// which quietly made those words twice as likely as the rest.
// ============================================================================

const LATIN = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'eiusmod', 'tempor', 'incididunt', 'labore', 'dolore', 'magna', 'aliqua',
  'enim', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris',
  'nisi', 'aliquip', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'reprehenderit',
  'voluptate', 'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur',
  'sint', 'occaecat', 'cupidatat', 'proident', 'sunt', 'culpa', 'officia', 'deserunt',
  'mollit', 'anim', 'laborum', 'diam', 'voluptas', 'vero', 'eos', 'accusamus',
  'iusto', 'odio', 'dignissimos', 'ducimus', 'blanditiis', 'praesentium', 'voluptatum',
  'deleniti', 'atque', 'corrupti', 'quos', 'dolores', 'molestias', 'excepturi',
  'cupiditate', 'provident', 'similique', 'mollitia', 'animi', 'dolorum', 'fuga',
  'harum', 'quidem', 'rerum', 'facilis', 'expedita', 'distinctio', 'nam', 'libero',
  'tempore', 'soluta', 'nobis', 'eligendi', 'optio', 'cumque', 'nihil', 'impedit',
  'quo', 'minus', 'maxime', 'placeat', 'facere', 'possimus', 'omnis', 'assumenda',
  'repellendus', 'temporibus', 'autem', 'quibusdam', 'debitis', 'necessitatibus',
  'saepe', 'eveniet', 'voluptates', 'repudiandae', 'recusandae', 'itaque', 'earum',
  'tenetur', 'sapiente', 'delectus', 'reiciendis', 'voluptatibus', 'maiores', 'alias',
  'consequatur', 'perferendis', 'doloribus', 'asperiores', 'repellat', 'veritatis',
  'architecto', 'beatae', 'vitae', 'dicta', 'explicabo', 'nemo', 'ipsam', 'quia',
  'modi', 'tempora', 'incidunt', 'magnam', 'quaerat', 'voluptatem', 'adipisci',
  'numquam', 'eius', 'sequi', 'quas', 'totam', 'rem', 'aperiam', 'corporis',
  'commodi', 'accusantium', 'doloremque', 'laudantium', 'ipsa', 'quae', 'ab',
  'illo', 'inventore', 'quasi', 'natus', 'ratione', 'perspiciatis', 'unde', 'iste',
  'error',
];

const SPANISH = [
  'tiempo', 'palabra', 'trabajo', 'ciudad', 'camino', 'ventana', 'mañana', 'silencio',
  'memoria', 'sombra', 'pequeño', 'grande', 'nuevo', 'viejo', 'claro', 'oscuro',
  'agua', 'tierra', 'cielo', 'árbol', 'montaña', 'río', 'campo', 'jardín',
  'puerta', 'mesa', 'libro', 'papel', 'carta', 'historia', 'idea', 'pregunta',
  'respuesta', 'manera', 'forma', 'color', 'sonido', 'música', 'voz', 'nombre',
  'amigo', 'gente', 'familia', 'niño', 'mujer', 'hombre', 'noche', 'verano',
  'invierno', 'lluvia', 'viento', 'fuego', 'piedra', 'metal', 'cristal', 'madera',
  'siempre', 'nunca', 'quizá', 'entonces', 'aunque', 'mientras', 'después', 'antes',
  'cerca', 'lejos', 'dentro', 'fuera', 'encima', 'debajo', 'primero', 'último',
];

// Everyday Japanese words, a mix of kana and kanji so line breaking and font
// fallback both get exercised.
const JAPANESE = [
  '時間', '言葉', '仕事', '都市', '道', '窓', '朝', '静けさ',
  '記憶', '影', '小さい', '大きい', '新しい', '古い', '明るい', '暗い',
  '水', '土', '空', '木', '山', '川', '野原', '庭',
  '扉', '机', '本', '紙', '手紙', '物語', '考え', '質問',
  'こたえ', 'やりかた', 'かたち', '色', '音', '音楽', '声', '名前',
  '友だち', '人々', '家族', '子ども', '女性', '男性', '夜', '夏',
  '冬', '雨', '風', '火', '石', '金属', 'ガラス', '木材',
  'いつも', 'けっして', 'たぶん', 'それから', 'けれど', 'あいだ', 'あとで', 'まえに',
];

const CHINESE = [
  '时间', '词语', '工作', '城市', '道路', '窗户', '早晨', '安静',
  '记忆', '影子', '小', '大', '新', '旧', '明亮', '黑暗',
  '水', '土地', '天空', '树', '山', '河', '田野', '花园',
  '门', '桌子', '书', '纸', '信', '故事', '想法', '问题',
  '回答', '方式', '形状', '颜色', '声音', '音乐', '嗓音', '名字',
  '朋友', '人们', '家庭', '孩子', '女人', '男人', '夜晚', '夏天',
  '冬天', '雨', '风', '火', '石头', '金属', '玻璃', '木头',
  '总是', '从不', '也许', '然后', '虽然', '当', '之后', '之前',
];

const RUSSIAN = [
  'время', 'слово', 'работа', 'город', 'дорога', 'окно', 'утро', 'тишина',
  'память', 'тень', 'маленький', 'большой', 'новый', 'старый', 'светлый', 'тёмный',
  'вода', 'земля', 'небо', 'дерево', 'гора', 'река', 'поле', 'сад',
  'дверь', 'стол', 'книга', 'бумага', 'письмо', 'история', 'мысль', 'вопрос',
  'ответ', 'способ', 'форма', 'цвет', 'звук', 'музыка', 'голос', 'имя',
  'друг', 'люди', 'семья', 'ребёнок', 'женщина', 'мужчина', 'ночь', 'лето',
  'зима', 'дождь', 'ветер', 'огонь', 'камень', 'металл', 'стекло', 'древесина',
  'всегда', 'никогда', 'возможно', 'затем', 'хотя', 'пока', 'после', 'перед',
];

const HINDI = [
  'समय', 'शब्द', 'काम', 'शहर', 'रास्ता', 'खिड़की', 'सुबह', 'शांति',
  'याद', 'छाया', 'छोटा', 'बड़ा', 'नया', 'पुराना', 'उजाला', 'अंधेरा',
  'पानी', 'धरती', 'आकाश', 'पेड़', 'पहाड़', 'नदी', 'खेत', 'बगीचा',
  'दरवाज़ा', 'मेज़', 'किताब', 'काग़ज़', 'चिट्ठी', 'कहानी', 'विचार', 'सवाल',
  'जवाब', 'तरीक़ा', 'आकार', 'रंग', 'आवाज़', 'संगीत', 'स्वर', 'नाम',
  'दोस्त', 'लोग', 'परिवार', 'बच्चा', 'औरत', 'आदमी', 'रात', 'गर्मी',
  'सर्दी', 'बारिश', 'हवा', 'आग', 'पत्थर', 'धातु', 'काँच', 'लकड़ी',
  'हमेशा', 'कभी', 'शायद', 'फिर', 'हालाँकि', 'जबकि', 'बाद', 'पहले',
];

const GREEK = [
  'χρόνος', 'λέξη', 'εργασία', 'πόλη', 'δρόμος', 'παράθυρο', 'πρωί', 'σιωπή',
  'μνήμη', 'σκιά', 'μικρός', 'μεγάλος', 'νέος', 'παλιός', 'φωτεινός', 'σκοτεινός',
  'νερό', 'γη', 'ουρανός', 'δέντρο', 'βουνό', 'ποτάμι', 'χωράφι', 'κήπος',
  'πόρτα', 'τραπέζι', 'βιβλίο', 'χαρτί', 'γράμμα', 'ιστορία', 'ιδέα', 'ερώτηση',
  'απάντηση', 'τρόπος', 'μορφή', 'χρώμα', 'ήχος', 'μουσική', 'φωνή', 'όνομα',
  'φίλος', 'άνθρωποι', 'οικογένεια', 'παιδί', 'γυναίκα', 'άνδρας', 'νύχτα', 'καλοκαίρι',
  'χειμώνας', 'βροχή', 'άνεμος', 'φωτιά', 'πέτρα', 'μέταλλο', 'γυαλί', 'ξύλο',
  'πάντα', 'ποτέ', 'ίσως', 'έπειτα', 'αν και', 'ενώ', 'μετά', 'πριν',
];

const ARABIC = [
  'وقت', 'كلمة', 'عمل', 'مدينة', 'طريق', 'نافذة', 'صباح', 'صمت',
  'ذاكرة', 'ظل', 'صغير', 'كبير', 'جديد', 'قديم', 'مضيء', 'مظلم',
  'ماء', 'أرض', 'سماء', 'شجرة', 'جبل', 'نهر', 'حقل', 'حديقة',
  'باب', 'طاولة', 'كتاب', 'ورق', 'رسالة', 'قصة', 'فكرة', 'سؤال',
  'جواب', 'طريقة', 'شكل', 'لون', 'صوت', 'موسيقى', 'نبرة', 'اسم',
  'صديق', 'ناس', 'عائلة', 'طفل', 'امرأة', 'رجل', 'ليل', 'صيف',
  'شتاء', 'مطر', 'ريح', 'نار', 'حجر', 'معدن', 'زجاج', 'خشب',
  'دائما', 'أبدا', 'ربما', 'ثم', 'رغم', 'بينما', 'بعد', 'قبل',
];

export const POOLS: Record<string, string[]> = {
  latin: LATIN,
  spanish: SPANISH,
  japanese: JAPANESE,
  chinese: CHINESE,
  russian: RUSSIAN,
  hindi: HINDI,
  greek: GREEK,
  arabic: ARABIC,
};

export const SCRIPT_META: Record<string, ScriptMeta> = {
  latin: { id: 'latin', label: 'Lorem ipsum', rtl: false, spaced: true, sentenceEnd: '.', comma: ',' },
  spanish: { id: 'spanish', label: 'Español', rtl: false, spaced: true, sentenceEnd: '.', comma: ',' },
  // CJK uses full-width punctuation and no spaces between words, which is
  // exactly the behaviour a layout needs to be tested against.
  japanese: { id: 'japanese', label: '日本語', rtl: false, spaced: false, sentenceEnd: '。', comma: '、' },
  chinese: { id: 'chinese', label: '中文', rtl: false, spaced: false, sentenceEnd: '。', comma: '，' },
  russian: { id: 'russian', label: 'Русский', rtl: false, spaced: true, sentenceEnd: '.', comma: ',' },
  hindi: { id: 'hindi', label: 'हिन्दी', rtl: false, spaced: true, sentenceEnd: '।', comma: ',' },
  greek: { id: 'greek', label: 'Ελληνικά', rtl: false, spaced: true, sentenceEnd: '.', comma: ',' },
  arabic: { id: 'arabic', label: 'العربية', rtl: true, spaced: true, sentenceEnd: '.', comma: '،' },
};

export const CLASSIC_OPENING =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

export const poolFor = (script: Script): string[] => POOLS[script] || LATIN;
export const metaFor = (script: Script): ScriptMeta => SCRIPT_META[script] || SCRIPT_META.latin;
