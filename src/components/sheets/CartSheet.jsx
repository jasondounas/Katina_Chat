import Sheet from './Sheet.jsx';
import { useSession } from '../../engine/session.jsx';
import { getItem, money } from '../../data/restaurant.js';
import { Plus, Minus } from '../Icons.jsx';

/**
 * Full review of the open basket — reachable any time by tapping the
 * basket bar. Adjust quantities here, keep browsing the menu behind it,
 * and only THIS sheet's button actually sends the order.
 */
export default function CartSheet() {
  const { state, api } = useSession();
  const draft = state.basketId ? state.drafts[state.basketId] : null;
  const lines = (draft?.items ?? [])
    .map((l) => ({ ...l, item: getItem(l.itemId) }))
    .filter((l) => l.item);
  const total = lines.reduce((s, l) => s + l.item.price * l.qty, 0);

  const send = () => {
    api.confirmDraft(state.basketId);
    api.closeSheet();
  };

  return (
    <Sheet
      title="Το Καλάθι σας"
      footer={
        lines.length > 0 ? (
          <button className="btn btn--primary" style={{ width: '100%' }} onClick={send}>
            Αποστολή Παραγγελίας στον Σερβιτόρο
          </button>
        ) : null
      }
    >
      {lines.length === 0 ? (
        <p style={{ color: 'var(--text-4)', padding: '24px 0', textAlign: 'center' }}>
          Το καλάθι σας είναι άδειο.
        </p>
      ) : (
        <>
          {lines.map((l) => (
            <div className="line" key={l.itemId}>
              <span className="line__name">{l.item.name}</span>
              <span className="line__leader" />
              <span className="price line__price">{money(l.item.price * l.qty)}</span>
              <span className="qty">
                <button onClick={() => api.draftQty(state.basketId, l.itemId, -1)} aria-label={`Ένα λιγότερο: ${l.item.name}`}>
                  <Minus width={12} height={12} />
                </button>
                <span>{l.qty}</span>
                <button onClick={() => api.draftQty(state.basketId, l.itemId, 1)} aria-label={`Ένα ακόμα: ${l.item.name}`}>
                  <Plus width={12} height={12} />
                </button>
              </span>
            </div>
          ))}
          <div className="total total--sub">
            <span className="total__label">Σύνολο</span>
            <span className="price total__value">{money(total)}</span>
          </div>
        </>
      )}
    </Sheet>
  );
}