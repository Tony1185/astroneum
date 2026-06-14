# Security Policy

## Supported Versions

While Astroneum is pre-1.0, only the **latest published minor** receives
security fixes. Pin to a specific minor in production and read the
[CHANGELOG](CHANGELOG.md) before upgrading.

| Version | Supported |
| ------- | --------- |
| Latest `0.x` minor | Yes |
| Older `0.x` minors | No — please upgrade |

## Reporting a Vulnerability

**Please do not file public GitHub issues for security bugs.**

Email the maintainer at the address listed on the
[npm package page](https://www.npmjs.com/package/astroneum) with:

- A description of the issue and its impact.
- A minimal reproduction (code snippet, sample input, or a private repo).
- The affected `astroneum` version(s) and browser(s).
- Any suggested mitigation.

You should expect an acknowledgement within **5 business days** and a
disposition (fix planned, won't-fix with rationale, or request for more
information) within **15 business days**.

## What Counts as a Vulnerability

Astroneum is a client-side React library. Examples of in-scope issues:

- Code injection via `ScriptEngine` sandbox escape.
- Untrusted bar data crashing or hanging the renderer.
- Datafeed handlers that can be coerced into making unintended network
  requests on behalf of the page.
- XSS via locale or drawing-template payloads rendered without sanitization.
- Cache-poisoning of the OPFS bar cache by a hostile datafeed.

Out of scope:

- Vulnerabilities in `react`, `react-dom`, or transitive dev dependencies
  — report those upstream.
- Issues that require the attacker to already control the host page
  (post-XSS escalations).
- Self-DoS through obviously bad input from the page's own code.

## Disclosure

Once a fix is available, we will:

1. Publish a patched version to npm.
2. Add an entry under `### Security` in [CHANGELOG.md](CHANGELOG.md).
3. Credit the reporter unless anonymity is requested.

Thank you for helping keep Astroneum users safe.

## Maintainer Notes

- The `main` branch should require pull request review before merge (branch
  protection). The auto-version-bump CI workflow publishes to npm on every
  push to `main` — an unreviewed merge from an untrusted contributor would
  automatically ship to the public registry.
- CI runs `pnpm audit --audit-level moderate` on every build. Review audit
  output periodically to catch known CVEs in the dependency tree.
- The `.gitignore` includes `.env` — never commit API keys or secrets. If
  a secret was ever committed, rotate it immediately and purge from git
  history with `git filter-repo` or `BFG Repo-Cleaner`.
