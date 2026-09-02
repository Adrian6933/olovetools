import React from 'react';
import { Lock, Zap, Server, Shield, Eye, FileCheck } from 'lucide-react';
import { ToolTheme } from '../../lib/themes';

interface TrustBarProps {
  theme: ToolTheme;
  badges?: Array<{ icon?: 'lock' | 'zap' | 'server' | 'shield' | 'eye' | 'file'; label: string }>;
  note?: string;
}

const ICON_MAP = {
  lock: Lock,
  zap: Zap,
  server: Server,
  shield: Shield,
  eye: Eye,
  file: FileCheck,
};

export const TrustBar: React.FC<TrustBarProps> = ({
  theme,
  badges,
  note = 'Your files never leave your device. 100% client-side processing.',
}) => {
  const items = badges ?? [
    { icon: 'lock' as const, label: 'No upload' },
    { icon: 'zap' as const, label: 'Instant' },
    { icon: 'shield' as const, label: 'Private' },
    { icon: 'file' as const, label: 'Free' },
  ];

  return (
    <div
      className="w-full flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 py-4 px-4 rounded-2xl"
      style={{
        backgroundColor: `${theme.primaryHex}08`,
        border: `1px solid ${theme.border}`,
      }}
      role="note"
    >
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
        {items.map((b, i) => {
          const Icon = ICON_MAP[b.icon ?? 'lock'];
          return (
            <div key={i} className="flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5" style={{ color: theme.primaryHex }} strokeWidth={2.5} />
              <span
                className="text-[10px] font-black uppercase tracking-widest"
                style={{ color: theme.textMuted }}
              >
                {b.label}
              </span>
            </div>
          );
        })}
      </div>
      <span
        className="text-xs font-medium text-center sm:text-left"
        style={{ color: theme.textMuted, opacity: 0.8 }}
      >
        {note}
      </span>
    </div>
  );
};
