import { waiterReasons, staff } from '../../data/restaurant.js';
import { useSession } from '../../engine/session.jsx';

/**
 * Το να ρωτάμε «γιατί» πριν καλέσουμε είναι όλο το νόημα: όποιος έρθει,
 * ξέρει ήδη για ποιο λόγο έρχεται.
 */
export function WaiterReasons() {
  const { api } = useSession();
  return (
    <div className="acts">
      {waiterReasons.map((r) => (
        <button key={r.id} className="act" onClick={() => api.requestWaiter(r.id, r.label)}>
          {r.label}
        </button>
      ))}
    </div>
  );
}

export function WaiterCard({ id }) {
  const { state, api } = useSession();
  const req = state.waiter && (!id || state.waiter.id === id) ? state.waiter : null;
  if (!req) return null;

  const person = Object.values(staff).find((s) => s.id === req.staffId) ?? staff.maria;
  const cancelled = req.status === 'cancelled';

  return (
    <div className="card">
      <div className="status">
        <div className="status__head" style={{ marginBottom: cancelled ? 0 : 12 }}>
          <span className="avatar">{person.initials}</span>
          <div className="status__title">
            <b>{cancelled ? 'Το αίτημα ακυρώθηκε' : 'Ζητήθηκε σερβιτόρος'}</b>
            <span>{person.name} · {person.role}</span>
          </div>
          {!cancelled && <span className="pulse pulse--accent" />}
        </div>

        {!cancelled && (
          <div className="eta" style={{ marginTop: 0, paddingTop: 11 }}>
            <span>{req.reasonLabel}</span>
            <span>Ζητήθηκε {req.at}</span>
          </div>
        )}
      </div>

      {!cancelled && (
        <div className="card__foot">
          <button className="btn btn--ghost btn--danger" onClick={api.cancelWaiter}>
            Ακύρωση αιτήματος
          </button>
        </div>
      )}
    </div>
  );
}
