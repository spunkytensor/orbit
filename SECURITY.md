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
