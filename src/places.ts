// SPDX-FileCopyrightText: 2026 Matt Curfman, Spunky Tensor LLC
// SPDX-License-Identifier: Apache-2.0

export interface Place {
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  altitude: number;
  description: string;
  image: string;
  tag: string;
}

export const places: Place[] = [
  {
    name: "The Dolomites",
    region: "Italy, Europe",
    latitude: 46.618,
    longitude: 12.302,
    altitude: 18000,
    description:
      "Where limestone peaks meet alpine stillness. See the world from a different perspective.",
    image: "dolomites",
    tag: "ABOVE THE ALPINE",
  },
  {
    name: "Grand Canyon",
    region: "Arizona, United States",
    latitude: 36.1069,
    longitude: -112.1129,
    altitude: 24000,
    description:
      "Two billion years, written in stone. Follow the Colorado River through a landscape like no other.",
    image: "canyon",
    tag: "CARVED BY TIME",
  },
  {
    name: "Great Barrier Reef",
    region: "Queensland, Australia",
    latitude: -19.24,
    longitude: 148.1,
    altitude: 45000,
    description:
      "A living mosaic in the Coral Sea. Discover the extraordinary colors of our largest reef.",
    image: "reef",
    tag: "INTO THE BLUE",
  },
  {
    name: "New York City",
    region: "New York, United States",
    latitude: 40.758,
    longitude: -73.9855,
    altitude: 1100,
    description:
      "A thousand stories in every block. Get a closer look at the city that never stands still.",
    image: "newyork",
    tag: "A CLOSER LOOK",
  },
  {
    name: "Mount Fuji",
    region: "Honshu, Japan",
    latitude: 35.3606,
    longitude: 138.7274,
    altitude: 18000,
    description:
      "An unmistakable silhouette. Explore the forests and volcanic slopes of Japan’s sacred mountain.",
    image: "fuji",
    tag: "QUIETLY EXTRAORDINARY",
  },
  {
    name: "Sahara Desert",
    region: "North Africa",
    latitude: 24.6,
    longitude: 12.3,
    altitude: 180000,
    description:
      "An ocean made of sand. Trace the shifting patterns of the largest hot desert on Earth.",
    image: "sahara",
    tag: "BEYOND THE HORIZON",
  },
];

export function parseCoordinates(
  input: string,
): { latitude: number; longitude: number } | null {
  const match = input
    .trim()
    .match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  return Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
    ? { latitude, longitude }
    : null;
}

export function formatCoordinate(value: number, latitude: boolean): string {
  return `${Math.abs(value).toFixed(3)}° ${latitude ? (value < 0 ? "S" : "N") : value < 0 ? "W" : "E"}`;
}

export function formatDistance(meters: number): string {
  return meters >= 1000
    ? `${(meters / 1000).toLocaleString("en-US", { maximumFractionDigits: meters < 10000 ? 1 : 0 })} km`
    : `${Math.round(meters)} m`;
}

export function formatAltitude(meters: number, unit: "km" | "mi"): string {
  const value = meters / (unit === "mi" ? 1609.344 : 1000);
  return `${value.toLocaleString("en-US", {
    maximumFractionDigits: value < 10 ? 1 : 0,
  })} ${unit}`;
}
