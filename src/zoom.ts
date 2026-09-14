// SPDX-FileCopyrightText: 2026 Matt Curfman, Spunky Tensor LLC
// SPDX-License-Identifier: Apache-2.0

/** Continuous critically damped motion in logarithmic altitude. */
export class SmoothZoom {
  private motion?: {
    position: number;
    target: number;
    velocity: number;
    updated: number;
  };

  constructor(
    private minimum: number,
    private maximum: number,
  ) {}

  get active(): boolean {
    return this.motion !== undefined;
  }

  add(height: number, factor: number, now: number): void {
    const motion = this.motion ?? {
      position: Math.log(height),
      target: Math.log(height),
      velocity: 0,
      updated: now,
    };
    motion.target = Math.max(
      Math.log(this.minimum),
      Math.min(Math.log(this.maximum), motion.target + Math.log(factor)),
    );
    // Retarget without resetting position, velocity, or the frame clock.
    this.motion = motion;
  }

  sample(now: number, reducedMotion = false): number {
    const motion = this.motion!;
    // Slow frames must not skip the animation. Resume with a small step rather
    // than jumping to where a wall-clock tween would already have finished.
    const dt = Math.max(0, Math.min((now - motion.updated) / 1000, 1 / 30));
    motion.updated = now;
    // Manual camera input stays continuous even under reduced motion. Shorten
    // the settling time instead of teleporting between widely separated views.
    const frequency = reducedMotion ? 20 : 8;
    const offset = motion.position - motion.target;
    const decay = Math.exp(-frequency * dt);
    const adjustment = motion.velocity + frequency * offset;
    motion.position = motion.target + (offset + adjustment * dt) * decay;
    motion.velocity = (motion.velocity - frequency * adjustment * dt) * decay;

    const bounded = Math.max(
      Math.log(this.minimum),
      Math.min(Math.log(this.maximum), motion.position),
    );
    if (bounded !== motion.position) {
      motion.position = bounded;
      motion.velocity = 0;
    }
    if (
      Math.abs(motion.position - motion.target) < 0.000001 &&
      Math.abs(motion.velocity) < 0.00001
    ) {
      return this.finish();
    }
    return Math.exp(motion.position);
  }

  finish(): number {
    const height = Math.exp(this.motion!.target);
    this.cancel();
    return height;
  }

  cancel(): void {
    this.motion = undefined;
  }
}

export function wheelZoomFactor(
  delta: number,
  mode: number,
  pageHeight: number,
): number {
  const pixels = delta * (mode === 1 ? 16 : mode === 2 ? pageHeight : 1);
  return Math.exp(Math.max(-0.7, Math.min(0.7, pixels * 0.002)));
}

export function pinchZoomFactor(previousDistance: number, distance: number): number {
  // Coincident fingers cannot define a scale; rebase at the next valid sample.
  return previousDistance > 0 && distance > 0 ? previousDistance / distance : 1;
}
