import React, { useRef } from 'react';
import { FileUp, ImagePlus, LayoutTemplate, Sparkles, X } from 'lucide-react';
import { TEMPLATES, type Template } from '../lib/templates';

interface StartPanelProps {
  t: any;
  /** File waiting to be placed. Nothing happens to it until the user says so. */
  pending: { file: File; url: string; from: string } | null;
  pendingWidth: number;
  onPendingWidth: (w: number) => void;
  onPlacePending: () => void;
  onDiscardPending: () => void;
  onPickImage: (file: File) => void;
  onImportJson: (file: File) => void;
  onTemplate: (tpl: Template) => void;
  hasBoard: boolean;
}

const card =
  'flex flex-col gap-2 p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:border-cyan-500/30 hover:bg-cyan-500/[0.06] text-left transition-all cursor-pointer';

export const StartPanel: React.FC<StartPanelProps> = ({
  t,
  pending,
  pendingWidth,
  onPendingWidth,
  onPlacePending,
  onDiscardPending,
  onPickImage,
  onImportJson,
  onTemplate,
  hasBoard,
}) => {
  const imgInput = useRef<HTMLInputElement | null>(null);
  const jsonInput = useRef<HTMLInputElement | null>(null);

  return (
    <div className="glass-card rounded-2xl p-5 space-y-5">
      <div className="flex items-center gap-2">
        <LayoutTemplate className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-black tracking-tight text-white">
          {hasBoard ? t.addToBoardTitle || 'Add to the board' : t.startTitle || 'Start a board'}
        </h3>
      </div>

      {/* An image that arrived by drop, paste or handoff sits here until the
          user places it: uploading something never triggers work by itself. */}
      {pending && (
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/[0.07] p-4 space-y-3">
          <div className="flex items-start gap-3">
            <img src={pending.url} alt="" className="w-20 h-20 object-cover rounded-lg border border-white/10 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{pending.file.name}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {pending.from
                  ? (t.pendingFrom || 'Handed over by {tool}').replace('{tool}', pending.from)
                  : t.pendingWaiting || 'Waiting — nothing has been placed yet.'}
              </p>
            </div>
            <button
              onClick={onDiscardPending}
              aria-label={t.discard || 'Discard'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <label className="block space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              {t.pendingWidth || 'Width on the board'}: <span className="text-cyan-300 tabular-nums">{pendingWidth}px</span>
            </span>
            <input
              type="range"
              min={120}
              max={720}
              step={20}
              value={pendingWidth}
              onChange={e => onPendingWidth(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </label>

          <button
            onClick={onPlacePending}
            className="w-full py-2.5 rounded-xl bg-cyan-500 text-[#04080a] text-xs font-black hover:bg-cyan-400 active:scale-[0.99] transition-all cursor-pointer"
          >
            {t.pendingPlace || 'Place it on the board'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {TEMPLATES.map(tpl => (
          <button key={tpl.id} onClick={() => onTemplate(tpl)} className={card}>
            <span className="flex items-center gap-2 text-xs font-black text-white">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              {t[tpl.titleKey] || tpl.titleFallback}
            </span>
            <span className="text-[11px] text-slate-400 leading-relaxed">{t[tpl.descKey] || tpl.descFallback}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => imgInput.current?.click()}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:border-cyan-500/30 text-xs font-bold transition-all cursor-pointer"
        >
          <ImagePlus className="w-4 h-4 text-cyan-400" />
          {t.addImage || 'Add an image'}
        </button>
        <button
          onClick={() => jsonInput.current?.click()}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:border-cyan-500/30 text-xs font-bold transition-all cursor-pointer"
        >
          <FileUp className="w-4 h-4 text-cyan-400" />
          {t.importJson || 'Open a .json board'}
        </button>
      </div>

      <input
        ref={imgInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const f = e.target.files && e.target.files[0];
          if (f) onPickImage(f);
          e.target.value = '';
        }}
      />
      <input
        ref={jsonInput}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={e => {
          const f = e.target.files && e.target.files[0];
          if (f) onImportJson(f);
          e.target.value = '';
        }}
      />
    </div>
  );
};

export default StartPanel;
