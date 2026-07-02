import React from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';
import { ToolTheme } from '../../lib/themes';

interface BottomCTAProps {
  theme: ToolTheme;
  title: string;
  description: string;
  ctaLabel: string;
  onCtaClick: () => void;
  secondaryLabel?: string;
  onSecondaryClick?: () => void;
}

export const BottomCTA: React.FC<BottomCTAProps> = ({
  theme,
  title,
  description,
  ctaLabel,
  onCtaClick,
  secondaryLabel,
  onSecondaryClick,
}) => {
  return (
    <section
      aria-labelledby="bottomcta-h2"
      className="max-w-screen-xl mx-auto px-4 py-12 md:py-20"
    >
      <div
        className="relative overflow-hidden p-8 md:p-14 text-center space-y-6"
        style={{
          background: `linear-gradient(135deg, ${theme.primaryHex}25 0%, ${theme.primaryHex}08 100%)`,
          border: `1px solid ${theme.primaryHex}40`,
          borderRadius: theme.radius === 'full' ? '2rem' : '1.5rem',
        }}
      >
        <div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-30"
          style={{ backgroundColor: theme.primaryHex }}
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: theme.primaryHex }}
          aria-hidden="true"
        />

        <div className="relative space-y-5 max-w-2xl mx-auto">
          <Sparkles
            className="w-8 h-8 mx-auto"
            style={{ color: theme.primaryHex }}
            strokeWidth={2}
          />
          <h2
            id="bottomcta-h2"
            className="text-3xl md:text-5xl font-black tracking-tighter leading-tight"
            style={{ color: theme.text }}
          >
            {title}
          </h2>
          <p className="text-base md:text-lg" style={{ color: theme.textMuted }}>
            {description}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onCtaClick}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-xl"
              style={{
                backgroundColor: theme.primaryHex,
                color: '#fff',
                boxShadow: `0 12px 32px -8px ${theme.primaryHex}80`,
              }}
            >
              <ArrowUp className="w-4 h-4" strokeWidth={3} />
              {ctaLabel}
            </button>
            {secondaryLabel && onSecondaryClick && (
              <button
                onClick={onSecondaryClick}
                className="px-6 py-3 rounded-2xl text-sm font-bold transition-all hover:scale-105 active:scale-95 border"
                style={{
                  backgroundColor: 'transparent',
                  color: theme.text,
                  borderColor: theme.border,
                }}
              >
                {secondaryLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
