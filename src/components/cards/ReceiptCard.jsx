import { useState } from 'react';
import { money2, table, paymentMethods } from '../../data/restaurant.js';
import { useSession } from '../../engine/session.jsx';
import { Check } from '../Icons.jsx';

export default function ReceiptCard() {
  const { state } = useSession();
  const p = state.payment;
  if (!p) return null;
  const method = paymentMethods.find((m) => m.id === p.method);

  return (
    <div className="card">
      <div className="receipt">
        <div className="receipt__tick"><Check width={19} height={19} /></div>
        <div className="price receipt__amount">{money2(p.total)}</div>
        <div className="receipt__meta">
          Επιτυχής πληρωμή · {method?.label ?? 'Κάρτα'} · {p.at}
        </div>

        <div className="receipt__split">
          <span>{table.label}</span>
          <span>
            {money2(p.subtotal)} + {money2(p.tip)} φιλοδώρημα
            {p.mode === 'share' ? ` · μερίδιο από ${p.shares}` : ''}
          </span>
        </div>
      </div>

      <div className="card__foot">
        <ReceiptEmail />
      </div>
    </div>
  );
}

/** Κανείς δεν θέλει να πληκτρολογεί email στο τέλος. Ένα πάτημα φτάνει. */
export function ReceiptEmail() {
  const { state, api } = useSession();
  const [email, setEmail] = useState('alex@mail.com');
  const sent = state.payment?.receiptEmail;

  if (sent) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--live)' }}>
        <Check width={13} height={13} />
        <span>Η απόδειξη στάλθηκε στο {sent}</span>
      </div>
    );
  }

  return (
    <>
      <input
        className="note"
        style={{ marginTop: 0, flex: 1 }}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label="Email για την απόδειξη"
        inputMode="email"
      />
      <button className="btn" style={{ flex: '0 0 auto' }} onClick={() => api.setReceiptEmail(email)}>
        Αποστολή απόδειξης
      </button>
    </>
  );
}
