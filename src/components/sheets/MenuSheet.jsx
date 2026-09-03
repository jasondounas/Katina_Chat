import { useState } from 'react';
import Sheet from './Sheet.jsx';
import Plate, { DishPhoto } from '../Plate.jsx';
import TagList from '../menu/TagList.jsx';
import MenuItemRow from '../menu/MenuItemRow.jsx';
import { useSession } from '../../engine/session.jsx';
import { getCategory, itemsIn, getItem, money, modifiers as modDefs } from '../../data/restaurant.js';
import { Plus, Minus } from '../Icons.jsx';

/** Μια ολόκληρη κατηγορία, χωρίς να φύγετε από τη συνομιλία. */
export function CategorySheet({ payload }) {
  const { state, api } = useSession();
  const category = getCategory(payload.categoryId);
  const items = itemsIn(category.id);

  const draft = state.basketId ? state.drafts[state.basketId] : null;
  const basketLines = (draft?.items ?? []).map((l) => ({ ...l, item: getItem(l.itemId) }));
  const basketTotal = basketLines.reduce((sum, l) => sum + l.item.price * l.qty, 0);
  const hasBasket = basketLines.length > 0;

  const confirmOrder = () => {
    api.confirmDraft(state.basketId);
    api.closeSheet();
  };

  return (
    <Sheet
      eyebrow={category.note}
      title={category.name}
      footer={hasBasket ? (
        <button className="btn btn--primary" style={{ width: '100%' }} onClick={confirmOrder}>
          Επιβεβαίωση Παραγγελίας · {money(basketTotal)}
        </button>
      ) : undefined}
    >
      <div className="rows" style={{ padding: 0 }}>
        {items.map((item) => (
          <MenuItemRow key={item.id} item={item} />
        ))}
      </div>
      <div style={{ height: 14 }} />
    </Sheet>
  );
}

/** Ένα πιάτο, αναλυτικά — το μόνο σημείο όπου το πιάτο δείχνεται μεγάλο. */
export function ItemSheet({ payload }) {
  const { state, api } = useSession();
  const item = getItem(payload.itemId);
  const [mods, setMods] = useState([]);

  const available = item.available;
  const draft = state.basketId ? state.drafts[state.basketId] : null;
  const myQty = draft?.items.find((l) => l.itemId === item.id)?.qty || 0;

  // Same running total everywhere (menu card, this sheet, the sticky bar) —
  // the whole basket, not just this one item.
  const basketLines = (draft?.items ?? []).map((l) => ({ ...l, item: getItem(l.itemId) }));
  const basketTotal = basketLines.reduce((sum, l) => sum + l.item.price * l.qty, 0);
  const hasBasket = basketLines.length > 0;

  const inc = () => api.addItem(item.id, 1);
  const dec = () => { if (state.basketId) api.draftQty(state.basketId, item.id, -1); };

  const confirmOrder = () => {
    api.confirmDraft(state.basketId);
    api.closeSheet();
  };

  return (
    <Sheet
      eyebrow={getCategory(item.category).name}
      title={item.name}
      footer={
        available ? (
          <>
            <span className="qty" style={{ margin: 0 }}>
              <button onClick={dec} aria-label="Λιγότερα" disabled={myQty === 0}>
                <Minus width={13} height={13} />
              </button>
              <span>{myQty}</span>
              <button onClick={inc} aria-label="Περισσότερα">
                <Plus width={13} height={13} />
              </button>
            </span>
            <button className="btn btn--primary" onClick={confirmOrder} disabled={!hasBasket}>
              Επιβεβαίωση Παραγγελίας · {money(basketTotal)}
            </button>
          </>
        ) : (
          <button className="btn" disabled>{item.unavailableNote}</button>
        )
      }
    >
      <div className="hero">
        <DishPhoto item={item}>
          <Plate art={item.art} size={168} />
        </DishPhoto>
      </div>

      <p className="turn__voice" style={{ fontSize: 16, marginBottom: 10 }}>{item.description}</p>
      <TagList ids={item.tags} max={6} short={false} />

      <div className="info" style={{ marginTop: 14 }}>
        <div className="info__row">
          <span className="info__label">Τιμή</span>
          <span className="info__value">{money(item.price)}</span>
        </div>
        <div className="info__row">
          <span className="info__label">Έτοιμο σε</span>
          <span className="info__value">{item.prepMin} λεπτά</span>
        </div>
        {item.pairs?.length > 0 && (
          <div className="info__row">
            <span className="info__label">Ταιριάζει με</span>
            <span className="info__value">
              {item.pairs.map((p) => getItem(p).name).join(', ')}
            </span>
          </div>
        )}
      </div>

      {item.modifiers?.length > 0 && (
        <>
          <div className="eyebrow" style={{ margin: '16px 0 8px' }}>Η κουζίνα μπορεί να αλλάξει</div>
          {item.modifiers.map((id) => (
            <button
              key={id}
              className="opt"
              aria-pressed={mods.includes(id)}
              onClick={() => setMods((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]))}
            >
              <span className="opt__body">
                <span className="opt__name">{modDefs[id].label}</span>
                {modDefs[id].note && <span className="opt__hint">{modDefs[id].note}</span>}
              </span>
              <span className="price" style={{ fontSize: 12, color: 'var(--text-3)' }}>
                {modDefs[id].priceDelta ? `+${money(modDefs[id].priceDelta)}` : 'Χωρίς χρέωση'}
              </span>
            </button>
          ))}
        </>
      )}
    </Sheet>
  );
}