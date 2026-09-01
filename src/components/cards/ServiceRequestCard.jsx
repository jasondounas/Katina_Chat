import { serviceItems } from '../../data/restaurant.js';
import { useSession } from '../../engine/session.jsx';
import { Check } from '../Icons.jsx';

/** Ένα αίτημα τραπεζιού είναι μικρή πληροφορία, όχι κάρτα. Μένει chip. */
export function ServiceRequestCard({ id }) {
  const { state } = useSession();
  const entry = state.services.find((s) => s.id === id);
  if (!entry) return null;
  const done = entry.status !== 'pending';

  return (
    <div className={`svc ${done ? 'svc--done' : ''}`}>
      {done ? <Check width={13} height={13} /> : <span className="pulse" />}
      <span>{entry.label}</span>
      <span className="svc__time">{done ? 'Παραδόθηκε' : `Ζητήθηκε ${entry.at}`}</span>
    </div>
  );
}

/** Ό,τι μπορεί να φέρει η σάλα χωρίς δελτίο στην κουζίνα. */
export function ServiceMenu() {
  const { state, api } = useSession();
  const pending = new Set(state.services.filter((s) => s.status === 'pending').map((s) => s.itemId));

  return (
    <div className="card">
      <div className="card__head"><span className="card__title">Από τη σάλα</span></div>
      <div className="card__body">
        <div className="svcgrid">
          {serviceItems.map((s) => (
            <button
              key={s.id}
              onClick={() => api.requestService(s.id)}
              disabled={pending.has(s.id)}
            >
              {pending.has(s.id) ? `${s.label} · έρχεται` : s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
