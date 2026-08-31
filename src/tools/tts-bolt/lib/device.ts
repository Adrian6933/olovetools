// ============================================================================
// The device engine: window.speechSynthesis.
//
// It cannot be recorded — the browser gives no MediaStream for it — so this
// path is preview only. What it *is* good for is the thing the neural engine
// cannot do: instant, offline, zero-request playback while you write. Which is
// why it is the default until you press Generate.
// ============================================================================

export interface DeviceVoice {
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
}

export function deviceSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Chrome populates the voice list asynchronously and fires `voiceschanged`
 * once it has. Subscribes properly (the old code assigned `onvoiceschanged`
 * directly inside an effect keyed on `lang`, so every language switch silently
 * replaced the handler and nothing ever removed it).
 */
export function subscribeDeviceVoices(onChange: (voices: DeviceVoice[]) => void): () => void {
  if (!deviceSupported()) return () => {};
  const synth = window.speechSynthesis;

  const read = () =>
    onChange(
      synth.getVoices().map(v => ({
        name: v.name,
        lang: v.lang,
        localService: v.localService,
        default: v.default,
      }))
    );

  read();
  synth.addEventListener('voiceschanged', read);
  return () => synth.removeEventListener('voiceschanged', read);
}

export interface SpeakOptions {
  text: string;
  voiceName: string | null;
  rate: number;
  pitch: number;
  volume: number;
  /** Character offset of the word being spoken, for the live highlight. */
  onBoundary?: (charIndex: number) => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
}

/**
 * Chrome stops speaking after roughly 15 seconds of a single utterance unless
 * it is nudged. A pause/resume pair on a timer is the long-standing workaround;
 * without it, anything longer than a paragraph cuts off mid-sentence.
 */
const KEEPALIVE_MS = 10000;
let keepalive: ReturnType<typeof setInterval> | null = null;

function startKeepalive() {
  stopKeepalive();
  keepalive = setInterval(() => {
    const synth = window.speechSynthesis;
    if (!synth.speaking || synth.paused) return;
    synth.pause();
    synth.resume();
  }, KEEPALIVE_MS);
}

function stopKeepalive() {
  if (keepalive !== null) {
    clearInterval(keepalive);
    keepalive = null;
  }
}

export function speak(options: SpeakOptions): void {
  if (!deviceSupported()) {
    options.onError?.('unsupported');
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(options.text);
  if (options.voiceName) {
    const match = synth.getVoices().find(v => v.name === options.voiceName);
    if (match) utterance.voice = match;
  }
  utterance.rate = options.rate;
  utterance.pitch = options.pitch;
  utterance.volume = options.volume;

  if (options.onBoundary) {
    utterance.onboundary = event => options.onBoundary?.(event.charIndex);
  }
  utterance.onend = () => {
    stopKeepalive();
    options.onEnd?.();
  };
  utterance.onerror = event => {
    stopKeepalive();
    // Cancelling on purpose fires an error too; that is not worth surfacing.
    if (event.error === 'interrupted' || event.error === 'canceled') return;
    options.onError?.(event.error || 'speech_failed');
  };

  startKeepalive();
  synth.speak(utterance);
}

export function stopSpeaking(): void {
  if (!deviceSupported()) return;
  stopKeepalive();
  window.speechSynthesis.cancel();
}
