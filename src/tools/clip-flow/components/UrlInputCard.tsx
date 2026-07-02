import React, { useState } from 'react';
import { Link2, Loader2, AlertCircle, Scissors, Download } from 'lucide-react';

interface UrlInputCardProps {
  t: any;
  onSubmit: (input: string) => void;
  loading: boolean;
  loadingLabel?: string;
  error: string | null;
}

export const UrlInputCard: React.FC<UrlInputCardProps> = ({ t, onSubmit, loading, loadingLabel, error }) => {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !loading) onSubmit(value.trim());
  };

  return (
    <div className="glass-card rounded-3xl p-6 md:p-10 space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-violet-400" />
          {t.inputTitle || 'Paste a Twitch VOD or channel'}
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t.inputPlaceholder || 'twitch.tv/videos/123456789 or channel name'}
            className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-colors"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !value.trim()}
            className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl transition-colors shrink-0"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Scissors className="w-5 h-5" />}
            {loading ? (loadingLabel || t.loadingVod || 'Loading...') : (t.inputButton || 'Load video')}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>{t.exampleLabel || 'Examples:'}</span>
          <code className="bg-white/5 px-2 py-0.5 rounded">twitch.tv/videos/123456789</code>
          <code className="bg-white/5 px-2 py-0.5 rounded">shroud</code>
        </div>
      </form>

      {error && (
        <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
            <Link2 className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{t.featurePasteTitle || '1. Paste'}</p>
            <p className="text-xs text-slate-500">{t.featurePasteText || 'Any VOD or live channel link.'}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
            <Scissors className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{t.featureCutTitle || '2. Mark cuts'}</p>
            <p className="text-xs text-slate-500">{t.featureCutText || 'Mark as many ranges as you want, any length.'}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
            <Download className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{t.featureExportTitle || '3. Export'}</p>
            <p className="text-xs text-slate-500">{t.featureExportText || 'Download separately or joined as one MP4.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
