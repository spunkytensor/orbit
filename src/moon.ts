// SPDX-FileCopyrightText: 2026 Matt Curfman, Spunky Tensor LLC
// SPDX-License-Identifier: Apache-2.0

import {
  Cartesian3,
  BlendingState,
  Ellipsoid,
  EllipsoidGeometry,
  GeometryInstance,
  JulianDate,
  Material,
  MaterialAppearance,
  Matrix3,
  Primitive,
  Simon1994PlanetaryPositions,
  Transforms,
} from "cesium";

/** A faint identification light, added over the built-in Moon's real phase. */
export function createMoonFill(): Primitive {
  return new Primitive({
    geometryInstances: new GeometryInstance({
      geometry: new EllipsoidGeometry({
        radii: Ellipsoid.MOON.radii,
        stackPartitions: 32,
        slicePartitions: 64,
        vertexFormat: MaterialAppearance.MaterialSupport.BASIC.vertexFormat,
      }),
    }),
    appearance: new MaterialAppearance({
      materialSupport: MaterialAppearance.MaterialSupport.BASIC,
      flat: true,
      closed: true,
      translucent: false,
      material: new Material({
        translucent: false,
        fabric: {
          uniforms: { minimumLight: 0.10 },
          source: `
            czm_material czm_getMaterial(czm_materialInput materialInput) {
              czm_material material = czm_getDefaultMaterial(materialInput);
              float sunlight = max(dot(normalize(materialInput.normalEC), czm_sunDirectionEC), 0.0);
              material.diffuse = vec3(0.0);
              material.emission = vec3(minimumLight * (1.0 - sunlight));
              material.alpha = 1.0;
              return material;
            }
          `,
        },
      }),
      // The normal Moon is already drawn in Cesium's environment pass. Add
      // only dim fill; don't replace its texture/phase or show through Earth.
      // Use the opaque pass: Cesium's transparency pass replaces custom blending.
      renderState: {
        blending: BlendingState.ADDITIVE_BLEND,
        depthTest: { enabled: true },
      },
    }),
    asynchronous: false,
    allowPicking: false,
  });
}

/** Same public ephemeris and reference-frame conversion as Cesium's Moon. */
export function moonPosition(time: JulianDate): Cartesian3 {
  const rotation = Transforms.computeIcrfToFixedMatrix(time) ??
    Transforms.computeTemeToPseudoFixedMatrix(time);
  return Matrix3.multiplyByVector(
    rotation,
    Simon1994PlanetaryPositions.computeMoonPositionInEarthInertialFrame(time),
    new Cartesian3(),
  );
}
