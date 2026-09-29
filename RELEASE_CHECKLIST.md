# Public release checklist

These are maintainer release gates, not claims that legal clearance or a full
security audit has already occurred.

- [ ] Confirm authority to publish all original code under Apache-2.0 and verify
  the copyright statement in `NOTICE`.
- [ ] Verify the origin and redistribution rights for `public/spunky-tensor-logo.png`
  and `public/orbit.svg`. The repository does not contain provenance records.
- [ ] Verify the six Unsplash photo IDs against the actual local files; record
  canonical photo pages and photographer names where available. Existing source
  IDs alone are not a complete provenance record.
- [ ] Review current Esri terms for the intended deployment. Replace or license
  Open-Meteo for commercial use. Review all external service terms and privacy
  requirements; Apache-2.0 does not override them.
- [ ] Establish and test a private vulnerability-reporting channel; update
  `SECURITY.md` with its actual destination. Enable private reports if supported.
- [ ] Review the complete Git history and release files for secrets and private
  information using an approved secret scanner. Rotate any exposed credentials;
  adding ignore rules does not remediate history.
- [ ] Run `node scripts/setup-npm.mjs`, `npm run deps`, `npm test`,
  `npm run build`, and `npm audit`. Assess every current advisory before release;
  the CI audit only blocks high and critical findings.
- [ ] Review generated `dist/licenses/`, including upstream Cesium notices and
  any packages reported without a standalone license file. Retain these files
  with all deployed bundles. Recheck notices on dependency upgrades.
- [ ] Complete the README browser smoke checks on desktop and mobile, including
  service failures, attribution visibility, keyboard use, and reduced motion.
- [ ] Choose the public hosting/repository location, enable issue/PR features as
  appropriate, and configure CI, branch protection, and dependency alerts if the
  chosen host supports them. No GitHub repository is assumed by this checkout.
- [ ] Deploy `dist/` over HTTPS; verify workers/assets, external services, security
  headers, and deployment-specific privacy disclosures. Do not serve dev tools.
- [ ] Publish a version/tag and release notes only after the above checks pass.
- [ ] Verify the release's security workflow succeeds and attaches the lockfile
  SBOM and audit evidence to the release. These assets outlive CI artifact expiry.
