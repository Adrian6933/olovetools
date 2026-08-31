import React, { useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, ChevronDown, Loader2, Mic2, Play, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { MAX_BLOCK_CHARS } from '../lib/api';
import { resolve } from '../lib/script';
import type { Block, BlockStatus, NeuralVoice, TimelineMark } from '../types';

interface Defaults {
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
}

interface ScriptEditorProps {
  blocks: Block[];
  status: Record<string, BlockStatus>;
  defaults: Defaults;
  voiceLabel: (shortName: string) => string;
  voices: NeuralVoice[];
  /** Marks of the block currently playing, for the word highlight. */
  activeBlockId: string | null;
  activeWord: TimelineMark | null;
  expandedId: string | null;
  onToggleExpanded: (id: string | null) => void;
  onChange: (id: string, patch: Partial<Block>) => void;
  onSplit: (id: string, caret: number) => void;
  onRemove: (id: string) => void;
  onAdd: (afterId: string) => void;
  onPickVoice: (id: string) => void;
  onPreviewBlock: (id: string) => void;
  onSeekBlock: (id: string) => void;
  t: any;
}

const STATUS_DOT: Record<BlockStatus, string> = {
  stale: 'bg-slate-600',
  queued: 'bg-amber-500/40',
  rendering: 'bg-amber-400',
  done: 'bg-emerald-500',
  error: 'bg-red-500',
};

/** Grows the textarea to its content so no paragraph hides behind a scrollbar. */
function useAutoSize(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(72, el.scrollHeight)}px`;
  }, [value]);
  return ref;
}

const OverrideSlider: React.FC<{
  label: string;
  value: number | null;
  fallback: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (value: number | null) => void;
  resetLabel: string;
}> = ({ label, value, fallback, min, max, step, suffix, onChange, resetLabel }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</span>
      <span className="flex items-center gap-1.5">
        <span className={`text-[11px] font-bold tabular-nums ${value === null ? 'text-slate-600' : 'text-amber-400'}`}>
          {(value ?? fallback).toFixed(step < 1 ? 2 : 0)}
          {suffix}
        </span>
        {value !== null && (
          <button
            onClick={() => onChange(null)}
            title={resetLabel}
            aria-label={resetLabel}
            className="p-0.5 rounded text-slate-500 hover:text-amber-400 transition-colors cursor-pointer border-none bg-transparent"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value ?? fallback}
      onChange={e => onChange(parseFloat(e.target.value))}
      className="w-full accent-amber-500 cursor-pointer"
    />
  </div>
);

/**
 * The script, one paragraph per block.
 *
 * Every block carries its own optional voice and prosody, which is what turns a
 * flat narration into a two-hander dialogue, and its own render status, so a
 * re-render after an edit only touches the paragraphs that actually changed.
 */
export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  blocks,
  status,
  defaults,
  voiceLabel,
  activeBlockId,
  activeWord,
  expandedId,
  onToggleExpanded,
  onChange,
  onSplit,
  onRemove,
  onAdd,
  onPickVoice,
  onPreviewBlock,
  onSeekBlock,
  t,
}) => (
  <div className="space-y-3">
    {blocks.map((block, index) => {
      const state = status[block.id] || 'stale';
      const overridden = block.voice !== null || block.rate !== null || block.pitch !== null || block.volume !== null;
      const isActive = block.id === activeBlockId;
      const expanded = expandedId === block.id;

      return (
        <BlockRow
          key={block.id}
          block={block}
          index={index}
          state={state}
          overridden={overridden}
          isActive={isActive}
          activeWord={isActive ? activeWord : null}
          expanded={expanded}
          defaults={defaults}
          voiceLabel={voiceLabel}
          canRemove={blocks.length > 1}
          onToggleExpanded={onToggleExpanded}
          onChange={onChange}
          onSplit={onSplit}
          onRemove={onRemove}
          onAdd={onAdd}
          onPickVoice={onPickVoice}
          onPreviewBlock={onPreviewBlock}
          onSeekBlock={onSeekBlock}
          t={t}
        />
      );
    })}
  </div>
);

const BlockRow: React.FC<{
  block: Block;
  index: number;
  state: BlockStatus;
  overridden: boolean;
  isActive: boolean;
  activeWord: TimelineMark | null;
  expanded: boolean;
  defaults: Defaults;
  voiceLabel: (shortName: string) => string;
  canRemove: boolean;
  onToggleExpanded: (id: string | null) => void;
  onChange: (id: string, patch: Partial<Block>) => void;
  onSplit: (id: string, caret: number) => void;
  onRemove: (id: string) => void;
  onAdd: (afterId: string) => void;
  onPickVoice: (id: string) => void;
  onPreviewBlock: (id: string) => void;
  onSeekBlock: (id: string) => void;
  t: any;
}> = ({
  block,
  index,
  state,
  overridden,
  isActive,
  activeWord,
  expanded,
  defaults,
  voiceLabel,
  canRemove,
  onToggleExpanded,
  onChange,
  onSplit,
  onRemove,
  onAdd,
  onPickVoice,
  onPreviewBlock,
  onSeekBlock,
  t,
}) => {
  const textRef = useAutoSize(block.text);
  const overLimit = block.text.length > MAX_BLOCK_CHARS;

  return (
    <div
      className={`rounded-2xl border transition-colors ${
        isActive ? 'border-amber-500/50 bg-amber-500/[0.04]' : 'border-white/5 bg-white/[0.015] hover:border-white/10'
      }`}
    >
      <div className="flex items-start gap-2 p-3">
        <div className="flex flex-col items-center gap-1.5 pt-2 shrink-0">
          <span className={`w-2 h-2 rounded-full ${STATUS_DOT[state]} ${state === 'rendering' ? 'animate-pulse' : ''}`} />
          <button
            onClick={() => onSeekBlock(block.id)}
            title={t.jumpToBlock || 'Jump to this paragraph'}
            className="text-[10px] font-black text-slate-600 hover:text-amber-400 tabular-nums transition-colors cursor-pointer border-none bg-transparent p-0"
          >
            {String(index + 1).padStart(2, '0')}
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <textarea
            ref={textRef}
            value={block.text}
            onChange={e => onChange(block.id, { text: e.target.value })}
            onKeyDown={e => {
              // Enter starts a new paragraph, matching how the text was split
              // on import; Shift+Enter keeps a soft line break inside one.
              if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                onSplit(block.id, e.currentTarget.selectionStart);
              }
            }}
            placeholder={t.textarea_placeholder || 'Type or paste your text here to read aloud…'}
            rows={2}
            className="w-full bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none resize-none text-[15px] leading-relaxed font-medium"
          />

          {isActive && activeWord && (
            <div className="mt-1 text-[11px] font-bold text-amber-400/90 truncate" aria-live="off">
              ▸ {activeWord.x}
            </div>
          )}

          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5">
            <button
              onClick={() => onToggleExpanded(expanded ? null : block.id)}
              className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer border-none bg-transparent p-0 ${
                overridden ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              <Mic2 className="w-3 h-3" />
              <span className="truncate max-w-[11rem]">
                {block.voice ? voiceLabel(block.voice) : t.blockInheritVoice || 'Default voice'}
              </span>
              <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>

            <span className={`text-[10px] font-bold tabular-nums ${overLimit ? 'text-red-400' : 'text-slate-600'}`}>
              {block.text.length}
              {overLimit ? ` / ${MAX_BLOCK_CHARS}` : ''}
            </span>

            {state === 'error' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400">
                <AlertCircle className="w-3 h-3" />
                {t.blockError || 'Render failed'}
              </span>
            )}
            {state === 'done' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500/80">
                <CheckCircle2 className="w-3 h-3" />
                {t.blockDone || 'Rendered'}
              </span>
            )}
            {state === 'rendering' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                {t.blockRendering || 'Rendering…'}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 shrink-0">
          <button
            onClick={() => onPreviewBlock(block.id)}
            title={t.blockPreview || 'Preview this paragraph'}
            aria-label={t.blockPreview || 'Preview this paragraph'}
            className="p-1.5 rounded-lg text-slate-600 hover:text-amber-400 hover:bg-white/5 transition-colors cursor-pointer border-none bg-transparent"
          >
            <Play className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAdd(block.id)}
            title={t.blockAdd || 'Add a paragraph below'}
            aria-label={t.blockAdd || 'Add a paragraph below'}
            className="p-1.5 rounded-lg text-slate-600 hover:text-amber-400 hover:bg-white/5 transition-colors cursor-pointer border-none bg-transparent"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onRemove(block.id)}
            disabled={!canRemove}
            title={t.blockRemove || 'Delete this paragraph'}
            aria-label={t.blockRemove || 'Delete this paragraph'}
            className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer border-none bg-transparent disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/5 px-3 py-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div className="sm:col-span-2 flex items-center gap-2">
            <button
              onClick={() => onPickVoice(block.id)}
              className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 border border-white/10 hover:border-amber-500/40 text-left transition-colors cursor-pointer"
            >
              <Mic2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-xs font-bold text-slate-200 truncate">
                {block.voice ? voiceLabel(block.voice) : `${t.blockInheritVoice || 'Default voice'} · ${voiceLabel(defaults.voice)}`}
              </span>
            </button>
            {block.voice && (
              <button
                onClick={() => onChange(block.id, { voice: null })}
                title={t.blockResetOverride || 'Back to the default'}
                aria-label={t.blockResetOverride || 'Back to the default'}
                className="p-2 rounded-xl border border-white/10 text-slate-500 hover:text-amber-400 transition-colors cursor-pointer bg-transparent"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <OverrideSlider
            label={t.label_speed || 'Reading speed'}
            value={block.rate}
            fallback={resolve(block, 'rate', defaults.rate)}
            min={0.5}
            max={2}
            step={0.05}
            suffix="×"
            onChange={value => onChange(block.id, { rate: value })}
            resetLabel={t.blockResetOverride || 'Back to the default'}
          />
          <OverrideSlider
            label={t.label_pitch || 'Voice pitch'}
            value={block.pitch}
            fallback={resolve(block, 'pitch', defaults.pitch)}
            min={0.5}
            max={1.5}
            step={0.05}
            suffix="×"
            onChange={value => onChange(block.id, { pitch: value })}
            resetLabel={t.blockResetOverride || 'Back to the default'}
          />
          <OverrideSlider
            label={t.label_volume || 'Volume'}
            value={block.volume}
            fallback={resolve(block, 'volume', defaults.volume)}
            min={10}
            max={100}
            step={5}
            suffix="%"
            onChange={value => onChange(block.id, { volume: value })}
            resetLabel={t.blockResetOverride || 'Back to the default'}
          />
        </div>
      )}
    </div>
  );
};

export default ScriptEditor;
