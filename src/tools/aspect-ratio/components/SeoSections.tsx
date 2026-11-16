import React from 'react';
import { KNOWN_RATIOS } from '../lib/ratio';

/**
 * The guide under the tools, written around what people search for:
 * "what is the aspect ratio of 1920×1080", "how to calculate an aspect ratio",
 * "convert 16:9 to 9:16", "aspect ratio chart". Server-rendered with the island.
 */
export function SeoSections({ t }: { t: any }) {
  const sections: { title: string; text: string }[] = Array.isArray(t.sections) ? t.sections : [];
  const faqs: { question: string; answer: string }[] = Array.isArray(t.faq) ? t.faq : [];
  const steps: string[] = Array.isArray(t.howSteps) ? t.howSteps : [];

  return (
    <div className="mt-16 md:mt-24 space-y-16 md:space-y-20">
      <section aria-labelledby="ar-how" className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
          <h2 id="ar-how" className="text-2xl md:text-4xl font-black text-white tracking-tight">{t.howTitle}</h2>
          {t.howIntro && <p className="text-slate-400 text-base md:text-lg leading-relaxed">{t.howIntro}</p>}
          {steps.length > 0 && (
            <ol className="space-y-3">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-7 h-7 shrink-0 rounded-lg bg-lime-400 text-lime-950 font-black text-sm flex items-center justify-center">{i + 1}</span>
                  <span className="text-slate-300 leading-relaxed">{s}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className="rounded-3xl bg-black/30 border border-lime-500/20 p-6 font-mono text-sm md:text-base space-y-2">
          <p className="text-[11px] font-sans font-black uppercase tracking-widest text-lime-300/80">{t.exampleTitle || 'Example'}</p>
          <p className="text-slate-300">1920 × 1080</p>
          <p className="text-slate-400">{t.gcdLabel || 'GCD'}(1920, 1080) = 120</p>
          <p className="text-slate-300">1920 ÷ 120 = 16 · 1080 ÷ 120 = 9</p>
          <p className="text-3xl font-black text-white pt-1">16:9</p>
          <p className="text-slate-400 pt-3">{t.exampleResize || 'Same ratio, 720 px tall:'}</p>
          <p className="text-slate-300">720 × 16 ÷ 9 = <span className="text-lime-300 font-black">1280</span> → 1280 × 720</p>
        </div>
      </section>

      {sections.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sections.map((s, i) => (
            <article key={i} className="rounded-3xl p-6 md:p-8 bg-lime-950/20 border border-white/5 space-y-3">
              <h2 className="text-lg md:text-xl font-black text-white leading-tight">{s.title}</h2>
              {String(s.text)
                .split('\n\n')
                .map((p, j) => (
                  <p key={j} className="text-sm md:text-base text-slate-400 leading-relaxed">{p}</p>
                ))}
            </article>
          ))}
        </section>
      )}

      <section aria-labelledby="ar-chart" className="space-y-5">
        <h2 id="ar-chart" className="text-2xl md:text-3xl font-black text-white tracking-tight">{t.chartTitle || 'Common aspect ratios'}</h2>
        {t.chartText && <p className="text-slate-400 leading-relaxed max-w-3xl">{t.chartText}</p>}
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-widest text-slate-500">
                <th className="font-black py-2 px-4">{t.colRatio || 'Ratio'}</th>
                <th className="font-black py-2 px-2">{t.colDecimal || 'Decimal'}</th>
                <th className="font-black py-2 px-2">{t.colUse || 'Use'}</th>
                <th className="font-black py-2 px-4">{t.colSizes || 'Typical sizes'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {KNOWN_RATIOS.map(r => (
                <tr key={r.id}>
                  <td className="py-2.5 px-4 font-mono font-black text-lime-300 whitespace-nowrap">{r.cinemaLabel || r.name}</td>
                  <td className="py-2.5 px-2 font-mono text-slate-400">{(r.w / r.h).toFixed(3)}</td>
                  <td className="py-2.5 px-2 text-slate-300">{t[r.labelKey] || r.label}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-400">{(r.resolutions || []).slice(0, 3).map(s => `${s.w}×${s.h}`).join(' · ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {faqs.length > 0 && (
        <section aria-labelledby="ar-faq" className="max-w-4xl mx-auto w-full space-y-6">
          <h2 id="ar-faq" className="text-2xl md:text-4xl font-black text-white tracking-tight text-center">{t.faqTitle || 'Frequently asked questions'}</h2>
          <div className="grid gap-3">
            {faqs.map((f, i) => (
              <details key={i} className="rounded-2xl px-5 py-4 bg-lime-950/20 border border-white/5 hover:border-lime-500/20 group [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-start gap-3 cursor-pointer list-none">
                  <h3 className="flex-1 text-base font-bold text-white">{f.question}</h3>
                  <span className="shrink-0 text-lime-400 transition-transform group-open:rotate-45 text-xl leading-none">+</span>
                </summary>
                <p className="text-slate-400 leading-relaxed pt-3 text-sm md:text-base">{f.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
