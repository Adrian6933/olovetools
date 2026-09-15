// ============================================================================
// Exact frame control, built on requestVideoFrameCallback.
// ----------------------------------------------------------------------------
// rVFC is the low-level hook the old version ignored. It fires once per frame
// the compositor actually presents and hands over `mediaTime` (the real
// presentation timestamp) and `presentedFrames` (a monotonic counter). Two
// things follow from that, and both were guesses before:
//
//   * the frame rate can be MEASURED instead of typed into a box, and
//   * a seek can be AWAITED to the exact frame that ends up on screen, so a
//     capture can never draw the previous one.
//
// Everything degrades to the `seeked` event where rVFC is missing (Firefox at
// the time of writing), with `exact` reported as false so the UI does not
// claim a precision it does not have.
// ============================================================================

interface FrameMeta {
  mediaTime: number;
  presentedFrames: number;
}

type VideoWithRvfc = HTMLVideoElement & {
  requestVideoFrameCallback?: (cb: (now: number, meta: FrameMeta) => void) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

export function hasRvfc(video: HTMLVideoElement | null): boolean {
  return typeof (video as VideoWithRvfc | null)?.requestVideoFrameCallback === 'function';
}

/** Resolves on the next presented frame, or on `seeked` as a fallback. */
export function nextPresentedFrame(video: HTMLVideoElement, timeoutMs = 2000): Promise<FrameMeta | null> {
  const element = video as VideoWithRvfc;

  return new Promise(resolve => {
    let settled = false;
    let handle: number | undefined;

    const finish = (meta: FrameMeta | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      video.removeEventListener('seeked', onSeeked);
      if (handle !== undefined && element.cancelVideoFrameCallback) element.cancelVideoFrameCallback(handle);
      resolve(meta);
    };

    // A seek that lands on a frame already presented never fires rVFC again,
    // so `seeked` has to stay armed even when rVFC is available.
    const onSeeked = () => finish({ mediaTime: video.currentTime, presentedFrames: -1 });
    const timer = setTimeout(() => finish(null), timeoutMs);

    video.addEventListener('seeked', onSeeked, { once: true });
    if (element.requestVideoFrameCallback) {
      handle = element.requestVideoFrameCallback((_now, meta) => finish(meta));
    }
  });
}

/** Seeks and does not resolve until that position is the one on screen. */
export async function seekExact(video: HTMLVideoElement, time: number): Promise<number> {
  const clamped = Math.max(0, Math.min(video.duration || 0, time));
  if (Math.abs(video.currentTime - clamped) < 1e-6) return video.currentTime;
  const waiter = nextPresentedFrame(video);
  video.currentTime = clamped;
  const meta = await waiter;
  return meta?.mediaTime ?? video.currentTime;
}

/**
 * Measures the frame rate by playing muted for a moment and watching the
 * presentation timestamps. Deliberately not a guess from the container: a
 * variable-rate recording has no single "real" fps, and the median of the
 * observed deltas is the honest answer for stepping purposes.
 */
export async function measureFps(video: HTMLVideoElement, samples = 12): Promise<number | null> {
  const element = video as VideoWithRvfc;
  if (!element.requestVideoFrameCallback) return null;

  const times: number[] = [];
  const wasPaused = video.paused;
  const wasMuted = video.muted;
  const startedAt = video.currentTime;

  video.muted = true;
  try {
    await video.play();
  } catch {
    video.muted = wasMuted;
    return null;
  }

  await new Promise<void>(resolve => {
    let handle = 0;
    const tick = (_now: number, meta: FrameMeta) => {
      times.push(meta.mediaTime);
      if (times.length >= samples) {
        resolve();
        return;
      }
      handle = element.requestVideoFrameCallback!(tick);
    };
    handle = element.requestVideoFrameCallback!(tick);
    // Never hang on a video that stalls.
    setTimeout(() => {
      if (element.cancelVideoFrameCallback) element.cancelVideoFrameCallback(handle);
      resolve();
    }, 1500);
  });

  // Restore the playback state the caller had before measuring. Measuring a
  // playing video must not unexpectedly leave it paused.
  if (wasPaused) {
    video.pause();
    video.currentTime = startedAt;
  } else {
    try { await video.play(); } catch { /* autoplay policy may block resume */ }
  }
  video.muted = wasMuted;

  const deltas: number[] = [];
  for (let i = 1; i < times.length; i += 1) {
    const delta = times[i] - times[i - 1];
    if (delta > 0.0005 && delta < 1) deltas.push(delta);
  }
  if (deltas.length < 3) return null;

  deltas.sort((a, b) => a - b);
  const median = deltas[Math.floor(deltas.length / 2)];
  const raw = 1 / median;

  // Snap to the rates that actually exist, but only when we are close: a real
  // 23.976 must not be rounded to 24 and then drift a frame every 42 seconds.
  const COMMON = [23.976, 24, 25, 29.97, 30, 48, 50, 59.94, 60, 120];
  const near = COMMON.find(candidate => Math.abs(candidate - raw) / candidate < 0.02);
  return near ?? Math.round(raw * 1000) / 1000;
}

/** Steps whole frames from wherever the video is now. */
export async function stepFrames(video: HTMLVideoElement, fps: number, delta: number): Promise<number> {
  const step = 1 / (fps || 30);
  // Half a frame of bias keeps repeated steps from landing on a boundary and
  // rounding back onto the frame we just left.
  return seekExact(video, video.currentTime + delta * step + (delta > 0 ? step * 0.05 : -step * 0.05));
}

export function frameIndexAt(time: number, fps: number | null): number {
  if (!fps) return -1;
  return Math.round(time * fps);
}

export function formatTimecode(seconds: number, fps: number | null): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const hh = Math.floor(safe / 3600);
  const mm = Math.floor((safe % 3600) / 60);
  const ss = Math.floor(safe % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  if (fps) {
    const ff = Math.floor((safe % 1) * fps);
    const head = hh > 0 ? `${pad(hh)}:` : '';
    return `${head}${pad(mm)}:${pad(ss)}:${pad(ff)}`;
  }
  const ms = Math.floor((safe % 1) * 1000);
  const head = hh > 0 ? `${pad(hh)}:` : '';
  return `${head}${pad(mm)}:${pad(ss)}.${String(ms).padStart(3, '0')}`;
}
