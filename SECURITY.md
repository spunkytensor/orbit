# Security policy

## Supported versions

Security fixes target the latest default-branch code. Older snapshots and forks
are not maintained separately. This is a community project without a guaranteed
response time or security support SLA.

## Reporting a vulnerability

Do **not** disclose exploitable details, credentials, or personal information in
public issues or pull requests. Use the hosting platform's private vulnerability
reporting feature if the repository offers it. Otherwise, ask a maintainer for a
private reporting channel without posting the vulnerability details. This
repository does not yet publish a dedicated security email address; maintainers
must establish and test a private reporting route before public release.

Include the affected revision, browser/runtime versions, reproduction steps, a
minimal proof of concept, impact, and any proposed mitigation. Test only systems
you own or have permission to test. Do not probe upstream imagery or search
services as part of a report to this project. Coordinate public disclosure with
the maintainer after a fix or mitigation is available.

## Automated security checks

All npm package versions must be at least 72 hours old before installation.
`.npmrc` filters new resolutions with npm 11.10.0+, and CI/orb setup validate
every locked version against live registry publication timestamps before `npm ci`.
Missing metadata, unsupported sources, and registry failures block installation.
Dependabot has a three-day version-update cooldown; its security updates bypass
that cooldown but do not bypass our CI check. Require both regression jobs in
branch protection to enforce this on merges. Local installation instructions in
CONTRIBUTING.md use `npm run deps` for the same preflight with lifecycle scripts
disabled; bare npm commands can bypass the preflight. Engine guards reject npm
versions below 11.10.0. The pinned npm bootstrap itself verifies publication age.

`.github/workflows/public-repo-security.yml` is named **Spunky Tensor security**.
It calls the shared Trivy workflow pinned to
`ed53814ed23f76c11fa4a91f57f99de903c18bfc` (workflow and `baseline-sha` input) and retains the separate npm audit and
CycloneDX evidence. The npm audit scans the complete committed lockfile,
including development and optional dependencies, without installing project
packages or executing their lifecycle scripts. The npm version pinned in
`package.json` supplies the npm audit and npm SBOM tooling.
Both scans run on PRs, pushes to `main`, published releases, nightly at 09:29 UTC,
and manual dispatch. Full-inventory scanning replaces the GitHub dependency-review
service gate; no Dependency Graph or paid private security add-on is required.
Trivy includes development dependencies, rejects empty inventories, retains all
severities, and blocks High/Critical findings including unfixed vulnerabilities.
Caller ignore/config files cannot suppress its shared policy.

High and critical advisories fail the audit job; low and moderate findings remain
visible in the JSON report and require triage. Scanner/service failures also fail
the job. There are no advisory exclusions. Any future exception must identify the
advisory, affected package, reachability, responsible owner, rationale, and expiry
or reassessment condition; do not silently omit development dependencies.

The `npm-supply-chain-artifacts` artifact retains `orbit-sbom.cdx.json`,
`npm-audit.json`, and `npm-audit.exit-code` for 30 days, including on failed runs
when the files were produced. The SBOM inventories build and runtime dependencies;
it is not a claim that all listed packages ship to the browser. Published releases
run the same scan against the release tag and attach the SBOM and audit evidence
as release assets after a successful audit, independent of CI artifact expiry.
License inventory
checks verify packaging, not a legal license allowlist or approval.

Optional, public-only CodeQL runs JavaScript/TypeScript security-extended analysis on PRs, `main`, weekly,
and on demand. Findings appear in GitHub code scanning; successful analysis alone
does not mean no vulnerabilities were found. Actions use immutable commit pins,
read-only permissions except CodeQL result upload and the release-only evidence
upload, and bounded job timeouts. Existing npm, regression, and CodeQL jobs use
Blacksmith Ubuntu 24.04 runners; the repository must have access to that
integration. Trivy uses GitHub-hosted Ubuntu 24.04. Actions minutes/storage and
existing runner billing still apply; this is not a promise of zero CI costs.

