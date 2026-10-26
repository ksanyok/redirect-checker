#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { traceRedirects } from '../src/index.js';

const HELP = `Usage: redirect-checker <url> [url ...] [options]
       redirect-checker --file urls.txt

Follows a URL hop by hop (301, 302, 307, 308 and <meta> refresh) and shows the
full chain with status codes, timings, loops, downgrades and the final page.

Options:
  --ua <agent>      User agent to send (e.g. "Googlebot")
  --max <n>         Maximum number of hops (default: 10)
  --head            Use HEAD requests instead of GET
  --file <path>     Check every URL in a file (one per line)
  --json            Print JSON
  --strict          Exit with code 1 on warnings too
  -h, --help        Show this help

Online version (no install): https://promopilot.link/en/tools/redirect-checker.php
`;

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const value = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
if (!args.length || flag('-h') || flag('--help')) { process.stdout.write(HELP); process.exit(args.length ? 0 : 2); }

const color = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => (color ? `\x1b[${code}m${s}\x1b[0m` : s);
const ICON = { error: c(31, '✖'), warning: c(33, '!'), info: c(36, 'i') };
const statusColor = (s) => (!s ? 31 : s >= 400 ? 31 : s >= 300 ? 33 : 32);
const valued = new Set(['--ua', '--max', '--file']);
const urls = args.filter((a, i) => !a.startsWith('-') && !valued.has(args[i - 1]));
if (value('--file')) urls.push(...readFileSync(value('--file'), 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#')));

try {
  const reports = [];
  for (const url of urls) reports.push(await traceRedirects(url, { userAgent: value('--ua'), maxHops: Number(value('--max') || 10), method: flag('--head') ? 'HEAD' : 'GET' }));
  if (flag('--json')) console.log(JSON.stringify(reports.length === 1 ? reports[0] : reports, null, 2));
  else for (const r of reports) {
    r.hops.forEach((h, i) => {
      const st = c(statusColor(h.status), String(h.status ?? 'ERR').padEnd(3));
      console.log(`  ${c(2, String(i + 1).padStart(2))}  ${st}  ${h.url}${h.ms !== undefined ? c(2, `  ${h.ms} ms`) : ''}${h.kind === 'meta-refresh' ? c(2, '  (meta refresh)') : ''}`);
    });
    console.log(`\n${c(1, 'Final:')} ${r.final} (HTTP ${r.finalStatus ?? 'error'}) after ${r.redirects} redirect${r.redirects === 1 ? '' : 's'}\n`);
    if (!r.issues.length) console.log(c(32, '✔ Redirects look good'));
    for (const i of r.issues) console.log(`  ${ICON[i.level]} ${i.message}`);
    if (reports.length > 1) console.log(c(2, '─'.repeat(60)));
  }
  const failing = reports.flatMap((r) => r.issues).filter((i) => i.level === 'error' || (flag('--strict') && i.level === 'warning'));
  process.exit(failing.length ? 1 : 0);
} catch (err) {
  console.error(c(31, `Error: ${err.message}`));
  process.exit(2);
}
