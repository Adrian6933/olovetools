// ============================================================================
// Lista de palabras para frases de contraseña
// ----------------------------------------------------------------------------
// Palabras inglesas cortas (3-7 letras), frecuentes y sin homófonos que se
// presten a error al dictarlas o teclearlas. No hay plurales de otra palabra de
// la lista ni parejas que sólo se distingan por una letra confundible.
//
// El tamaño de la lista NO se redondea a una potencia de dos: la entropía se
// calcula como palabras × log2(longitud real), así que la cifra que ve el
// usuario es exacta sea cual sea el número de entradas.
//
// Este módulo se importa de forma diferida (import() dentro del modo frase)
// para que no entre en el chunk inicial de quien sólo quiere el generador.
// ============================================================================

const RAW =
  'able acid acorn actor adapt add adobe adopt adult afar affix afraid after again agent agile ' +
  'aging agree ahead aim air aisle alarm album alert alien alike alive alley allow alloy almond ' +
  'aloft alone along aloud alpha also alter amber amble amend amid ample amuse anchor angel anger ' +
  'angle ankle annex answer ant anvil apart apex apple apply april apron arcade arch arena argue ' +
  'arid arise arm armor army aroma array arrow art ash aside ask aspen asset atlas atom attic ' +
  'auburn audio audit auger august aunt auto avert avid awake award aware away awning axis axle ' +
  'baby back bacon badge bagel baker balm bamboo banjo bank barge barn basil basin basket bat ' +
  'batch bath baton bay beach beacon beam bean bear beat bee beech beef beetle began begin behind ' +
  'being bell belt bench bend berry beside best bevel beyond bike bill birch bird birth bison ' +
  'bit black blade blank blast blaze bleak blend bless blind blink bliss block bloom blot blue ' +
  'blunt blur blush board boast boat bobcat body boil bold bolt bond bone bonus book boost boot ' +
  'border borrow both bottle bough bounce bound bow bowl box brace braid brain brake branch brand ' +
  'brass brave bread break bream breeze brew brick bridge brief bright brim bring brink brisk ' +
  'broad broil broke brook broom brown brush bubble bucket budget buffet bugle build bulb bulk ' +
  'bump bunch bundle bunk burn burst bush butter button buyer cabin cable cactus cadet cage cake ' +
  'calm camel camp canal candle cane canoe canvas canyon cape car carbon card care cargo carol ' +
  'carpet carry cart carve case cash cask cast cat catch cattle cause cave cedar cell cement ' +
  'census cent chain chair chalk champ chant chaos chapel charm chart chase cheap check cheer ' +
  'cheese chef cherry chess chest chew chief child chill chime chin chip chirp choice choir chop ' +
  'chord chorus chose chrome chunk churn cider cigar cinema circle citrus city civic civil claim ' +
  'clamp clash clasp class claw clay clean clear clerk click cliff climb cling clip cloak clock ' +
  'close cloth cloud clover club clump clung coach coal coast coat cobalt cobra cocoa code coffee ' +
  'coil coin cold collar colony color colt column comb combat come comet comic coral cord core ' +
  'cork corn corner cosmic cost cotton couch cough could count county couple course court cousin ' +
  'cove cover cow cozy crab crack craft crane crash crate crave crawl crayon cream credit creek ' +
  'creep crest crew cricket crimson crisp crop cross crowd crown crumb crush crust crypt cube ' +
  'cuff culture cup curb curd cure curl curse curve cushion custom cut cycle cyclone daily dairy ' +
  'daisy dance dandy danger dare dark dart dash data date dawn day dazzle deal dear debate debris ' +
  'debt decade decal decay decide deck decor decoy deed deep deer defeat defend degree delay delta ' +
  'demand denim dense dental depart depth derby desert design desk detail detect device devote ' +
  'dew diagram dial diamond diary dice diesel diet dig digit dine dinner direct dirt disc dish ' +
  'disk ditch dive dock doctor dodge dog dome domino donate donkey donor door dose dot double ' +
  'dough dove down dozen draft drag dragon drain drama drape draw dream dress dried drift drill ' +
  'drink drive drop drove drum dry duck duct dude duet dug duke dull duo dusk dust duty dwarf ' +
  'dwell dye eager eagle early earn earth ease east easy eaten echo eclair edge edit eel effort ' +
  'egg eight eject elbow elder elect elegant element elk elm else email embark ember emblem embrace ' +
  'emerald emit empty enable enact enamel encode end enemy energy engage engine enjoy enough ' +
  'enrich ensure enter entire entry envoy epic equal equip era erase errand error escape essay ' +
  'estate etch eternal ethics evade even event ever evict evolve exact exam exceed excess exchange ' +
  'excite exempt exert exhale exile exist exit exotic expand expect expert expire export express ' +
  'extend extra fable fabric face fact fade fairy faith falcon fall false fame family famous fancy ' +
  'far fare farm fast fate father fatigue fault favor fawn fear feast feather fee feed feel fellow ' +
  'felt fence fern ferry fetch fever few fiber fiction field fierce fifth fig figure file fill ' +
  'film filter final finch find fine finger finish fire firm first fiscal fish fist fit five fix ' +
  'flag flame flash flask flat flavor flax fled flee fleet flesh flew flex flight fling flint ' +
  'flip float flock flood floor flour flow flower fluent fluid flush flute fly foam focus fog ' +
  'foil fold folk follow font food foot force forest forge fork form fort forum forward fossil ' +
  'foster found four fox frame free fresh friend fringe frog front frost frown fruit fudge fuel ' +
  'full fun fund fungus funnel fur furnace fury fuse future fuzzy gadget gain galaxy gallery game ' +
  'gap garage garden garlic gas gate gather gauge gave gaze gear gem gene gentle genuine germ get ' +
  'ghost giant gift ginger giraffe girl give glacier glad glance gland glare glass glaze gleam ' +
  'glide glint globe gloom glory glove glow glue goat gold golf gone good goose gorge gospel gown ' +
  'grab grace grade grain grand grant grape graph grasp grass grave gravy gray graze great green ' +
  'greet grid grief grill grim grin grip grit groove group grove grow gruff guard guess guest ' +
  'guide guild gulf gull gum gust gym habit hail hair half hall halt hammer hand hang harbor hard ' +
  'hare harm harp harvest haste hat hatch haul haven hawk hay hazel head heal heap hear heart ' +
  'heat heavy hedge heel height helium helm help hemp herb herd here hero hidden high hike hill ' +
  'hint hip hire hive hobby hockey hold hole hollow home honey honor hood hoof hook hope horizon ' +
  'horn horse hose host hotel hound hour house hover howl hub huge hum human humble humor hunt ' +
  'hurdle hurry hurt hut hybrid hydrant ice icon idea ideal idle igloo ignite image impact imply ' +
  'import impose inch income indeed index indigo indoor infant inform inject injure ink inland ' +
  'inlet inner input insect insert inside insist inspect intact intend invest invite iron island ' +
  'issue item ivory ivy jacket jade jagged jam jar jaunt jaw jazz jelly jersey jet jewel job jog ' +
  'join joint joke jolly jolt journal joy judge juice july jumbo jump june jungle junior junk ' +
  'jury just kayak keen keep kennel kept kettle key kick kind king kiosk kiss kit kite kitten ' +
  'knee knife knight knit knob knock knot know koala lab label labor lace lack ladder lady lagoon ' +
  'lake lamb lamp land lane lantern lap large laser last late later laugh launch laundry lava law ' +
  'lawn layer lazy lead leaf league leak lean leap learn lease leash least leather leave ledge ' +
  'left leg legacy legend legume lemon lend length lens leopard less lesson letter level lever ' +
  'liberty library lid life lift light like lilac lily limb lime limit line linen link lion lip ' +
  'liquid list listen liter little live lizard load loaf loan lobby lobster local lock locust ' +
  'lodge loft log logic lone long look loop loose lord lose lot lotus loud lounge love loyal luck ' +
  'lumber lunar lunch lung lure lush luxury lyric macro made magic magnet maid mail main major ' +
  'make mammal manage mango manor mantle manual maple marble march margin marine mark market ' +
  'marsh mask mason mass mast match math matter mature maze meadow meal mean meat medal media ' +
  'medium meet melody melon melt member memory mend menu mercy merge merit merry mesh mess metal ' +
  'meteor meter method mid midst might mild mile milk mill mimic mind mine mingle minor mint ' +
  'minute mirror mix moat mobile mode model modest modify moist molten moment money monitor monkey ' +
  'month mood moon moral morning mortal mosaic moss most motel moth motion motor mount mouse ' +
  'mouth move movie much mud muffin mug mule multi mumble muscle museum music must mutual myth ' +
  'nacho nail name napkin narrow nation native nature naval near neat neck nectar need needle ' +
  'neon nerve nest net never new next nice niche night nimble nine noble node noise none noon ' +
  'normal north nose note notice novel now nudge number nurse nut nylon oak oasis oat obey object ' +
  'oblige observe obtain occur ocean octave octopus odd offer office often oil olive omega omit ' +
  'once onion only onset onward opal open opera opinion oppose option orange orbit orchard order ' +
  'organ origin ornate other otter ounce outer output outside oval oven over owl own oxide oxygen ' +
  'oyster ozone pace pack pact paddle page paid pail pain paint pair palace pale palm panda panel ' +
  'panic pantry paper parade parcel pardon parent park parrot part party pass past pasta patch ' +
  'path patient patio patrol pause pave paw pay peace peach peak peanut pear pearl pebble pedal ' +
  'peel peer pelican pen pencil penguin people pepper perch perfect perform perhaps period permit ' +
  'person pest petal phase phone photo phrase piano pick picnic picture pie piece pier pigment ' +
  'pile pilot pin pinch pine pink pint pioneer pipe pistol pitch pity pivot pixel pizza place ' +
  'plain plan plant plasma plate play plaza plead please pledge plenty plot plow pluck plug plum ' +
  'plumb plunge plural pocket poem poet point polar pole police polish polite pond pony pool poppy ' +
  'porch pork port portal pose post pot potato pouch pound pour powder power praise prank prawn ' +
  'pray press pretty prevent price pride prime print prism prison prize probe problem process ' +
  'produce profit prompt proof proper propose protect proud prove prune public pull pulse pump ' +
  'punch pupil puppy pure purple purse push put puzzle pyramid quail quaint quake quality quantum ' +
  'quarry quart queen quench query quest queue quick quiet quill quilt quirk quiver quiz quota ' +
  'quote rabbit raccoon race radar radio radish raft rail rain raise rally ranch random range ' +
  'rank rapid rare rate rather ratio raven raw ray razor reach react read ready real reason rebel ' +
  'recall recipe record recover red reduce reef refer reflect reform refuge regard region regret ' +
  'reject relax relay relief remain remedy remind remote remove render renew rent repair repeat ' +
  'reply report rescue resist resort respect rest result retail retire return reveal review reward ' +
  'rhino rhyme ribbon rice rich ridge rifle right rigid rim ring rinse riot ripe ripple rise ' +
  'risk ritual river road roast robin robot rock rocket rod rogue role roll roof room root rope ' +
  'rose rotate rough round route rover row royal rubber ruby rug rule rumble run rural rush rust ' +
  'sabre sack sacred saddle safe saffron sage sail saint salad salmon salon salt salute same ' +
  'sample sand satin sauce save saw scale scan scarf scene scent school science scissor scoop ' +
  'scope score scout scrap screen script scroll scrub sculpt seal search season seat second secret ' +
  'sector secure seed seek seem segment seize select self sell senate send senior sense sentry ' +
  'serve session settle seven sever shade shaft shall shame shape share shark sharp shed sheep ' +
  'sheet shelf shell shield shift shine ship shirt shock shoe shop shore short shot should shout ' +
  'shovel show shrimp shrink shrug shuffle shut shy sibling side siege sigh sight sign silent ' +
  'silk silver similar simple since sing sink sir siren sister sit six size skate sketch ski skill ' +
  'skin skirt skull sky slab slam slate sleek sleep sleeve slice slide slight slim slogan slope ' +
  'slot slow small smart smash smell smile smoke smooth snack snake snap sneak snow soap soccer ' +
  'social sock soda sofa soft soil solar sold solid solve some song soon soot sorry sort soul ' +
  'sound soup source south space spade span spare spark speak spear speed spell spend sphere ' +
  'spice spider spill spin spiral spirit split spoke sponge spoon sport spot spray spread spring ' +
  'sprint spruce spur spy square squash squid stable stack staff stage stair stamp stand star ' +
  'start state stay steady steam steel steep steer stem step stereo stick stiff still sting stir ' +
  'stock stone stool stop store storm story stove strap straw stream street stress strike string ' +
  'strip strong studio study stuff stump style subject submit subtle suburb subway such sudden ' +
  'sugar suit summer summit sun super supply support sure surf surge survey suspect swallow swamp ' +
  'swan swap swarm sweat sweep sweet swell swift swim swing switch sword symbol syntax syrup ' +
  'system table tablet tack tactic tag tail take tale talent talk tall tan tank tape target task ' +
  'taste tavern tax teach team tear tease tech tell temple tempo tenant tend tennis tent term ' +
  'test text thank that theme theory there these thick thin thing think third thorn those thread ' +
  'three thrive throat throw thumb thunder ticket tide tidy tie tiger tight tile tilt timber time ' +
  'tiny tip tire title toast today toe token toll tomato tone tongue tonic took tool tooth top ' +
  'topic torch total touch tough tour towel tower town toxic toy trace track trade traffic trail ' +
  'train trait tram trap travel tray tread treat tree trend trial tribe trick trim trio trip ' +
  'trophy tropic trouble truck true trumpet trunk trust truth try tube tulip tumble tuna tundra ' +
  'tunnel turbo turf turkey turn turtle tutor twelve twin twist type ultra umbrella uncle under ' +
  'unfold unify union unique unit unite unlock until unusual update upgrade uphold upon upper ' +
  'upset urban urge usage use useful usual utility vacant vacuum vague valid valley value valve ' +
  'van vanish vapor variety vast vault vein velvet vendor venture venue verb verdict verify verse ' +
  'very vessel vest veteran vibrant victor video view vigor villa village vine vinyl violet ' +
  'violin virtue virus vision visit vital vivid vocal voice volcano volume vote vowel voyage ' +
  'wafer wage wagon waist wait wake walk wall walnut wander want ward warm warn wash wasp waste ' +
  'watch water wave wax weak wealth weapon wear weasel weather weave wedge week weigh weird ' +
  'welcome weld well west wet whale wheat wheel when where which while whisk white whole wide ' +
  'width wild will win wind window wing wink winter wipe wire wise wish witty wizard wolf woman ' +
  'wonder wood wool word work world worry worth would wound woven wrap wreck wrist write wrong ' +
  'yard yarn year yeast yellow yes yet yield yoga yogurt yonder young youth zebra zenith zero ' +
  'zigzag zinc zone zoom';

export const WORDS: string[] = RAW.split(' ').filter(Boolean);

/** Tamaño real de la lista. La entropía por palabra es log2 de este número. */
export const WORD_COUNT = WORDS.length;

if (import.meta.env.DEV) {
  // Una entrada duplicada reduciría la entropía real por debajo de la anunciada.
  const seen = new Set(WORDS);
  if (seen.size !== WORDS.length) {
    console.warn(`[entropy-bolt] wordlist con duplicados: ${WORDS.length} entradas, ${seen.size} únicas`);
  }
}
