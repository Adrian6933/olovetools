import type { LottieJson } from '../types';

// ============================================================================
// Sample animations.
//
// These were rewritten because the originals never rendered at all. Two things
// were wrong with them, and lottie-web fails silently on both:
//
//   1. The `fl` (fill) shapes had no `o` opacity property. SVGFillStyleData
//      reads `data.o.k` unconditionally, so the whole layer failed to build and
//      the stage stayed empty.
//   2. The keyframes used the legacy `{t, s, e}` form with no `i`/`o` easing.
//      Since 5.x the player needs the easing handles to evaluate an animated
//      multi-dimensional property; without them nothing is drawn.
//
// Every keyframe below therefore carries explicit easing, and every fill and
// stroke carries its opacity.
// ============================================================================

/** Standard ease-in-out handles, in the array form the exporter emits. */
const EASE_IN = { x: [0.4], y: [1] };
const EASE_OUT = { x: [0.6], y: [0] };

interface Keyframe {
  t: number;
  s?: number[];
  i?: typeof EASE_IN;
  o?: typeof EASE_OUT;
}

/** Builds an animated property with ease-in-out between every pair of keys. */
function eased(keys: [number, number[]][]): { a: 1; k: Keyframe[] } {
  const frames: Keyframe[] = keys.map(([t, s], index) =>
    index === keys.length - 1 ? { t, s } : { t, s, i: EASE_IN, o: EASE_OUT }
  );
  return { a: 1, k: frames };
}

const still = (k: number | number[]) => ({ a: 0 as const, k });

function fill(rgba: number[], name = 'Fill') {
  return { ty: 'fl', c: still(rgba), o: still(100), r: 1, nm: name };
}

function bar(index: number, x: number, color: number[], offset: number) {
  return {
    ddd: 0,
    ind: index,
    ty: 4,
    nm: `Bar ${index}`,
    sr: 1,
    ks: {
      o: still(100),
      r: still(0),
      p: still([x, 100, 0]),
      a: still([0, 0, 0]),
      s: eased([
        [offset, [100, 30, 100]],
        [offset + 15, [100, 120, 100]],
        [offset + 30, [100, 30, 100]],
      ]),
    },
    ao: 0,
    shapes: [
      { ty: 'rc', d: 1, s: still([20, 80]), p: still([0, 0]), r: still(5), nm: 'Rect Path' },
      fill(color),
    ],
    ip: 0,
    op: 60,
    st: 0,
  };
}

export const PRESETS: Record<'spinner' | 'square' | 'circle' | 'gradient', LottieJson> = {
  // Three bars bouncing on staggered offsets: three distinct static fills, so
  // the palette has something obvious to recolour.
  spinner: {
    v: '5.5.2',
    fr: 30,
    ip: 0,
    op: 60,
    w: 200,
    h: 200,
    nm: 'Bouncing Bars',
    ddd: 0,
    assets: [],
    layers: [
      bar(1, 70, [0.239, 0.702, 0.949, 1], 0),
      bar(2, 100, [0.851, 0.271, 0.929, 1], 10),
      bar(3, 130, [0.961, 0.62, 0.043, 1], 20),
    ],
  },

  // One animated rotation property and one fill: the smallest possible file
  // that still moves.
  square: {
    v: '5.5.2',
    fr: 30,
    ip: 0,
    op: 60,
    w: 200,
    h: 200,
    nm: 'Rotating Square',
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: 'Square Layer',
        sr: 1,
        ks: {
          o: still(100),
          r: eased([
            [0, [0]],
            [60, [360]],
          ]),
          p: still([100, 100, 0]),
          a: still([0, 0, 0]),
          s: still([100, 100, 100]),
        },
        ao: 0,
        shapes: [
          { ty: 'rc', d: 1, s: still([80, 80]), p: still([0, 0]), r: still(10), nm: 'Rectangle Path' },
          fill([0.388, 0.4, 0.945, 1], 'Fill 1'),
        ],
        ip: 0,
        op: 60,
        st: 0,
      },
    ],
  },

  // An elastic scale loop with a stroke on top of the fill, so the palette
  // shows a stroke entry too.
  circle: {
    v: '5.5.2',
    fr: 30,
    ip: 0,
    op: 60,
    w: 200,
    h: 200,
    nm: 'Pulsing Circle',
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: 'Circle Layer',
        sr: 1,
        ks: {
          o: still(100),
          r: still(0),
          p: still([100, 100, 0]),
          a: still([0, 0, 0]),
          s: eased([
            [0, [40, 40, 100]],
            [30, [110, 110, 100]],
            [60, [40, 40, 100]],
          ]),
        },
        ao: 0,
        shapes: [
          { ty: 'el', d: 1, s: still([90, 90]), p: still([0, 0]), nm: 'Ellipse Path' },
          fill([0.063, 0.714, 0.506, 1], 'Fill 1'),
          {
            ty: 'st',
            c: still([0.996, 0.949, 0.212, 1]),
            o: still(100),
            w: still(6),
            lc: 1,
            lj: 1,
            ml: 4,
            nm: 'Stroke 1',
          },
        ],
        ip: 0,
        op: 60,
        st: 0,
      },
    ],
  },

  // A gradient fill: its colours live in a flat [offset,r,g,b, …] table rather
  // than in `c.k`, which is exactly the case most online viewers miss.
  gradient: {
    v: '5.5.2',
    fr: 30,
    ip: 0,
    op: 60,
    w: 200,
    h: 200,
    nm: 'Gradient Sweep',
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: 'Gradient Layer',
        sr: 1,
        ks: {
          o: still(100),
          r: eased([
            [0, [0]],
            [60, [360]],
          ]),
          p: still([100, 100, 0]),
          a: still([0, 0, 0]),
          s: still([100, 100, 100]),
        },
        ao: 0,
        shapes: [
          { ty: 'rc', d: 1, s: still([130, 40]), p: still([0, 0]), r: still(20), nm: 'Bar Path' },
          {
            ty: 'gf',
            t: 1,
            s: still([-65, 0]),
            e: still([65, 0]),
            g: {
              p: 3,
              k: still([
                0, 0.388, 0.4, 0.945,
                0.5, 0.851, 0.271, 0.929,
                1, 0.024, 0.714, 0.831,
              ]),
            },
            o: still(100),
            r: 1,
            nm: 'Gradient Fill',
          },
        ],
        ip: 0,
        op: 60,
        st: 0,
      },
    ],
  },
};
