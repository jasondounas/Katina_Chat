import { useState } from 'react';
import Sheet from './Sheet.jsx';
import { useSession } from '../../engine/session.jsx';
import { openDraft, draftLines, draftTotal } from '../../engine/state.js';
import { getItem, categories, tags as tagDefs, money } from '../../data/restaurant.js';
import { Plus, Minus } from '../Icons.jsx';

const DRINK_CATS = ['drinks', 'cocktails', 'beverages', 'soft drinks', 'wine', 'bar'];

const MOD_SETS = {
  drink: ['χωρίς πάγο', 'με πολύ πάγο', 'χωρίς ζάχαρη'],
  food: ['χωρίς κρεμμύδι', 'χωρίς σάλτσα'],
};

const modsFor = (item) => {
  const cat = categories.find((c) => c.id === item.category);
  const name = String(cat?.id || item.category || '').toLowerCase();
  const isDrink = DRINK_CATS.some((d) => name.includes(d)) || cat?.unit === 'ποτά';
  return MOD_SETS[isDrink ? 'drink' : 'food'];
};

function CartLine({ draftId, line }) {
  const { api } = useSession();
  const [noteOpen, setNoteOpen] = useState(!!line.note);
  const item = getItem(line.itemId);
  if (!item) return null;

  const itemTags = (item.tags || []).map((id) => tagDefs[id]).filter(Boolean);
  const diet = itemTags.find((t) => t.tone === 'diet');
  const allergens = itemTags.filter((t) => t.tone === 'allergen');

  return (
    <div className="cartline">
      <div className="cartline__top">
        <div className="cartline__body">
          <div className="cartline__name">{item.name}</div>
          <div className="price cartline__price">{money(item.price * line.qty)}</div>
          {(diet || allergens.length > 0) && (
            <div className="cartline__diet">
              {diet && <span className="tag tag--diet">{diet.short}</span>}
              {allergens.length > 0 && (
                <span className="cartline__contains">
                  Περιέχει: {allergens.map((a) => a.short.toLowerCase()).join(', ')}
                </span>
              )}
            </div>
          )}
        </div>
        <span className="qty">
          <button
            onClick={() => api.draftQty(draftId, line.lineId, -1)}
            aria-label={`Ένα λιγότερο: ${item.name}`}
          >
            <Minus width={12} height={12} />
          </button>
          <span>{line.qty}</span>
          <button
            onClick={() => api.draftQty(draftId, line.lineId, 1)}
            aria-label={`Ένα ακόμα: ${item.name}`}
          >
            <Plus width={12} height={12} />
          </button>
        </span>
      </div>

      <div className="cartline__mods">
        {modsFor(item).map((mod) => (
          <button
            key={mod}
            className="pill pill--sm"
            aria-pressed={line.mods.includes(mod)}
            onClick={() => api.toggleMod(draftId, line.lineId, mod)}
          >
            {mod}
          </button>
        ))}
        <button className="pill pill--sm pill--ghost" onClick={() => setNoteOpen((v) => !v)}>
          + Σημείωση
        </button>
      </div>

      {noteOpen && (
        <textarea
          className="cartline__note"
          rows={2}
          value={line.note}
          onChange={(e) => api.lineNote(draftId, line.lineId, e.target.value)}
          placeholder={`Σημείωση για ${item.name}`}
        />
      )}

      <div className="cartline__mods">
        <button
          className="pill pill--sm pill--ghost"
          onClick={() => api.forkLine(draftId, line.lineId)}
        >
          + άλλο ένα, ξεχωριστά
        </button>
      </div>
    </div>
  );
}

export default function CartSheet() {
  const { state, api } = useSession();
  const draft = openDraft(state);
  const lines = draftLines(state);
  const total = draftTotal(state);

  if (!draft || !lines.length) {
    return (
      <Sheet title="Η παραγγελία μου" onClose={api.closeSheet}>
        <p className="catalog__empty">
          Η παραγγελία σας είναι άδεια.
          <br />
          <button className="pill pill--sm" onClick={() => api.openSheet('catalog')}>
            Άνοιγμα καταλόγου
          </button>
        </p>
      </Sheet>
    );
  }

  return (
    <Sheet
      title="Η παραγγελία μου"
      back={() => api.openSheet('catalog')}
      footer={(
        <>
          <textarea
            className="cart__note"
            rows={1}
            value={state.draftNote}
            onChange={(e) => api.draftNote(e.target.value)}
            placeholder="Σημείωση (προαιρετικό) — π.χ. χωρίς πάγο"
          />
          <button
            className="btn btn--primary cart__confirm"
            onClick={() => api.confirmDraft(draft.id)}
          >
            Επιβεβαίωση · {money(total)}
          </button>
          <p className="cart__reassure">
            Τίποτα δεν φεύγει στην κουζίνα μέχρι να το επιβεβαιώσετε.
          </p>
        </>
      )}
    >
      {lines.map((line) => (
        <CartLine key={line.lineId} draftId={draft.id} line={line} />
      ))}
      <div className="total total--sub">
        <span className="total__label">Σύνολο</span>
        <span className="price total__value">{money(total)}</span>
      </div>
    </Sheet>
  );
}