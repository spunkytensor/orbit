# Contributing to Orbit

Bug reports, focused fixes, documentation, and accessibility improvements are
welcome. Discuss large features or new dependencies with a maintainer first.

## Local development

Use Node.js 22.12 or newer and npm:

```sh
npm ci
npm run dev
npm test
npm run build
```

The build runs TypeScript checking. There is currently no separate lint or format
command; match the surrounding TypeScript and CSS style. Keep `package-lock.json`
in sync when changing dependencies. Do not commit `node_modules/`, `dist/`, secrets,
or local environment files.

## Automated checks

GitHub Actions runs `npm ci`, all Vitest regressions, the strict TypeScript check
and production build on Node 22 and 24 for pull requests and pushes to `main`.
After building, run `node --test scripts/check-dist.mjs` to verify emitted JS/CSS,
Cesium assets, legal documents, and the runtime license inventory. These are
offline packaging checks, not a browser/WebGL end-to-end test; the manual browser
checks below still apply. JUnit results are retained for 14 days.

The CVE/SBOM workflow also runs weekly and on manual dispatch. Reproduce its
security checks with the pinned npm version (no project dependency changes):

```sh
mkdir -p reports/security
npx --yes npm@11.6.2 sbom --package-lock-only --sbom-format=cyclonedx --sbom-type=application > reports/security/orbit-sbom.cdx.json
npx --yes npm@11.6.2 audit --package-lock-only --audit-level=high --json > reports/security/npm-audit.json
```

See [SECURITY.md](SECURITY.md#automated-security-checks) for the gating policy and
repository settings needed to enforce it. Dependabot opens weekly npm and GitHub
Actions updates; review them and require the same regression checks as other PRs.

## Amp orbs

`.agents/setup` checks the orb's preinstalled Node.js (22.12+) and npm, then
installs locked dependencies, including build and test tools. Amp snapshots this
environment: an exact snapshot skips setup, while a stale snapshot reruns the
install using npm's preserved download cache. No secrets, environment files,
databases, or additional system packages are required.

`.agents/resume` only checks that the tools are still installed; it never installs
dependencies or starts servers. If dependencies were removed, run `.agents/setup`
to repair them. Run `npm test` and `npm run build` to validate the environment.

Start the supervised Vite preview with `amp orb services ensure`. The service in
`.amp/services.yaml` uses Amp's assigned port and checks HTTP readiness. Open the
printed portal URL rather than a localhost URL. Generated portal state is ignored
by Git. Setup changes take effect for future orbs after reaching the Amp project's
default branch; no manual snapshot deletion is needed.

## Submitting changes

1. Create a focused branch from the current default branch.
2. Explain the problem and intended behavior; add a regression test where practical.
3. Run tests and the production build. For UI changes, check a hardware-accelerated
   browser at desktop and narrow sizes, keyboard access, and reduced motion.
   Use the smoke-check list in [README.md](README.md#validation).
4. Open a pull request with a summary, testing results, relevant issue references,
   and screenshots for visible changes. State any verification limitations.

Preserve Cesium credits and provider attribution. Document the origin and license
of every new image, font, data source, and dependency in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Publicly accessible URLs are not
evidence of permission to redistribute. Do not add network-dependent unit tests.

For bug reports, provide reproduction steps, expected and actual behavior,
browser/OS, and sanitized console errors. Report security issues using
[SECURITY.md](SECURITY.md), not public issues.

## Contribution terms

By intentionally submitting a contribution for inclusion, you agree to license
your original contribution under Apache-2.0, as described in section 5 of
[LICENSE](LICENSE), unless explicitly stated otherwise. Submit only work you have
the right to contribute and identify separately licensed material. No copyright
assignment is required.

## Community expectations

Be respectful, constructive, and welcoming. Harassment, discriminatory language,
threats, and publication of private information are not acceptable. Maintainers
may moderate discussions and decline contributions that violate these standards.
For sensitive conduct concerns, request a private maintainer contact without
posting personal details publicly.
