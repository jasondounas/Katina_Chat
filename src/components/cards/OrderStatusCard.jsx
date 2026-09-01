import { orderStages, getItem } from '../../data/restaurant.js';
import { useSession } from '../../engine/session.jsx';
import { orderStageIndex } from '../../engine/state.js';

const STAGE_NOTE = {
  received: 'Η κουζίνα έχει το δελτίο σας',
  preparing: 'Σύντομα στο πάσο',
  ready: 'Η Μαρία τα παίρνει τώρα',
  served: 'Όλα σερβιρίστηκαν',
};

export default function OrderStatusCard() {
  const { state } = useSession();
  const { order } = state;
  if (!order.items.length) return null;

  const idx = orderStageIndex(state);
  const count = order.items.reduce((s, l) => s + l.qty, 0);
  // Το etaMin είναι τα λεπτά που απομένουν, όχι ο συνολικός χρόνος — έτσι η
  // κάρτα και η πρόταση του βοηθού δεν διαφωνούν ποτέ.
  const eta = order.etaMin ?? Math.max(...order.items.map((l) => getItem(l.itemId).prepMin));

  return (
    <div className="card">
      <div className="status">
        <div className="status__head">
          <span className={`pulse ${order.stage === 'served' ? 'pulse--idle' : ''}`} />
          <div className="status__title">
            <b>Παραγγελία #{order.number}</b>
            <span>{STAGE_NOTE[order.stage]}</span>
          </div>
          <span className="status__time">{order.placedAt}</span>
        </div>

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
          {order.stage === 'preparing' && <span>απομένουν <b>{eta}–{eta + 2} λεπτά</b></span>}
          {order.stage === 'received' && <span>Εκτίμηση <b>{eta} λεπτά</b></span>}
          {order.stage === 'ready' && <span><b>Φεύγει από το πάσο</b></span>}
          {order.stage === 'served' && <span>Ολοκληρώθηκε</span>}
        </div>
      </div>
    </div>
  );
}
