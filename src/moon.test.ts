// SPDX-FileCopyrightText: 2026 Matt Curfman, Spunky Tensor LLC
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import {
  BlendingState, Cartesian3, EllipsoidGeometry, GeometryInstance, JulianDate,
  MaterialAppearance,
} from "cesium";
import { createMoonFill, moonPosition } from "./moon";

describe("Moon identification fill", () => {
  it("keeps the physical radius, adds light instead of replacing the phase, and respects Earth depth", () => {
    const fill = createMoonFill();
    const appearance = fill.appearance as MaterialAppearance;
    const instance = fill.geometryInstances as GeometryInstance;
    const geometry = EllipsoidGeometry.createGeometry(instance.geometry as EllipsoidGeometry)!;
    expect(geometry.boundingSphere!.radius).toBe(1737400);
    // A translucent appearance silently replaces custom blending with alpha
    // blending; that would paint over the original Moon and erase its phase.
    expect(appearance.isTranslucent()).toBe(false);
    expect(appearance.getRenderState().blending).toEqual(BlendingState.ADDITIVE_BLEND);
    expect(appearance.getRenderState().depthTest.enabled).toBe(true);
    expect(appearance.getRenderState().cull.enabled).toBe(true);
    expect(fill.allowPicking).toBe(false);
    expect(appearance.material.uniforms.minimumLight).toBeGreaterThan(0);
    expect(appearance.material.uniforms.minimumLight).toBeLessThanOrEqual(0.10);
    fill.destroy();
  });
});

describe("Moon position", () => {
  it("uses lunar orbital distance and updates Earth-fixed position with time", () => {
    const first = moonPosition(JulianDate.fromIso8601("2026-09-12T00:00:00Z"));
    const later = moonPosition(JulianDate.fromIso8601("2026-09-12T06:00:00Z"));
    // Broad astronomical bounds, independent of the ephemeris implementation.
    expect(Cartesian3.magnitude(first)).toBeGreaterThan(350000000);
    expect(Cartesian3.magnitude(first)).toBeLessThan(410000000);
    expect(Cartesian3.distance(first, later)).toBeGreaterThan(300000000);
  });
});
