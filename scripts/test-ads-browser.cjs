// Run node scripts/test-ads-browser.cjs, then open http://127.0.0.1:4329.
const http = require('node:http');
const esbuild = require('esbuild');
async function main() {
  const { outputFiles } = await esbuild.build({
    entryPoints: ['scripts/test-ads-browser.tsx'], bundle: true, write: false,
    format: 'iife', platform: 'browser', jsx: 'automatic',
    define: { 'import.meta.env.DEV': 'false', 'process.env.NODE_ENV': '"development"' },
  });
  http.createServer((req, res) => {
    res.setHeader('Content-Type', req.url === '/test.js' ? 'text/javascript' : 'text/html; charset=utf-8');
    res.end(req.url === '/test.js' ? outputFiles[0].contents :
      '<!doctype html><html lang="es"><meta charset="utf-8"><title>Testing manual ads</title><body><pre id="results"></pre><div id="fixture"></div><script src="/test.js"></script></body></html>');
  }).listen(4329, '127.0.0.1', () => console.log('Ad regression checks: http://127.0.0.1:4329'));
}
main().catch(error => { console.error(error); process.exit(1); });
