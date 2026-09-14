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

`.github/workflows/security.yml` adapts Reel Maestro's separate audit and
CycloneDX evidence pattern to npm. It scans the complete committed lockfile,
including development and optional dependencies, without installing project
packages or executing their lifecycle scripts. npm 11.6.2 supplies both scanners.
Audits run on PRs, pushes to `main`, Mondays at 08:17 UTC, and manual dispatch.

High and critical advisories fail the audit job; low and moderate findings remain
visible in the JSON report and require triage. Scanner/service failures also fail
the job. There are no advisory exclusions. Any future exception must identify the
advisory, affected package, reachability, responsible owner, rationale, and expiry
or reassessment condition; do not silently omit development dependencies.

The `npm-supply-chain-artifacts` artifact retains `orbit-sbom.cdx.json`,
`npm-audit.json`, and `npm-audit.exit-code` for 30 days, including on failed runs
when the files were produced. The SBOM inventories build and runtime dependencies;
it is not a claim that all listed packages ship to the browser. License inventory
checks verify packaging, not a legal license allowlist or approval.

CodeQL runs JavaScript/TypeScript security-extended analysis on PRs, `main`, weekly,
and on demand. Findings appear in GitHub code scanning; successful analysis alone
does not mean no vulnerabilities were found. Actions use immutable commit pins,
read-only permissions except CodeQL result upload, and bounded job timeouts.

Maintainers should enable dependency graph/Dependabot alerts, private vulnerability
reporting, secret scanning and push protection in GitHub settings where available.
Configure branch rules to require both Node regression jobs and the npm audit,
and a code-scanning merge protection rule for CodeQL findings. Workflows alone do
not enforce branch protection. CodeQL requires code scanning enabled (and GitHub
Code Security entitlement if the repository becomes private). Do not enable both
default CodeQL setup and this advanced workflow. Repository settings are not
changed by these files.

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
