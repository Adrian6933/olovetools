// ============================================================================
// Language data for the analyser.
// ----------------------------------------------------------------------------
// The previous build kept one giant multilingual array per feeling and matched
// it with `token.includes(seed)`. Two things were broken beyond repair there:
//
//  1. Seeds were stored accented ("glücklich", "alegría") but tokens were
//     cleaned with `[^\w]` first, which deletes accents outright — so every
//     non-English seed was dead weight that could never match, and every
//     multi-word seed ("sin embargo") could never match either, because the
//     text was split on whitespace before the lookup.
//  2. Substring matching turned "window" into a win, "server" and "never" into
//     creative writing, and "several" into confidence.
//
// So: everything is stored folded (accents stripped, lowercased) and matched on
// whole tokens, phrases are matched against the folded text, and each language
// carries its own stop-word list instead of pooling all nine into one bag —
// pooling meant Spanish text lost the English stop words too and vice versa.
// ============================================================================

export type LangId = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'ru' | 'hi' | 'ja' | 'zh' | 'other';

export type ToneKey = 'formal' | 'casual' | 'academic' | 'confident' | 'creative';

export const TONE_KEYS: ToneKey[] = ['formal', 'casual', 'academic', 'confident', 'creative'];

/**
 * Only the combining marks used by Latin and Cyrillic (U+0300–U+036F).
 * `\p{Diacritic}` would also eat Devanagari nukta and Japanese dakuten, which
 * changes the word instead of normalising it (が would fold to か). Built from
 * code points so the source file never carries a bare combining character.
 */
const COMBINING_MARKS = new RegExp(
  `[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`,
  'g'
);

export function fold(value: string): string {
  return value.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase();
}

const list = (source: string): string[] => source.split(/\s+/u).filter(Boolean).map(fold);

const set = (source: string): Set<string> => new Set(list(source));

const weigh = (source: string, weight: number): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const word of list(source)) out[word] = weight;
  return out;
};

export interface LangPack {
  /** Words that carry no topical meaning — excluded from keyword density. */
  stopwords: Set<string>;
  /** Folded token → polarity, −2 (awful) to +2 (superb). */
  polarity: Record<string, number>;
  /** Multi-word expressions, matched against the folded text. */
  phrases: [string, number][];
  /** Flip the polarity of whatever comes next ("not great"). */
  negators: Set<string>;
  /** Multiply the polarity of whatever comes next ("really great"). */
  intensifiers: Record<string, number>;
  /** Vocabulary markers per tone. */
  tone: Record<ToneKey, string[]>;
  /** Hedges and padding that weaken a sentence. */
  fillers: string[];
  /** Long words with a shorter everyday equivalent. */
  simpler: Record<string, string>;
  /** Adverb ending, for the "too many adverbs" check. */
  adverb: RegExp | null;
  /** Words that end like an adverb but are not one ("family", "supply"). */
  adverbExceptions?: Set<string>;
  /** Passive-voice shape, run per sentence. */
  passive: RegExp | null;
  /** Words that make a sentence about the reader — used by the tone profile. */
  secondPerson: string[];
  firstPerson: string[];
}

