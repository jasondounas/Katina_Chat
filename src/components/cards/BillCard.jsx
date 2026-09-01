import { money, table } from '../../data/restaurant.js';
import { useSession } from '../../engine/session.jsx';
import { billLines, subtotal } from '../../engine/state.js';

/**
 * Ο λογαριασμός χρησιμοποιεί τις τελείες της τυπωμένης απόδειξης ανάμεσα σε
 * όνομα και τιμή. Είναι το μόνο σημείο όπου η διεπαφή δανείζεται σκόπιμα από
 * το χαρτί, γιατί αυτό ακριβώς περιμένει να δει ο επισκέπτης.
 */
export default function BillCard({ compact }) {
  const { state, api } = useSession();
  const lines = billLines(state);
  const total = subtotal(state);
  if (!lines.length) return null;

  const settled = Boolean(state.payment);

  return (
    <div className="card">
      <div className="card__head">
        <span className="card__title">Το τραπέζι σας</span>
        <span className="eyebrow">{table.label} · {table.party} άτομα</span>
      </div>

      <div className="card__body">
        {lines.map((l) => (
          <div className="line" key={l.itemId}>
            <span className="line__qty">{l.qty}×</span>
            <span className="line__name">{l.item.name}</span>
            <span className="line__leader" />
            <span className="price line__price">{money(l.total)}</span>
          </div>
        ))}

        <div className="total">
          <span className="total__label">{settled ? 'Πληρώθηκε' : 'Μερικό σύνολο'}</span>
          <span className="price total__value">{money(total)}</span>
        </div>
      </div>

      {!compact && !settled && (
        <div className="card__foot">
          <button className="btn btn--primary" onClick={() => api.openSheet('payment')}>Πληρωμή</button>
          <button className="btn" onClick={() => api.openSheet('split')}>Μοίρασμα</button>
        </div>
      )}
    </div>
  );
}
