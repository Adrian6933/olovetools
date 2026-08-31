import React from 'react';
import {
  IconGzip,
  IconHandoff,
  IconLocal,
  IconPlugins,
  IconPrecision,
  IconRepair,
  StepDropArt,
  StepShipArt,
  StepTuneArt,
} from './Illustrations';

// ============================================================================
// The explanatory half of the page: how it works, what it does, and the FAQ.
// ============================================================================

interface StoryProps {
  t: any;
  animated: boolean;
}

const STEPS = [
  { Art: StepDropArt, key: 'how1' },
  { Art: StepTuneArt, key: 'how2' },
  { Art: StepShipArt, key: 'how3' },
];

export const HowItWorks: React.FC<StoryProps> = ({ t, animated }) => (
  <section className="space-y-6">
    <div className="text-center space-y-2">
      <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
        {t.howTitle || 'How it works'}
      </h2>
      <p className="text-sm text-gray-500 max-w-xl mx-auto leading-relaxed">
        {t.howSubtitle || ''}
      </p>
    </div>

    <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 list-none p-0 m-0">
      {STEPS.map(({ Art, key }, index) => (
        <li key={key} className="glass-card rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 shrink-0 grid place-items-center rounded-lg bg-cyan-500/15 border border-cyan-500/25 text-[11px] font-black text-cyan-300">
              {index + 1}
            </span>
            <h3 className="text-sm font-bold text-white tracking-tight min-w-0">
              {t[`${key}Title`] || ''}
            </h3>
          </div>
          <Art className="w-full h-auto max-h-28" animated={animated} />
          <p className="text-[12px] text-gray-500 leading-relaxed">{t[`${key}Text`] || ''}</p>
        </li>
      ))}
    </ol>
  </section>
);

const FEATURES = [
  { Icon: IconPlugins, key: 'feat_engine' },
  { Icon: IconRepair, key: 'feat_repair' },
  { Icon: IconPrecision, key: 'feat_precision' },
  { Icon: IconGzip, key: 'feat_gzip' },
  { Icon: IconLocal, key: 'feat_local' },
  { Icon: IconHandoff, key: 'feat_handoff' },
];

export const Features: React.FC<{ t: any }> = ({ t }) => (
  <section className="space-y-6">
    <h2 className="text-xl md:text-2xl font-black text-white tracking-tight text-center">
      {t.featuresTitle || 'What it does'}
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {FEATURES.map(({ Icon, key }) => (
        <div key={key} className="glass-card rounded-2xl p-5 space-y-2.5">
          <span className="inline-grid place-items-center w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
            <Icon className="w-5 h-5" />
          </span>
          <h3 className="text-sm font-bold text-white tracking-tight">{t[`${key}Title`] || ''}</h3>
          <p className="text-[12px] text-gray-500 leading-relaxed">{t[`${key}Text`] || ''}</p>
        </div>
      ))}
    </div>
  </section>
);

export const Faq: React.FC<{ t: any }> = ({ t }) => {
  if (!Array.isArray(t.faq) || t.faq.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl md:text-2xl font-black text-white tracking-tight text-center">
        {t.faqTitle || 'Frequently asked questions'}
      </h2>
      <div className="space-y-2 max-w-3xl mx-auto">
        {t.faq.map((item: { question: string; answer: string }, index: number) => (
          <details
            key={index}
            className="group glass-card rounded-2xl overflow-hidden border border-white/5 [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="px-5 py-4 flex items-center gap-3 cursor-pointer list-none hover:bg-white/[0.03] transition-colors">
              <span className="flex-1 min-w-0 text-sm font-bold text-white">{item.question}</span>
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 shrink-0 text-cyan-400 transition-transform group-open:rotate-45"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </summary>
            <p className="px-5 pb-4 text-[13px] text-gray-400 leading-relaxed m-0">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
};