// ---------------------------------------------------------------------------
// English
// ---------------------------------------------------------------------------
const EN: LangPack = {
  stopwords: set(`
    the a an and or but if then than so as at by for from in into of off on onto out over to up with without
    is are was were be been being am do does did done have has had having will would shall should can could may
    might must not no nor this that these those it its he she they them him her his hers their there here
    i you we us me my your our who whom whose which what when where why how all any both each few more most
    other some such only own same too very just about after again against because before below between during
    further once until while above down under
  `),
  polarity: {
    ...weigh('excellent outstanding superb brilliant wonderful amazing fantastic perfect love adore delighted thrilled best breakthrough flawless', 2),
    ...weigh('good great nice happy glad pleased positive success succeed win winning gain improve improved better benefit clear simple easy helpful useful strong solid safe fast quick smooth clean fresh bright hope proud enjoy like recommend valuable reliable', 1),
    ...weigh('bad poor sad unhappy negative fail failing problem issue difficult hard slow weak wrong error mistake risk worry doubt confusing unclear boring annoying broken lose loss late messy expensive concern', -1),
    ...weigh('terrible awful horrible disaster hate disgusting worst useless catastrophic hopeless furious devastating unacceptable appalling', -2),
  },
  phrases: [
    ['as good as it gets', 2], ['a waste of time', -2], ['out of the box', 1], ['state of the art', 2],
    ['fell short', -1], ['on the fence', -0.5], ['blown away', 2], ['let down', -1.5],
  ],
  negators: set(`not no never none nothing neither nor cannot cant dont doesnt didnt isnt arent wasnt werent wont hardly barely rarely without`),
  intensifiers: { very: 1.5, really: 1.4, extremely: 1.8, incredibly: 1.7, absolutely: 1.6, totally: 1.4, deeply: 1.4, slightly: 0.6, somewhat: 0.6, fairly: 0.8, quite: 1.2 },
  tone: {
    formal: list(`however therefore furthermore consequently moreover nevertheless accordingly hereby herein pursuant regarding respectfully sincerely kindly request submit shall pertaining thereof whereas notwithstanding subsequently`),
    casual: list(`hey yeah yep nope cool stuff vibe anyway wow guy guys kinda gonna wanna totally super awesome literally lol haha okay ok bunch tons pretty basically honestly folks`),
    academic: list(`analysis analyse analyze data research results methodology hypothesis conclude evidence context theory examine experiment significant variable sample correlation empirical framework literature findings observed measured`),
    confident: list(`will must definitely certainly clearly absolutely essential crucial guarantee ensure proven decisive committed deliver own lead drive achieve always never every without doubt`),
    creative: list(`imagine feel dream vivid shimmer whisper canvas paint story magic wild breath poetic echo dance colour color glow shadow bloom drift spark texture rhythm`),
  },
  fillers: list(`very really quite just actually basically simply literally definitely totally absolutely honestly perhaps maybe somewhat rather kind sort somehow probably essentially virtually generally`),
  simpler: {
    utilize: 'use', utilise: 'use', commence: 'start', terminate: 'end', endeavour: 'try', endeavor: 'try',
    facilitate: 'help', ascertain: 'find out', demonstrate: 'show', purchase: 'buy', additional: 'more',
    numerous: 'many', sufficient: 'enough', approximately: 'about', subsequently: 'later', prior: 'before',
    regarding: 'about', obtain: 'get', require: 'need', assist: 'help', component: 'part', initiate: 'start',
    modification: 'change', implement: 'do', currently: 'now', however: 'but', therefore: 'so',
  },
  adverb: /ly$/u,
  // "-ly" is a suffix, not a part of speech: these are nouns, verbs and
  // adjectives that would otherwise be flagged on every page.
  adverbExceptions: set(`family families supply supplies reply replies apply applies
    likely unlikely lovely lonely friendly deadly costly silly jelly belly rally
    ally allies bully bullies melancholy anomaly assembly italy july holy wholly
    ugly early only really
    quarterly monthly weekly yearly daily hourly nightly elderly orderly disorderly
    timely untimely lively homely worldly scholarly motherly fatherly brotherly
    sisterly leisurely burly curly surly stately ghastly`),
  passive: /\b(?:is|are|was|were|be|been|being|get|got)\s+(?:\w+\s+){0,2}?\w+(?:ed|en)\b(?=\s+by\b|\s|[.,;:!?)]|$)/giu,
  secondPerson: list(`you your yours yourself yourselves`),
  firstPerson: list(`i me my mine we us our ours`),
};

