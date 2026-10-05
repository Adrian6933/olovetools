// Served by test-ads-browser.cjs. Uses the production AdSlot with a local
// request queue: no Google script, real ad requests, or impressions.
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AdSlot } from '../src/components/shared/AdSlot';

const output = document.getElementById('results')!;
const mount = document.getElementById('fixture')!;
const root = createRoot(mount);
const pause = () => new Promise(resolve => setTimeout(resolve, 200));
const check = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
  output.textContent += `PASS: ${message}\n`;
};

async function run() {
  window.adsbygoogle = [];
  mount.style.marginTop = '3000px';
  root.render(<StrictMode><AdSlot position="content" /></StrictMode>);
  await pause();
  check(mount.querySelector('[data-ad-placement]'), 'Lazy placement exists before intersection');
  check(!mount.querySelector('ins'), 'Offscreen placement does not expose an unrequested ins');
  check(window.adsbygoogle.length === 0, 'Offscreen placement makes no request');

  mount.scrollIntoView();
  await pause();
  check(mount.querySelector('ins'), 'Scrolling into view mounts the ad');
  check(window.adsbygoogle.length === 1, 'One request after intersection, including StrictMode');
  mount.style.width = '320px';
  await pause();
  check(window.adsbygoogle.length === 1, 'Resizing does not refresh the ad');

  const ins = mount.querySelector('ins')!;
  ins.setAttribute('data-ad-status', 'unfilled');
  await pause();
  check((mount.querySelector('[data-ad-placement]') as HTMLElement).hidden, 'Unfilled placement hides its label and reserved space');
  ins.setAttribute('data-ad-status', 'filled');
  await pause();
  check(!(mount.querySelector('[data-ad-placement]') as HTMLElement).hidden, 'Filled placement stays visible');

  root.render(null);
  await pause();
  mount.style.display = 'none';
  root.render(<StrictMode><AdSlot position="top" lazyLoad={false} /></StrictMode>);
  await pause();
  check(window.adsbygoogle.length === 1, 'Zero-width placement makes no request');
  mount.style.display = 'block';
  await pause();
  check(window.adsbygoogle.length === 2, 'Placement requests once when width becomes available');
  root.render(<StrictMode><AdSlot position="top" lazyLoad={false} /></StrictMode>);
  await pause();
  check(window.adsbygoogle.length === 2, 'Rerender does not duplicate queued requests');
  root.unmount();
  mount.remove();
  window.scrollTo(0, 0);
  document.title = 'PASS: manual ads regression tests';
  output.textContent += '\nAll 11 browser checks passed.';
}
run().catch(error => {
  document.title = 'FAIL: manual ads regression tests';
  output.textContent += `\nFAIL: ${error.message}`;
  window.scrollTo(0, 0);
});
