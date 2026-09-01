import { useState } from 'react';
import Sheet from './Sheet.jsx';
import { useSession } from '../../engine/session.jsx';
import { subtotal } from '../../engine/state.js';
import { money2, paymentMethods, tipPresets, table } from '../../data/restaurant.js';
import { Check } from '../Icons.jsx';

/**
 * Πρώτα το φιλοδώρημα, μετά ο τρόπος: το ποσό πρέπει να κλειδώσει πριν
 * δεσμευτεί κανείς να το πληρώσει. Το ελεύθερο ποσό είναι απλό πεδίο αριθμού —
 * ένα slider θα ήταν χαριτωμένο και ανακριβές.
 */
export default function PaymentSheet({ payload }) {
  const { state, api } = useSession();
  const [method, setMethod] = useState('apple');
  const [tipId, setTipId] = useState('ten');
  const [customTip, setCustomTip] = useState('');
  const [status, setStatus] = useState('idle');

  const base = payload?.amount ?? subtotal(state);
  const mode = payload?.mode ?? 'full';
  const preset = tipPresets.find((t) => t.id === tipId);
  const tip = tipId === 'custom'
    ? Math.max(0, Number(customTip) || 0)
    : Math.round(base * (preset.pct / 100) * 100) / 100;
  const total = base + tip;

  const pay = () => {
    setStatus('working');
    setTimeout(() => {
      api.pay({
        method, tipPct: tipId === 'custom' ? null : preset.pct,
        tip, subtotal: base, total, mode,
        shares: payload?.shares,
      });
    }, 1200);
  };

  return (
    <Sheet
      eyebrow={mode === 'full' ? table.label : payload.label}
      title={mode === 'full' ? 'Πληρωμή τραπεζιού' : 'Πληρωμή μεριδίου'}
      footer={
        <button className="btn btn--primary" onClick={pay} disabled={status === 'working'}>
          {status === 'working' ? 'Επιβεβαίωση…' : `Πληρωμή ${money2(total)}`}
        </button>
      }
    >
      <div className="eyebrow" style={{ marginBottom: 8 }}>Φιλοδώρημα</div>
      <div className="seg">
        {tipPresets.map((t) => (
          <button key={t.id} aria-pressed={tipId === t.id} onClick={() => setTipId(t.id)}>{t.label}</button>
        ))}
        <button aria-pressed={tipId === 'custom'} onClick={() => setTipId('custom')}>Άλλο ποσό</button>
      </div>

      {tipId === 'custom' && (
        <input
          className="note"
          inputMode="decimal"
          placeholder="Ποσό φιλοδωρήματος σε €"
          value={customTip}
          onChange={(e) => setCustomTip(e.target.value.replace(/[^\d.]/g, ''))}
          aria-label="Ελεύθερο ποσό φιλοδωρήματος"
        />
      )}

      <div className="total total--sub" style={{ marginBottom: 18 }}>
        <span className="total__label" style={{ textTransform: 'none', letterSpacing: '0.01em', fontSize: 12.5 }}>
          {mode === 'full' ? 'Λογαριασμός' : 'Το μερίδιό σας'} {money2(base)} + φιλοδώρημα {money2(tip)}
        </span>
        <span className="price total__value">{money2(total)}</span>
      </div>

      <div className="eyebrow" style={{ marginBottom: 8 }}>Τρόπος πληρωμής</div>
      {paymentMethods.map((m) => (
        <button key={m.id} className="opt" aria-pressed={method === m.id} onClick={() => setMethod(m.id)}>
          <span className="opt__body">
            <span className="opt__name">{m.label}</span>
            <span className="opt__hint">{m.hint}</span>
          </span>
          <span className="opt__tick"><Check width={15} height={15} /></span>
        </button>
      ))}

      <p style={{ fontSize: 11, color: 'var(--text-4)', margin: '4px 0 8px', lineHeight: 1.5 }}>
        Prototype — δεν εκτελείται πληρωμή και δεν αποθηκεύονται στοιχεία κάρτας.
      </p>
    </Sheet>
  );
}
