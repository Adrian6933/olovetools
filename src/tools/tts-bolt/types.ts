// ============================================================================
// TTSBolt — shared types
// ============================================================================

/** Which synthesiser renders the audio. */
export type Engine = 'neural' | 'device';

/** A voice from the neural catalogue (Microsoft Edge Read Aloud). */
export interface NeuralVoice {
  shortName: string;
  friendlyName: string;
  gender: string;
  locale: string;
  /** Derived: "Aria", pulled out of the verbose friendlyName. */
  displayName: string;
  /** Derived: base language tag, e.g. "en" for "en-GB". */
  language: string;
  /** Derived: this voice speaks any language, not just its own locale. */
  multilingual: boolean;
}

/** Per-block prosody. `null` means "inherit the script default". */
export interface Prosody {
  voice: string | null;
  rate: number | null;
  pitch: number | null;
  volume: number | null;
}

/**
 * One paragraph of the script. Blocks are the unit of synthesis: editing one
 * only invalidates that block's audio, which is what makes re-rendering a
 * 10-minute narration after a typo fix cost one request instead of all of them.
 */
export interface Block extends Prosody {
  id: string;
  text: string;
}

/** A word or sentence boundary reported by the engine, in milliseconds. */
export interface Mark {
  /** 'w' word · 's' sentence */
  k: 'w' | 's';
  /** Offset from the start of the block. */
  t: number;
  d: number;
  x: string;
}

/** Same as Mark but rebased onto the full timeline, and tagged with its block. */
export interface TimelineMark extends Mark {
  blockId: string;
}

/** The rendered audio of a single block. */
export interface RenderedBlock {
  /** Hash of the text + prosody that produced this audio; a mismatch = stale. */
  signature: string;
  /** Untouched MP3 bytes from the engine — the download is these, concatenated. */
  mp3: Uint8Array;
  /** Decoded samples, used for the waveform and for gapless playback. */
  buffer: AudioBuffer;
  marks: Mark[];
  durationMs: number;
}

export type BlockStatus = 'stale' | 'queued' | 'rendering' | 'done' | 'error';

/** Everything the player needs after a render pass. */
export interface Timeline {
  /** Concatenated decoded audio, silence-free and gapless. */
  buffer: AudioBuffer;
  marks: TimelineMark[];
  /** Start offset of each block on the timeline, in seconds. */
  blockStarts: Record<string, number>;
  durationSec: number;
  /** Downsampled |peak| per column, computed once for the waveform. */
  peaks: Float32Array;
  totalBytes: number;
}

export interface HistoryEntry {
  id: string;
  preview: string;
  /** Whole script, so restoring brings back the per-block voices too. */
  blocks: Block[];
  voice: string;
  engine: Engine;
  at: number;
}