Maintainers should enable dependency graph/Dependabot alerts, private vulnerability
reporting, secret scanning and push protection in GitHub settings where available.
Configure branch rules to require both Node regression jobs and the npm audit,
with the shared Trivy check. Workflows alone do not enforce branch protection.
CodeQL is supplemental and skips private repositories instead of requiring GitHub
Code Security. Trivy/npm audit do not replace its dataflow analysis. Do not require
this optional check or a paid code-scanning rule for baseline adoption. Repository
settings are not changed by these files.

## Baseline adoption and remaining gates

Maintainer: Matt Curfman / Spunky Tensor. Supported code remains the latest default
branch only, as described above; there are no separately supported release lines.
The [shared baseline](https://github.com/spunkytensor/.github/blob/ed53814ed23f76c11fa4a91f57f99de903c18bfc/docs/baseline.md)
defines adoption requirements, not a compliance certification.

Trivy's `security-source` artifact retains SPDX and CycloneDX SBOMs, full JSON,
scanner/database version information, source/run identity, and report checksums
for 30 days. Successful release-tag scans attach that evidence alongside the
existing npm evidence to [release downloads](https://github.com/spunkytensor/orbit/releases).
Those are **source/build inventories**, not SBOMs or attestations of a deployed
bundle. No published releases existed at adoption; the release-only upload path
still needs validation on an authorized release.

Orbit distributes source and a static `dist/` browser bundle, not a container or
npm package. Build checks reconcile installed runtime versions and copied notices
with the lockfile. Cesium bundles additional code, workers, WASM and assets under
its full upstream notices. Trivy cannot establish complete coverage of that
bundle or the photographs and branding. Remote fonts, imagery and geocoding are
obtained by the browser, not shipped by Orbit; their terms still apply.

Before claiming full adoption, maintainers must:

- Verify branch rules, workflow/policy owners, 2FA and access reviews. Require the
  real Trivy check alongside existing npm and regression checks; remove obsolete
  dependency-review requirements if configured. Free GitHub security features may
  supplement the baseline but are not prerequisites. Private reports stay in the
  caller's private Actions artifacts, never the public organization reporter.
- Establish and test the private reporting route. Assign vulnerability findings
  an owner and remediation date; exceptions also need reviewer, scope, evidence,
  expiry and tracking reference. The shared scanner currently has no exceptions.
- Reconcile both SBOM formats with actual released bundle files (including nested
  Cesium components and non-code assets), publish bundle checksums and notices,
  and bind provenance/attestations to the exact distributed digest. Source SBOM
  checksums are not bundle checksums. Add immutable released-artifact rescanning
  if supported releases are introduced; rebuilding main is not a substitute.
- Review missing dependency license files and photo/branding provenance and
  service terms in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Automated
  packaging checks are not legal clearance; ORT/ScanCode attribution review is
  still pending.
- Verify the first successful nightly run after merge and connect the shared
  freshness report to this caller path. Alert on scans older than 36 hours;
  cron alone is not continuous monitoring. No successful nightly run is claimed
  by this adoption PR.

## Deployment security

- Deploy only the production `dist/` output over HTTPS. Do not expose Vite's
  development or preview server as a production service.
- There is no backend or project account system. Browser requests still disclose
  IP addresses and request details to external providers; see [PRIVACY.md](PRIVACY.md).
- Never embed secrets in client code or `VITE_*` variables: the browser can read
  them. Ignoring `.env` files does not remove secrets already committed to Git.
- Keep dependencies and the lockfile current. Run `npm audit` and
  `npm audit --omit=dev`; assess development-server advisories as well as runtime
  vulnerabilities. Do not blindly apply forced major-version upgrades.
- Configure appropriate hosting security headers and test a Content Security
  Policy against Cesium workers, imagery, search, and fonts before enforcing it.
- The orb-only `allowedHosts` setting is for the authenticated preview environment,
  not a recommendation for public Vite development servers.
