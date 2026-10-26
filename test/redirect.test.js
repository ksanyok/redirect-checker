import { test } from 'node:test';
import assert from 'node:assert/strict';
import { traceRedirects, metaRefresh } from '../src/index.js';

const web = (routes) => async (url) => {
  const r = routes[url];
  if (!r) throw Object.assign(new TypeError('fetch failed'), { cause: { code: 'ENOTFOUND' } });
  const headers = { ...(r.location ? { location: r.location } : {}), 'content-type': r.type || 'text/html' };
  return new Response(r.body ?? null, { status: r.status, headers });
};
const codes = (r) => r.issues.map((i) => i.code);

test('follows a clean http → https chain', async () => {
  const r = await traceRedirects('example.com', { fetch: web({
    'http://example.com/': { status: 301, location: 'https://example.com/' },
    'https://example.com/': { status: 200, body: '<html></html>' },
  }) });
  assert.equal(r.redirects, 1);
  assert.equal(r.final, 'https://example.com/');
  assert.deepEqual(r.issues, []);
});

test('resolves relative locations and flags long chains and temporary https redirects', async () => {
  const r = await traceRedirects('http://example.com/a', { fetch: web({
    'http://example.com/a': { status: 302, location: 'https://example.com/a' },
    'https://example.com/a': { status: 301, location: '/b' },
    'https://example.com/b': { status: 307, location: '/c' },
    'https://example.com/c': { status: 200 },
  }) });
  assert.deepEqual(r.hops.map((h) => h.status), [302, 301, 307, 200]);
  for (const code of ['long-chain', 'temporary-https', 'temporary']) assert.ok(codes(r).includes(code), code);
});

test('detects loops, downgrades, errors and meta refresh', async () => {
  const loop = await traceRedirects('https://example.com/x', { fetch: web({
    'https://example.com/x': { status: 301, location: '/y' }, 'https://example.com/y': { status: 301, location: '/x' },
  }) });
  assert.ok(codes(loop).includes('loop'));
  const down = await traceRedirects('https://example.com/', { fetch: web({
    'https://example.com/': { status: 301, location: 'http://example.com/old' }, 'http://example.com/old': { status: 404 },
  }) });
  assert.ok(codes(down).includes('https-downgrade'));
  assert.ok(codes(down).includes('final-error'));
  const meta = await traceRedirects('https://example.com/m', { fetch: web({
    'https://example.com/m': { status: 200, body: '<meta http-equiv="refresh" content="0; url=/n">' }, 'https://example.com/n': { status: 200 },
  }) });
  assert.equal(meta.final, 'https://example.com/n');
  assert.ok(codes(meta).includes('meta-refresh'));
});

test('stops after maxHops and reports network errors', async () => {
  const routes = {};
  for (let i = 0; i < 5; i++) routes[`https://example.com/${i}`] = { status: 301, location: `/${i + 1}` };
  const r = await traceRedirects('https://example.com/0', { maxHops: 3, fetch: web(routes) });
  assert.ok(codes(r).includes('too-many'));
  const dead = await traceRedirects('https://nowhere.test/', { fetch: web({}) });
  assert.ok(codes(dead).includes('fetch-failed'));
  assert.equal(dead.ok, false);
});

test('parses meta refresh variants', () => {
  assert.equal(metaRefresh('<META HTTP-EQUIV=Refresh CONTENT="5;URL=\'https://e.com/x\'">', 'https://a.com/'), 'https://e.com/x');
  assert.equal(metaRefresh('<meta charset="utf-8">', 'https://a.com/'), null);
});
