import { useState } from 'react';
import Sheet from './Sheet.jsx';
import { useSession } from '../../engine/session.jsx';
import { billLines, subtotal } from '../../engine/state.js';
import { money2, table } from '../../data/restaurant.js';
import { Plus, Minus, Check } from '../Icons.jsx';

const MODES = [
  { id: 'equal', label: 'Ισόποσα' },
  { id: 'items', label: 'Ανά πιάτο' },
  { id: 'custom', label: 'Ελεύθερο ποσό' },
];

export default function SplitBillSheet() {
  const { state, api } = useSession();
  const [mode, setMode] = useState('equal');
  const [guests, setGuests] = useState(table.party);
  const [picked, setPicked] = useState([]);
  const [amount, setAmount] = useState('');

  const lines = billLines(state);
  const total = subtotal(state);
  const equalShare = Math.round((total / guests) * 100) / 100;
  const itemsShare = lines
    .filter((l) => picked.includes(l.itemId))
    .reduce((s, l) => s + l.total, 0);
  const customShare = Math.min(total, Math.max(0, Number(amount) || 0));

  const share = { equal: equalShare, items: itemsShare, custom: customShare }[mode];
  const label = {
    equal: `1 από ${guests} μερίδια`,
    items: `${picked.length} ${picked.length === 1 ? 'πιάτο' : 'πιάτα'}`,
    custom: 'Ελεύθερο ποσό',
  }[mode];

  const toggle = (id) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <Sheet
      eyebrow={`${table.label} · ${money2(total)}`}
      title="Μοίρασμα λογαριασμού"
      footer={
        <button
          className="btn btn--primary"
          disabled={share <= 0}
          onClick={() => api.openSheet('payment', { amount: share, mode: 'share', label, shares: `${money2(total)}` })}
        >
          Πληρωμή {money2(share)}
        </button>
      }
    >
      <div className="seg" style={{ marginBottom: 16 }}>
        {MODES.map((m) => (
          <button key={m.id} aria-pressed={mode === m.id} onClick={() => setMode(m.id)}>{m.label}</button>
        ))}
      </div>

      {mode === 'equal' && (
        <>
          <div className="share" style={{ marginBottom: 12 }}>
            <span className="share__who">Άτομα στο τραπέζι</span>
            <span className="qty">
              <button onClick={() => setGuests((g) => Math.max(2, g - 1))} aria-label="Λιγότερα άτομα"><Minus width={12} height={12} /></button>
              <span>{guests}</span>
              <button onClick={() => setGuests((g) => Math.min(8, g + 1))} aria-label="Περισσότερα άτομα"><Plus width={12} height={12} /></button>
            </span>
          </div>

          <div className="shares">
            {Array.from({ length: guests }, (_, i) => (
              <div className={`share ${i === 0 ? 'share--you' : ''}`} key={i}>
                <span className="avatar" style={{ width: 26, height: 26, fontSize: 11 }}>{i + 1}</span>
                <span className="share__who">{i === 0 ? 'Εσείς · αυτή η συσκευή' : `Άτομο ${i + 1}`}</span>
                <span className="price share__amt">{money2(equalShare)}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 12, lineHeight: 1.5 }}>
            Κάθε άτομο μπορεί να σαρώσει το ίδιο QR και να πληρώσει το δικό του μερίδιο — εσείς πληρώνετε μόνο το δικό σας.
          </p>
        </>
      )}

      {mode === 'items' && (
        <div className="shares">
          {lines.map((l) => (
            <button
              key={l.itemId}
              className="opt"
              style={{ marginBottom: 0 }}
              aria-pressed={picked.includes(l.itemId)}
              onClick={() => toggle(l.itemId)}
            >
              <span className="opt__body">
                <span className="opt__name">{l.qty}× {l.item.name}</span>
                <span className="opt__hint">{money2(l.total)}</span>
              </span>
              <span className="opt__tick"><Check width={15} height={15} /></span>
            </button>
          ))}
        </div>
      )}

      {mode === 'custom' && (
        <>
          <input
            className="note"
            style={{ marginTop: 0 }}
            inputMode="decimal"
            placeholder={`Ποσό σε € — έως ${money2(total)}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
            aria-label="Ποσό προς πληρωμή"
          />
          <div className="seg" style={{ marginTop: 10 }}>
            {[0.25, 0.5, 0.75].map((f) => (
              <button key={f} onClick={() => setAmount(String(Math.round(total * f * 100) / 100))}>
                {f * 100}%
              </button>
            ))}
          </div>
        </>
      )}
    </Sheet>
  );
}
