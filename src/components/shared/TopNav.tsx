import React from 'react';
import { Heart, ArrowUp, Sparkles } from 'lucide-react';
import { ToolTheme } from '../../lib/themes';
import { LanguagePill } from './LanguagePill';

interface TopNavProps {
  theme: ToolTheme;
  currentLang: string;
  onLanguageChange: (lang: string) => void;
  toolName?: string;
  toolIcon?: React.ReactNode;
}

export const TopNav: React.FC<TopNavProps> = ({
  theme,
  currentLang,
  onLanguageChange,
  toolName,
  toolIcon,
}) => {
  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header
      role="banner"
      className="fixed top-0 left-0 right-0 z-40 h-16 backdrop-blur-xl border-b"
      style={{
        backgroundColor: `${theme.bg}f0`,
        borderColor: theme.border,
      }}
    >
      <div className="h-full max-w-screen-2xl mx-auto px-4 md:px-6 flex items-center justify-between gap-3">
        {/* Left: Logo + Tool name (clickable → scroll to top) */}
        <button
          onClick={handleScrollTop}
          className="flex items-center gap-3 shrink-0 group cursor-pointer border-none bg-transparent"
          aria-label="Scroll to top"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-105 group-hover:-translate-y-0.5"
            style={{ backgroundColor: theme.primaryHex }}
          >
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-white transition-all group-hover:brightness-110">
            oLove<span style={{ color: theme.primaryHex }}>Tools</span>
          </span>

          {toolName && (
            <>
              <div className="h-6 w-px" style={{ backgroundColor: theme.border }} />
              {toolIcon && (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${theme.primaryHex}20` }}
                >
                  {toolIcon}
                </div>
              )}
              <span
                className="text-lg font-bold tracking-tight hidden sm:inline"
                style={{ color: theme.text }}
              >
                {toolName}
              </span>
              <ArrowUp
                className="w-4 h-4 opacity-0 -ml-2 group-hover:opacity-40 group-hover:ml-0 transition-all"
                style={{ color: theme.textMuted }}
              />
            </>
          )}
        </button>

        {/* Right: Language pill only */}
        <div className="flex items-center gap-2 shrink-0">
          <LanguagePill
            theme={theme}
            currentLang={currentLang}
            onLanguageChange={onLanguageChange}
            variant="topnav"
          />
        </div>
      </div>
    </header>
  );
};