// ---------------------------------------------------------------------------
// Spanish
// ---------------------------------------------------------------------------
const ES: LangPack = {
  stopwords: set(`
    el la los las un una unos unas y e o u pero si no ni que de del a al en con por para sin sobre entre hasta
    desde como cuando donde porque aunque mientras es son era eran ser sido estar esta estan este esa eso esos
    esas aquel aquella yo tu el ella nosotros vosotros ellos ellas me te se nos os lo le les mi su sus nuestro
    vuestro hay ha han he has habia habian muy mas menos ya tambien tampoco todo toda todos todas otro otra
    cada uno dos algo alguien nada nadie asi
  `),
  polarity: {
    ...weigh('excelente extraordinario magnifico brillante maravilloso increible perfecto encanta adoro fantastico optimo insuperable impecable', 2),
    ...weigh('bueno bien genial feliz contento alegre positivo exito lograr ganar mejora mejor beneficio claro simple facil util fuerte solido seguro rapido limpio fresco esperanza orgulloso disfrutar recomendar valioso fiable', 1),
    ...weigh('malo pobre triste negativo fallo fallar problema dificil lento debil error equivocado riesgo preocupa duda confuso aburrido roto perder perdida tarde caro molesto', -1),
    ...weigh('terrible horrible pesimo desastre odio asqueroso peor inutil catastrofico desastroso inaceptable lamentable', -2),
  },
  phrases: [
    ['sin duda', 1], ['una perdida de tiempo', -2], ['a la altura', 1], ['de primera', 1.5],
    ['no obstante', 0], ['deja mucho que desear', -1.5], ['vale la pena', 1.5],
  ],
  negators: set(`no ni nunca jamas nada nadie ningun ninguno ninguna tampoco sin apenas`),
  intensifiers: { muy: 1.5, realmente: 1.4, extremadamente: 1.8, increiblemente: 1.7, absolutamente: 1.6, totalmente: 1.4, bastante: 1.2, algo: 0.6, poco: 0.5, sumamente: 1.7 },
  tone: {
    formal: list(`sin embargo por lo tanto ademas consecuentemente asimismo no obstante atentamente cordialmente estimado remitir solicitar conforme respecto presente adjunto quedamos disposicion`),
    casual: list(`hola oye vale guay mola tio tia bueno rollo cosas movida total super flipante literalmente jaja vamos venga bastante rollo`),
    academic: list(`analisis analizar datos investigacion resultados metodologia hipotesis concluir evidencia contexto teoria examinar experimento significativo variable muestra correlacion empirico marco hallazgos observado medido`),
    confident: list(`sera debe definitivamente ciertamente claramente absolutamente esencial crucial garantizar asegurar probado decisivo comprometido lograr liderar impulsar siempre nunca sin duda`),
    creative: list(`imagina siente sueno vivido susurro lienzo pintar historia magia salvaje aliento poetico eco baile color brillo sombra florecer chispa textura ritmo`),
  },
  fillers: list(`muy realmente bastante solo simplemente literalmente basicamente definitivamente totalmente absolutamente sinceramente quizas tal vez algo mas bien practicamente generalmente`),
  simpler: {
    utilizar: 'usar', comenzar: 'empezar', finalizar: 'acabar', posteriormente: 'luego', previamente: 'antes',
    aproximadamente: 'unos', adicional: 'mas', numerosos: 'muchos', suficiente: 'bastante', obtener: 'conseguir',
    requerir: 'necesitar', realizar: 'hacer', efectuar: 'hacer', modificacion: 'cambio', actualmente: 'ahora',
    facilitar: 'ayudar', adquirir: 'comprar', demostrar: 'mostrar', componente: 'parte',
  },
  adverb: /mente$/u,
  passive: /\b(?:es|son|era|eran|fue|fueron|sera|seran|sido|siendo|esta|estan)\s+(?:\w+\s+){0,2}?\w+(?:ado|ada|ados|adas|ido|ida|idos|idas)\b/giu,
  secondPerson: list(`tu ti tuyo tuya usted ustedes vosotros vuestro`),
  firstPerson: list(`yo mi mio nosotros nuestro nuestra`),
};

