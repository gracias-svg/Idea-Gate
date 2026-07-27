// src/lib/smoothScroll.ts
// Sprint 07 (W3) — scroll-to-section needs an exact 250ms duration, which the
// browser's native `scrollIntoView({behavior:'smooth'})` cannot guarantee (no
// duration/easing control). This is a small rAF-driven scroll animator so the
// Workspace ↔ Document sync hits the prescribed timing.

// Cubic ease-in-out — matches the *shape* of lib/motion/primitives.ts's
// `easing.standard` cubic-bezier without needing bezier root-finding for a
// scrollTop tween.
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function smoothScrollTo(container: HTMLElement, targetTop: number, durationMs: number): Promise<void> {
  return new Promise(resolve => {
    const startTop = container.scrollTop;
    const distance = targetTop - startTop;
    if (Math.abs(distance) < 1) { resolve(); return; }

    const start = performance.now();
    function step(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / durationMs, 1);
      container.scrollTop = startTop + distance * easeInOutCubic(t);
      if (t < 1) requestAnimationFrame(step);
      else resolve();
    }
    requestAnimationFrame(step);
  });
}

// Scrolls `container` so that `target` sits near its top, honouring
// prefers-reduced-motion (jumps instantly, no animation).
export function scrollElementIntoView(
  container: HTMLElement,
  target: HTMLElement,
  durationMs: number,
  reducedMotion: boolean,
  offset = 24,
): Promise<void> {
  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const targetTop = container.scrollTop + (targetRect.top - containerRect.top) - offset;

  if (reducedMotion) {
    container.scrollTop = targetTop;
    return Promise.resolve();
  }
  return smoothScrollTo(container, targetTop, durationMs);
}
