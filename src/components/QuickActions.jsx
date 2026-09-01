import { useSession } from '../engine/session.jsx';

/**
 * Προτάσεις μέσα στην ατάκα. Διαβάζονται σαν κάτι που μόλις πρότεινε ο
 * βοηθός, όχι σαν μπάρα πλοήγησης βιδωμένη πάνω σε ένα chat.
 */
export default function QuickActions({ options = [] }) {
  const { api } = useSession();
  return (
    <div className="acts">
      {options.map((o, i) => (
        <button
          key={`${o.label}-${i}`}
          className={`act ${o.tone === 'primary' ? 'act--primary' : ''}`}
          onClick={() => api.act(o)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
