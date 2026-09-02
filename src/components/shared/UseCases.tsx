import { useTextosAnuncio } from '../../config/ads';
import React from 'react';
import { ToolTheme } from '../../lib/themes';
import { AdSlot, AdSlotSize } from './AdSlot';

export type UseCasesVariant = 'text-heavy' | 'cards-2col';

interface UseCasesProps {
  theme: ToolTheme;
  id?: string;
  title: string;
  subtitle?: string;
  intro: string;
  items: Array<{ title: string; text: string }>;
  variant: UseCasesVariant;
  /** When true, render the AdSlot on the right column (desktop only) */
  withAd?: boolean;
  /** AdSense client/slot for the aside ad */
  adSenseClient?: string;
  adSenseSlot?: string;
}

export const UseCases: React.FC<UseCasesProps> = ({
  theme,
  id = 'usecases',
  title,
  subtitle,
  intro,
  items,
  variant,
  withAd = true,
  adSenseClient,
  adSenseSlot,
}) => {
  const textosAd = useTextosAnuncio();
  return (
    <section
      aria-labelledby={`${id}-h2`}
      className="max-w-screen-xl mx-auto px-4 py-12 md:py-16"
    >
      <div
        className={`grid grid-cols-1 gap-8 ${
          withAd ? 'lg:grid-cols-[1fr_300px]' : 'lg:grid-cols-1'
        }`}
      >
        <div className="space-y-5">
          <span
            className="inline-block text-[10px] font-black uppercase tracking-[0.25em] px-2.5 py-1 rounded-md"
            style={{ backgroundColor: `${theme.primaryHex}15`, color: theme.primaryHex }}
          >
            Use cases
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
          <p className="text-base leading-relaxed" style={{ color: theme.textMuted }}>
            {intro}
          </p>

          {variant === 'text-heavy' ? (
            <ul role="list" className="space-y-3 pt-2">
              {items.map((it, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-2xl transition-all"
                  style={{
                    backgroundColor: `${theme.primaryHex}08`,
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  <div
                    className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs"
                    style={{ backgroundColor: theme.primaryHex, color: '#fff' }}
                  >
                    ✓
                  </div>
                  <div>
                    <h3 className="text-sm font-black mb-0.5" style={{ color: theme.text }}>
                      {it.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }}>
                      {it.text}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {items.map((it, i) => (
                <article
                  key={i}
                  className="p-5 rounded-2xl space-y-2"
                  style={{
                    backgroundColor: theme.surface,
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  <h3 className="text-sm font-black" style={{ color: theme.text }}>
                    {it.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }}>
                    {it.text}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>

        {withAd && (
          <aside className="hidden lg:block" aria-label={textosAd.anuncio}>
            <div className="sticky top-20">
              <AdSlot
                theme={theme}
                position="side"
                size="rectangle"
                adSenseClient={adSenseClient}
                adSenseSlot={adSenseSlot}
              />
            </div>
          </aside>
        )}
      </div>
    </section>
  );
};
