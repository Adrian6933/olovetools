import React from 'react';
import { ToolTheme } from '../../lib/themes';

export type FeaturesVariant = 'cards-3col' | 'cards-4col' | 'list-checkmark';

interface FeatureItem {
  title: string;
  text: string;
  emoji?: string;
}

interface FeaturesGridProps {
  theme: ToolTheme;
  id?: string;
  title: string;
  subtitle?: string;
  features: FeatureItem[];
  variant: FeaturesVariant;
}

export const FeaturesGrid: React.FC<FeaturesGridProps> = ({
  theme,
  id = 'features',
  title,
  subtitle,
  features,
  variant,
}) => {
  if (variant === 'cards-3col' || variant === 'cards-4col') {
    const cols = variant === 'cards-3col' ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4';
    return (
      <section
        aria-labelledby={`${id}-h2`}
        className="max-w-screen-xl mx-auto px-4 py-12 md:py-16"
      >
        <div className="text-center max-w-2xl mx-auto mb-8 md:mb-12 space-y-3">
          <span
            className="inline-block text-[10px] font-black uppercase tracking-[0.25em] px-2.5 py-1 rounded-md"
            style={{ backgroundColor: `${theme.primaryHex}15`, color: theme.primaryHex }}
          >
            Features
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
        <ul
          role="list"
          className={`grid grid-cols-1 ${cols} gap-4 md:gap-6`}
        >
          {features.map((f, i) => (
            <li
              key={i}
              className="p-6 rounded-3xl space-y-3 transition-all hover:-translate-y-1"
              style={{
                backgroundColor: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: theme.radius === 'full' ? '1.5rem' : theme.radius === 'sm' ? '0.75rem' : '1.25rem',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
                style={{
                  backgroundColor: `${theme.primaryHex}20`,
                  border: `1px solid ${theme.border}`,
                  borderRadius: theme.radius === 'full' ? '9999px' : '0.5rem',
                }}
              >
                {f.emoji ?? ['⚡', '🔒', '✨', '🚀', '💎', '🎯'][i % 6]}
              </div>
              <h3 className="text-base font-black" style={{ color: theme.text }}>
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }}>
                {f.text}
              </p>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  // list-checkmark
  return (
    <section
      aria-labelledby={`${id}-h2`}
      className="max-w-screen-xl mx-auto px-4 py-12 md:py-16"
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-2 space-y-3">
          <span
            className="inline-block text-[10px] font-black uppercase tracking-[0.25em] px-2.5 py-1 rounded-md"
            style={{ backgroundColor: `${theme.primaryHex}15`, color: theme.primaryHex }}
          >
            Features
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
        <ul role="list" className="lg:col-span-3 space-y-3">
          {features.map((f, i) => (
            <li
              key={i}
              className="flex items-start gap-4 p-4 rounded-2xl transition-all"
              style={{
                backgroundColor: `${theme.primaryHex}08`,
                border: `1px solid ${theme.border}`,
              }}
            >
              <div
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm"
                style={{ backgroundColor: theme.primaryHex, color: '#fff' }}
              >
                ✓
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-black mb-1" style={{ color: theme.text }}>
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }}>
                  {f.text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
