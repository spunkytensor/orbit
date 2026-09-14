// SPDX-FileCopyrightText: 2026 Matt Curfman, Spunky Tensor LLC
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  define: { CESIUM_BASE_URL: JSON.stringify("/cesium") },
  plugins: [
    viteStaticCopy({
      targets: ["Workers", "Assets", "Widgets", "ThirdParty"].map((folder) => ({
        src: `node_modules/cesium/Build/Cesium/${folder}`,
        dest: "cesium",
      })),
    }),
  ],
  server: { allowedHosts: process.env.AMP_ORB === "1" ? true : undefined },
});