// ---------------------------------------------------------------------------
// French
// ---------------------------------------------------------------------------
const FR: LangPack = {
  stopwords: set(`
    le la les un une des du de a au aux et ou mais si ne pas ni que qui quoi dont ou en dans sur sous par pour
    sans avec chez vers entre est sont etait etaient etre ete avoir ai as ont avait ce cet cette ces celui celle
    je tu il elle nous vous ils elles me te se lui leur mon ton son notre votre plus moins tres deja aussi tout
    toute tous toutes autre chaque comme quand parce alors donc y
  `),
  polarity: {
    ...weigh('excellent extraordinaire magnifique brillant merveilleux incroyable parfait adore fantastique impeccable superbe', 2),
    ...weigh('bon bien genial heureux content positif succes reussir gagner amelioration meilleur benefice clair simple facile utile fort solide sur rapide propre espoir fier apprecier recommander fiable', 1),
    ...weigh('mauvais pauvre triste negatif echec echouer probleme difficile lent faible erreur risque inquiet doute confus ennuyeux casse perdre perte tard cher agacant', -1),
    ...weigh('terrible horrible affreux desastre deteste degoutant pire inutile catastrophique inacceptable', -2),
  },
  phrases: [['sans doute', 1], ['une perte de temps', -2], ['a la hauteur', 1], ['laisse a desirer', -1.5]],
  negators: set(`ne pas plus jamais rien aucun aucune personne sans guere`),
  intensifiers: { tres: 1.5, vraiment: 1.4, extremement: 1.8, incroyablement: 1.7, absolument: 1.6, totalement: 1.4, assez: 1.2, peu: 0.5 },
  tone: {
    formal: list(`cependant par consequent en outre neanmoins ainsi veuillez agreer cordialement sincerement concernant conformement soumettre demande present ci joint`),
    casual: list(`salut ouais truc mec machin bref carrement grave trop stylé cool super genre du coup franchement mdr`),
    academic: list(`analyse analyser donnees recherche resultats methodologie hypothese conclure preuve contexte theorie examiner experience significatif variable echantillon correlation empirique cadre`),
    confident: list(`sera doit absolument certainement clairement essentiel crucial garantir assurer prouve decisif engage livrer diriger toujours jamais sans doute`),
    creative: list(`imagine ressens reve vif murmure toile peindre histoire magie sauvage souffle poetique echo danse couleur lueur ombre eclore etincelle texture rythme`),
  },
  fillers: list(`tres vraiment assez juste simplement litteralement basiquement definitivement totalement absolument franchement peut etre plutot pratiquement generalement`),
  simpler: {
    utiliser: 'servir', commencer: 'debuter', ulterieurement: 'plus tard', approximativement: 'environ',
    supplementaire: 'de plus', nombreux: 'beaucoup', suffisant: 'assez', obtenir: 'avoir', necessiter: 'falloir',
    effectuer: 'faire', modification: 'changement', actuellement: 'maintenant', faciliter: 'aider',
  },
  adverb: /ment$/u,
  passive: /\b(?:est|sont|etait|etaient|fut|furent|sera|seront|ete)\s+(?:\w+\s+){0,2}?\w+(?:e|es|ee|ees)\b\s+par\b/giu,
  secondPerson: list(`tu toi vous votre vos ton ta tes`),
  firstPerson: list(`je moi mon ma mes nous notre nos`),
};

// ---------------------------------------------------------------------------
// German
// ---------------------------------------------------------------------------
const DE: LangPack = {
  stopwords: set(`
    der die das ein eine einen einem einer eines und oder aber wenn dann als so wie bei von zu zum zur in im
    an am auf aus fur mit ohne uber unter nach vor durch gegen um ist sind war waren sein gewesen haben hat
    hatte werden wird wurde nicht kein keine ich du er sie es wir ihr sich mein dein sein ihr unser euer
    dieser diese dieses jener man auch nur schon noch sehr mehr alle jeder andere dass denn doch
  `),
  polarity: {
    ...weigh('ausgezeichnet hervorragend grossartig brillant wunderbar unglaublich perfekt liebe fantastisch makellos herausragend', 2),
    ...weigh('gut schoen gluecklich zufrieden positiv erfolg gewinnen verbesserung besser vorteil klar einfach nuetzlich stark solide sicher schnell sauber hoffnung stolz geniessen empfehlen zuverlaessig', 1),
    ...weigh('schlecht arm traurig negativ fehler scheitern problem schwierig langsam schwach falsch risiko sorge zweifel verwirrend langweilig kaputt verlieren verlust spaet teuer aergerlich', -1),
    ...weigh('schrecklich furchtbar entsetzlich katastrophe hasse ekelhaft schlimmste nutzlos inakzeptabel katastrophal', -2),
  },
  phrases: [['ohne zweifel', 1], ['zeitverschwendung', -2], ['auf den punkt', 1], ['laesst zu wuenschen uebrig', -1.5]],
  negators: set(`nicht nie niemals kein keine keiner nichts niemand ohne kaum`),
  intensifiers: { sehr: 1.5, wirklich: 1.4, extrem: 1.8, unglaublich: 1.7, absolut: 1.6, voellig: 1.4, ziemlich: 1.2, etwas: 0.6 },
  tone: {
    formal: list(`jedoch daher somit ausserdem dennoch folglich hiermit bezueglich gemaess beiliegend sehr geehrte mit freundlichen gruessen beantragen einreichen`),
    casual: list(`hey ja klar cool zeug kumpel halt eben irgendwie total super krass echt voll naja quatsch`),
    academic: list(`analyse analysieren daten forschung ergebnisse methodik hypothese schlussfolgern nachweis kontext theorie untersuchen experiment signifikant variable stichprobe korrelation empirisch rahmen`),
    confident: list(`wird muss definitiv sicher eindeutig absolut wesentlich entscheidend garantieren sicherstellen bewiesen verpflichtet liefern fuehren immer nie zweifellos`),
    creative: list(`stell dir vor fuehle traum lebendig fluestern leinwand malen geschichte magie wild atem poetisch echo tanz farbe leuchten schatten bluehen funke textur rhythmus`),
  },
  fillers: list(`sehr wirklich ziemlich nur einfach buchstaeblich grundsaetzlich definitiv voellig absolut ehrlich vielleicht eher praktisch generell irgendwie`),
  simpler: {
    verwenden: 'nutzen', durchfuehren: 'machen', beginnen: 'starten', anschliessend: 'danach',
    ungefaehr: 'etwa', zusaetzlich: 'mehr', zahlreiche: 'viele', ausreichend: 'genug', erhalten: 'bekommen',
    benoetigen: 'brauchen', modifikation: 'aenderung', gegenwaertig: 'jetzt', ermoeglichen: 'erlauben',
  },
  adverb: /(?:lich|weise)$/u,
  passive: /\b(?:wird|werden|wurde|wurden|worden)\s+(?:\w+\s+){0,2}?ge\w+\b/giu,
  secondPerson: list(`du dich dir dein deine ihr euch euer sie ihre`),
  firstPerson: list(`ich mich mir mein meine wir uns unser`),
};

