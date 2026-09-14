// SPDX-FileCopyrightText: 2026 Matt Curfman, Spunky Tensor LLC
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import { SmoothZoom, wheelZoomFactor, pinchZoomFactor } from "./zoom";

function advance(
  zoom: SmoothZoom,
  start: number,
  end: number,
  step = 10,
): number {
  let height = 0;
  for (let time = start + step; time <= end && zoom.active; time += step)
    height = zoom.sample(time);
  return height;
}

describe("continuous zoom inertia", () => {
  it.each([0.5, 2])(
    "accelerates gently then coasts to the target for factor %s",
    (factor) => {
      const zoom = new SmoothZoom(100, 100000000);
      zoom.add(10000, factor, 0);
      const heights = [10000];
      for (let t = 10; t <= 3000 && zoom.active; t += 10)
        heights.push(zoom.sample(t));
      const steps = heights.slice(1).map((h, i) => Math.abs(h - heights[i]));
      heights
        .slice(1)
        .forEach((h, i) =>
          expect((h - heights[i]) * (factor - 1)).toBeGreaterThanOrEqual(0),
        );
      expect(steps[0]).toBeLessThan(steps[5]);
      expect(steps[50]).toBeLessThan(steps[10]);
      expect(steps[100]).toBeLessThan(steps[50]);
      expect(heights.at(-1)).toBeCloseTo(10000 * factor);
      expect(zoom.active).toBe(false);
    },
  );

  it("matches the damped motion at different normal frame rates", () => {
    const a = new SmoothZoom(100, 100000000);
    const b = new SmoothZoom(100, 100000000);
    a.add(16000, 0.25, 0);
    b.add(16000, 0.25, 0);
    const at240 = advance(a, 0, 240, 10);
    expect(advance(b, 0, 240, 20)).toBeCloseTo(at240, 8);
    // Analytic critically damped response at 240 ms, natural frequency 8/s.
    const remaining = (1 + 1.92) * Math.exp(-1.92);
    expect(at240).toBeCloseTo(4000 * Math.pow(4, remaining), 8);
  });

  it("preserves position AND velocity when another input changes the target", () => {
    const zoom = new SmoothZoom(100, 100000000);
    zoom.add(10000, 0.5, 0);
    advance(zoom, 0, 90);
    const before = zoom.sample(99.99);
    const current = zoom.sample(100);
    zoom.add(current, 0.5, 100);
    expect(zoom.sample(100)).toBeCloseTo(current, 8);
    const after = zoom.sample(100.01);
    expect((after - current) / (current - before)).toBeCloseTo(1, 2);
    expect(advance(zoom, 100.01, 3100.01)).toBeCloseTo(2500);
  });

  it("brakes and reverses without a discontinuity in velocity", () => {
    const zoom = new SmoothZoom(100, 100000000);
    zoom.add(10000, 0.5, 0);
    const current = advance(zoom, 0, 100);
    zoom.add(current, 2, 100);
    expect(zoom.sample(100)).toBeCloseTo(current);
    expect(zoom.sample(101)).toBeLessThan(current); // Momentum is not reset.
    const braking = advance(zoom, 101, 301);
    expect(zoom.sample(302)).toBeGreaterThan(braking); // Now moving outward.
    expect(advance(zoom, 302, 3002)).toBeCloseTo(10000);
  });

  it("keeps reduced-motion zoom continuous but settles sooner", () => {
    const normal = new SmoothZoom(100, 100000000);
    const reduced = new SmoothZoom(100, 100000000);
    normal.add(10000, 0.5, 0);
    reduced.add(10000, 0.5, 0);
    expect(reduced.sample(0, true)).toBeCloseTo(10000);
    const first = reduced.sample(16, true);
    expect(first).toBeGreaterThan(9500);
    expect(first).toBeLessThan(10000);
    let height = first;
    for (let t = 32; t <= 496; t += 16) height = reduced.sample(t, true);
    expect(height).toBeGreaterThan(5000);
    expect(height).toBeLessThan(5003);
    expect(advance(normal, 0, 496, 16)).toBeGreaterThan(5300);
  });

  it("preserves finger scale through staggered events and a reversing pinch", () => {
    const zoom = new SmoothZoom(100, 100000000);
    zoom.add(18000, pinchZoomFactor(40, 50), 0);
    const current = advance(zoom, 0, 70);
    zoom.add(current, pinchZoomFactor(50, 80), 70);
    const halfway = advance(zoom, 70, 130);
    zoom.add(halfway, pinchZoomFactor(80, 60), 130);
    // Finger separation ends at 60 from 40: altitude must end at 2/3,
    // independent of how far the animation got before reversing the fingers.
    expect(advance(zoom, 130, 3130)).toBeCloseTo(12000);
  });

  it("does not skip to the endpoint after a long frame or tab suspension", () => {
    const stalled = new SmoothZoom(100, 100000000);
    const normal = new SmoothZoom(100, 100000000);
    stalled.add(10000, 0.5, 0);
    normal.add(10000, 0.5, 0);
    const afterStall = stalled.sample(5000);
    expect(afterStall).toBeCloseTo(normal.sample(1000 / 30));
    expect(afterStall).toBeGreaterThan(9500);
    expect(stalled.active).toBe(true);
  });

  it("accumulates high-frequency input without starving the frame clock", () => {
    const zoom = new SmoothZoom(100, 100000000);
    zoom.add(10000, 0.99, 0);
    for (let t = 1; t <= 16; t++) zoom.add(10000, 0.99, t);
    expect(zoom.sample(16)).toBeLessThan(9990);
    expect(advance(zoom, 16, 3016)).toBeCloseTo(10000 * Math.pow(0.99, 17));
  });

  it("clamps both boundaries and discards cancelled momentum", () => {
    const zoom = new SmoothZoom(100, 100000000);
    zoom.add(150, 0.5, 0);
    expect(zoom.finish()).toBeCloseTo(100);
    expect(zoom.active).toBe(false);
    zoom.add(90000000, 2, 100);
    expect(zoom.finish()).toBeCloseTo(100000000);
    zoom.add(10000, 0.1, 200);
    advance(zoom, 200, 300);
    zoom.cancel();
    zoom.add(40000, 0.5, 400);
    expect(zoom.sample(400)).toBeCloseTo(40000);
    expect(advance(zoom, 400, 3400)).toBeCloseTo(20000);
  });
});

it("normalizes wheel units and bounds large deltas", () => {
  expect(wheelZoomFactor(48, 0, 720)).toBeCloseTo(wheelZoomFactor(3, 1, 720));
  expect(wheelZoomFactor(180, 0, 720)).toBeCloseTo(
    wheelZoomFactor(0.25, 2, 720),
  );
  expect(wheelZoomFactor(0, 0, 720)).toBe(1);
  expect(wheelZoomFactor(-100, 0, 720)).toBeLessThan(1);
  expect(wheelZoomFactor(100, 0, 720)).toBeGreaterThan(1);
  expect(wheelZoomFactor(100000, 0, 720)).toBeCloseTo(Math.exp(0.7));
});

it("maps pinch separation to scale without jumps from coincident fingers", () => {
  expect(pinchZoomFactor(30, 75)).toBeCloseTo(0.4);
  expect(pinchZoomFactor(75, 30)).toBeCloseTo(2.5);
  expect(pinchZoomFactor(0, 75)).toBe(1);
  expect(pinchZoomFactor(75, 0)).toBe(1);
  expect(pinchZoomFactor(0, 0)).toBe(1);
});
