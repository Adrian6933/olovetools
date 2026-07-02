import React from 'react';
import { ToolTheme } from '../../lib/themes';

interface ContainerProps {
  theme: ToolTheme;
  /** Visual variant: subtle, elevated, gradient, borderless */
  variant?: 'subtle' | 'elevated' | 'gradient' | 'borderless';
  /** Max width constraint */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  /** Vertical padding scale */
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  /** Render as <section> (default) or <div> */
  as?: 'section' | 'div' | 'article';
  className?: string;
  children: React.ReactNode;
  id?: string;
  ariaLabel?: string;
}

const MAX_WIDTHS = {
  sm: 'max-w-3xl',
  md: 'max-w-4xl',
  lg: 'max-w-5xl',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  '3xl': 'max-w-[1600px]',
  full: 'max-w-full',
};

const PADDINGS = {
  sm: 'px-4 py-8',
  md: 'px-4 md:px-6 py-10 md:py-12',
  lg: 'px-4 md:px-8 py-12 md:py-16',
  xl: 'px-4 md:px-10 py-16 md:py-20',
};

export const Container: React.FC<ContainerProps> = ({
  theme,
  variant = 'subtle',
  maxWidth = 'xl',
  padding = 'lg',
  as: Tag = 'section',
  className = '',
  children,
  id,
  ariaLabel,
}) => {
  const variantStyles: Record<NonNullable<ContainerProps['variant']>, React.CSSProperties> = {
    subtle: {
      backgroundColor: 'transparent',
    },
    elevated: {
      backgroundColor: `${theme.surface}`,
      border: `1px solid ${theme.border}`,
      borderRadius: theme.radius === 'full' ? '2rem' : '1.5rem',
      backdropFilter: 'blur(16px)',
    },
    gradient: {
      background: `linear-gradient(135deg, ${theme.primaryHex}10 0%, ${theme.primaryHex}03 100%)`,
      border: `1px solid ${theme.border}`,
      borderRadius: theme.radius === 'full' ? '2rem' : '1.5rem',
    },
    borderless: {
      backgroundColor: 'transparent',
    },
  };

  return (
    <Tag
      id={id}
      aria-label={ariaLabel}
      className={`${MAX_WIDTHS[maxWidth]} mx-auto ${PADDINGS[padding]} ${className}`}
      style={variantStyles[variant]}
    >
      {children}
    </Tag>
  );
};
