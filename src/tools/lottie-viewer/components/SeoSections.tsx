import React from 'react';

/**
 * Guide under the player, written around what people search for: "play
 * Lottie online", "Lottie JSON viewer", ".lottie player", "TGS viewer".
 * Server-rendered with the island so it is in the page HTML.
 */
export function SeoSections({ t }: { t: any }) {
  const steps: string[] = Array.isArray(t.howSteps) ? t.howSteps : [];
  const sections: { title: string; text: string }[] = Array.isArray(t.sections) ? t.sections : [];
  const faqs: { question: string; answer: string }[] = Array.isArray(t.faq) ? t.faq : [];
  const formats: { ext: string; text: string }[] = Array.isArray(t.formatsList) ? t.formatsList : [];

  return (
    <div className="mt-8 space-y-16 md:space-y-20">
      {steps.length > 0 && (
        <section aria-labelledby="lv-how" className="space-y-6">
          <h2 id="lv-how" className="text-2xl md:text-4xl font-black text-white tracking-tight">{t.howTitle}</h2>
          {t.howIntro && <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-3xl">{t.howIntro}</p>}
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 list-none p-0 m-0">
            {steps.map((s, i) => (
              <li key={i} className="glass-card rounded-3xl p-5 border border-white/5 flex gap-3">
                <span className="w-8 h-8 shrink-0 rounded-xl bg-indigo-500 text-white font-black flex items-center justify-center">{i + 1}</span>
                <span className="text-sm text-slate-300 leading-relaxed">{s}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {formats.length > 0 && (
        <section aria-labelledby="lv-formats" className="space-y-5">
          <h2 id="lv-formats" className="text-2xl md:text-3xl font-black text-white tracking-tight">{t.formatsTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {formats.map(f => (
              <div key={f.ext} className="rounded-2xl bg-[#0b0a1f] border border-white/5 p-4 flex gap-4">
                <span className="shrink-0 px-2.5 h-8 rounded-lg bg-indigo-500/15 text-indigo-300 font-mono font-black text-sm flex items-center">{f.ext}</span>
                <p className="text-sm text-slate-400 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {sections.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sections.map((s, i) => (
            <article key={i} className="rounded-3xl p-6 md:p-8 bg-[#0b0a1f] border border-white/5 space-y-3">
              <h2 className="text-lg md:text-xl font-black text-white leading-tight">{s.title}</h2>
              {String(s.text).split('\n\n').map((p, j) => (
                <p key={j} className="text-sm md:text-base text-slate-400 leading-relaxed">{p}</p>
              ))}
            </article>
          ))}
        </section>
      )}

      {faqs.length > 0 && (
        <section aria-labelledby="lv-faq" className="max-w-4xl mx-auto w-full space-y-6">
          <h2 id="lv-faq" className="text-2xl md:text-4xl font-black text-white tracking-tight text-center">{t.faqTitle || 'Frequently asked questions'}</h2>
          <div className="grid gap-3">
            {faqs.map((f, i) => (
              <details key={i} className="glass-card rounded-2xl px-5 py-4 border border-white/5 hover:border-indigo-500/20 group [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-start gap-3 cursor-pointer list-none">
                  <h3 className="flex-1 text-base font-bold text-white">{f.question}</h3>
                  <span className="shrink-0 text-indigo-400 transition-transform group-open:rotate-45 text-xl leading-none">+</span>
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
