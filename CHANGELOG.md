# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-10-26

### Added
- `redirect-checker` CLI with multiple URLs, `--file` bulk mode, `--ua`, `--max`, `--head`, `--json`, `--strict`
- Hop-by-hop tracing with manual redirects: status, resolved Location, timing and server header per hop
- Meta refresh detection and following
- Checks: loops, too many hops, long chains, HTTPS downgrade, temporary HTTPS redirect, temporary redirects, final 4xx/5xx, final URL on plain HTTP
- Library API (`traceRedirects`, `metaRefresh`) with injectable fetch, and GitHub Action

[1.0.0]: https://github.com/ksanyok/redirect-checker/releases/tag/v1.0.0