// ---------------------------------------------------------------------------
// Portuguese
// ---------------------------------------------------------------------------
const PT: LangPack = {
  stopwords: set(`
    o a os as um uma uns umas e ou mas se nao nem que de do da dos das em no na nos nas por para com sem sobre
    entre ate desde como quando onde porque embora enquanto e sao era eram ser sido estar esta estao este essa
    isso aquele eu tu ele ela nos vos eles elas me te se lhe lhes meu seu nosso ha muito mais menos ja tambem
    todo toda todos todas outro cada dois algo alguem nada ninguem assim
  `),
  polarity: {
    ...weigh('excelente extraordinario magnifico brilhante maravilhoso incrivel perfeito adoro fantastico otimo impecavel', 2),
    ...weigh('bom bem legal feliz contente positivo sucesso conseguir ganhar melhoria melhor beneficio claro simples facil util forte solido seguro rapido limpo esperanca orgulhoso aproveitar recomendar confiavel', 1),
    ...weigh('ruim pobre triste negativo falha falhar problema dificil lento fraco erro errado risco preocupa duvida confuso chato quebrado perder perda tarde caro irritante', -1),
    ...weigh('terrivel horrivel pessimo desastre odeio nojento pior inutil catastrofico inaceitavel lamentavel', -2),
  },
  phrases: [['sem duvida', 1], ['perda de tempo', -2], ['a altura', 1], ['deixa a desejar', -1.5], ['vale a pena', 1.5]],
  negators: set(`nao nem nunca jamais nada ninguem nenhum nenhuma tampouco sem apenas`),
  intensifiers: { muito: 1.5, realmente: 1.4, extremamente: 1.8, incrivelmente: 1.7, absolutamente: 1.6, totalmente: 1.4, bastante: 1.2, pouco: 0.5 },
  tone: {
    formal: list(`contudo portanto alem disso consequentemente entretanto todavia atenciosamente cordialmente prezado encaminhar solicitar conforme referente anexo`),
    casual: list(`oi opa cara mano galera coisa treco tipo total super massa literalmente kkk beleza valeu`),
    academic: list(`analise analisar dados pesquisa resultados metodologia hipotese concluir evidencia contexto teoria examinar experimento significativo variavel amostra correlacao empirico quadro`),
    confident: list(`sera deve definitivamente certamente claramente absolutamente essencial crucial garantir assegurar comprovado decisivo comprometido entregar liderar sempre nunca sem duvida`),
    creative: list(`imagine sinta sonho vivido sussurro tela pintar historia magia selvagem folego poetico eco danca cor brilho sombra florescer faisca textura ritmo`),
  },
  fillers: list(`muito realmente bastante apenas simplesmente literalmente basicamente definitivamente totalmente absolutamente sinceramente talvez meio praticamente geralmente`),
  simpler: {
    utilizar: 'usar', iniciar: 'comecar', finalizar: 'acabar', posteriormente: 'depois', aproximadamente: 'cerca',
    adicional: 'mais', numerosos: 'muitos', suficiente: 'bastante', obter: 'conseguir', necessitar: 'precisar',
    realizar: 'fazer', modificacao: 'mudanca', atualmente: 'agora', facilitar: 'ajudar',
  },
  adverb: /mente$/u,
  passive: /\b(?:e|sao|era|eram|foi|foram|sera|serao|sido|estao)\s+(?:\w+\s+){0,2}?\w+(?:ado|ada|ados|adas|ido|ida|idos|idas)\b/giu,
  secondPerson: list(`tu ti teu tua voce voces seu sua`),
  firstPerson: list(`eu mim meu minha nos nosso nossa`),
};

