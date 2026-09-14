// SPDX-FileCopyrightText: 2026 Matt Curfman, Spunky Tensor LLC
// SPDX-License-Identifier: Apache-2.0

import {
  createIcons,
  Search,
  ArrowUpRight,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Globe2,
  Layers,
  Maximize,
  Compass,
  X,
  MapPin,
  Shuffle,
  Mouse,
  Move,
  Info,
  Check,
  LocateFixed,
  Keyboard,
  Orbit,
} from "lucide";
import "cesium/Build/Cesium/Widgets/widgets.css";
import "./style.css";
import { createGlobe, type Globe } from "./globe";
import {
  places,
  parseCoordinates,
  formatAltitude,
  formatCoordinate,
  formatDistance,
  type Place,
} from "./places";

const icon = (name: string, cls = "") =>
  `<i data-lucide="${name}" class="${cls}"></i>`;
const icons = () =>
  createIcons({
    icons: {
      Search,
      ArrowUpRight,
      ArrowRight,
      ChevronLeft,
      ChevronRight,
      Plus,
      Minus,
      Globe2,
      Layers,
      Maximize,
      Compass,
      X,
      MapPin,
      Shuffle,
      Mouse,
      Move,
      Info,
      Check,
      LocateFixed,
      Keyboard,
      Orbit,
    },
  });
const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!;

$("#app").innerHTML = `
  <main id="globe" aria-label="Interactive 3D Earth. Drag to pan, scroll to zoom. Arrow keys pan; plus and minus zoom." tabindex="0"></main>
  <div class="edge-shade" aria-hidden="true"></div>
  <header class="topbar">
    <button class="brand" id="home" aria-label="Orbit home">${icon("orbit")}<span>ORBIT<span class="brand-dot">.</span></span></button>
    <div class="search-wrap">
      <form id="search-form" class="search-box">${icon("search")}<input id="search" aria-label="Search places or coordinates" placeholder="Search anywhere on Earth" autocomplete="off" /><kbd>/</kbd></form>
      <div id="search-results" class="panel search-results" hidden></div>
    </div>
    <nav aria-label="Main navigation"><button id="explore" class="nav-active">Explore</button><button id="about">About Orbit ${icon("arrow-up-right")}</button><span class="nav-divider"></span><span class="planet-status"><span class="status-dot"></span>A NEW PERSPECTIVE</span></nav>
  </header>

  <section class="intro" id="intro"><div class="eyebrow"><span></span> ONE PLANET. ENDLESS DISCOVERY.</div><h1>A world worth<br/><span>exploring.</span></h1><p>From the big picture<br/>to the smallest wonders.</p><button id="start" class="text-link">Find your next perspective ${icon("arrow-right")}</button></section>

  <div class="view-badge"><span class="status-dot"></span><span id="view-name">EARTH VIEW</span><span class="badge-divider"></span><span id="mode-name">3D EXPLORER</span></div>

  <aside class="discovery" id="discovery">
    <div class="discovery-heading"><span class="eyebrow">A LITTLE INSPIRATION</span><div><button id="previous" class="mini-button" aria-label="Previous destination">${icon("chevron-left")}</button><span id="card-counter">01 / 06</span><button id="next" class="mini-button" aria-label="Next destination">${icon("chevron-right")}</button><button id="dismiss-discovery" class="mini-button" aria-label="Dismiss place suggestions" title="Dismiss for this session">${icon("x")}</button></div></div>
    <button class="destination-card" id="destination"><div class="card-image"><img id="place-image" src="/images/dolomites.jpg" alt="Dolomites mountain landscape"/><span class="image-tag" id="place-tag">ABOVE THE ALPINE</span><span class="image-arrow">${icon("arrow-up-right")}</span></div><div class="card-content"><h2 id="place-name">The Dolomites</h2><div class="place-region">${icon("map-pin")}<span id="place-region">Italy, Europe</span></div><p id="place-description">Where limestone peaks meet alpine stillness. See the world from a different perspective.</p><div class="card-cta">Take me there ${icon("arrow-right")}</div></div></button>
    <button id="surprise" class="surprise">${icon("shuffle")} Somewhere unexpected</button>
  </aside>

  <div class="navigation-tools" aria-label="Map controls">
    <button id="north" class="compass-button" title="Reset north" aria-label="Reset north"><span>N</span>${icon("compass")}</button>
    <div class="tool-group"><button id="zoom-in" title="Zoom in (+)" aria-label="Zoom in">${icon("plus")}</button><span></span><button id="zoom-out" title="Zoom out (−)" aria-label="Zoom out">${icon("minus")}</button></div>
    <div class="tool-group"><button id="earth-view" title="Return to Earth view (H)" aria-label="Return to Earth view">${icon("globe-2")}</button><button id="closeup" title="Zoom to a 1 km-wide view" aria-label="Zoom to 1 km view">${icon("locate-fixed")}</button><button id="layers" title="Map layers" aria-label="Map layers" aria-expanded="false">${icon("layers")}</button></div>
    <button id="fullscreen" class="standalone" title="Toggle fullscreen" aria-label="Toggle fullscreen">${icon("maximize")}</button>
  </div>

  <section id="layers-panel" class="panel layers-panel" aria-label="Map layers" hidden>
    <div class="panel-heading"><h2>Your perspective</h2><button class="mini-button" id="close-layers" aria-label="Close layers">${icon("x")}</button></div>
    <span class="eyebrow">EARTH IMAGERY</span>
    <button class="layer-option selected" data-layer="satellite" aria-pressed="true"><span class="layer-thumb satellite-thumb"></span><span><strong>Satellite</strong><small>High-resolution · Esri</small></span>${icon("check")}</button>
    <button class="layer-option" data-layer="nasa" aria-pressed="false"><span class="layer-thumb nasa-thumb"></span><span><strong>Blue Marble</strong><small>Global composite · NASA</small></span>${icon("check")}</button>
    <p class="layer-note">NASA is a 500 m/pixel composite. Choose Satellite for detailed close-up views.</p>
  </section>

  <div id="toast" class="toast" role="status" hidden></div>
  <div class="interaction-hint">${icon("mouse")} Scroll to zoom <span>·</span>${icon("move")} Drag to explore <button id="help" aria-label="Navigation help">${icon("info")}</button></div>
  <footer class="telemetry"><div class="coordinates"><span id="latitude">22.000° N</span><span id="longitude">22.000° E</span></div><button id="altitude-toggle" class="altitude" type="button"><span>ALTITUDE</span><strong id="altitude">19,000 km</strong></button><div class="scale"><span id="scale-label">GLOBAL VIEW</span><span class="scale-line"></span></div></footer>
  <div class="attribution"><span id="credits"></span><button id="sources">Data & credits</button></div>
  <a class="spunky-watermark" href="https://spunkytensor.ai"><img src="/spunky-tensor-mark.png" alt="Spunky Tensor" draggable="false" /></a>

  <dialog id="dialog"><div class="dialog-top"><span class="eyebrow">A NEW PERSPECTIVE</span><button id="close-dialog" class="mini-button" aria-label="Close dialog">${icon("x")}</button></div><div id="dialog-content"></div></dialog>
`;
icons();

