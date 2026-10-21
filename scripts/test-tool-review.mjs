import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { handleSocial, handleSocialMedia, isAllowedRelayUrl, youtubeIdFrom } from '../server/socialResolve.mjs';
import { parseRdap } from '../server/rdapLookup.mjs';
import { parseRegistration } from '../server/whoisLookup.mjs';
import { synthesizeSpeech } from '../server/ttsGenerate.mjs';

async function load(file) {
  const result = await build({ entryPoints: [file], bundle: true, write: false, format: 'esm', platform: 'node', packages: 'external', logLevel: 'silent' });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].contents).toString('base64'));
}
for (const tool of ['binary-flow', 'pdf-flow', 'socialbolt', 'whois-bolt']) {
  const expected = Object.keys((await load(`src/locales/en/${tool}.ts`)).default).sort();
  for (const lang of ['es', 'fr', 'de', 'pt', 'ru', 'hi', 'ja', 'zh']) {
    assert.deepEqual(Object.keys((await load(`src/locales/${lang}/${tool}.ts`)).default).sort(), expected, `${lang}/${tool} translation keys`);
  }
}
const floats = await load('src/tools/binary-flow/lib/floats.ts');
assert.equal(floats.exactDecimal(0.1), '0.1000000000000000055511151231257827021181583404541015625');
assert.equal(floats.exactDecimal(-0), '-0');
assert.equal(floats.exactDecimal(Number.MIN_VALUE).length, 1076);
assert.equal(Number(floats.exactDecimal(Number.MIN_VALUE)), Number.MIN_VALUE);
assert.equal(floats.exactDecimal(Number.MAX_VALUE).length, 309);
assert.equal(floats.ulp(1, 64), 2 ** -52);
assert.equal(floats.ulp(-1, 64), 2 ** -52);
assert.equal(floats.ulp(-0, 64), Number.MIN_VALUE);
const binary = await load('src/tools/binary-flow/lib/convert.ts');
assert.equal(binary.parseInBase('12.5', 10).error, 'fraction');
assert.equal(binary.parseInBase('1.234.567', 10).value, 1234567n);
assert.equal(binary.applyOp(255n, 10n ** 100n, 'shl', 8), 0n);
assert.throws(() => binary.applyOp(1n, 10n ** 100n, 'shl', 0), /shift_limit/);
const epochs = await load('src/tools/epoch-flow/lib/epochs.ts');
assert.equal(epochs.parseStamp('1700000000.123456789', 'unix', 's').ns, 1700000000123456789n);
assert.equal(epochs.parseStamp('-0.000000001', 'unix', 's').ns, -1n);
assert.equal(epochs.parseStamp('1.7e9', 'unix', 's').ns, 1700000000000000000n);
assert.equal(epochs.parseStamp('8640000000000000.000001', 'unix', 'ms').error, 'range');
for (const [input, code] of [
  [{text: {}, voice:'es-ES-ElviraNeural'}, 'missing_text'],
  [{text:'test', voice:'\"/><audio src="https://example.com"/>'}, 'invalid_voice'],
  [{text:'test', voice:'es-ES-ElviraNeural', rate:Infinity}, 'invalid_settings'],
]) await assert.rejects(synthesizeSpeech(input), error => error.code === code);
if (process.argv.includes('--live-tts')) {
  const result = await synthesizeSpeech({text:'Hola. España, uno & dos, prueba de voz.', voice:'es-ES-ElviraNeural'});
  assert.ok(result.audio.length > 1000); assert.ok(result.marks.some(mark => mark.k === 'w' && mark.d > 0));
  console.log(`PASS live neural TTS: ${result.audio.length} bytes, ${result.marks.length} timed marks`);
}

const { parsePageRange } = await load('src/tools/pdf-flow/lib/pageRange.ts');
assert.deepEqual(parsePageRange('3, 1', 3).pages, [2, 0]);
assert.deepEqual(parsePageRange('5-2; 1', 5).pages, [4, 3, 2, 1, 0]);
for (const invalid of ['1abc', '1, 99999', '1-', '1-9999999999999999999', '0', '1.5', '1,,2']) assert.equal(parsePageRange(invalid, 3).invalid, true, invalid);

const social = await load('src/tools/socialbolt/lib/socialApi.ts');
const intake = social.inspectLinks('invalid line\nhttps://youtu.be/jNQXAC9IVRw\nhttps://youtube.com/watch?v=jNQXAC9IVRw&si=tracking');
assert.equal(intake.links.length, 1); assert.equal(intake.duplicates, 1); assert.deepEqual(intake.invalid, ['invalid line']);
assert.equal(social.splitLinks('https://video.twimg.com/example.mp4?signature=a,b')[0], 'https://video.twimg.com/example.mp4?signature=a,b');
assert.equal(social.detectPlatform('https://youtube.com.evil.test/watch?v=jNQXAC9IVRw'), 'unknown');
assert.equal(social.directResult('https://pbs.twimg.com/media/image?format=png&name=orig').assets[0].mime, 'image/png');
assert.equal(social.directResult('https://video.twimg.com/playback').assets[0].ext, 'mp4');
assert.equal(youtubeIdFrom('https://youtube.com/watch?v=invalid'), null);
assert.equal(youtubeIdFrom('https://youtube.com/shorts/jNQXAC9IVRw'), 'jNQXAC9IVRw');
assert.equal(isAllowedRelayUrl('https://video.twimg.com/a.mp4'), true);
for (const url of ['http://video.twimg.com/a', 'https://video.twimg.com.evil.test/a', 'https://user:pass@video.twimg.com/a', 'https://video.twimg.com:8443/a']) assert.equal(isAllowedRelayUrl(url), false, url);
assert.equal((await handleSocial(new URL('https://local/api/social?action=capabilities'))).status, 200);

