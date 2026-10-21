import assert from 'node:assert/strict';
import { build } from 'esbuild';

const results = [];
async function load(file) {
  const built = await build({ entryPoints: [file], bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent' });
  return import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].contents).toString('base64'));
}
async function test(tool, run) {
  try { await run(); results.push({ tool, passed: true }); console.log(`PASS ${tool}`); }
  catch (e) { results.push({ tool, passed: false, error: e.message }); console.error(`FAIL ${tool}: ${e.message}`); }
}

await test('base64-bolt', async () => {
  const m = await load('src/tools/base64-bolt/lib/base64.ts');
  for (let length = 0; length <= 256; length++) {
    const bytes = Uint8Array.from({ length }, (_, i) => (i * 197 + length) % 256);
    for (const alphabet of ['base64', 'base64url']) {
      const encoded = m.encodeBytes(bytes, { ...m.DEFAULT_ENCODE, alphabet, padding: false });
      const decoded = m.decodeBase64(encoded);
      assert.equal(decoded.error, ''); assert.deepEqual([...decoded.value.bytes], [...bytes]);
    }
  }
  assert.equal(m.encodeBytes(new TextEncoder().encode('Hola ñ 😀')), 'SG9sYSDDsSDwn5iA');
});
await test('json-flow', async () => {
  const p = await load('src/tools/json-flow/lib/parse.ts'), s = await load('src/tools/json-flow/lib/serialize.ts');
  const raw = '{"id":18446744073709551615,"name":"España 😀"}';
  const parsed = p.parseJson(raw); assert.equal(parsed.ok, true);
  assert.equal(s.printJson(parsed.root, { indent: 2, minify: true }), raw);
  assert.equal(p.parseJson('{"a":1,}').ok, false);
  assert.equal(p.parseJson('{"a":1,}', { tolerant: true }).ok, true);
});
await test('xml-json', async () => {
  const m = await load('src/tools/xml-json/lib/xmlParse.ts');
  const xml = m.parseXml('<root title="España &amp; ñ"><a><![CDATA[x < 3]]></a></root>');
  assert.equal(xml.issues.filter(x => x.level === 'error').length, 0);
  assert.ok(m.parseXml('<root><a></root>').issues.some(x => x.level === 'error'));
});
await test('graph-flow', async () => {
  const m = await load('src/tools/graph-flow/utils/dataParser.ts');
  const parsed = m.parseDelimited('Mes;Ventas;Meta\nEnero;1.234,5;1.100\nFebrero;2.000,75;3.500\n');
  assert.deepEqual(parsed.data.labels, ['Enero', 'Febrero']);
  assert.deepEqual(parsed.data.series[0].values, [1234.5, 2000.75]);
  assert.deepEqual(parsed.data.series[1].values, [1100, 3500]);
  const round = m.parseDelimited(m.datasetToCSV(parsed.data));
  assert.deepEqual(round.data.series.map(s => s.values), parsed.data.series.map(s => s.values));
});
await test('list-mixer', async () => {
  const m = await load('src/tools/list-mixer/lib/pipeline.ts'), c = await load('src/tools/list-mixer/lib/catalog.ts');
  const out = m.runPipeline('item10\nitem2\nitem1', '', { split:'lines', custom:'' }, [c.makeStep('sort', false)], 'es');
  assert.deepEqual(out.items, ['item1', 'item2', 'item10']);
});
await test('lorem-flow', async () => {
  const m = await load('src/tools/lorem-flow/lib/generate.ts'), t = await load('src/tools/lorem-flow/types.ts');
  const options = { ...t.DEFAULTS, unit:'words', count:7, seed:'review' };
  const words = m.generate(options); assert.equal(m.countWords(words, options.script), 7);
  assert.equal(m.generate(options), words);
  const chars = m.generate({ ...options, unit:'characters', count:30, script:'japanese' });
  assert.equal([...chars].length, 30);
});
await test('morse-flow', async () => {
  const m = await load('src/tools/morse-flow/lib/translate.ts');
  assert.equal(m.encode('SOS').output, '... --- ...');
  assert.equal(m.decode('... --- ...').output, 'SOS');
  assert.equal(m.encode('canción').issues.length, 0);
});
await test('subtitles-bolt', async () => {
  const p = await load('src/tools/subtitles-bolt/lib/parse.ts'), f = await load('src/tools/subtitles-bolt/lib/format.ts');
  const track = p.parseTrack('1\n00:00:00,500 --> 00:00:01,800\nHola <i>mundo</i>.\n', 'srt');
  assert.equal(track.cues.length, 1);
  assert.match(f.emit(track, 'vtt'), /00:00:00\.500 --> 00:00:01\.800/);
  assert.match(f.emit(track, 'ass'), /\\i1/);
  assert.match(f.emit(track, 'ttml'), /fontStyle="italic"/);
});
await test('entropy-bolt', async () => {
  const m = await load('src/tools/entropy-bolt/lib/charsets.ts'), e = await load('src/tools/entropy-bolt/lib/entropy.ts');
  const opts = { ...m.DEFAULT_OPTIONS, length:24, requireEach:true };
  const batch = m.generateMany(opts, 100);
  const passwords = batch.map(x => x.password);
  assert.equal(new Set(passwords).size, 100);
  for (const pw of passwords) { assert.equal(pw.length, 24); assert.match(pw, /[A-Z]/); assert.match(pw, /[a-z]/); assert.match(pw, /\d/); }
  assert.ok(e.estimateBits('password123', new Set(['password123', 'password'])).bits < 20);
});
await test('time-bolt', async () => {
  const m = await load('src/tools/time-bolt/lib/time.ts');
  const march = new Date('2026-03-15T12:00:00Z'), april = new Date('2026-04-05T12:00:00Z');
  assert.equal(m.offsetMinutes('Europe/Madrid', march), 60);
  assert.equal(m.offsetMinutes('America/New_York', march), -240);
  assert.equal(m.offsetMinutes('Europe/Madrid', april), 120);
  assert.equal(m.offsetMinutes('Europe/London', april), 60);
});
await test('cron-flow', async () => {
  const p = await load('src/tools/cron-flow/lib/cron.ts'), s = await load('src/tools/cron-flow/lib/schedule.ts');
  const parsed = p.parseCron('0 9 * * 1-5');
  const next = s.nextOccurrences(parsed.cron, Date.parse('2026-10-23T10:00:00Z'), 'UTC', 2);
  assert.equal(new Date(next[0].ts).toISOString(), '2026-10-26T09:00:00.000Z');
  assert.equal(new Date(next[1].ts).toISOString(), '2026-10-27T09:00:00.000Z');
});
await test('unitflow', async () => {
  const m = await load('src/tools/unitflow/lib/units.ts');
  const cat = m.CATEGORY_BY_ID.temperature;
  const c = cat.units.find(u => u.symbol === '°C'), f = cat.units.find(u => u.symbol === '°F');
  const value = m.parseQuantity(cat, '-40', c);
  assert.deepEqual(m.fromBase(f, value.base), { n:-40n, d:1n });
});
await test('wordflow', async () => {
  const m = await load('src/tools/wordflow/lib/analyze.ts');
  const text = 'Hola España, esta es una prueba.';
  const words = m.tokenize(text, 'es'); assert.equal(words.length, 6);
  assert.ok(m.tokenize('日本語のテストです', 'ja').length > 1);
});
await test('qr-bolt', async () => {
  const m = await load('src/tools/qr-bolt/lib/qr.ts');
  assert.equal(m.buildWifi({ ssid:'Casa;Ñ', password:'a\\b;c:d', security:'WPA' }), 'WIFI:T:WPA;S:Casa\\;Ñ;P:a\\\\b\\;c\\:d;;');
});
await test('qr-reader', async () => {
  const m = await load('src/tools/qr-reader/lib/parse.ts');
  const payload = m.parsePayload('WIFI:T:WPA;S:Casa\\;Ñ;P:abc;;');
  assert.equal(payload.kind, 'wifi');
  assert.ok(m.reviewUrl('https://user:secret@example.com/')?.warnings.length > 0);
});
await test('colorsnap', async () => {
  const m = await load('src/tools/colorsnap/lib/color.ts');
  assert.equal(m.contrastRatio({r:0,g:0,b:0},{r:255,g:255,b:255}), 21);
  for (const rgb of [[230,57,70],[69,123,157],[0,0,0],[255,255,255]]) {
    const lab = m.rgbToOklab(...rgb), round = m.oklabToRgb(lab.L,lab.a,lab.b);
    assert.ok(Math.abs(round.r-rgb[0]) <= 1 && Math.abs(round.g-rgb[1]) <= 1 && Math.abs(round.b-rgb[2]) <= 1);
  }
});
await test('zip-flow', async () => {
  const m = await load('src/tools/zip-flow/lib/files.ts');
  const taken = new Set();
  assert.equal(m.uniquePath('España.txt', taken), 'España.txt');
  taken.add('España.txt');
  assert.equal(m.uniquePath('España.txt', taken), 'España (2).txt');
  assert.ok(!m.sanitizePath('../../private/file.txt').includes('..'));
});
await test('url-bolt', async () => {
  const m = await load('src/tools/url-bolt/lib/codec.ts');
  const source = 'España 😀 & /?';
  for (const profile of ['component','strict','form','path','query','fragment','rfc5987']) {
    const encoded = m.encode(source, { profile });
    assert.equal(m.decode(encoded.value, { plusAsSpace: profile === 'form' }).value, source);
  }
  assert.ok(m.decode('%ZZ %E0%A4%A').issues.length > 0);
});

