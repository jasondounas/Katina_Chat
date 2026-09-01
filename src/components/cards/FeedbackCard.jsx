import { feedbackTags } from '../../data/restaurant.js';
import { useSession } from '../../engine/session.jsx';
import { Star, Check } from '../Icons.jsx';

export default function FeedbackCard() {
  const { state, api } = useSession();
  const fb = state.feedback;
  const stars = fb?.stars ?? 0;
  const good = stars >= 4;

  if (fb?.submitted) {
    return (
      <div className="card">
        <div className="status">
          <div className="status__head" style={{ marginBottom: 0 }}>
            <span className="avatar" style={{ color: 'var(--live)', borderColor: 'var(--live)', background: 'var(--live-soft)' }}>
              <Check width={15} height={15} />
            </span>
            <div className="status__title">
              <b>Η αξιολόγηση στάλθηκε</b>
              <span>{stars} στα 5{fb.tags.length ? ` · ${fb.tags.join(', ')}` : ''}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card__body" style={{ paddingTop: 10, paddingBottom: stars ? 14 : 10 }}>
        <div className="stars" role="radiogroup" aria-label="Βαθμολογήστε τη βραδιά σας">
          {stars === 0 && <span className="stars__hint">Πατήστε για βαθμολογία</span>}
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              className={`star ${n <= stars ? 'star--on' : ''}`}
              onClick={() => api.rate(n)}
              role="radio"
              aria-checked={n === stars}
              aria-label={`${n} ${n > 1 ? 'αστέρια' : 'αστέρι'}`}
            >
              <Star filled={n <= stars} />
            </button>
          ))}
        </div>

        {stars > 0 && (
          <>
            <p className="turn__voice" style={{ fontSize: 15, marginTop: 12 }}>
              {good
                ? 'Χαίρομαι πολύ. Υπήρξε κάτι που σας άρεσε ιδιαίτερα;'
                : 'Λυπάμαι που δεν ήταν τέλεια. Τι θα μπορούσαμε να κάνουμε καλύτερα;'}
            </p>

            <div className="fbtags">
              {feedbackTags.map((tag) => (
                <button
                  key={tag}
                  className="fbtag"
                  aria-pressed={fb.tags.includes(tag)}
                  onClick={() => api.toggleFeedbackTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>

            <textarea
              className="note"
              rows={2}
              placeholder={good ? 'Προαιρετικά — πείτε το στην ομάδα' : 'Προαιρετικά — ο υπεύθυνος το διαβάζει απόψε'}
              value={fb.note}
              onChange={(e) => api.setFeedbackNote(e.target.value)}
            />
          </>
        )}
      </div>

      {stars > 0 && (
        <div className="card__foot">
          <button className="btn btn--primary" onClick={api.submitFeedback}>Αποστολή αξιολόγησης</button>
        </div>
      )}
    </div>
  );
}
