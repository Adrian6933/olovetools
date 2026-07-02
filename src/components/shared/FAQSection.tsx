import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToolTheme } from '../../lib/themes';

export type FAQVariant = 'accordion-default' | 'accordion-first-open';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  theme: ToolTheme;
  id?: string;
  title: string;
  subtitle?: string;
  items: FAQItem[];
  variant: FAQVariant;
}

export const FAQSection: React.FC<FAQSectionProps> = ({
  theme,
  id = 'faq',
  title,
  subtitle,
  items,
  variant,
}) => {
  const initialOpen = variant === 'accordion-first-open' ? 0 : null;
  const [open, setOpen] = useState<number | null>(initialOpen);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: it.answer,
      },
    })),
  };

  return (
    <section
      aria-labelledby={`${id}-h2`}
      className="max-w-3xl mx-auto px-4 py-12 md:py-16"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="text-center max-w-2xl mx-auto mb-8 md:mb-10 space-y-3">
        <span
          className="inline-block text-[10px] font-black uppercase tracking-[0.25em] px-2.5 py-1 rounded-md"
          style={{ backgroundColor: `${theme.primaryHex}15`, color: theme.primaryHex }}
        >
          FAQ
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

      <div
        className="space-y-3"
        itemScope
        itemType="https://schema.org/FAQPage"
      >
        {items.map((it, i) => {
          const isOpen = open === i;
          return (
            <div
              key={i}
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: isOpen ? theme.surface : `${theme.primaryHex}05`,
                border: `1px solid ${isOpen ? theme.primaryHex : theme.border}`,
              }}
              itemScope
              itemType="https://schema.org/Question"
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full px-4 md:px-5 py-4 flex items-center justify-between gap-3 text-left transition-all"
                aria-expanded={isOpen}
                aria-controls={`faq-${id}-${i}`}
              >
                <h3
                  className="text-sm md:text-base font-black flex-1"
                  style={{ color: theme.text }}
                  itemProp="name"
                >
                  {it.question}
                </h3>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  style={{ color: theme.textMuted }}
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={`faq-${id}-${i}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                    itemScope
                    itemProp="acceptedAnswer"
                    itemType="https://schema.org/Answer"
                  >
                    <p
                      className="px-4 md:px-5 pb-4 text-sm leading-relaxed"
                      style={{ color: theme.textMuted }}
                      itemProp="text"
                    >
                      {it.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
};