await test('jwt-bolt', async () => {
  const m = await load('src/tools/jwt-bolt/lib/crypto.ts');
  const key = { kind:'secret-utf8', text:'review-secret-only' };
  const signed = await m.signToken('{"alg":"HS256","typ":"JWT"}', '{"sub":"España","admin":false}', 'HS256', key);
  assert.ok(signed.token);
  const parts = signed.token.split('.');
  assert.equal((await m.verifySignature(parts.slice(0,2).join('.'), parts[2], 'HS256', key)).state, 'valid');
  assert.equal((await m.verifySignature(parts.slice(0,2).join('.'), parts[2], 'HS256', { ...key, text:'other' })).state, 'invalid');
});
await test('sql-flow', async () => {
  const m = await load('src/tools/sql-flow/lib/analyze.ts');
  const source = "SELECT 'a;b' AS value FROM users WHERE name = 'o''neil'; SELECT 2;";
  assert.equal(m.analyze(source).statements.length, 2);
  assert.ok(m.analyze("SELECT 'unclosed").issues.some(x=>x.severity==='error'));
});
await test('hex-to-rgb', async () => {
  const m = await load('src/tools/hex-to-rgb/lib/color.ts');
  const red = {r:255,g:0,b:0,a:1};
  assert.deepEqual(m.rgbToHsl(red), {h:0,s:100,l:50});
  const round = m.hslToRgb(m.rgbToHsl(red));
  assert.ok(Math.abs(round.r-255)<0.001 && round.g===0 && round.b===0);
});
await test('whiteboard-flow', async () => {
  const m = await load('src/tools/whiteboard-flow/lib/board.ts');
  const input = '{"layout":"kanban","nodes":[{"id":"a","text":"España","column":"done","x":1,"y":2,"w":200,"h":120}],"edges":[]}';
  const {doc,error} = m.fromJSON(input); assert.equal(error,'');
  assert.equal(m.fromJSON(m.toJSON(doc)).doc.nodes[0].text, 'España');
  assert.match(m.toMarkdown(doc,{todo:'Pendiente',inprogress:'En curso',done:'Hecho'}), /\[x\].*España/);
  assert.equal(m.fromJSON(input.replace('"x":1','"x":1e309')).error,'shape');
  assert.equal(m.fromJSON(input.replace('"w":200','"w":999999999')).error,'shape');
});
await test('tts-bolt', async () => {
  const m = await load('src/tools/tts-bolt/lib/captions.ts');
  const cues = [{ startMs:500,endMs:1800,text:'España y ñ' }];
  assert.match(m.toSrt(cues), /00:00:00,500 --> 00:00:01,800/);
  assert.match(m.toVtt(cues), /^WEBVTT/);
  assert.match(m.toVtt(cues), /España y ñ/);
});

