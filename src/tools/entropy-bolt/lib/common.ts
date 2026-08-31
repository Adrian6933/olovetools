// ============================================================================
// Contraseñas filtradas más frecuentes
// ----------------------------------------------------------------------------
// La versión anterior traía 15 entradas y las comparaba con `includes`, así que
// "mypassword1" se detectaba pero "trustno1", "iloveyou2" o "qazwsx" no.
//
// Esta lista recoge las que aparecen sistemáticamente en la cabecera de los
// volcados públicos. No pretende ser exhaustiva —para eso hace falta un fichero
// de decenas de MB o una consulta de red, y esta herramienta no hace ninguna de
// las dos— pero cubre lo que la gente escribe de verdad cuando improvisa.
//
// Se carga bajo demanda: sólo hace falta al analizar una contraseña escrita a
// mano, no al generar una.
// ============================================================================

const RAW =
  '123456 password 123456789 12345678 12345 111111 1234567 sunshine qwerty iloveyou princess admin ' +
  'welcome 666666 abc123 football 123123 monkey 654321 aa123456 donald password1 qwerty123 1q2w3e4r ' +
  'letmein zxcvbnm login starwars 121212 bailey freedom shadow passw0rd master baseball buster ' +
  'daniel hannah thomas summer george harley pepper ginger dragon michael jordan jennifer hunter ' +
  'trustno1 batman soccer charlie andrew michelle jessica pokemon superman matthew robert ' +
  'chicken purple ashley amanda nicole jasmine banana tigger cookie maggie ranger hockey killer ' +
  'sparky orange melissa boomer mercedes flower nathan snoopy junior samsung yellow computer ' +
  'internet whatever samantha zaq12wsx qazwsx qwertyuiop asdfgh asdfghjkl zxcvbn 1qaz2wsx ' +
  '1q2w3e4r5t q1w2e3r4 abcd1234 abc12345 a1b2c3d4 test123 admin123 root toor guest default ' +
  'changeme secret temp123 pass123 pass1234 password123 password12 passwort contrasena motdepasse ' +
  '000000 999999 888888 222222 333333 555555 777777 101010 112233 123321 456789 987654321 ' +
  '11111111 00000000 1234 12345678910 147258369 159753 1234qwer qwe123 asd123 zxc123 ' +
  'iloveyou1 ilovegod iloveu babygirl lovely angel love loveme forever family friends ' +
  'jesus christ heaven prayer blessed church bible faith hope grace ' +
  'anthony joshua william david joseph brandon justin ryan tyler kevin jason eric adam brian ' +
  'sarah emily hannah madison elizabeth taylor lauren rachel megan brittany danielle stephanie ' +
  'chelsea courtney kayla alexis vanessa victoria natalie andrea ' +
  'liverpool arsenal chelseafc barcelona realmadrid manchester rangers celtic juventus milan ' +
  'ferrari porsche corvette mustang harleydavidson yamaha honda toyota nissan subaru ' +
  'metallica nirvana slipknot blink182 greenday linkinpark eminem rihanna beyonce madonna ' +
  'pokemon1 pikachu charizard mario zelda sonic minecraft fortnite roblox skyrim halo diablo ' +
  'counterstrike callofduty starcraft warcraft runescape gandalf legolas frodo aragorn ' +
  'summer2023 summer2024 winter2023 spring2024 autumn2023 january february september october ' +
  'welcome1 welcome123 admin1 letmein1 monkey1 dragon1 shadow1 master1 hello hello123 ' +
  'access matrix ninja phoenix wizard hammer thunder lightning storm falcon eagle tiger lion ' +
  'panther cobra viper shark dolphin husky bulldog rocket cosmos galaxy nebula saturn jupiter ' +
  'bandit hotdog cheese coffee whisky vodka guinness corona heineken budweiser ' +
  'money cash dollar bank credit fuckyou fuckoff bullshit asshole bitch ' +
  'poop butthead beavis mustang1 blink182x guitar drummer bassist singer ' +
  'newyork london paris tokyo berlin madrid moscow sydney toronto chicago boston seattle ' +
  'redsox yankees lakers cowboys packers steelers giants dodgers braves ' +
  'qwertz azerty poiuyt lkjhgf mnbvcxz 0987654321 abcdef abcdefg abcdefgh fedcba ' +
  'aaaaaa bbbbbb cccccc zzzzzz qqqqqq aaaaaaaa abc abcd abcde ' +
  'apple google amazon yahoo hotmail gmail outlook facebook twitter instagram tiktok netflix ' +
  'spotify youtube linkedin snapchat whatsapp telegram discord reddit twitch ' +
  'sunshine1 princess1 football1 baseball1 basketball soccer1 tennis golf swimming running ' +
  'freedom1 liberty america patriot eagle1 usa canada england ireland scotland ' +
  'birthday christmas halloween valentine newyear holiday vacation weekend friday monday ' +
  'school teacher student college university homework science history english math ' +
  'doctor nurse police fireman lawyer engineer manager director boss office work ' +
  'purple1 orange1 yellow1 green1 blue1 red123 black white silver golden ' +
  'trustme believe dreams destiny angel1 devil666 satan heaven7 lucky7 lucky777 ' +
  'test testing test1 test12 demo demo123 sample example foobar foo bar baz ' +
  'qwer asdf zxcv 1111 2222 0000 1212 6969 4200 1337 leet hacker anonymous';

let cache: Set<string> | null = null;

/** Conjunto en minúsculas, construido una sola vez. */
export function commonPasswords(): Set<string> {
  if (!cache) cache = new Set(RAW.split(/\s+/).filter(Boolean));
  return cache;
}

export const COMMON_COUNT = RAW.split(/\s+/).filter(Boolean).length;