const watermark = $(".spunky-watermark");
const navigationTools = $(".navigation-tools");
const telemetry = $(".telemetry");
const positionWatermark = () => {
  const tray = navigationTools.getBoundingClientRect();
  const footer = telemetry.getBoundingClientRect();
  watermark.style.left = `${tray.left + tray.width / 2}px`;
  watermark.style.top = `${(tray.bottom + footer.top) / 2}px`;
};
const watermarkLayout = new ResizeObserver(positionWatermark);
watermarkLayout.observe(document.body);
watermarkLayout.observe(navigationTools);
watermarkLayout.observe(telemetry);
positionWatermark();

const intro = $("#intro");
const introInteraction = new AbortController();
const dismissIntro = (event: Event) => {
  // Let the intro's own link finish activating before making it inert.
  if (event.type !== "click" && intro.contains(event.target as Node)) return;
  intro.classList.add("away");
  intro.inert = true;
  introInteraction.abort();
};
for (const type of ["pointerdown", "wheel", "keydown", "click", "gesturestart"]) {
  document.addEventListener(type, dismissIntro, {
    passive: true,
    signal: introInteraction.signal,
  });
}

let globe: Globe | undefined;
let selected = 0;
let toastTimer: ReturnType<typeof setTimeout>;
let currentAltitude = 19000000;
let altitudeUnit: "km" | "mi" = "km";

function updateAltitude() {
  const value = formatAltitude(currentAltitude, altitudeUnit);
  const nextUnit = altitudeUnit === "km" ? "miles" : "kilometers";
  $("#altitude").textContent = value;
  $("#altitude-toggle").setAttribute(
    "aria-label",
    `Altitude ${value}. Display in ${nextUnit}`,
  );
  $("#altitude-toggle").setAttribute("title", `Display in ${nextUnit}`);
}

$("#altitude-toggle").onclick = () => {
  altitudeUnit = altitudeUnit === "km" ? "mi" : "km";
  updateAltitude();
};
updateAltitude();

