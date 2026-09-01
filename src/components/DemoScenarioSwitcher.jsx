import { useState, useEffect } from 'react';
import { scenarios } from '../data/scenarios.js';
import { platform, restaurant } from '../data/restaurant.js';
import { useSession } from '../engine/session.jsx';

const THEMES = [
  { id: 'light', label: 'μέρα' },
  { id: 'dark', label: 'νύχτα' },
];

/**
 * Χειριστήρια παρουσίασης. Σκόπιμα monospace και «άστυλα», ώστε κανείς στην
 * αίθουσα να μην τα μπερδέψει με το προϊόν που βλέπει ο επισκέπτης.
 */
export default function DemoScenarioSwitcher() {
  const { state, api } = useSession();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const canAdvance = Boolean(state.order.stage) && state.order.stage !== 'served';

  return (
    <>
      <button className="rail__toggle" onClick={() => setOpen((o) => !o)}>
        {open ? 'Κλείσιμο' : 'Demo'}
      </button>

      <aside className="rail" data-open={open} onClick={() => setOpen(false)}>
        <div className="rail__brand">
          <b>{platform.name}</b>
          <span>demo console</span>
        </div>

        <div>
          <div className="rail__label">Κατάστημα</div>
          <div className="rail__venue">
            {restaurant.name} {restaurant.city} · {restaurant.concept}
          </div>
          <div className="seg seg--mono">
            {THEMES.map((t) => (
              <button key={t.id} aria-pressed={theme === t.id} onClick={() => setTheme(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="rail__label">Σενάρια</div>
          <div className="rail__list">
            {scenarios.map((s, i) => (
              <button
                key={s.id}
                className="rail__item"
                aria-current={state.scenario === s.id}
                onClick={() => api.loadScenario(s.id)}
              >
                <span className="rail__num">{String(i + 1).padStart(2, '0')}</span>
                <span>
                  <span className="rail__name">{s.label}</span>
                  <span className="rail__note">{s.note}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="rail__label">Ζωντανά χειριστήρια</div>
          <div className="rail__ops" style={{ marginTop: 10 }}>
            <button className="rail__op" disabled={!canAdvance} onClick={api.advanceOrder}>
              επόμενο στάδιο κουζίνας →
            </button>
            <button
              className="rail__op"
              disabled={!state.order.items.length || Boolean(state.payment)}
              onClick={() => api.openSheet('payment')}
            >
              άνοιγμα πληρωμής
            </button>
            <button
              className="rail__op"
              disabled={!state.payment}
              onClick={() => api.say('Πώς σας φάνηκαν όλα απόψε;', [{ type: 'feedback' }])}
            >
              ζήτησε αξιολόγηση
            </button>
            <button className="rail__op" onClick={() => api.loadScenario(state.scenario)}>
              επαναφορά σεναρίου
            </button>
          </div>
        </div>

        <div className="rail__foot">
          Φανταστικά δεδομένα. Καμία πληρωμή, καμία κουζίνα, καμία Μαρία.<br />
          Γράψτε ελεύθερα στη μπάρα — ο βοηθός απαντά από τα δεδομένα του καταλόγου.<br /><br />
          Φωτογραφίες πιάτων: Wikimedia Commons, άδειες CC.<br />
          Αναλυτική απόδοση στο src/data/photo-credits.json
        </div>
      </aside>
    </>
  );
}
