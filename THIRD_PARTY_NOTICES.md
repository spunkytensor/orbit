# Third-party attributions and terms

Apache-2.0 applies to original Orbit code and documentation, not automatically to
third-party code, images, data, fonts, services, or marks. Retain this document,
`NOTICE`, and the upstream license texts when redistributing the application.

## Software

- **CesiumJS** — CesiumJS Contributors, Apache-2.0.
  <https://github.com/CesiumGS/cesium>. Its upstream `LICENSE.md` includes extensive
  separate notices for bundled code and assets, including Natural Earth, lunar
  textures, and the NASA sky box. Preserve the entire file, not just its Apache
  preamble, and preserve on-screen credits.
- **Lucide** — Lucide Contributors, ISC, with Feather-derived portions credited
  to Cole Bemis under MIT. <https://lucide.dev/license>.
- Transitive runtime dependencies retain their own licenses. `npm run build`
  copies available installed license/notice files into `dist/licenses/dependencies/`
  and creates an inventory from `package-lock.json`. Cesium's complete upstream
  notices also cover components without standalone package license files. Review
  the inventory's missing-file entries rather than assuming metadata is clearance.
- TypeScript, Vite, Vitest, and vite-plugin-static-copy are development tools, not
  relicensed by this project. Their installed packages contain their license terms.

## Bundled destination photographs

The README records the following Unsplash source image IDs. They are under the
[Unsplash license](https://unsplash.com/license), **not Apache-2.0**. The license
permits broad use but does not permit selling unmodified copies or compiling a
competing image service; rights involving depicted people, marks, or property may
require separate consideration. Photographer identities and canonical photo pages
have not been verified in this repository.

| Local file | Recorded source |
| --- | --- |
| `public/images/dolomites.jpg` | <https://images.unsplash.com/photo-1464822759023-fed622ff2c3b> |
| `public/images/canyon.jpg` | <https://images.unsplash.com/photo-1474044159687-1ee9f3a51722> |
| `public/images/reef.jpg` | <https://images.unsplash.com/photo-1546026423-cc4642628d2b> |
| `public/images/newyork.jpg` | <https://images.unsplash.com/photo-1485871981521-5b1fd3805eee> |
| `public/images/fuji.jpg` | <https://images.unsplash.com/photo-1490806843957-31f4c9a91c65> |
| `public/images/sahara.jpg` | <https://images.unsplash.com/photo-1509316785289-025f5b846b35> |

The filename-to-ID mapping follows the destination order in the existing README;
verify it against the original downloads before release. `reef.jpg` is also used
as a decorative background. Branding assets `public/orbit.svg` and
`public/spunky-tensor-logo.png` need maintainer provenance confirmation. No
trademark permission or endorsement is implied by the code license.

## Fonts

DM Sans and Space Grotesk are requested from Google Fonts by `index.html` and use
the SIL Open Font License 1.1. They are not bundled in this repository. Upstream
font licenses and copyright notices are available at:

- <https://github.com/google/fonts/blob/main/ofl/dmsans/OFL.txt>
- <https://github.com/google/fonts/blob/main/ofl/spacegrotesk/OFL.txt>

If self-hosting fonts, include their complete upstream license files with them.

## Data and network services

| Provider | Attribution and terms |
| --- | --- |
| Esri World Imagery | Esri, Vantor, Earthstar Geographics, and the GIS User Community; exact credits vary by location. Retain Cesium's dynamic credits. [Source and terms](https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9). Unauthenticated access is not an unrestricted data license or commercial entitlement. |
| NASA GIBS / ESDIS | We acknowledge the use of imagery provided by services from NASA's Global Imagery Browse Services (GIBS), part of NASA's Earth Science Data and Information System (ESDIS). [Service documentation](https://nasa-gibs.github.io/gibs-api-docs/). |
| Natural Earth II | Public domain fallback packaged with Cesium. [Terms](https://www.naturalearthdata.com/about/terms-of-use/). |
| Open-Meteo / GeoNames | Geocoding results from Open-Meteo using GeoNames data. Preserve result attribution. Data is offered under CC BY 4.0; the hosted free API separately restricts use to non-commercial purposes and imposes usage limits. [API](https://open-meteo.com/en/docs/geocoding-api), [terms](https://open-meteo.com/en/terms), [GeoNames](https://www.geonames.org/). |

Remote imagery and geocoding results are not bundled or relicensed by Orbit.
Review current service terms before deployment; do not bulk-download imagery on
the assumption that the project's code license grants that right.
