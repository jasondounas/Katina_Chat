import { useSession } from '../engine/session.jsx';
import { getItem, money } from '../data/restaurant.js';

/**
 * Always-visible bar showing the currently open basket's count and running
 * total, with the ONE send-order button. This is the only place an order
 * actually gets sent — the browsing popups (category/item) only add and
 * remove quantities, so you can pick from several categories before
 * sending once, the same way customer.html's cart bar works.
 */
export default function BasketBar() {
  const { state, api } = useSession();
  const draft = state.basketId ? state.drafts[state.basketId] : null;
  if (!draft || draft.status !== 'pending' || !draft.items.length) return null;

  const lines = draft.items
    .map((l) => ({ ...l, item: getItem(l.itemId) }))
    .filter((l) => l.item);
  const count = lines.reduce((sum, l) => sum + l.qty, 0);
  const total = lines.reduce((sum, l) => sum + l.item.price * l.qty, 0);

  return (
    <div className="basket-bar">
      <div className="basket-bar__info">
        <span className="basket-bar__count">{count} {count === 1 ? 'προϊόν' : 'προϊόντα'}</span>
        <span className="price basket-bar__total">{money(total)}</span>
      </div>
      <button className="btn btn--primary" onClick={() => api.confirmDraft(state.basketId)}>
        Αποστολή Παραγγελίας
      </button>
    </div>
  );
}