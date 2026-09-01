/**
 * Κατεβάζει υποψήφιες φωτογραφίες από τα Commons ΤΟΠΙΚΑ, ώστε το contact sheet
 * να φορτώνει από τον δίσκο και να μην εξαρτάται από αργές remote υπηρεσίες.
 *
 *   node tools/commons-candidates.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import fs2 from 'node:fs';

const API = 'https://commons.wikimedia.org/w/api.php';
const DIR = 'tools/cand';
const UA = { 'User-Agent': 'KatinaBot-prototype/1.0 (demo)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const QUERIES = {
  'crab-pasta': 'seafood spaghetti plate',
  gnocchi: 'gnocchi tomato basil',
  lamb: 'roast lamb meat plate',
  'olive-cake': 'cake slice plate dessert',
  tomato: 'caprese tomato mozzarella salad',
  chocolate: 'chocolate dessert plate',
};

const usable = (p) => {
  const i = p.imageinfo?.[0];
  if (!i || i.mime !== 'image/jpeg') return false;
  if (i.width < 900 || i.height < 560) return false;
  const r = i.width / i.height;
  if (r < 1.1 || r > 2.2) return false;
  return !/logo|map|diagram|drawing|painting|illustration|poster|book|cover|page/i.test(p.title);
};

await fs.mkdir(DIR, { recursive: true });

let manifest = {};
try { manifest = JSON.parse(fs2.readFileSync('tools/cand/manifest.json','utf8')); } catch {}
for (const [id, q] of Object.entries(QUERIES)) {
  const url = `${API}?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}`
    + '&gsrnamespace=6&gsrlimit=20&prop=imageinfo&iiprop=url|mime|size|extmetadata'
    + '&iiurlwidth=900&format=json';
  const res = await fetch(url, { headers: UA });
  if (!res.ok) { console.log('http', res.status, id); await sleep(2500); continue; }
  const pages = Object.values((await res.json()).query?.pages ?? {}).filter(usable).slice(0, 6);

  manifest[id] = [];
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const file = `${id}-${i}.jpg`;
    if (!fs2.existsSync(path.join(DIR, file))) {
      const img = await fetch(p.imageinfo[0].thumburl, { headers: UA });
      if (!img.ok) continue;
      await fs.writeFile(path.join(DIR, file), Buffer.from(await img.arrayBuffer()));
    }
    const meta = p.imageinfo[0].extmetadata ?? {};
    const strip = (h) => (h ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    manifest[id].push({
      file,
      title: p.title.replace(/^File:/, ''),
      author: strip(meta.Artist?.value) || 'Unknown',
      license: strip(meta.LicenseShortName?.value) || 'See Commons',
      source: `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title)}`,
    });
  }
  console.log(String(manifest[id].length).padStart(2), '·', id);
  await sleep(3000);
}

await fs.writeFile('tools/cand/manifest.json', JSON.stringify(manifest, null, 2) + '\n');

const rows = Object.entries(manifest).map(([id, list]) => `
  <section><h2>${id}</h2><div class="row">
  ${list.map((c, i) => `<figure><img src="${c.file}"><figcaption>${i}</figcaption></figure>`).join('')}
  </div></section>`).join('');

await fs.writeFile('tools/cand/sheet.html', `<meta charset="utf-8"><style>
body{background:#111;color:#eee;font:13px system-ui;margin:0;padding:14px}
h2{font:600 13px system-ui;color:#d9a75b;margin:0 0 6px}
section{margin-bottom:14px}
.row{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}
figure{margin:0;position:relative}
img{width:100%;aspect-ratio:176/118;object-fit:cover;border-radius:5px;display:block;background:#222}
figcaption{position:absolute;top:4px;left:4px;background:#000c;padding:1px 6px;border-radius:3px;font:600 11px system-ui}
</style>${rows}`);

console.log('\nsheet → tools/cand/sheet.html');
