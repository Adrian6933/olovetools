import React from 'react';
import { Download, Trash2, Settings2 } from 'lucide-react';
import { ToolTheme } from '../../../../lib/themes';
import { CompressSettings } from '../../types';

interface LabDockProps {
  theme: ToolTheme;
  settings: CompressSettings;
  onSettingsChange: (settings: CompressSettings) => void;
  hasCompletedItems: boolean;
  hasItems: boolean;
  onDownloadAll: () => void;
  onClearAll: () => void;
  labels: {
    qualityLabel: string;
    formatLabel: string;
    originalFormat: string;
    downloadAllBtn: string;
    clearBtn: string;
    settingsTitle: string;
  };
}

const FORMAT_OPTIONS = [
  { key: 'original', label: 'Original' },
  { key: 'image/webp', label: 'WebP' },
  { key: 'image/jpeg', label: 'JPG' },
  { key: 'image/png', label: 'PNG' },
];

export const LabDock: React.FC<LabDockProps> = ({
  theme,
  settings,
  onSettingsChange,
  hasCompletedItems,
  hasItems,
  onDownloadAll,
  onClearAll,
  labels,
}) => {
  return (
    <div
      className="flex flex-col gap-3 px-4 py-3 sm:px-5 sm:py-4"
      style={{
        backgroundColor: `${theme.bg}e6`,
        backdropFilter: 'blur(24px)',
        borderRadius: theme.radius === 'full' ? '9999px' : '1rem',
        border: `1px solid ${theme.border}`,
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}
    >
      {/* Title row (mobile) */}
      <div className="flex items-center gap-2 sm:hidden">
        <Settings2 className="w-3.5 h-3.5" style={{ color: theme.primaryHex }} />
        <span
          className="text-[10px] font-black uppercase tracking-widest"
          style={{ color: theme.textMuted }}
        >
          {labels.settingsTitle}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        {/* Quality slider */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span
            className="text-[10px] font-black uppercase tracking-widest shrink-0"
            style={{ color: theme.textMuted }}
          >
            {labels.qualityLabel}
          </span>
          <input
            type="range"
            min="1"
            max="100"
            value={settings.quality}
            onChange={(e) =>
              onSettingsChange({ ...settings, quality: Number(e.target.value) })
            }
            disabled={settings.format === 'image/png'}
            className="flex-1 h-1 cursor-pointer disabled:opacity-40"
            style={{
              accentColor: theme.primaryHex,
            }}
          />
          <span
            className="text-xs font-black tabular-nums shrink-0 w-8 text-right"
            style={{ color: theme.primaryHex }}
          >
            {settings.quality}%
          </span>
        </div>

        <div
          className="hidden sm:block w-px h-6"
          style={{ backgroundColor: theme.border }}
        />

        {/* Format selector */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-[10px] font-black uppercase tracking-widest shrink-0 hidden sm:inline"
            style={{ color: theme.textMuted }}
          >
            {labels.formatLabel}
          </span>
          <div
            className="flex gap-1 p-0.5 rounded-lg"
            style={{ backgroundColor: `${theme.primaryHex}10` }}
          >
            {FORMAT_OPTIONS.map((opt) => {
              const isActive = settings.format === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() =>
                    onSettingsChange({ ...settings, format: opt.key as any })
                  }
                  className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all"
                  style={{
                    backgroundColor: isActive ? theme.primaryHex : 'transparent',
                    color: isActive ? '#fff' : theme.textMuted,
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="hidden sm:block w-px h-6"
          style={{ backgroundColor: theme.border }}
        />

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {hasItems && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95"
              style={{
                backgroundColor: 'transparent',
                color: theme.textMuted,
                border: `1px solid ${theme.border}`,
              }}
              title={labels.clearBtn}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{labels.clearBtn}</span>
            </button>
          )}

          <button
            onClick={onDownloadAll}
            disabled={!hasCompletedItems}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-black transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              backgroundColor: theme.primaryHex,
              color: '#fff',
              boxShadow: hasCompletedItems ? `0 4px 16px ${theme.primaryHex}40` : 'none',
            }}
          >
            <Download className="w-3.5 h-3.5" strokeWidth={3} />
            {labels.downloadAllBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
