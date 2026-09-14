// SPDX-FileCopyrightText: 2026 Matt Curfman, Spunky Tensor LLC
// SPDX-License-Identifier: Apache-2.0

import {
  Viewer,
  Cartesian2,
  Cartesian3,
  Math as CesiumMath,
  Color,
  Credit,
  CreditDisplay,
  EllipsoidTerrainProvider,
  ArcGisMapServerImageryProvider,
  TileMapServiceImageryProvider,
  buildModuleUrl,
  UrlTemplateImageryProvider,
  WebMercatorTilingScheme,
  ImageryLayer,
  ClockStep,
  EllipsoidGeodesic,
  PerspectiveFrustum,
  CameraEventType,
  ScreenSpaceEventType,
  type ScreenSpaceEventHandler,
  type Camera,
  Transforms,
  Matrix4,
  LabelCollection,
  LabelStyle,
  HorizontalOrigin,
  Occluder,
  BoundingSphere,
} from "cesium";
import { SmoothZoom, wheelZoomFactor, pinchZoomFactor } from "./zoom";
import { createMoonFill, moonPosition } from "./moon";

/** Signed rotation about the viewing ray that puts geodetic north screen-up. */
export function northAngle(camera: Camera, center: Cartesian3): number {
  const north = Matrix4.multiplyByPointAsVector(
    Transforms.eastNorthUpToFixedFrame(center),
    Cartesian3.UNIT_Y,
    new Cartesian3(),
  );
  // The camera basis projects north onto the screen without changing its ray.
  return Math.atan2(
    Cartesian3.dot(north, camera.rightWC),
    Cartesian3.dot(north, camera.upWC),
  );
}

export type ViewState = {
  latitude: number;
  longitude: number;
  altitude: number;
  heading: number;
  width: number | null;
};
export const HOME = { latitude: 22, longitude: 22, altitude: 19000000 };