function notify(message: string) {
  $("#toast").textContent = message;
  $("#toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("#toast").hidden = true), 7000);
}
function ready(action: (g: Globe) => void) {
  if (globe) action(globe);
  else notify("The globe is getting ready. One moment…");
}
function selectCard(index: number) {
  selected = (index + places.length) % places.length;
  const place = places[selected];
  $("#place-name").textContent = place.name;
  $("#place-region").textContent = place.region;
  $("#place-description").textContent = place.description;
  $("#place-tag").textContent = place.tag;
  $("#card-counter").textContent =
    `${String(selected + 1).padStart(2, "0")} / 06`;
  $("#place-image").setAttribute("src", `/images/${place.image}.jpg`);
  $("#place-image").setAttribute("alt", `${place.name} landscape`);
}
function visit(
  place: Pick<Place, "name" | "latitude" | "longitude" | "altitude">,
) {
  ready((g) => {
    g.fly(place.latitude, place.longitude, place.altitude);
    $("#view-name").textContent = place.name.toUpperCase();
    $("#search-results").hidden = true;
    $("#search").blur();
  });
}
const discovery = $("#discovery");
try {
  discovery.hidden = sessionStorage.getItem("orbit.discoveryDismissed") === "true";
} catch {
  // Storage may be blocked; the card can still be dismissed for this page.
}
$("#dismiss-discovery").onclick = () => {
  discovery.hidden = true;
  $("#globe").focus({ preventScroll: true });
  try {
    sessionStorage.setItem("orbit.discoveryDismissed", "true");
  } catch {
    // Keep dismissal functional even when session storage is unavailable.
  }
};
$("#previous").onclick = () => selectCard(selected - 1);
$("#next").onclick = () => selectCard(selected + 1);
$("#destination").onclick = () => visit(places[selected]);
$("#surprise").onclick = () => {
  selectCard(selected + 1 + Math.floor(Math.random() * (places.length - 1)));
  visit(places[selected]);
};
const home = () =>
  ready((g) => {
    g.home();
    $("#view-name").textContent = "EARTH VIEW";
  });
$("#home").onclick = home;
$("#earth-view").onclick = home;
$("#zoom-in").onclick = () => ready((g) => g.zoom(0.5));
$("#zoom-out").onclick = () => ready((g) => g.zoom(2));
$("#closeup").onclick = () => ready((g) => g.closeup());
$("#north").onclick = () => ready((g) => g.north());
$("#fullscreen").onclick = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    notify("Fullscreen is not available in this browser.");
  }
};
function toggleLayers(show: boolean) {
  $("#layers-panel").hidden = !show;
  $("#layers").setAttribute("aria-expanded", String(show));
}
$("#layers").onclick = () => toggleLayers($("#layers-panel").hidden);
$("#close-layers").onclick = () => toggleLayers(false);
document.querySelectorAll<HTMLButtonElement>("[data-layer]").forEach(
  (button) =>
    (button.onclick = () =>
      ready((g) => {
        const layer = button.dataset.layer as "satellite" | "nasa";
        if (!g.setLayer(layer)) return;
        document.querySelectorAll("[data-layer]").forEach((el) => {
          el.classList.toggle("selected", el === button);
          el.setAttribute("aria-pressed", String(el === button));
        });
        $("#mode-name").textContent =
          layer === "nasa" ? "BLUE MARBLE" : "3D EXPLORER";
      })),
);

function showDialog(content: string) {
  $("#dialog-content").innerHTML = content;
  $<HTMLDialogElement>("#dialog").showModal();
  icons();
}
$("#close-dialog").onclick = () => $<HTMLDialogElement>("#dialog").close();
$("#dialog").onclick = (e) => {
  if (e.target === $("#dialog")) $<HTMLDialogElement>("#dialog").close();
};
const showSources = () =>
  showDialog(
    `<h2>One Earth.<br/><em>Many perspectives.</em></h2><p>Orbit brings our planet a little closer. A WebGL-powered globe, real satellite imagery, and the freedom to follow your curiosity.</p><div class="source-item"><strong>Satellite imagery</strong><p>Esri World Imagery, Vantor, Earthstar Geographics, and the GIS User Community. Resolution and capture dates vary by location. This is a composite, not a live feed.</p><a href="https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9" target="_blank" rel="noreferrer">Imagery & terms ${icon("arrow-up-right")}</a></div><div class="source-item"><strong>Open global imagery</strong><p>NASA GIBS / ESDIS Blue Marble (500 m/pixel), with Natural Earth II as a local fallback. NASA is open access; Esri’s publicly accessible service is subject to its own usage terms.</p><a href="https://www.earthdata.nasa.gov/engage/open-data-services-software/earthdata-developer-portal/gibs-api" target="_blank" rel="noreferrer">NASA data sources ${icon("arrow-up-right")}</a></div><div class="source-item"><strong>Astronomically grounded</strong><p>Cesium’s Tycho-2 sky map uses TEME orientation at the session time. Earth uses the WGS84 ellipsoid. Terrain elevation and 3D buildings are not included. Destination photographs: Unsplash.</p></div><div class="dialog-sponsor"><img src="/spunky-tensor-logo.png" alt="" draggable="false"/><span>Brought to you by Spunky Tensor</span></div>`,
  );
