import { useReducedMotion as useFramerReducedMotion, type Variants, type Transition } from 'framer-motion';

/**
 * Central motion kit for shared/chrome components. Rules:
 * - Only animate transform/opacity (never layout-affecting properties) to avoid CLS.
 * - Never animate above-the-fold entrance content (hero, first paint).
 * - Every animated component must respect prefers-reduced-motion via `useReducedMotion()` below.
 */

export const EASE_OUT: Transition['ease'] = [0.16, 1, 0.3, 1];

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: EASE_OUT } },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

/** Hover/tap affordance for cards — use as `whileHover="hover"` + variants={cardHover} */
export const cardHover: Variants = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.02, y: -2, transition: { duration: 0.2, ease: EASE_OUT } },
};

/** Press feedback for buttons/icons — use as whileTap={pressScale} */
export const pressScale = { scale: 0.94 };

/**
 * Wraps framer-motion's useReducedMotion with a stable fallback and returns
 * ready-to-spread props that neutralize motion when the user prefers it —
 * pass through `{...motionSafe(variants)}` style, or just check the boolean
 * and swap `transition={{ duration: prefersReduced ? 0 : 0.3 }}`.
 */
export function useReducedMotion(): boolean {
  return useFramerReducedMotion() ?? false;
}

/** Returns a duration of 0 when the user prefers reduced motion, else the given value. */
export function safeDuration(prefersReduced: boolean, duration: number): number {
  return prefersReduced ? 0 : duration;
}
