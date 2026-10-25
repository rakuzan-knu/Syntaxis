# Security policy

Report vulnerabilities privately on Telegram: https://t.me/gmblesssed. Please do not open public
issues for security problems.

We aim to acknowledge reports within 48 hours.

## Hardening in place

- Static deployment with no server runtime or user data storage.
- Strict Content Security Policy: scripts, styles, fonts and images only from the site origin.
- HSTS with preload, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `nosniff`, restrictive
  Permissions-Policy, and a cross-origin opener policy.
- No third-party scripts, trackers or cookies. Fonts are self-hosted.
