import { useMemo, useRef, useState } from 'react';
import Sheet from './Sheet.jsx';
import { useSession } from '../../engine/session.jsx';
import { draftCount, draftTotal, draftQtyOf } from '../../engine/state.js';
import { menu, categories, tags as tagDefs, money } from '../../data/restaurant.js';
import { Plus } from '../Icons.jsx';

/** Greek search must ignore accents and final sigma, like intents.js does. */
const norm = (s) => String(s)
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/ς/g, 'σ');

export default function CatalogSheet() {
  const { state, api } = useSession();
  const [query, setQuery] = useState('');
  const [diets, setDiets] = useState([]);
  const sectionRefs = useRef({});

  const dietTags = useMemo(() => {
    const present = new Set(menu.flatMap((m) => m.tags || []));
    return Object.values(tagDefs).filter((t) => t.tone === 'diet' && present.has(t.id));
  }, []);

  const allergensOf = (item) => (item.tags || [])
    .map((id) => tagDefs[id])
    .filter((t) => t && t.tone === 'allergen');

  const visible = useMemo(() => {
    const q = norm(query.trim());
    return menu.filter((m) => {
      if (q && !norm(m.name).includes(q) && !norm(m.description || '').includes(q)) return false;
      return diets.every((d) => (m.tags || []).includes(d));
    });
  }, [query, diets]);

  const sections = categories
    .map((cat) => ({ cat, items: visible.filter((m) => m.category === cat.id) }))
    .filter((s) => s.items.length);

  const jumpTo = (categoryId) => {
    const el = sectionRefs.current[categoryId];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const count = draftCount(state);
  const total = draftTotal(state);

  return (
    <Sheet
      title="Κατάλογος"
      footer={count > 0 ? (
        <button className="basketbar" onClick={() => api.openSheet('cart')}>
          <span className="basketbar__n">{count}</span>
          <span>Δες την παραγγελία</span>
          <span className="price basketbar__total">{money(total)} →</span>
        </button>
      ) : null}
    >
      <div className="catalog__tools">
        <input
          className="catalog__search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Αναζήτηση στο μενού…"
          aria-label="Αναζήτηση στο μενού"
        />
        {dietTags.length > 0 && (
          <div className="catalog__filters">
            {dietTags.map((t) => (
              <button
                key={t.id}
                className="pill pill--sm"
                aria-pressed={diets.includes(t.id)}
                onClick={() => setDiets((d) => (
                  d.includes(t.id) ? d.filter((x) => x !== t.id) : [...d, t.id]
                ))}
              >
                {t.short}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="catalog__jump">
        {categories.map((c) => (
          <button key={c.id} className="pill pill--sm" onClick={() => jumpTo(c.id)}>
            {c.name}
          </button>
        ))}
      </div>

      {!sections.length ? (
        <p className="catalog__empty">Κανένα είδος δεν ταιριάζει. Δοκιμάστε λιγότερα φίλτρα.</p>
      ) : (
        <div>
          {sections.map(({ cat, items }) => (
            <div key={cat.id}>
              <div
                className="catalog__section"
                ref={(el) => { sectionRefs.current[cat.id] = el; }}
              >
                {cat.name}
              </div>
              {items.map((item) => {
                const inBasket = draftQtyOf(state, item.id);
                const allergens = allergensOf(item);
                return (
                  <div className="crow" key={item.id}>
                    <div className="crow__body">
                      <div className="crow__name">{item.name}</div>
                      <div className="price crow__price">{money(item.price)}</div>
                      {allergens.length > 0 && (
                        <div className="crow__meta">
                          Περιέχει: {allergens.map((a) => a.short.toLowerCase()).join(', ')}
                        </div>
                      )}
                    </div>
                    {inBasket > 0 && <span className="crow__qty">{inBasket}</span>}
                    <button
                      className="crow__add"
                      onClick={() => api.addItem(item.id, 1)}
                      disabled={!item.available}
                      aria-label={`Προσθήκη: ${item.name}`}
                    >
                      {item.available ? <Plus width={14} height={14} /> : '—'}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
          <div style={{ height: 14 }} />
        </div>
      )}
    </Sheet>
  );
}