// ---------------------------------------------------------------------------
// Russian
// ---------------------------------------------------------------------------
const RU: LangPack = {
  stopwords: set(`
    и в во на с со у о об к из от до для за под над перед при а но или да что как это то он она оно они мы вы
    я ты мой твой наш ваш его ее их был была были быть есть нет не ни же бы ли уже еще только очень весь вся
    все всё который когда где потому чтобы если так там тут
  `),
  polarity: {
    ...weigh('отличный превосходный великолепный блестящий замечательный невероятный идеальный обожаю безупречный', 2),
    ...weigh('хороший хорошо любовь успех выиграть улучшение лучше польза ясно просто легко полезно сильный надежный быстрый чистый надежда гордый рекомендую радость', 1),
    ...weigh('плохой бедный грустный негативный ошибка провал проблема трудный медленный слабый неверный риск сомнение путаница скучный сломанный потеря дорого раздражает', -1),
    ...weigh('ужасный кошмарный катастрофа ненавижу отвратительный худший бесполезный неприемлемо', -2),
  },
  phrases: [['без сомнения', 1], ['пустая трата времени', -2], ['оставляет желать лучшего', -1.5]],
  negators: set(`не нет ни никогда никто ничто никакой без едва`),
  intensifiers: { 'очень': 1.5, 'действительно': 1.4, 'крайне': 1.8, 'невероятно': 1.7, 'абсолютно': 1.6, 'полностью': 1.4, 'довольно': 1.2, 'немного': 0.6 },
  tone: {
    formal: list(`однако следовательно кроме того таким образом тем не менее уважаемый настоящим просим направляем согласно относительно приложение искренне`),
    casual: list(`привет ага круто штука чувак типа короче блин супер ваще прикольно ржу давай`),
    academic: list(`анализ данные исследование результаты методология гипотеза вывод доказательство контекст теория эксперимент значимый переменная выборка корреляция эмпирический`),
    confident: list(`будет должен определенно безусловно очевидно абсолютно необходимо решающий гарантировать обеспечить доказано всегда никогда несомненно`),
    creative: list(`представь чувствую мечта яркий шепот холст рисовать история магия дикий дыхание поэтичный эхо танец цвет сияние тень расцвет искра ритм`),
  },
  fillers: list(`очень действительно довольно просто буквально практически определенно полностью абсолютно честно возможно наверное скорее вообще`),
  simpler: { 'осуществлять': 'делать', 'приобрести': 'купить', 'посредством': 'через', 'предоставить': 'дать' },
  adverb: null,
  passive: null,
  secondPerson: list(`ты вы твой ваш тебя вас`),
  firstPerson: list(`я мы мой наш меня нас`),
};

