const PERMANENT = new Set([301, 308]);
const TEMPORARY = new Set([302, 303, 307]);
const UA = 'Mozilla/5.0 (compatible; redirect-checker; +https://github.com/ksanyok/redirect-checker)';

function startUrl(input) {
  const s = String(input || '').trim();
  if (!s) throw new TypeError('A URL is required');
  return new URL(/^https?:\/\//i.test(s) ? s : `http://${s}`).toString();
}

/** Find a <meta http-equiv="refresh"> target in an HTML body. */
export function metaRefresh(html, base) {
  const tag = /<meta[^>]+http-equiv\s*=\s*["']?refresh["']?[^>]*>/i.exec(html)?.[0];
  const m = tag && /content\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(tag);
  const content = m && (m[1] ?? m[2] ?? m[3]);
  const target = content && /url\s*=\s*['"]?([^'";]+)/i.exec(content)?.[1];
  return target ? new URL(target.trim(), base).toString() : null;
}

/**
 * Follow a URL hop by hop and report every redirect.
 * @param {string} url
 * @param {{maxHops?: number, userAgent?: string, method?: 'GET'|'HEAD', fetch?: typeof fetch, followMeta?: boolean}} [options]
 */
export async function traceRedirects(url, options = {}) {
  const doFetch = options.fetch || globalThis.fetch;
  const max = options.maxHops ?? 10;
  const hops = [];
  const issues = [];
  const add = (level, code, message) => issues.push({ level, code, message });
  const seen = new Set();
  let current = startUrl(url);
  for (let i = 0; i <= max; i++) {
    if (seen.has(current)) { add('error', 'loop', `Redirect loop: ${current} was already visited.`); break; }
    seen.add(current);
    const started = Date.now();
    let res;
    try {
      res = await doFetch(current, { method: options.method || 'GET', redirect: 'manual', headers: { 'user-agent': options.userAgent || UA } });
    } catch (err) {
      hops.push({ url: current, status: null, error: err.cause?.code || err.message });
      add('error', 'fetch-failed', `Request to ${current} failed: ${err.cause?.code || err.message}`);
      break;
    }
    const hop = { url: current, status: res.status, location: null, kind: null, ms: Date.now() - started, server: res.headers.get('server') };
    hops.push(hop);
    const loc = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && loc) {
      hop.location = new URL(loc, current).toString();
      hop.kind = PERMANENT.has(res.status) ? 'permanent' : TEMPORARY.has(res.status) ? 'temporary' : 'other';
      current = hop.location;
      continue;
    }
    if (options.followMeta !== false && res.status === 200 && /html/i.test(res.headers.get('content-type') || '') && (options.method || 'GET') === 'GET') {
      const target = metaRefresh(await res.text(), current);
      if (target) { hop.location = target; hop.kind = 'meta-refresh'; current = target; continue; }
    }
    break;
  }
  const redirects = hops.filter((h) => h.location);
  const final = hops[hops.length - 1];
  if (redirects.length >= max && final.location) add('error', 'too-many', `Stopped after ${max} redirects.`);
  if (redirects.length > 2) add('warning', 'long-chain', `${redirects.length} redirects in a row; point links straight to the final URL (search engines may stop following after a few hops).`);
  for (const h of redirects) {
    const from = new URL(h.url);
    const to = new URL(h.location);
    if (h.kind === 'temporary' && from.host === to.host && from.protocol === 'http:' && to.protocol === 'https:') add('warning', 'temporary-https', `${h.url} → https uses ${h.status}; use 301 or 308 for a permanent HTTPS redirect.`);
    else if (h.kind === 'temporary') add('info', 'temporary', `${h.url} uses a temporary ${h.status} redirect; use 301/308 if the move is permanent.`);
    if (from.protocol === 'https:' && to.protocol === 'http:') add('error', 'https-downgrade', `${h.url} redirects from HTTPS to insecure HTTP.`);
    if (h.kind === 'meta-refresh') add('warning', 'meta-refresh', `${h.url} uses a <meta> refresh instead of an HTTP redirect.`);
  }
  if (final.status >= 400) add('error', 'final-error', `The chain ends with HTTP ${final.status}.`);
  if (final.status && final.status < 400 && new URL(final.url).protocol === 'http:') add('warning', 'no-https', 'The final URL is served over plain HTTP.');
  return { start: hops[0].url, final: final.url, finalStatus: final.status, redirects: redirects.length, hops, issues, ok: !issues.some((i) => i.level === 'error') };
}
