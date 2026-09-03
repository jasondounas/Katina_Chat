import { getItem, staff, serviceItems, orderStages } from '../data/restaurant.js';

/**
 * One reducer owns the whole table session.
 *
 * Messages carry typed `blocks`; most blocks hold only an id and read live
 * state at render time, so a card rendered ten messages ago still reflects
 * reality (a cancelled waiter request greys out in place, an order card
 * advances through its stages).
 */

let seq = 0;
export const uid = (prefix = 'x') => `${prefix}-${++seq}`;

/** Session clock, in minutes past 20:00. Keeps timestamps believable. */
export const clockLabel = (mins) => {
  const h = 20 + Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const initialState = {
  clock: 12,
  phase: 'seated', // seated → ordered → dining → paid → closed
  messages: [],
  drafts: {}, // id -> { items:[{itemId,qty}], status }
  order: { number: 124, items: [], stage: null, placedAt: null, etaMin: null },
  services: [], // { id, itemId, label, at, status }
  waiter: null, // { id, reasonId, reasonLabel, staffId, at, status }
  payment: null, // { method, tipPct, tip, total, mode, shares, at, receiptEmail }
  feedback: null, // { stars, tags:[], note, submitted }
  sheet: null, // { type, payload }
  typing: false,
  toast: null,
  scenario: 'welcome',
};

/* ---------- selectors ---------- */

export const billLines = (state) =>
  state.order.items.map((line) => {
    const item = getItem(line.itemId);
    return { ...line, item, total: item.price * line.qty };
  });

export const subtotal = (state) =>
  billLines(state).reduce((sum, l) => sum + l.total, 0);

export const orderStageIndex = (state) =>
  orderStages.findIndex((s) => s.id === state.order.stage);

export const activeWaiter = (state) =>
  state.waiter && state.waiter.status === 'active' ? state.waiter : null;

export const pendingServices = (state) =>
  state.services.filter((s) => s.status === 'pending');

const mergeLines = (lines, additions) => {
  const next = lines.map((l) => ({ ...l }));
  additions.forEach((add) => {
    const found = next.find((l) => l.itemId === add.itemId && (l.mod || null) === (add.mod || null));
    if (found) found.qty += add.qty;
    else next.push({ ...add });
  });
  return next;
};

/** Phase drives the contextual chips and the header rail. */
const derivePhase = (state) => {
  if (state.feedback?.submitted) return 'closed';
  if (state.payment) return 'paid';
  if (state.order.stage === 'served') return 'dining';
  if (state.order.items.length) return 'ordered';
  return 'seated';
};

/* ---------- reducer ---------- */

export function reducer(state, action) {
  const withPhase = (next) => ({ ...next, phase: derivePhase(next) });

  switch (action.type) {
    case 'RESET':
      return { ...initialState, ...action.state };

    case 'TICK':
      return { ...state, clock: state.clock + (action.minutes ?? 1) };

    case 'TYPING':
      return { ...state, typing: action.value };

    case 'PUSH': {
      const at = clockLabel(state.clock);
      const msg = { id: uid('m'), at, ...action.message };
      return { ...state, messages: [...state.messages, msg] };
    }

    case 'PATCH_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === action.id ? { ...m, ...action.patch } : m,
        ),
      };

    case 'OPEN_SHEET':
      return { ...state, sheet: { type: action.sheet, payload: action.payload ?? null } };

    case 'CLOSE_SHEET':
      return { ...state, sheet: null };

    case 'TOAST':
      return { ...state, toast: action.value ? { id: uid('t'), text: action.value } : null };

    /* --- ordering --- */

    case 'CREATE_DRAFT': {
      const id = action.id || uid('d');
      return {
        ...state,
        drafts: { ...state.drafts, [id]: { id, items: action.items, status: 'pending' } },
      };
    }

    /** Tapping + on the menu while a basket is already open — adds to the
     * same draft instead of spawning a brand new one/chat message. */
    case 'ADD_TO_DRAFT': {
      const draft = state.drafts[action.id];
      if (!draft || draft.status !== 'pending') return state;
      const exists = draft.items.some((l) => l.itemId === action.itemId);
      const items = exists
        ? draft.items.map((l) => (l.itemId === action.itemId ? { ...l, qty: l.qty + (action.qty ?? 1) } : l))
        : [...draft.items, { itemId: action.itemId, qty: action.qty ?? 1 }];
      return { ...state, drafts: { ...state.drafts, [action.id]: { ...draft, items } } };
    }

    case 'DRAFT_QTY': {
      const draft = state.drafts[action.id];
      if (!draft) return state;
      const items = draft.items
        .map((l) => (l.itemId === action.itemId ? { ...l, qty: Math.max(0, l.qty + action.delta) } : l))
        .filter((l) => l.qty > 0);
      if (!items.length) {
        return {
          ...state,
          drafts: { ...state.drafts, [action.id]: { ...draft, items, status: 'cancelled' } },
        };
      }
      return { ...state, drafts: { ...state.drafts, [action.id]: { ...draft, items } } };
    }

    case 'CANCEL_DRAFT': {
      const draft = state.drafts[action.id];
      if (!draft) return state;
      return { ...state, drafts: { ...state.drafts, [action.id]: { ...draft, status: 'cancelled' } } };
    }

    case 'CONFIRM_DRAFT': {
      const draft = state.drafts[action.id];
      if (!draft || draft.status !== 'pending') return state;
      const items = mergeLines(state.order.items, draft.items);
      const eta = Math.max(...draft.items.map((l) => getItem(l.itemId).prepMin));
      return withPhase({
        ...state,
        drafts: { ...state.drafts, [action.id]: { ...draft, status: 'confirmed' } },
        order: {
          ...state.order,
          items,
          stage: 'received',
          placedAt: state.order.placedAt ?? clockLabel(state.clock),
          etaMin: eta,
        },
      });
    }

    /** Seeds an already-placed order without going through a draft. */
    case 'SEED_ORDER':
      return withPhase({
        ...state,
        order: { ...state.order, ...action.order },
      });

    case 'ADVANCE_ORDER': {
      const idx = orderStages.findIndex((s) => s.id === state.order.stage);
      const nextStage = action.stage || orderStages[Math.min(idx + 1, orderStages.length - 1)].id;
      return withPhase({ ...state, order: { ...state.order, stage: nextStage } });
    }

    /* --- service + waiter --- */

    case 'REQUEST_SERVICE': {
      const def = serviceItems.find((s) => s.id === action.itemId);
      const entry = {
        id: action.id || uid('svc'),
        itemId: action.itemId,
        label: def?.label ?? action.itemId,
        at: clockLabel(state.clock),
        status: 'pending',
      };
      return { ...state, services: [...state.services, entry] };
    }

    case 'RESOLVE_SERVICE':
      return {
        ...state,
        services: state.services.map((s) =>
          s.id === action.id ? { ...s, status: action.status ?? 'delivered' } : s,
        ),
      };

    case 'REQUEST_WAITER':
      return {
        ...state,
        waiter: {
          id: action.id || uid('w'),
          reasonId: action.reasonId,
          reasonLabel: action.reasonLabel,
          staffId: action.staffId ?? staff.maria.id,
          at: clockLabel(state.clock),
          status: 'active',
        },
      };

    case 'CANCEL_WAITER':
      return { ...state, waiter: state.waiter ? { ...state.waiter, status: 'cancelled' } : null };

    /* --- payment + feedback --- */

    case 'PAY':
      return withPhase({ ...state, payment: { ...action.payment, at: clockLabel(state.clock) } });

    case 'SET_RECEIPT_EMAIL':
      return { ...state, payment: state.payment ? { ...state.payment, receiptEmail: action.email } : null };

    case 'RATE':
      return { ...state, feedback: { stars: action.stars, tags: [], note: '', submitted: false } };

    case 'TOGGLE_FEEDBACK_TAG': {
      if (!state.feedback) return state;
      const has = state.feedback.tags.includes(action.tag);
      return {
        ...state,
        feedback: {
          ...state.feedback,
          tags: has
            ? state.feedback.tags.filter((t) => t !== action.tag)
            : [...state.feedback.tags, action.tag],
        },
      };
    }

    case 'FEEDBACK_NOTE':
      return { ...state, feedback: state.feedback ? { ...state.feedback, note: action.note } : null };

    case 'SUBMIT_FEEDBACK':
      return withPhase({
        ...state,
        feedback: state.feedback ? { ...state.feedback, submitted: true } : null,
      });

    default:
      return state;
  }
}