$("#about").onclick = showSources;
$("#sources").onclick = showSources;
$("#help").onclick = () =>
  showDialog(
    `<h2>Follow your curiosity.</h2><p>There’s a whole world at your fingertips.</p><dl class="help-list"><dt>Move around Earth</dt><dd>Click and drag · one-finger drag</dd><dt>Zoom in or out</dt><dd>Scroll · pinch · + / − keys</dd><dt>Pan with your keyboard</dt><dd>Arrow keys when the globe is focused</dd><dt>Search a place</dt><dd>Press / · name or latitude, longitude</dd><dt>Back to the big picture</dt><dd>Press H · globe button</dd><dt>See a 1 km-wide area</dt><dd>Use the crosshair button</dd></dl><p class="layer-note">Higher-resolution tiles appear as they arrive. Detail varies by coverage and connection speed.</p>`,
  );
function explore() {
  showDialog(
    `<h2>The extraordinary<br/><em>is out there.</em></h2><p>Pick a place. Change your perspective.</p><div class="explore-grid">${places.map((p, i) => `<button data-place="${i}" class="explore-card"><img src="/images/${p.image}.jpg" alt="${p.name}"/><span><strong>${p.name}</strong><small>${p.region}</small></span>${icon("arrow-up-right")}</button>`).join("")}</div>`,
  );
  document.querySelectorAll<HTMLButtonElement>("[data-place]").forEach(
    (button) =>
      (button.onclick = () => {
        selectCard(Number(button.dataset.place));
        visit(places[selected]);
        $<HTMLDialogElement>("#dialog").close();
      }),
  );
}
$("#explore").onclick = explore;
$("#start").onclick = explore;