export async function createGlobe(
  onView: (view: ViewState) => void,
  onError: (message: string) => void,
) {
  // Orbit uses CesiumJS but does not connect to Cesium ion services.
  CreditDisplay.cesiumCredit = new Credit("", true);
  const viewer = new Viewer("globe", {
    baseLayer: false,
    terrainProvider: new EllipsoidTerrainProvider(),
    animation: false,
    timeline: false,
    geocoder: false,
    homeButton: false,
    baseLayerPicker: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    fullscreenButton: false,
    selectionIndicator: false,
    infoBox: false,
    requestRenderMode: true,
    maximumRenderTimeChange: 60,
    creditContainer: "credits",
    showRenderLoopErrors: false,
  });
  const { scene, camera } = viewer;
  // The Moon label can be over 500,000 km away at lunar apogee when zoomed out.
  camera.frustum.far = 1000000000;
  viewer.clock.clockStep = ClockStep.SYSTEM_CLOCK;
  // This explorer owns camera navigation; sky double-clicks must not track entities.
  viewer.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  viewer.resolutionScale = Math.min(window.devicePixelRatio, 1.5);
  scene.backgroundColor = Color.fromCssColorString("#080c10");
  scene.globe.baseColor = Color.fromCssColorString("#153046");
  scene.globe.maximumScreenSpaceError = 1.5;
  scene.globe.tileCacheSize = 350;
  scene.globe.preloadAncestors = true;
  scene.globe.enableLighting = true;
  scene.skyBox!.show = true;
  scene.globe.showGroundAtmosphere = false;
  scene.fog.enabled = false;
  scene.postProcessStages.fxaa.enabled = true;
  const moonFill = scene.primitives.add(createMoonFill());
  const moonLabels = scene.primitives.add(new LabelCollection()) as LabelCollection;
  const moonLabel = moonLabels.add({
    text: "MOON",
    position: moonPosition(viewer.clock.currentTime),
    font: '12px "DM Sans", sans-serif',
    fillColor: Color.fromCssColorString("#b5e8d3"),
    outlineColor: Color.fromCssColorString("#080c10"),
    outlineWidth: 3,
    style: LabelStyle.FILL_AND_OUTLINE,
    horizontalOrigin: HorizontalOrigin.CENTER,
    pixelOffset: new Cartesian2(0, -18),
  });
  const earthOccluder = new Occluder(new BoundingSphere(Cartesian3.ZERO, 1), Cartesian3.ZERO);
  scene.preUpdate.addEventListener((_scene, time) => {
    moonLabel.position = moonPosition(time);
    Matrix4.fromTranslation(moonLabel.position, moonFill.modelMatrix);
    earthOccluder.cameraPosition = scene.globe.ellipsoid.transformPositionToScaledSpace(camera.positionWC);
    moonLabel.show = earthOccluder.isPointVisible(
      scene.globe.ellipsoid.transformPositionToScaledSpace(moonLabel.position),
    );
  });
  const controller = scene.screenSpaceCameraController;
  controller.minimumZoomDistance = 100;
  controller.maximumZoomDistance = 100000000;
  controller.enableTilt = false;
  controller.enableLook = false;
  controller.inertiaSpin = 0.88;
  controller.inertiaZoom = 0.8;
  // Wheel, pinch, and buttons share our continuous zoom. Do not also let the
  // native controller apply pinch deltas. One-finger pan stays with Cesium.
  controller.zoomEventTypes = [CameraEventType.RIGHT_DRAG];
  camera.setView({
    destination: Cartesian3.fromDegrees(
      HOME.longitude,
      HOME.latitude,
      HOME.altitude,
    ),
    orientation: { heading: 0, pitch: -Math.PI / 2, roll: 0 },
  });
  scene.renderError.addEventListener(() =>
    onError(
      "The 3D renderer stopped. Please reload, or check that hardware acceleration is enabled.",
    ),
  );

  function getView(): ViewState {
    const center = camera.pickEllipsoid(
      new Cartesian2(
        scene.canvas.clientWidth / 2,
        scene.canvas.clientHeight / 2,
      ),
    );
    const position = center
      ? scene.globe.ellipsoid.cartesianToCartographic(center)
      : camera.positionCartographic;
    // Measure the middle half of the viewport on the ellipsoid, then extrapolate.
    const left = camera.pickEllipsoid(
      new Cartesian2(
        scene.canvas.clientWidth * 0.25,
        scene.canvas.clientHeight / 2,
      ),
    );
    const right = camera.pickEllipsoid(
      new Cartesian2(
        scene.canvas.clientWidth * 0.75,
        scene.canvas.clientHeight / 2,
      ),
    );
    const width =
      left && right
        ? new EllipsoidGeodesic(
            scene.globe.ellipsoid.cartesianToCartographic(left),
            scene.globe.ellipsoid.cartesianToCartographic(right),
          ).surfaceDistance * 2
        : null;
    return {
      latitude: CesiumMath.toDegrees(position.latitude),
      longitude: CesiumMath.toDegrees(position.longitude),
      altitude: camera.positionCartographic.height,
      heading: -CesiumMath.toDegrees(
        northAngle(camera, center ?? camera.positionWC),
      ),
      width,
    };
  }
  const update = () => onView(getView());
  camera.percentageChanged = 0.01;
  camera.changed.addEventListener(update);
  camera.moveEnd.addEventListener(update);
  window.addEventListener("resize", update);
  update();

  const smoothZoom = new SmoothZoom(
    controller.minimumZoomDistance,
    controller.maximumZoomDistance,
  );
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const stopZoom = () => {
    smoothZoom.cancel();
    update();
  };
  const applyZoom = (height: number) => {
    // Dolly on the view ray: keep the viewed point and orientation stable.
    camera.zoomIn(camera.positionCartographic.height - height);
    scene.requestRender();
  };
  // Run before Cesium decides whether to draw this frame, not in a second RAF
  // loop. Idle scenes still sleep; every active zoom step is explicitly drawn.
  scene.preUpdate.addEventListener(() => {
    if (!smoothZoom.active) return;
    applyZoom(smoothZoom.sample(performance.now(), reducedMotion.matches));
    // Camera.changed handles telemetry just as it does for pan. Avoid doing
    // duplicate ellipsoid intersections and DOM updates on every zoom frame.
    if (!smoothZoom.active) update();
  });
  const zoom = (factor: number) => {
    if (factor === 1) return;
    camera.cancelFlight();
    smoothZoom.add(
      camera.positionCartographic.height,
      factor,
      performance.now(),
    );
    scene.requestRender();
  };
  const touchPointers = new Set<number>();
  let safariGesture = false;
  let gestureScale = 1;
  scene.canvas.addEventListener("gesturestart", (event) => {
    event.preventDefault();
    stopZoom();
    safariGesture = true;
    gestureScale = 1;
  }, { passive: false });
  scene.canvas.addEventListener("gesturechange", (event) => {
    event.preventDefault();
    const scale = (event as Event & { scale: number }).scale;
    // Touchscreen pinches already arrive through Cesium. Safari's trackpad
    // GestureEvents need their own route, without applying either stream twice.
    if (safariGesture && touchPointers.size === 0) {
      zoom(pinchZoomFactor(gestureScale, scale));
    }
    gestureScale = scale;
  }, { passive: false });
  document.addEventListener("gestureend", () => { safariGesture = false; });
  window.addEventListener("blur", () => {
    safariGesture = false;
    touchPointers.clear();
  });
  viewer.screenSpaceEventHandler.setInputAction(
    (event: ScreenSpaceEventHandler.TwoPointMotionEvent) => {
      // Cesium 1.145's runtime supplies distance despite its four-point TS
      // declaration. Both distances are quarter-pixels, so their ratio is scale.
      const { distance } = event as unknown as {
        distance: ScreenSpaceEventHandler.MotionEvent;
      };
      zoom(pinchZoomFactor(distance.startPosition.y, distance.endPosition.y));
    },
    ScreenSpaceEventType.PINCH_MOVE,
  );
  scene.canvas.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      if (safariGesture) return;
      zoom(
        wheelZoomFactor(
          event.deltaY,
          event.deltaMode,
          scene.canvas.clientHeight,
        ),
      );
    },
    { passive: false },
  );
  // A direct manipulation takes ownership of the camera immediately.
  scene.canvas.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") touchPointers.add(event.pointerId);
    stopZoom();
    // A compass reset suppresses the old gesture's inertia, not the next one.
    controller.inertiaSpin = 0.88;
    controller.inertiaZoom = 0.8;
  });
  for (const type of ["pointerup", "pointercancel"] as const) {
    scene.canvas.addEventListener(type, (event) => touchPointers.delete(event.pointerId));
  }

  let satellite: ImageryLayer | undefined;
  let nasa: ImageryLayer | undefined;
  const base = await TileMapServiceImageryProvider.fromUrl(
    buildModuleUrl("Assets/Textures/NaturalEarthII"),
  );
  viewer.imageryLayers.addImageryProvider(base);
  try {
    const imagery = await ArcGisMapServerImageryProvider.fromUrl(
      "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
      {
        enablePickFeatures: false,
        maximumLevel: 19,
        credit: new Credit(
          "Imagery © Esri, Vantor, Earthstar Geographics",
          true,
        ),
      },
    );
    satellite = viewer.imageryLayers.addImageryProvider(imagery);
    imagery.errorEvent.addEventListener(() =>
      onError(
        "Some satellite tiles are unavailable. Existing imagery stays visible; try NASA in Layers.",
      ),
    );
  } catch {
    onError(
      "Satellite imagery is unavailable. Showing the offline world map; try NASA in Layers.",
    );
  }
  scene.requestRender();

  const fly = (
    latitude: number,
    longitude: number,
    altitude: number,
    duration = 2.3,
  ) => {
    stopZoom();
    camera.cancelFlight();
    camera.flyTo({
      destination: Cartesian3.fromDegrees(
        longitude,
        latitude,
        CesiumMath.clamp(altitude, 100, 100000000),
      ),
      orientation: { heading: 0, pitch: -Math.PI / 2, roll: 0 },
      duration: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : duration,
    });
  };

  return {
    viewer,
    getView,
    fly,
    home: () => fly(HOME.latitude, HOME.longitude, HOME.altitude),
    zoom,
    north: () => {
      stopZoom();
      camera.cancelFlight();
      controller.inertiaSpin = 0;
      controller.inertiaZoom = 0;
      const center = camera.pickEllipsoid(
        new Cartesian2(scene.canvas.clientWidth / 2, scene.canvas.clientHeight / 2),
      );
      // Twist only: a flight would relocate the camera, change pitch, and shift
      // the viewed location. This preserves position, center ray, and zoom.
      camera.twistRight(northAngle(camera, center ?? camera.positionWC));
      scene.requestRender();
      update();
    },
    closeup: () => {
      const v = getView();
      const frustum = camera.frustum as PerspectiveFrustum;
      // Horizontal field of view determines the altitude for a 1 km-wide nadir view.
      const altitude =
        1000 / (2 * Math.tan(frustum.fovy! / 2) * frustum.aspectRatio!);
      fly(v.latitude, v.longitude, altitude);
    },
    setLayer: (layer: "satellite" | "nasa") => {
      if (layer === "satellite" && !satellite) {
        onError("Satellite service could not connect. Reload to retry.");
        return false;
      }
      if (layer === "nasa" && !nasa) {
        const imagery = new UrlTemplateImageryProvider({
          url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/2004-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg",
          tilingScheme: new WebMercatorTilingScheme(),
          maximumLevel: 8,
          credit: new Credit(
            'NASA GIBS / ESDIS · Blue Marble · <a href="https://www.earthdata.nasa.gov/engage/open-data-services-software/earthdata-developer-portal/gibs-api" target="_blank" rel="noopener noreferrer">Data attribution</a>',
            true,
          ),
        });
        imagery.errorEvent.addEventListener(() =>
          onError(
            "NASA imagery is unavailable in this area. Try Satellite in Layers.",
          ),
        );
        nasa = viewer.imageryLayers.addImageryProvider(imagery);
      }
      if (satellite) satellite.show = layer === "satellite";
      if (nasa) nasa.show = layer === "nasa";
      scene.requestRender();
      return true;
    },
  };
}

export type Globe = Awaited<ReturnType<typeof createGlobe>>;