// Reject redirect escapes before any request to the untrusted destination.
const realFetch = globalThis.fetch;
const oldCobalt = process.env.COBALT_API_URL;
try {
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response(null, { status: 302, headers: { location: 'https://localhost/private' } }); };
  const redirected = await handleSocialMedia(new URL('https://local/api/social?action=media&url=https%3A%2F%2Fvideo.twimg.com%2Fa.mp4'));
  assert.equal(redirected.status, 403); assert.equal(calls, 1);
  process.env.COBALT_API_URL = 'https://extractor.example/';
  assert.equal(isAllowedRelayUrl('https://extractor.example/tunnel?id=example'), true);
  assert.equal(isAllowedRelayUrl('https://extractor.example/admin'), false);
  globalThis.fetch = async () => new Response('ok', { headers: { 'content-type': 'video/mp4' } });
  const unicode = await handleSocialMedia(new URL('https://local/api/social?action=media&url=https%3A%2F%2Fvideo.twimg.com%2Fa.mp4&name=Espa%C3%B1a.mp4'));
  assert.match(unicode.headers['Content-Disposition'], /filename\*=UTF-8''Espa%C3%B1a.mp4/);
  const longName = await handleSocialMedia(new URL('https://local/api/social?action=media&url=https%3A%2F%2Fvideo.twimg.com%2Fa.mp4&name=' + 'a'.repeat(100) + '.mp4'));
  assert.match(longName.headers['Content-Disposition'], /filename="a+\.mp4"/);
  const asset = social.directResult('https://video.twimg.com/a.mp4').assets[0];
  globalThis.fetch = async () => new Response('', {headers:{'content-type':'video/mp4'}});
  await assert.rejects(social.fetchAsset(asset, 'video.mp4'), /Empty media/);
  globalThis.fetch = async () => new Response('<html>denied</html>', {headers:{'content-type':'text/html'}});
  await assert.rejects(social.fetchAsset(asset, 'video.mp4'), /page instead of media/);
} finally {
  globalThis.fetch = realFetch;
  if (oldCobalt === undefined) delete process.env.COBALT_API_URL; else process.env.COBALT_API_URL = oldCobalt;
}

const registration = parseRdap({ ldhName:'EXAMPLE.COM', objectClassName:'domain', entities:[{ roles:['registrar'], vcardArray:['vcard', [['fn', {}, 'text', 'Example Registrar']]] }], events:[{eventAction:'registration',eventDate:'2000-01-01T00:00:00Z'}], status:['active'], nameservers:[{ldhName:'NS.EXAMPLE.COM'}], secureDNS:{delegationSigned:false} }, 'https://registry.example/domain/example.com');
assert.equal(registration.registrar, 'Example Registrar'); assert.equal(registration.expires, null); assert.equal(registration.dnssec, false);
assert.equal('entities' in registration, false);
// Port-43 fallback for the extensions without RDAP: same shape, no contacts.
const itRecord = parseRegistration('Domain:             google.it\nStatus:             ok\nCreated:            1999-12-10 00:00:00\nLast Update:        2026-06-09 23:13:34\nExpire Date:        2027-04-21\n\nRegistrant\n  Organization:     Google Ireland Holdings\n  Created:          2018-03-02 19:04:02\n\nRegistrar\n  Organization:     MarkMonitor International Limited\n  Name:             MARKMONITOR-REG\n\nNameservers\n  ns1.google.com\n  ns2.google.com\n', 'google.it', 'whois.nic.it');
assert.deepEqual([itRecord.registrar, itRecord.created, itRecord.expires, itRecord.updated, itRecord.nameservers.length], ['MarkMonitor International Limited', '1999-12-10', '2027-04-21', '2026-06-09', 2]);
const jpRecord = parseRegistration('a. [Domain Name]                GOOGLE.CO.JP\r\ng. [Organization]               Google Japan G.K.\r\np. [Name Server]                ns1.google.com\r\n[State]                         Connected (2027/03/31)\r\n[Registered Date]               2001/03/22\r\n', 'google.co.jp', 'whois.jprs.jp');
assert.deepEqual([jpRecord.domain, jpRecord.created, jpRecord.expires, jpRecord.statuses[0], jpRecord.registrar], ['google.co.jp', '2001-03-22', '2027-03-31', 'Connected', null]);
const mxRecord = parseRegistration('Domain Name:       google.com.mx\nCreated On:        2003-02-24\nExpiration Date:   2027-02-23\nRegistrar:         Markmonitor\nRegistrant:\n   Name:           Google LLC\n   City:           Mountain View\n   State:          California\n', 'google.com.mx', 'whois.mx');
assert.deepEqual(mxRecord.statuses, []); assert.equal(JSON.stringify(mxRecord).includes('California'), false);
assert.equal(parseRegistration('Domain: x.pt\nCreation Date: 09/01/2003 00:00:00\n', 'x.pt', 'whois.dns.pt').created, '2003-01-09');
const recipes = await load('src/lib/imageRecipes.ts');
const { DEFAULT_SETTINGS: compress } = await load('src/tools/compresssnap/lib/types.ts');
const { DEFAULT_SETTINGS: format } = await load('src/tools/formatflow/lib/types.ts');
assert.equal(recipes.isCompressRecipe(compress), true); assert.equal(recipes.isFormatRecipe(format), true);
for (const invalid of [null, {}, { ...compress, width: 100000000 }, { ...compress, quality: NaN }, { ...compress, format: 'text/html' }]) assert.equal(recipes.isCompressRecipe(invalid), false);
console.log('PASS: exact IEEE-754 decimals and shifts; ordered strict PDF ranges; social intake, relay redirects and Unicode filenames; RDAP and port-43 registration parsing; persisted image recipe validation.');
