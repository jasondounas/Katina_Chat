/**
 * Βήμα 2 από 2: εφαρμόζει τις επιλογές που έγιναν με το μάτι πάνω στο contact
 * sheet, και ενημερώνει την απόδοση δικαιωμάτων.
 *
 *   node tools/apply-picks.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const PICKS = {
  'crab-pasta': 2,
  gnocchi: 0,
  lamb: 4,
  'olive-cake': 5,
  tomato: 0,
  chocolate: 5,
  chicken: 5,
  orzo: 4,
  'harissa-prawns': 0,
};

const manifest = JSON.parse(await fs.readFile('tools/cand/manifest.json', 'utf8'));
const credits = JSON.parse(await fs.readFile('src/data/photo-credits.json', 'utf8'));

for (const [id, index] of Object.entries(PICKS)) {
  const pick = manifest[id]?.[index];
  if (!pick) { console.log('MISS', id, index); continue; }
  await fs.copyFile(path.join('tools/cand', pick.file), path.join('public/dishes', `${id}.jpg`));
  credits[id] = {
    title: pick.title, author: pick.author, license: pick.license, source: pick.source,
  };
  console.log('applied', id, '·', pick.title.slice(0, 56));
}

await fs.writeFile('src/data/photo-credits.json', JSON.stringify(credits, null, 2) + '\n');
console.log('\ncredits updated for', Object.keys(credits).length, 'dishes');