// ---------------------------------------------------------------------------
// Hindi
// ---------------------------------------------------------------------------
const HI: LangPack = {
  stopwords: set(`
    और या लेकिन में पर तक को के का की लिए से द्वारा है हैं था थे थी हो होता होती करना किया गया यह वह ये वे मैं तुम आप हम
    मेरा तेरा उसका उनका जो कि क्या कब कहाँ क्यों कैसे नहीं भी ही तो अब सब कुछ बहुत
  `),
  polarity: {
    ...weigh('उत्कृष्ट शानदार बेहतरीन अद्भुत लाजवाब परिपूर्ण प्यार बेमिसाल', 2),
    ...weigh('अच्छा बढ़िया खुश सफलता जीत सुधार बेहतर लाभ स्पष्ट सरल आसान उपयोगी मजबूत सुरक्षित तेज साफ आशा गर्व सुझाव भरोसेमंद', 1),
    ...weigh('बुरा दुखी नकारात्मक गलती असफल समस्या कठिन धीमा कमजोर गलत जोखिम चिंता संदेह उलझन उबाऊ टूटा नुकसान महंगा', -1),
    ...weigh('भयानक घटिया आपदा नफरत घिनौना बेकार अस्वीकार्य', -2),
  },
  phrases: [['समय की बर्बादी', -2], ['बिना किसी संदेह', 1]],
  negators: set(`नहीं ना कभी कोई कुछ बिना`),
  intensifiers: { 'बहुत': 1.5, 'वाकई': 1.4, 'अत्यंत': 1.8, 'बिल्कुल': 1.6, 'पूरी': 1.4, 'थोड़ा': 0.6 },
  tone: {
    formal: list(`तथापि इसलिए इसके अतिरिक्त फलस्वरूप महोदय सादर निवेदन प्रस्तुत संलग्न तदनुसार`),
    casual: list(`अरे यार भाई मस्त कूल चीजें वगैरह एकदम बढ़िया हाहा चलो`),
    academic: list(`विश्लेषण आंकड़े अनुसंधान परिणाम पद्धति परिकल्पना निष्कर्ष प्रमाण संदर्भ सिद्धांत प्रयोग महत्वपूर्ण चर नमूना सहसंबंध`),
    confident: list(`अवश्य निश्चित स्पष्ट बिल्कुल आवश्यक महत्वपूर्ण गारंटी सुनिश्चित सिद्ध हमेशा कभी नहीं`),
    creative: list(`कल्पना महसूस सपना जीवंत फुसफुसाहट कैनवास चित्र कहानी जादू जंगली सांस काव्यात्मक गूंज नृत्य रंग चमक छाया खिलना चिंगारी लय`),
  },
  fillers: list(`बहुत वाकई काफी सिर्फ बस बिल्कुल पूरी तरह शायद कुछ आमतौर पर`),
  simpler: {},
  adverb: null,
  passive: null,
  secondPerson: list(`तुम आप तेरा तुम्हारा आपका`),
  firstPerson: list(`मैं हम मेरा हमारा`),
};

// ---------------------------------------------------------------------------
// Japanese
// ---------------------------------------------------------------------------
const JA: LangPack = {
  stopwords: set(`
    の に は を た が で て と し れ さ ある いる も する から な こと として い や れる など なっ ない この ため
    その あっ よう また もの という あり まで られ なる へ か だ これ によって により より による ず なり における
  `),
  polarity: {
    ...weigh('素晴らしい 最高 完璧 感動 傑作 見事 愛', 2),
    ...weigh('良い 嬉しい 成功 改善 便利 簡単 安全 速い 綺麗 希望 誇り 楽しい おすすめ 信頼', 1),
    ...weigh('悪い 悲しい 失敗 問題 困難 遅い 弱い 間違い 危険 心配 疑問 混乱 退屈 壊れた 損失 高い', -1),
    ...weigh('最悪 ひどい 災害 嫌い 気持ち悪い 無駄 許容できない', -2),
  },
  phrases: [['時間の無駄', -2], ['間違いなく', 1]],
  negators: set(`ない ません なかった 決して 何も 誰も`),
  intensifiers: { 'とても': 1.5, '本当に': 1.4, '非常に': 1.8, '絶対に': 1.6, '完全に': 1.4, '少し': 0.6 },
  tone: {
    formal: list(`しかしながら したがって さらに ゆえに 拝啓 敬具 お願い申し上げます ご査収 について 記載 提出`),
    casual: list(`ねえ すごい やつ とにかく まじ めっちゃ ちょっと やばい めんどい ははは`),
    academic: list(`分析 データ 研究 結果 方法論 仮説 結論 証拠 文脈 理論 検証 実験 有意 変数 標本 相関`),
    confident: list(`必ず 絶対に 明確に 確実に 不可欠 重要 保証 確保 実証 常に 決して`),
    creative: list(`想像 感じる 夢 鮮やか ささやき キャンバス 描く 物語 魔法 野生 息 詩的 響き 踊り 色 輝き 影 咲く 火花 リズム`),
  },
  fillers: list(`とても 本当に かなり ただ 単に 完全に 絶対に 正直 たぶん おそらく 一般的に`),
  simpler: {},
  adverb: null,
  passive: /(?:れる|られる|された|されました)/gu,
  secondPerson: list(`あなた 君 お前 あなたの`),
  firstPerson: list(`私 僕 俺 我々 私たち`),
};

