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
