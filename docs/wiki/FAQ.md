# FAQ

## 301 or 302 — does it matter for SEO?

Google treats long-standing 302s much like 301s eventually, but a 301 (or 308) states the move is permanent and consolidates signals faster. Use 302/307 only for genuinely temporary moves.

## How many redirects are too many?

One is ideal. Google follows up to 10 hops but recommends fewer than 3-5; every hop adds latency for users. Link directly to the final URL and collapse chains on the server.

## What is the difference between 307 and 308?

They are the method-preserving versions of 302 and 301: a POST stays a POST. For normal page moves 301/308 are equivalent for SEO.

## Are meta refresh redirects bad?

Google follows instant meta refreshes, but they are slower, not understood by every client and look like a soft 404 when delayed. Prefer a server-side 301.

## Why does the tool show a different result than my browser?

Browsers cache 301 redirects and may have HSTS rules that upgrade to HTTPS before any request. The tool always makes fresh requests.
