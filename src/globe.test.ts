// SPDX-FileCopyrightText: 2026 Matt Curfman, Spunky Tensor LLC
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from "vitest";
import {
  Camera,
  Cartesian2,
  Cartesian3,
  Cartographic,
  GeographicProjection,
  type Scene,
} from "cesium";
import { northAngle } from "./globe";

describe("true-north compass", () => {
  it.each([
    { longitude: 34, latitude: 55, height: 19000000, pitch: -1.48, heading: 2.1 },
    { longitude: -122.4, latitude: 37.7, height: 600, pitch: -1.3, heading: -1.2 },
    { longitude: 179.9, latitude: -67, height: 100000000, pitch: -Math.PI / 2, heading: 3.14 },
    { longitude: -35, latitude: 89.99, height: 100, pitch: -Math.PI / 2, heading: -2.7 },
  ])("preserves the camera and center at $height m, latitude $latitude", (view) => {
    // Exercise Cesium's actual camera math without creating a WebGL context.
    const camera = new Camera({
      canvas: { clientWidth: 1280, clientHeight: 800 },
      drawingBufferWidth: 1280,
      drawingBufferHeight: 800,
      mapProjection: new GeographicProjection(),
    } as unknown as Scene);
    camera.setView({
      destination: Cartesian3.fromDegrees(view.longitude, view.latitude, view.height),
      orientation: { heading: view.heading, pitch: view.pitch, roll: 0 },
    });
    const pixel = new Cartesian2(640, 400);
    const center = camera.pickEllipsoid(pixel)!;
    const position = Cartesian3.clone(camera.positionWC);
    const direction = Cartesian3.clone(camera.directionWC);
    const altitude = camera.positionCartographic.height;
    const angle = northAngle(camera, center);
    expect(Math.abs(angle)).toBeGreaterThan(0.5); // Not already north-up.
    expect(Math.abs(angle)).toBeLessThanOrEqual(Math.PI);

    camera.twistRight(angle);

    // Independently derive geodetic north from the viewed point, not camera HPR.
    const { latitude, longitude } = Cartographic.fromCartesian(center);
    const north = new Cartesian3(
      -Math.sin(latitude) * Math.cos(longitude),
      -Math.sin(latitude) * Math.sin(longitude),
      Math.cos(latitude),
    );
    expect(Cartesian3.dot(north, camera.rightWC)).toBeCloseTo(0, 12);
    expect(Cartesian3.dot(north, camera.upWC)).toBeGreaterThan(0);
    expect(Cartesian3.distance(camera.positionWC, position)).toBe(0);
    expect(Cartesian3.distance(camera.directionWC, direction)).toBeLessThan(1e-12);
    expect(Cartesian3.distance(camera.pickEllipsoid(pixel)!, center)).toBeLessThan(1e-5);
    expect(camera.positionCartographic.height).toBeCloseTo(altitude, 6);
    expect(northAngle(camera, center)).toBeCloseTo(0, 12);
  });
});
