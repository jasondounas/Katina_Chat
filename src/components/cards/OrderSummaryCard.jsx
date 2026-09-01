import { getItem, money } from '../../data/restaurant.js';
import { useSession } from '../../engine/session.jsx';
import { Plus, Minus, Check } from '../Icons.jsx';

/** Η εκκρεμής παραγγελία. Τίποτα δεν φτάνει στην κουζίνα πριν την επιβεβαίωση. */
export default function OrderSummaryCard({ id }) {
  const { state, api } = useSession();
  const draft = state.drafts[id];
  if (!draft) return null;

  const lines = draft.items.map((l) => ({ ...l, item: getItem(l.itemId) }));
  const total = lines.reduce((s, l) => s + l.item.price * l.qty, 0);
  const pending = draft.status === 'pending';

  if (draft.status === 'cancelled') {
    return (
      <div className="card">
        <div className="status">
          <div className="status__head" style={{ marginBottom: 0 }}>
            <span className="pulse pulse--idle" />
            <div className="status__title"><b>Η παραγγελία καθαρίστηκε</b><span>Δεν στάλθηκε τίποτα</span></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card__head">
        <span className="card__title">
          {pending ? 'Στην παραγγελία σας' : `Παραγγελία #${state.order.number}`}
        </span>
        {!pending && (
          <span className="eyebrow" style={{ color: 'var(--live)' }}>Στάλθηκε</span>
        )}
      </div>

      <div className="card__body">
        {lines.map((l) => (
          <div className="line" key={l.itemId}>
            {/* όσο η παραγγελία είναι επεξεργάσιμη, την ποσότητα τη λέει ο μετρητής */}
            {!pending && <span className="line__qty">{l.qty}×</span>}
            <span className="line__name">{l.item.name}</span>
            <span className="line__leader" />
            <span className="price line__price">{money(l.item.price * l.qty)}</span>
            {pending && (
              <span className="qty">
                <button onClick={() => api.draftQty(id, l.itemId, -1)} aria-label={`Ένα λιγότερο: ${l.item.name}`}>
                  <Minus width={12} height={12} />
                </button>
                <span>{l.qty}</span>
                <button onClick={() => api.draftQty(id, l.itemId, 1)} aria-label={`Ένα ακόμα: ${l.item.name}`}>
                  <Plus width={12} height={12} />
                </button>
              </span>
            )}
          </div>
        ))}

        <div className="total total--sub">
          <span className="total__label">Μερικό σύνολο</span>
          <span className="price total__value">{money(total)}</span>
        </div>
      </div>

      {pending ? (
        <div className="card__foot">
          <button className="btn btn--primary" onClick={() => api.confirmDraft(id)}>Επιβεβαίωση παραγγελίας</button>
          <button className="btn" onClick={() => api.send('Δείξε μου τον κατάλογο')}>Κάτι ακόμα</button>
        </div>
      ) : (
        <div className="card__foot" style={{ color: 'var(--text-3)', fontSize: 12, alignItems: 'center', gap: 8 }}>
          <Check width={13} height={13} />
          <span>Στάλθηκε στην κουζίνα στις {state.order.placedAt}</span>
        </div>
      )}
    </div>
  );
}
