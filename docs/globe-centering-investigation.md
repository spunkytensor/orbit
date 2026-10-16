# Intermittent globe centering investigation

## Report and expected behavior

The globe animation sometimes appears to the left of the browser window rather
than centered. The triggering steps, browser, OS, display scaling, and whether
this happens during navigation or at rest are not yet known.

The initial Earth view and Return to Earth view should be centered in the globe
viewport. Do not force the camera back to Earth on every resize: that would
discard intentional navigation, including views of the Moon.

## Initial investigation (2026-09-14)

No application behavior has been changed. The reported intermittent offset has
not yet been reproduced.

- `src/style.css` positions `#app` over the viewport and `#globe` with zero insets.
  The Cesium widget and canvas have 100% width and height.
- `src/globe.ts` initializes a nadir-facing home camera. Destination flights use
  the same orientation. Custom smooth zoom dollies along the current viewing ray;
  it does not explicitly re-center Earth.
- The application window-resize callback updates telemetry only. This alone is
  not evidence of a rendering bug: the Viewer uses Cesium's default render loop.
  Verify actual canvas dimensions and rendered output before adding another
  resize mechanism.
- The initial resolution scale is capped at 1.5 using `devicePixelRatio`. Moving
  between displays and browser zoom remain reproduction candidates, not proven
  causes.

### Checks performed

In orb Chromium, at device pixel ratio 2, loaded the application at 1280 × 720,
then resized the same page to 390 × 844 and 1600 × 900. Waited for two animation
frames after each resize and inspected captures. Earth remained horizontally
centered in these states. This checks narrow desktop layout, not a real mobile
device or Safari.

At 1280 × 720, `#globe`, `.cesium-viewer`, `.cesium-widget`, and the canvas all
had bounding rectangles `(0, 0, 1280, 720)`. The canvas drawing buffer was
1920 × 1080, consistent with the configured 1.5 resolution scale.

Baseline validation:

- `npm test`: 32 tests passed across four files.
- `npm run build`: passed, including TypeScript checking. Vite reported an
  unresolved-at-build-time NaturalEarth texture URL and a large-chunk warning;
  the license-copy script also flagged packages without standalone license files.

## Reproduction checklist

1. Record browser/version, OS, viewport size, browser zoom, display scaling, and
   whether the window was moved between monitors. Capture a screenshot showing
   the whole viewport and describe the last interaction before the offset.
2. Try a fresh load, Return to Earth view, destination flights, zoom in/out,
   dragging, and Reset north. Distinguish transient flight positions from an
   offset that persists after motion stops.
3. Resize wide → narrow → wide, enter/exit fullscreen, change browser zoom,
   move between displays with different scaling, and restore a background tab.
   Repeat during an active flight and smooth zoom.
4. Compare canvas and ancestor bounding rectangles with the viewport. Record
   canvas `width`/`height`, `clientWidth`/`clientHeight`, and `devicePixelRatio`.
   A full-size canvas with an off-center Earth suggests a camera/projection issue;
   an offset or undersized canvas suggests layout or sizing instead.
5. Repeat in the affected browser, especially real Safari if that is where the
   report occurred. Orb Chromium checks cannot rule out browser/GPU-specific
   behavior.

## Completion criteria

- Obtain repeatable triggering steps or a captured failing state with dimensions.
- Identify whether layout, drawing-buffer sizing, or camera navigation causes it.
- Add a focused regression check and the smallest fix supported by that evidence.
- Verify initial view, home return, resize/fullscreen, and intentional navigation
  remain correct. Run unit tests and the production build.
