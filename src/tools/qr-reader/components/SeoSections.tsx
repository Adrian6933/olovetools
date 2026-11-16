import React from 'react';
import { Camera, FileText, Lock, MonitorUp, QrCode, ScanBarcode, ShieldCheck, Smartphone, Upload, Wifi } from 'lucide-react';

/**
 * The guide under the tool. It answers what people actually search for
 * ("read a QR from an image", "QR reader on PC", "WiFi QR password",
 * "barcode scanner online") in plain words, one topic per heading. Rendered on
 * the server with the rest of the island, so it is in the page HTML.
 */
const STEP_ICONS = [Smartphone, Upload, MonitorUp, FileText];
const SECTION_ICONS = [Wifi, ScanBarcode, ShieldCheck, Lock];

const MATRIX = ['QR Code', 'Micro QR', 'rMQR', 'Data Matrix', 'Aztec', 'PDF417', 'MaxiCode'];
const LINEAR = ['EAN-13', 'EAN-8', 'UPC-A', 'UPC-E', 'ISBN', 'Code 128', 'Code 39', 'Code 93', 'Codabar', 'ITF-14', 'GS1 DataBar'];

export function SeoSections({ t, lang }: { t: any; lang: string }) {
  const steps: { title: string; text: string }[] = Array.isArray(t.guideSteps) ? t.guideSteps : [];
  const sections: { title: string; text: string }[] = Array.isArray(t.sections) ? t.sections : [];
  const faqs: { question: string; answer: string }[] = Array.isArray(t.faq) ? t.faq : [];

  return (
    <div className="mt-16 md:mt-24 space-y-16 md:space-y-24">
      {steps.length > 0 && (
        <section aria-labelledby="qr-guide" className="space-y-8">
          <div className="max-w-3xl space-y-3">
            <h2 id="qr-guide" className="text-2xl md:text-4xl font-black text-white tracking-tight">
              {t.guideTitle}
            </h2>
            {t.guideIntro && <p className="text-slate-400 text-base md:text-lg leading-relaxed">{t.guideIntro}</p>}
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, i) => {
              const Icon = STEP_ICONS[i] || Camera;
              return (
                <li key={i} className="glass-card rounded-3xl p-5 md:p-6 space-y-3 border border-white/5">
                  <span className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-300">
                    <Icon className="w-5 h-5" />
                  </span>
                  <h3 className="text-base font-black text-white leading-snug">{step.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{step.text}</p>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {sections.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sections.map((s, i) => {
            const Icon = SECTION_ICONS[i] || QrCode;
            return (
              <article key={i} className="rounded-3xl p-6 md:p-8 bg-[#061218] border border-white/5 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-300 shrink-0">
                    <Icon className="w-5 h-5" />
                  </span>
                  <h2 className="text-lg md:text-xl font-black text-white leading-tight">{s.title}</h2>
                </div>
                {String(s.text)
                  .split('\n\n')
                  .map((para, j) => (
                    <p key={j} className="text-sm md:text-base text-slate-400 leading-relaxed">
                      {para}
                    </p>
                  ))}
              </article>
            );
          })}
        </section>
      )}

      <section aria-labelledby="qr-formats" className="space-y-5">
        <h2 id="qr-formats" className="text-2xl md:text-3xl font-black text-white tracking-tight">
          {t.formatsTitle || 'Supported codes'}
        </h2>
        {t.formatsText && <p className="text-slate-400 leading-relaxed max-w-3xl">{t.formatsText}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: t.formats2d || '2D codes', list: MATRIX },
            { title: t.formats1d || 'Barcodes', list: LINEAR },
          ].map(group => (
            <div key={group.title} className="glass-card rounded-2xl p-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">{group.title}</h3>
              <ul className="flex flex-wrap gap-2">
                {group.list.map(name => (
                  <li key={name} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-slate-300">
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {faqs.length > 0 && (
        <section aria-labelledby="qr-faq" className="max-w-4xl mx-auto w-full space-y-6">
          <h2 id="qr-faq" className="text-2xl md:text-4xl font-black text-white tracking-tight text-center">
            {t.faqTitle || 'Frequently asked questions'}
          </h2>
          <div className="grid gap-3">
            {faqs.map((faq, idx) => (
              <details
                key={idx}
                className="glass-card rounded-2xl px-5 py-4 border border-white/5 hover:border-cyan-500/20 transition-colors group [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex items-start gap-3 cursor-pointer list-none text-base font-bold text-white">
                  <h3 className="flex-1 text-base font-bold">{faq.question}</h3>
                  <span className="shrink-0 text-cyan-400 transition-transform group-open:rotate-45 text-xl leading-none">+</span>
                </summary>
                <p className="text-slate-400 leading-relaxed pt-3 text-sm md:text-base">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-3xl p-6 md:p-10 bg-gradient-to-br from-cyan-500/15 to-transparent border border-cyan-500/20 flex flex-col md:flex-row md:items-center gap-5 justify-between">
        <div className="space-y-2 max-w-2xl">
          <h2 className="text-xl md:text-2xl font-black text-white">{t.makerCardTitle || 'Need to create a QR code?'}</h2>
          <p className="text-slate-400">{t.makerCardText || 'QRBolt builds styled QR codes and checks they scan before you print them.'}</p>
        </div>
        <a
          href={`/${lang.toLowerCase()}/qr-bolt/`}
          className="inline-flex items-center justify-center gap-2 px-6 h-12 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm shrink-0"
        >
          <QrCode className="w-4 h-4" />
          {t.makerCtaLong || 'Create a QR code'}
        </a>
      </section>
    </div>
  );
}
