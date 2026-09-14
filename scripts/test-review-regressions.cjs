// Run: node scripts/test-review-regressions.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(path) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('exports', 'require', source)(exports, require);
  return exports;
}

async function main() {
  const realNow = Date.now;
  try {
    let now = 1800000000000;
    Date.now = () => now;
    for (const kind of ['v7', 'ulid']) {
      const engine = load('src/tools/uuid-generator/lib/engine.ts');
      let previous = '';
      // Exercise repeated overflow and then a backwards wall clock.
      for (const count of [100000, 10000]) {
        const batch = await engine.generateBatch({ kind, count, namespace: '', names: [] });
        assert.equal(batch.duplicates, 0);
        for (let i = 0; i < count; i++) {
          const id = engine.bytesToHex(batch.bytes, i * 16, 16);
          assert.ok(id > previous, `${kind} out of order at ${i}`);
          if (kind === 'v7') {
            assert.equal(batch.bytes[i * 16 + 6] >>> 4, 7);
            assert.equal(batch.bytes[i * 16 + 8] >>> 6, 2);
          }
          previous = id;
        }
        now -= 1000;
      }
    }
  } finally { Date.now = realNow; }

  const { frameForRatio } = load('src/tools/aspect-ratio/lib/ratio.ts');
  assert.deepEqual(frameForRatio({ w: 100, h: 60 }, 16, 9, 16), { w: 0, h: 0 });
  assert.deepEqual(frameForRatio({ w: 100, h: 60 }, 16, 9), { w: 96, h: 54 });
  for (const [rw, rh] of [[16, 9], [9, 16], [4, 3], [1.85, 1]]) {
    for (const multiple of [1, 2, 8, 16]) {
      const frame = frameForRatio({ w: 4000, h: 3000 }, rw, rh, multiple);
      assert.ok(frame.w > 0 && frame.h > 0);
      assert.ok(frame.w <= 4000 && frame.h <= 3000);
      assert.ok(Math.abs(frame.w / frame.h - rw / rh) < 1e-12);
      assert.equal(frame.w % multiple, 0);
      assert.equal(frame.h % multiple, 0);
    }
  }
  const { optimizeLottie, DEFAULT_OPTIMIZE } = load('src/tools/lottie-viewer/utils/optimize.ts');
  const original = { v: '5.7.0', fr: 30, ip: 0, op: 60, w: 100, h: 100,
    layers: [{ ty: 1, ind: 1, bm: 1, nm: 'Layer', ks: { o: { a: 0, k: 100, ix: 11 } } }] };
  const optimized = optimizeLottie(original, DEFAULT_OPTIMIZE).json;
  const restored = JSON.parse(JSON.stringify(optimized));
  assert.equal(restored.layers[0].bm, 1);
  assert.equal(restored.layers[0].ks.o.ix, 11);
  assert.equal(restored.layers[0].nm, undefined);
  assert.equal(original.layers[0].nm, 'Layer');
  console.log('PASS: UUID/ULID large batches and clock rollback; exact bounded frames; Lottie rendering properties survive JSON export.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
