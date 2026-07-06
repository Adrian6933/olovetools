import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { ToolTheme } from '../../lib/themes';
import { useReducedMotion } from './motion';

export type HeroVariant = 'centered' | 'split' | 'studio' | 'terminal';

interface HeroProps {
  theme: ToolTheme;
  variant: HeroVariant;
  title: string;
  tagline: string;
  description?: string;
  /** Right-side content for split/studio/terminal variants */
  aside?: React.ReactNode;
  /** CTA buttons shown at the bottom */
  primaryCta?: { label: string; onClick: () => void; href?: string };
  secondaryCta?: { label: string; onClick: () => void; href?: string };
  /** Stats or social proof shown under CTAs */
  stats?: Array<{ value: string; label: string }>;
  /** For the studio variant: animated background element */
  decoration?: React.ReactNode;
  /** When true, the hero content is wrapped in a glass card (centered variant) */
  cardMode?: boolean;
}

export const Hero: React.FC<HeroProps> = ({
  theme,
  variant,
  title,
  tagline,
  description,
  aside,
  primaryCta,
  secondaryCta,
  stats,
  decoration,
  cardMode = true,
}) => {
  const prefersReduced = useReducedMotion();
  const CtaButton: React.FC<{ cta: NonNullable<typeof primaryCta>; variant: 'primary' | 'secondary' }> = ({
    cta,
    variant: v,
  }) => {
    const className =
      v === 'primary'
        ? 'px-7 py-3.5 rounded-2xl text-sm font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-xl'
        : 'px-7 py-3.5 rounded-2xl text-sm font-bold transition-all hover:scale-105 active:scale-95 border-2';
    const style =
      v === 'primary'
        ? {
            backgroundColor: theme.primaryHex,
            color: '#fff',
            boxShadow: `0 12px 32px -8px ${theme.primaryHex}80`,
          }
        : {
            backgroundColor: 'transparent',
            color: theme.text,
            borderColor: theme.border,
          };
    const Tag = cta.href ? 'a' : 'button';
    return (
      <Tag
        {...(cta.href ? { href: cta.href } : { onClick: cta.onClick })}
        className={className}
        style={style}
        onMouseEnter={(e) => {
          if (v === 'secondary') e.currentTarget.style.backgroundColor = `${theme.primaryHex}15`;
        }}
        onMouseLeave={(e) => {
          if (v === 'secondary') e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {cta.label}
      </Tag>
    );
  };

  const Badge = (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest"
      style={{
        backgroundColor: `${theme.primaryHex}18`,
        color: theme.primaryHex,
        border: `1px solid ${theme.border}`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ backgroundColor: theme.primaryHex }}
      />
      Free · No signup · {theme.world}
    </span>
  );

  const Heading = (
    <div className="space-y-5">
      <h1
        id="hero-h1"
        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.95]"
        style={{ color: theme.text }}
      >
        {title}{' '}
        <span
          className="bg-clip-text text-transparent"
          style={{ backgroundImage: `linear-gradient(135deg, ${theme.primaryHex}, ${theme.primaryHex}90)` }}
        >
          {tagline}
        </span>
      </h1>
      {description && (
        <p
          className="text-base md:text-lg leading-relaxed max-w-2xl mx-auto md:mx-0"
          style={{ color: theme.textMuted }}
        >
          {description}
        </p>
      )}
      {(primaryCta || secondaryCta) && (
        <div className="flex flex-wrap items-center gap-3 pt-2 justify-center md:justify-start">
          {primaryCta && <CtaButton cta={primaryCta} variant="primary" />}
          {secondaryCta && <CtaButton cta={secondaryCta} variant="secondary" />}
        </div>
      )}
      {stats && stats.length > 0 && (
        <div className="flex flex-wrap items-center gap-5 sm:gap-8 pt-3 justify-center md:justify-start">
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col">
              <span
                className="text-2xl md:text-3xl font-black tabular-nums leading-none"
                style={{ color: theme.primaryHex }}
              >
                {s.value}
              </span>
              <span
                className="text-[10px] font-black uppercase tracking-widest mt-1.5"
                style={{ color: theme.textMuted }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (variant === 'centered') {
    return (
      <section
        aria-labelledby="hero-h1"
        className="relative pt-12 pb-10 md:pt-16 md:pb-12 px-4"
      >
        {decoration && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">{decoration}</div>
        )}
        <div className="relative max-w-5xl mx-auto flex flex-col items-center text-center gap-6">
          {Badge}
          {Heading}
          <motion.button
            onClick={() => {
              document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="mt-2 inline-flex flex-col items-center gap-1 transition-all"
            style={{ color: theme.textMuted }}
            animate={prefersReduced ? {} : { y: [0, 4, 0] }}
            transition={prefersReduced ? undefined : { duration: 1.8, repeat: Infinity }}
            aria-label="Scroll to tool"
          >
            <span className="text-[10px] font-black uppercase tracking-widest">Try it now</span>
            <ChevronDown className="w-5 h-5" />
          </motion.button>
        </div>
      </section>
    );
  }

  if (variant === 'split') {
    return (
      <section
        aria-labelledby="hero-h1"
        className="relative pt-12 pb-10 md:pt-16 md:pb-12 px-4"
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-5">
            {Badge}
            {Heading}
          </div>
          {aside && (
            <div className="relative">
              <div
                className="absolute -inset-4 rounded-3xl blur-2xl opacity-30"
                style={{ backgroundColor: theme.primaryHex }}
              />
              <div className="relative">{aside}</div>
            </div>
          )}
        </div>
      </section>
    );
  }

  if (variant === 'studio') {
    return (
      <section
        aria-labelledby="hero-h1"
        className="relative pt-12 pb-12 md:pt-16 md:pb-16 px-4 overflow-hidden"
      >
        {decoration && <div className="absolute inset-0 pointer-events-none">{decoration}</div>}
        <div className="relative max-w-4xl mx-auto text-center flex flex-col items-center gap-6">
          {Badge}
          {Heading}
        </div>
        {aside && (
          <div className="relative max-w-5xl mx-auto mt-8 px-4">
            {aside}
          </div>
        )}
      </section>
    );
  }

  // terminal
  return (
    <section
      aria-labelledby="hero-h1"
      className="relative pt-12 pb-10 md:pt-16 md:pb-12 px-4"
      style={{ fontFamily: theme.font === 'mono' ? 'ui-monospace, monospace' : undefined }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          {Badge}
          {Heading}
        </div>
        {aside && <div>{aside}</div>}
      </div>
    </section>
  );
};
