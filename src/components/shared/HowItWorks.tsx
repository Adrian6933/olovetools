import React from 'react';
import { ToolTheme } from '../../lib/themes';

export type HowToVariant = 'steps-numbered' | 'timeline-vertical' | 'steps-alternating';

interface Step {
  title: string;
  text: string;
  emoji?: string;
}

interface HowItWorksProps {
  theme: ToolTheme;
  id?: string;
  title: string;
  subtitle?: string;
  steps: Step[];
  variant: HowToVariant;
  /** Base URL for HowTo JSON-LD (e.g. https://olovetools.com/en/compresssnap) */
  pageUrl: string;
  /** Tool name for the HowTo context */
  toolName: string;
  /** Description of the HowTo */
  description: string;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({
  theme,
  id = 'howto',
  title,
  subtitle,
  steps,
  variant,
  pageUrl,
  toolName,
  description,
}) => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `${title} · ${toolName}`,
    description,
    totalTime: 'PT1M',
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.title,
      text: s.text,
    })),
  };

  return (
    <section
      aria-labelledby={`${id}-h2`}
      className="max-w-screen-xl mx-auto px-4 py-12 md:py-16"
      itemScope
      itemType="https://schema.org/HowTo"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <meta itemProp="name" content={`${title} · ${toolName}`} />
      <meta itemProp="description" content={description} />
      <div className="text-center max-w-2xl mx-auto mb-8 md:mb-12 space-y-3">
        <span
          className="inline-block text-[10px] font-black uppercase tracking-[0.25em] px-2.5 py-1 rounded-md"
          style={{ backgroundColor: `${theme.primaryHex}15`, color: theme.primaryHex }}
        >
          How it works
        </span>
        <h2
          id={`${id}-h2`}
          className="text-3xl md:text-4xl font-black tracking-tighter"
          style={{ color: theme.text }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-base" style={{ color: theme.textMuted }}>
            {subtitle}
          </p>
        )}
      </div>

      {variant === 'steps-numbered' && (
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6" role="list">
          {steps.map((s, i) => (
            <li
              key={i}
              className="relative p-6 rounded-3xl space-y-3"
              style={{
                backgroundColor: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: theme.radius === 'full' ? '1.5rem' : '1.25rem',
              }}
              itemProp="step"
              itemScope
              itemType="https://schema.org/HowToStep"
            >
              <meta itemProp="position" content={String(i + 1)} />
              <div className="flex items-center gap-3">
                <span
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-base font-black"
                  style={{ backgroundColor: theme.primaryHex, color: '#fff' }}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <span className="text-2xl" aria-hidden="true">
                  {s.emoji}
                </span>
              </div>
              <h3 className="text-lg font-black" style={{ color: theme.text }} itemProp="name">
                {s.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }} itemProp="text">
                {s.text}
              </p>
            </li>
          ))}
        </ol>
      )}

      {variant === 'timeline-vertical' && (
        <ol className="relative max-w-2xl mx-auto space-y-6" role="list">
          {/* vertical line */}
          <div
            className="absolute left-5 top-0 bottom-0 w-px"
            style={{ backgroundColor: theme.border }}
            aria-hidden="true"
          />
          {steps.map((s, i) => (
            <li
              key={i}
              className="relative pl-16"
              itemProp="step"
              itemScope
              itemType="https://schema.org/HowToStep"
            >
              <meta itemProp="position" content={String(i + 1)} />
              <div
                className="absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2"
                style={{
                  backgroundColor: theme.bg,
                  color: theme.primaryHex,
                  borderColor: theme.primaryHex,
                }}
                aria-hidden="true"
              >
                {i + 1}
              </div>
              <div
                className="p-5 rounded-2xl"
                style={{
                  backgroundColor: theme.surface,
                  border: `1px solid ${theme.border}`,
                }}
              >
                <h3 className="text-base font-black mb-1" style={{ color: theme.text }} itemProp="name">
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }} itemProp="text">
                  {s.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {variant === 'steps-alternating' && (
        <ol className="space-y-8" role="list">
          {steps.map((s, i) => {
            const reverse = i % 2 === 1;
            return (
              <li
                key={i}
                className={`flex flex-col md:flex-row items-center gap-6 ${reverse ? 'md:flex-row-reverse' : ''}`}
                itemProp="step"
                itemScope
                itemType="https://schema.org/HowToStep"
              >
                <meta itemProp="position" content={String(i + 1)} />
                <div
                  className="shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black"
                  style={{
                    backgroundColor: `${theme.primaryHex}20`,
                    border: `1px solid ${theme.border}`,
                    color: theme.primaryHex,
                  }}
                  aria-hidden="true"
                >
                  {s.emoji ?? i + 1}
                </div>
                <div className="flex-1 space-y-2 text-center md:text-left">
                  <span
                    className="text-[10px] font-black uppercase tracking-widest"
                    style={{ color: theme.textMuted }}
                  >
                    Step {i + 1}
                  </span>
                  <h3 className="text-xl font-black" style={{ color: theme.text }} itemProp="name">
                    {s.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }} itemProp="text">
                    {s.text}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};
