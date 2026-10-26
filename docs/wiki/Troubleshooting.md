# Troubleshooting

## "Request failed: ENOTFOUND"

The host name does not resolve — a typo, or the domain is not configured for this host name (for example, `www`).

## The chain stops with 403 or 429

The site blocks automated clients or rate-limits. Try a browser user agent with `--ua`, or slow down bulk checks.

## Results differ between --head and GET

Some servers handle HEAD differently or not at all. GET is the default because it matches what browsers and crawlers do.

## Redirect loop reported but the site works in my browser

The loop may depend on cookies or the user agent (for example, a language or mobile redirect). Try `--ua` with a browser user agent.

## Still stuck?

Open an [issue](https://github.com/ksanyok/redirect-checker/issues/new/choose) with the command, the output (`--json` if possible) and your Node.js version — or compare with the [online version](https://promopilot.link/en/tools/redirect-checker.php?utm_source=github&utm_medium=repo&utm_campaign=tools&utm_content=redirect-checker).
