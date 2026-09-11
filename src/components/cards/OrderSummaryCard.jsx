import { getItem, money, orderStages } from '../../data/restaurant.js';
import { useSession } from '../../engine/session.jsx';
import { orderStageIndex } from '../../engine/state.js';
import { Plus, Minus } from '../Icons.jsx';

const STAGE_NOTE = {
  received: 'Η κουζίνα έχει το δελτίο σας',
  preparing: 'Σύντομα στο πάσο',
  ready: 'Η Μαρία τα παίρνει τώρα',
  served: 'Όλα σερβιρίστηκαν',
};

/**
 * Η εκκρεμής παραγγελία. Τίποτα δεν φτάνει στην κουζίνα πριν την επιβεβαίωση.
 *
 * Μόλις επιβεβαιωθεί, ΔΕΝ ανοίγει νέο μήνυμα με ξεχωριστή κάρτα παρακολούθησης
 * — η ίδια κάρτα μετατρέπεται επιτόπου στον ζωντανό δείκτη προόδου, ώστε ο
 * επισκέπτης να βλέπει μία κάρτα για κάθε παραγγελία, όχι δύο.
 */
export default function OrderSummaryCard({ id }) {
  const { state, api } = useSession();
  const draft = state.drafts[id];
  if (!draft) return null;

  const lines = draft.items.map((l) => ({ ...l, item: getItem(l.itemId) }));
  const total = lines.reduce((s, l) => s + l.item.price * l.qty, 0);
  const pending = draft.status === 'pending';
  const confirmed = draft.status === 'confirmed';

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

  const idx = confirmed ? orderStageIndex(state) : -1;
  const stageEta = state.order.etaMin ?? 0;
  const count = lines.reduce((s, l) => s + l.qty, 0);

  return (
    <div className="card">
      <div className="card__head">
        <span className="card__title">
          {pending ? 'Στην παραγγελία σας' : `Παραγγελία #${state.order.number}`}
        </span>
        {confirmed && (
          <span className="eyebrow" style={{ color: 'var(--live)' }}>
            {STAGE_NOTE[state.order.stage] || 'Στάλθηκε'}
          </span>
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

      {pending && (
        <div className="card__foot">
          <button className="btn btn--primary" onClick={() => api.confirmDraft(id)}>Επιβεβαίωση παραγγελίας</button>
          <button className="btn" onClick={() => api.send('Δείξε μου τον κατάλογο')}>Κάτι ακόμα</button>
        </div>
      )}

      {confirmed && (
        <div style={{ padding: '4px 18px 18px' }}>
          <div className="steps">
            {orderStages.map((stage, i) => (
              <div
                key={stage.id}
                className={`step ${i < idx ? 'step--done' : ''} ${i === idx ? 'step--now' : ''}`}
              >
                <span className="step__bar" />
                <span className="step__dot" />
                <span className="step__label">{stage.label}</span>
              </div>
            ))}
          </div>
          <div className="eta">
            <span>{count} είδη</span>
            {state.order.stage === 'preparing' && <span>απομένουν <b>{stageEta}–{stageEta + 2} λεπτά</b></span>}
            {state.order.stage === 'received' && <span>Εκτίμηση <b>{stageEta} λεπτά</b></span>}
            {state.order.stage === 'ready' && <span><b>Φεύγει από το πάσο</b></span>}
            {state.order.stage === 'served' && <span>Ολοκληρώθηκε</span>}
          </div>
        </div>
      )}
    </div>
  );
}