const search = $<HTMLInputElement>("#search");
let searchController: AbortController | undefined;
let searchVersion = 0;
function resultButton(label: string, detail: string, action: () => void) {
  const button = document.createElement("button");
  button.className = "search-result";
  button.innerHTML = `${icon("map-pin")}<span><strong></strong><small></small></span>${icon("arrow-up-right")}`;
  button.querySelector("strong")!.textContent = label;
  button.querySelector("small")!.textContent = detail;
  button.onclick = action;
  $("#search-results").append(button);
}
function localResults() {
  searchVersion++;
  searchController?.abort();
  const query = search.value.trim();
  $("#search-results").innerHTML =
    '<div class="eyebrow result-heading">GO SOMEWHERE</div>';
  $("#search-results").hidden = false;
  const coords = parseCoordinates(query);
  if (coords)
    resultButton(query, "Explore these coordinates", () =>
      visit({ name: query, ...coords, altitude: 10000 }),
    );
  else {
    const matches = places.filter((p) =>
      `${p.name} ${p.region}`.toLowerCase().includes(query.toLowerCase()),
    );
    matches.slice(0, 4).forEach((p) =>
      resultButton(p.name, p.region, () => {
        selectCard(places.indexOf(p));
        visit(p);
      }),
    );
    if (query)
      resultButton(
        `Search for “${query}”`,
        "Search worldwide · press Enter",
        () => void worldwideSearch(query),
      );
    else {
      const hint = document.createElement("p");
      hint.className = "search-note";
      hint.textContent = "Or enter coordinates, like 35.36, 138.73";
      $("#search-results").append(hint);
    }
  }
  icons();
}
async function worldwideSearch(query: string) {
  const coords = parseCoordinates(query);
  if (coords) {
    visit({ name: query, ...coords, altitude: 10000 });
    return;
  }
  if (/^[\s\d.,+-]+$/.test(query)) {
    $("#search-results").textContent =
      "Use latitude, longitude within ±90 and ±180.";
    return;
  }
  const version = ++searchVersion;
  searchController?.abort();
  searchController = new AbortController();
  $("#search-results").hidden = false;
  $("#search-results").textContent = "Finding your corner of the world…";
  try {
    // Explicit submission only: no autocomplete load against the public geocoder.
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`,
      { signal: searchController.signal },
    );
    if (!response.ok) throw new Error("Search unavailable");
    const data = await response.json();
    if (version !== searchVersion) return;
    $("#search-results").innerHTML = "";
    if (!data.results?.length) {
      $("#search-results").textContent =
        "No places found. Try a nearby city or coordinates.";
      return;
    }
    data.results.forEach(
      (p: {
        name: string;
        latitude: number;
        longitude: number;
        country?: string;
        admin1?: string;
      }) =>
        resultButton(
          p.name,
          [p.admin1, p.country].filter(Boolean).join(", "),
          () => visit({ ...p, altitude: 18000 }),
        ),
    );
    const credit = document.createElement("a");
    credit.className = "search-note";
    credit.href = "https://open-meteo.com/";
    credit.target = "_blank";
    credit.rel = "noreferrer";
    credit.textContent = "Geocoding by Open-Meteo · GeoNames";
    $("#search-results").append(credit);
    icons();
  } catch (error) {
    if (
      version === searchVersion &&
      !(error instanceof DOMException && error.name === "AbortError")
    )
      $("#search-results").textContent =
        "Search is temporarily unavailable. Try coordinates or a featured destination.";
  }
}
search.oninput = localResults;
search.onfocus = localResults;
$("#search-form").onsubmit = (event) => {
  event.preventDefault();
  if (search.value.trim()) void worldwideSearch(search.value.trim());
};
document.addEventListener("pointerdown", (event) => {
  if (!(event.target as HTMLElement).closest(".search-wrap")) {
    $("#search-results").hidden = true;
    searchVersion++;
    searchController?.abort();
  }
});
// Pinches over UI must not magnify the document. Canvas gestures are handled
// by the scene; scrollable panels retain ordinary one-finger scrolling.
document.addEventListener("wheel", (event) => {
  if (event.ctrlKey) event.preventDefault();
}, { passive: false });
for (const type of ["gesturestart", "gesturechange", "gestureend"]) {
  document.addEventListener(type, (event) => event.preventDefault(), { passive: false });
}
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    $("#search-results").hidden = true;
    toggleLayers(false);
    search.blur();
  }
  if ((event.ctrlKey || event.metaKey) && ["+", "=", "-"].includes(event.key)) {
    event.preventDefault();
  }
  if (
    (event.target as HTMLElement).matches("input, textarea") ||
    $<HTMLDialogElement>("#dialog").open
  )
    return;
  if (event.key === "/") {
    event.preventDefault();
    search.focus({ preventScroll: true });
  }
  if (event.key.toLowerCase() === "h") home();
  if (event.key === "+" || event.key === "=") {
    event.preventDefault();
    ready((g) => g.zoom(0.5));
  }
  if (event.key === "-") {
    event.preventDefault();
    ready((g) => g.zoom(2));
  }
  if (
    event.key.startsWith("Arrow") &&
    (event.target as HTMLElement).closest("#globe")
  ) {
    event.preventDefault();
    ready((g) => {
      const v = g.getView();
      const step = Math.max(0.0002, Math.min(15, (v.altitude / 6371000) * 12));
      g.fly(
        Math.max(
          -89.999,
          Math.min(
            89.999,
            v.latitude +
              (event.key === "ArrowUp"
                ? step
                : event.key === "ArrowDown"
                  ? -step
                  : 0),
          ),
        ),
        ((v.longitude +
          (event.key === "ArrowRight"
            ? step
            : event.key === "ArrowLeft"
              ? -step
              : 0) +
          540) %
          360) -
          180,
        v.altitude,
        0.25,
      );
    });
  }
});

createGlobe(
  (view) => {
    $("#latitude").textContent = formatCoordinate(view.latitude, true);
    $("#longitude").textContent = formatCoordinate(view.longitude, false);
    currentAltitude = view.altitude;
    updateAltitude();
    $("#scale-label").textContent =
      view.width && view.altitude < 5000000
        ? `VIEW ${formatDistance(view.width)}`
        : "GLOBAL VIEW";
    $("#discovery").classList.toggle("compact", view.altitude < 500000);
    $("#north svg").style.transform = `rotate(${-view.heading}deg)`;
  },
  notify,
)
  .then((value) => {
    globe = value;
    $("#globe").dataset.ready = "true";
  })
  .catch((error) => {
    console.error(error);
    notify(
      "Orbit needs WebGL. Enable browser hardware acceleration and reload to try again.",
    );
  });