await test('regex-flow', async () => {
  const m = await load('src/tools/regex-flow/lib/engine.ts');
  const request = {id:1, pattern:'(?<name>\\p{L}+)', flags:'gu', text:'Hola España', replacement:'[$<name>]', mode:'replace', limit:100};
  const result = m.run(request); assert.equal(result.ok, true); assert.equal(result.total, 2);
  assert.equal(result.replaced, '[Hola] [España]');
  assert.equal(m.run({...request, pattern:'('}).ok, false);
  const zero = m.run({...request, pattern:'(?=.)', text:'😀a'});
  assert.equal(zero.total, 2);
});
await test('diffsnap', async () => {
  const m = await load('src/tools/diffsnap/lib/diff.ts');
  const options = {whitespace:'none', ignoreCase:false, ignoreBlankLines:false, granularity:'line'};
  const result = m.runDiff('uno\ndos\ntres', 'uno\nDOS\ntres', options);
  assert.equal(result.stats.modified + result.stats.added, 1);
  assert.equal(result.stats.modified + result.stats.removed, 1); assert.equal(result.stats.unchanged, 2);
  const ignored = m.runDiff('uno\ndos ', 'UNO\nDOS', {...options, ignoreCase:true, whitespace:'trailing'});
  assert.equal(ignored.stats.similarity, 1);
});
await test('markdown-live', async () => {
  const p = await load('src/tools/markdown-live/lib/parser.ts'), r = await load('src/tools/markdown-live/lib/render.ts');
  const doc = p.parse('# España\n\n`a_b` y **negrita**\n\n<script>alert(1)</script>\n\n[ataque](javascript:alert%281%29)');
  const html = r.render(doc.blocks);
  assert.match(html, /<code>a_b<\/code>/); assert.match(html, /<strong>negrita<\/strong>/);
  assert.doesNotMatch(html, /<script>|href="javascript:/);
  assert.equal(r.safeUrl('javascript:alert(1)'), '');
});
await test('css-designer', async () => {
  const p = await load('src/tools/css-designer/lib/parse.ts'), s = await load('src/tools/css-designer/lib/serialize.ts');
  const parsed = p.parseCss('.card {box-shadow: 0 4px 8px rgba(0,0,0,.5), inset 0 1px 2px #fff; border-radius: 12px 24px;}');
  assert.equal(parsed.patch.shadow.layers.length, 2); assert.equal(parsed.patch.radius.tl, 12);
  assert.match(s.shadowValue(parsed.patch.shadow, 'hex'), /inset/);
  assert.equal(p.parseGradient('linear-gradient(90deg, #ff0000 0%, #0000ff 100%)').stops.length, 2);
});
await test('drawsnap', async () => {
  const g = await load('src/tools/drawsnap/lib/geometry.ts'), s = await load('src/tools/drawsnap/lib/svg.ts');
  const shape = {id:'a',type:'rect',color:'#ff0000',width:2,opacity:1,a:{x:10,y:10,p:1},b:{x:50,y:50,p:1},fill:true};
  assert.equal(g.hitTest(shape, {x:30,y:30}, 1), true);
  const svg = s.exportSvg({board:{w:320,h:240},shapes:[shape],surface:'transparent',pattern:'none'});
  assert.match(svg, /viewBox="0 0 320 240"/); assert.match(svg, /#ff0000/);
});
await test('hash-bolt', async () => {
  const m = await load('src/tools/hash-bolt/lib/verify.ts');
  const hash = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
  const parsed = m.parseExpected(`SHA256 (hello world.txt) = ${hash}\n${hash} *hello.txt`);
  assert.equal(parsed.length, 2); assert.equal(parsed[0].name, 'hello world.txt');
  assert.ok(parsed[0].candidates.includes('sha256'));
  assert.equal(m.compareHashes(hash.toUpperCase(), hash).equal, true);
});
await test('codecard', async () => {
  const m = await load('src/tools/codecard/lib/lines.ts');
  assert.deepEqual([...m.textToRanges('1,3-5,999', 6)], [1,3,4,5]);
  assert.equal(m.rangesToText(new Set([1,3,4,5])), '1, 3-5');
  assert.equal(m.plainLines('a\nb\n').length, 3);
});
await test('clip-flow', async () => {
  const m = await load('src/tools/clip-flow/services/route.ts');
  assert.equal(m.classifyRoute('/proxy?url=x').kind, 'own');
  assert.equal(m.classifyRoute('https://cdn.ttvnw.net/a.ts').kind, 'direct');
  assert.equal(m.classifyRoute('https://fake-twitch.tv/a.ts').kind, 'thirdParty');
  assert.equal(m.classifyRoute('/proxy-evil').kind, 'thirdParty');
  m.setAllowThirdParty(false);
  assert.equal(m.usableProxies([url=>url, url=>'/proxy?url='+url, url=>'https://third.example/'+url]).length, 2);
});
await test('klipy', async () => {
  const m = await load('src/tools/klipy/services/kickService.ts'), a = await load('src/tools/klipy/services/adapt.ts');
  assert.equal(m.categorySlug('Grand Theft Auto V'), 'grand-theft-auto-v');
  assert.equal(m.categorySlug('Pokémon & Friends'), 'pokemon-friends');
  const category = a.toCategory({id:'42',slug:'just-chatting',name:'Just Chatting',thumbnail:'https://example.com/a.png',viewers:123});
  assert.equal(category.id, 'just-chatting');
});

console.log(JSON.stringify(results));
if (results.some(r => !r.passed)) process.exitCode = 1;
