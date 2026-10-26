# Getting started

## Requirements

Node.js 18 or newer. No other dependencies.

## Install

```bash
# one-off run
npx github:ksanyok/redirect-checker example.com

# global CLI
npm install -g github:ksanyok/redirect-checker

# as a library in your project
npm install github:ksanyok/redirect-checker
```

## First run

```bash
redirect-checker example.com
```

Each hop is shown with its number, status code, URL and response time; meta refreshes are marked. The line after the chain shows the final URL, its status and the number of redirects. Problems follow: `✖` errors lose traffic, `!` warnings slow it down or weaken SEO signals.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | No errors (warnings allowed unless `--strict`) |
| 1 | Errors found (or warnings with `--strict`) |
| 2 | Bad arguments or the check could not run |

## More examples

**Check several URLs at once**

```bash
redirect-checker http://example.com https://www.example.com/old-page
```

**Check a whole migration map**

```bash
redirect-checker --file old-urls.txt --json > report.json
```

**See what Googlebot gets**

```bash
redirect-checker example.com --ua "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
```

## Without installing anything

Use the [online Redirect Checker](https://promopilot.link/en/tools/redirect-checker.php?utm_source=github&utm_medium=repo&utm_campaign=tools&utm_content=redirect-checker).
