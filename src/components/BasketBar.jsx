import { useSession } from '../engine/session.jsx';
import { getItem, money } from '../data/restaurant.js';

/**
 * Always-visible bar showing the currently open basket's running total.
 * Tapping it opens the full cart review (CartSheet) — it does NOT send
 * anything itself. You can keep browsing and adding from any category
 * while this bar just quietly keeps the total up to date.
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
    <button className="basket-bar" onClick={() => api.openSheet('cart')}>
      <div className="basket-bar__info">
        <span className="basket-bar__count">{count} {count === 1 ? 'προϊόν' : 'προϊόντα'}</span>
        <span className="price basket-bar__total">{money(total)}</span>
      </div>
      <span className="basket-bar__cta">Το καλάθι σας ›</span>
    </button>
  );
}