// ---------------------------------------------------------------------------
// Chinese
// ---------------------------------------------------------------------------
const ZH: LangPack = {
  stopwords: set(`
    的 了 和 是 在 我 你 他 她 它 们 这 那 都 就 也 而 及 与 或 但 不 没 有 一个 上 下 中 为 对 从 到 以 被 把
    很 更 最 会 能 要 说 之 其 于 等 着 过 呢 吗 吧
  `),
  polarity: {
    ...weigh('优秀 卓越 完美 精彩 杰出 惊艳 热爱', 2),
    ...weigh('好 棒 快乐 成功 改进 更好 好处 清晰 简单 容易 有用 强 安全 快 干净 希望 骄傲 推荐 可靠', 1),
    ...weigh('坏 差 悲伤 失败 问题 困难 慢 弱 错误 风险 担心 怀疑 混乱 无聊 损失 昂贵 讨厌', -1),
    ...weigh('糟糕 可怕 灾难 恶心 最差 无用 不可接受', -2),
  },
  phrases: [['浪费时间', -2], ['毫无疑问', 1]],
  negators: set(`不 没 没有 从不 无 别 未`),
  intensifiers: { '很': 1.5, '真的': 1.4, '非常': 1.8, '极其': 1.8, '完全': 1.4, '有点': 0.6 },
  tone: {
    formal: list(`然而 因此 此外 综上所述 敬启者 此致 敬礼 兹 谨 提交 依照 关于 附件`),
    casual: list(`嘿 酷 玩意 反正 超级 特别 哈哈 搞 咋 挺`),
    academic: list(`分析 数据 研究 结果 方法论 假设 结论 证据 语境 理论 检验 实验 显著 变量 样本 相关`),
    confident: list(`必须 一定 明确 绝对 关键 必要 保证 确保 证明 始终 从不 无疑`),
    creative: list(`想象 感受 梦 鲜明 低语 画布 描绘 故事 魔法 野性 呼吸 诗意 回响 舞蹈 色彩 光芒 阴影 绽放 火花 节奏`),
  },
  fillers: list(`很 真的 相当 只是 简单 完全 绝对 老实说 也许 大概 通常`),
  simpler: {},
  adverb: null,
  passive: /被/gu,
  secondPerson: list(`你 您 你们 你的`),
  firstPerson: list(`我 我们 我的`),
};

export const PACKS: Record<Exclude<LangId, 'other'>, LangPack> = {
  en: EN, es: ES, fr: FR, de: DE, pt: PT, ru: RU, hi: HI, ja: JA, zh: ZH,
};

export function packFor(lang: LangId): LangPack {
  return lang === 'other' ? EN : PACKS[lang];
}

/**
 * Stop words from every Latin-script pack merged together. Used only when the
 * detector had nothing to go on (a two-word note), so that "the" and "de" both
 * still drop out of the keyword table.
 */
export const FALLBACK_STOPWORDS: Set<string> = new Set(
  [EN, ES, FR, DE, PT].flatMap(pack => [...pack.stopwords])
);

/** Short, high-frequency words used to vote on the language of Latin text. */
export const DETECTOR_MARKERS: Record<string, string[]> = {
  en: list(`the of and to in is that it for with was you have this are not but they from`),
  es: list(`de la que el en los se del las por con una para es no su lo como mas pero`),
  fr: list(`de la le les des et en un une du est pour que qui dans par pas sur avec ne`),
  de: list(`der die das und ist den von zu mit sich auf fur nicht ein eine dem im als auch`),
  pt: list(`de que os as um uma do da em para com nao por mais como mas ao dos sao`),
};
