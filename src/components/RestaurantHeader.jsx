import { restaurant, table, guest, staff, money } from '../data/restaurant.js';
import { useSession } from '../engine/session.jsx';
import { activeWaiter, pendingServices, subtotal } from '../engine/state.js';
import { Chevron } from './Icons.jsx';

/**
 * Η κεφαλίδα κρατά την ταυτότητα· η γραμμή από κάτω κρατά την κατάσταση.
 * Δείχνει ένα πράγμα κάθε φορά, με σειρά επείγοντος — ένας καλεσμένος
 * σερβιτόρος υπερισχύει μιας παραγγελίας που μαγειρεύεται, κι αυτή ενός
 * τραπεζιού που ξεκουράζεται. Το πάτημα ρωτά αυτό που υπονοεί η κατάσταση,
 * ώστε η γραμμή να είναι συντόμευση και όχι σήμα.
 */
export default function RestaurantHeader() {
  const { state, api } = useSession();
  const live = liveState(state);

  return (
    <header className="hdr">
      <div className="hdr__top">
        <div>
          <div className="hdr__mark">{restaurant.name}</div>
          <span className="hdr__sub">Powered by KatinaBot</span>
        </div>
        <div className="hdr__table">
          <b>{table.label}</b>
          <span>{table.party} άτομα · {table.section}</span>
        </div>
      </div>

      <button className="rail-live" key={live.key} onClick={() => api.send(live.ask)}>
        <span className={`pulse ${live.tone ? `pulse--${live.tone}` : ''}`} />
        <span className="rail-live__text">
          <b>{live.lead}</b>
          {live.trail ? ` · ${live.trail}` : ''}
        </span>
        {live.meta && <span className="rail-live__meta">{live.meta}</span>}
        <Chevron width={13} height={13} style={{ color: 'var(--text-4)' }} />
      </button>

      <div className="hdr__rule" />
    </header>
  );
}

function liveState(state) {
  const waiter = activeWaiter(state);
  const services = pendingServices(state);
  const total = subtotal(state);

  if (waiter) {
    return {
      key: 'waiter', tone: 'lamp',
      lead: `Η ${staff.maria.name} έρχεται`, trail: waiter.reasonLabel,
      meta: waiter.at, ask: 'Καλέστε τον σερβιτόρο',
    };
  }

  if (state.payment) {
    return {
      key: 'paid', tone: 'idle',
      lead: 'Πληρώθηκε', trail: `ευχαριστούμε, ${guest.name}`,
      meta: money(state.payment.total), ask: 'Μπορείτε να μου στείλετε την απόδειξη;',
    };
  }

  if (state.order.stage && state.order.stage !== 'served') {
    const label = { received: 'Στάλθηκε στην κουζίνα', preparing: 'Ετοιμάζεται', ready: 'Έτοιμο' }[state.order.stage];
    return {
      key: 'order',
      lead: `Παραγγελία #${state.order.number}`, trail: label,
      meta: money(total), ask: 'Πού είναι το φαγητό μας;',
    };
  }

  if (services.length) {
    return {
      key: 'svc',
      lead: services[0].label, trail: 'έρχεται',
      meta: services[0].at, ask: 'Η παραγγελία μου',
    };
  }

  if (state.order.items.length) {
    return {
      key: 'served', tone: 'idle',
      lead: `Παραγγελία #${state.order.number}`, trail: 'σερβιρίστηκε',
      meta: money(total), ask: 'Τι λέει ο λογαριασμός μας;',
    };
  }

  return {
    key: 'seated', tone: 'idle',
    lead: `Καθίσατε ${guest.seatedAt}`, trail: 'τίποτα παραγγελμένο ακόμα',
    meta: '', ask: 'Δείξε μου τον κατάλογο',
  };
}
