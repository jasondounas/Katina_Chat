import { getItem, staff, serviceItems, orderStages } from '../data/restaurant.js';

/**
 * One reducer owns the whole table session.
 *
 * A basket line is identified by its own `lineId`, not by `itemId`. That is
 * what lets the same dish sit in the basket twice with different modifiers
 * — «ΦΑΒΑ χωρίς κρεμμύδι» and plain «ΦΑΒΑ» are two lines, two kitchen
 * tickets, two rows in `orders`. Anything keyed on itemId alone cannot
 * express that, so every draft action below takes a lineId.
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
  drafts: {}, // id -> { id, items:[{lineId,itemId,qty,mods,note}], status }
  basketId: null,
  draftNote: '', // order-level note, applies to every line in the open basket
  pending: null, // { draftId, items, note, endsAt } — the undo window
  order: { number: 124, items: [], stage: null, placedAt: null, etaMin: null },
  services: [],
  waiter: null,
  payment: null,
  feedback: null,
  sheet: null,
  typing: false,
  toast: null,
  scenario: 'welcome',
};

/* ---------- selectors ---------- */

export const billLines = (state) =>
  state.order.items
    .map((line) => {
      const item = getItem(line.itemId);
      return item ? { ...line, item, total: item.price * line.qty } : null;
    })
    .filter(Boolean);

export const subtotal = (state) =>
  billLines(state).reduce((sum, l) => sum + l.total, 0);

export const orderStageIndex = (state) =>
  orderStages.findIndex((s) => s.id === state.order.stage);

export const activeWaiter = (state) =>
  state.waiter && state.waiter.status === 'active' ? state.waiter : null;

export const pendingServices = (state) =>
  state.services.filter((s) => s.status === 'pending');

export const openDraft = (state) =>
  (state.basketId ? state.drafts[state.basketId] : null);

export const draftLines = (state) => openDraft(state)?.items ?? [];

export const draftCount = (state) =>
  draftLines(state).reduce((n, l) => n + l.qty, 0);

export const draftTotal = (state) =>
  draftLines(state).reduce((n, l) => {
    const item = getItem(l.itemId);
    return n + (item ? item.price * l.qty : 0);
  }, 0);

/** How many of a given dish sit in the basket, across all its lines. */
export const draftQtyOf = (state, itemId) =>
  draftLines(state)
    .filter((l) => l.itemId === itemId)
    .reduce((n, l) => n + l.qty, 0);

/* ---------- helpers ---------- */

const sameShape = (a, b) =>
  a.itemId === b.itemId
  && [...(a.mods || [])].sort().join('|') === [...(b.mods || [])].sort().join('|')
  && (a.note || '') === (b.note || '');

/** Folds a confirmed round into the table's running order. Lines that
 *  differ only by modifier stay apart — the kitchen needs them apart. */
const mergeLines = (lines, additions) => {
  const next = lines.map((l) => ({ ...l }));
  additions.forEach((add) => {
    const found = next.find((l) => sameShape(l, add));
    if (found) found.qty += add.qty;
    else next.push({ ...add });
  });
  return next;
};

const newLine = (itemId, qty = 1, mods = [], note = '') =>
  ({ lineId: uid('l'), itemId, qty, mods: mods || [], note: note || '' });

const derivePhase = (state) => {
  if (state.feedback?.submitted) return 'closed';
  if (state.payment) return 'paid';
  if (state.order.stage === 'served') return 'dining';
  if (state.order.items.length || state.pending) return 'ordered';
  return 'seated';
};

const patchDraft = (state, id, items) => ({
  ...state,
  drafts: { ...state.drafts, [id]: { ...state.drafts[id], items } },
});

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
          (m.id === action.id ? { ...m, ...action.patch } : m)),
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
      const items = (action.items || []).map((l) =>
        (l.lineId ? l : newLine(l.itemId, l.qty ?? 1, l.mods, l.note)));
      return {
        ...state,
        drafts: { ...state.drafts, [id]: { id, items, status: 'pending' } },
        basketId: id,
      };
    }

    /** Repeat taps of the same dish land on its existing *unmodified* line;
     *  a line that already carries modifiers is left alone, because the
     *  guest chose those deliberately. */
    case 'ADD_TO_DRAFT': {
      const draft = state.drafts[action.id];
      if (!draft || draft.status !== 'pending') return state;
      const plain = draft.items.find(
        (l) => l.itemId === action.itemId && !l.mods.length && !l.note,
      );
      const items = plain
        ? draft.items.map((l) =>
          (l.lineId === plain.lineId ? { ...l, qty: l.qty + (action.qty ?? 1) } : l))
        : [...draft.items, newLine(action.itemId, action.qty ?? 1)];
      return patchDraft(state, action.id, items);
    }

    /** «+ άλλο ένα, ξεχωριστά» — same dish, own line, no modifiers
     *  inherited. Inserted below its sibling so the pair reads as a pair. */
    case 'FORK_LINE': {
      const draft = state.drafts[action.id];
      if (!draft || draft.status !== 'pending') return state;
      const i = draft.items.findIndex((l) => l.lineId === action.lineId);
      if (i < 0) return state;
      const items = [...draft.items];
      items.splice(i + 1, 0, newLine(draft.items[i].itemId));
      return patchDraft(state, action.id, items);
    }

    case 'DRAFT_QTY': {
      const draft = state.drafts[action.id];
      if (!draft) return state;
      const items = draft.items
        .map((l) => (l.lineId === action.lineId
          ? { ...l, qty: Math.max(0, l.qty + action.delta) } : l))
        .filter((l) => l.qty > 0);
      if (!items.length) {
        return {
          ...state,
          drafts: { ...state.drafts, [action.id]: { ...draft, items, status: 'cancelled' } },
          basketId: state.basketId === action.id ? null : state.basketId,
          draftNote: '',
        };
      }
      return patchDraft(state, action.id, items);
    }

    case 'TOGGLE_MOD': {
      const draft = state.drafts[action.id];
      if (!draft || draft.status !== 'pending') return state;
      const items = draft.items.map((l) => {
        if (l.lineId !== action.lineId) return l;
        const has = l.mods.includes(action.mod);
        return {
          ...l,
          mods: has ? l.mods.filter((m) => m !== action.mod) : [...l.mods, action.mod],
        };
      });
      return patchDraft(state, action.id, items);
    }

    case 'LINE_NOTE': {
      const draft = state.drafts[action.id];
      if (!draft || draft.status !== 'pending') return state;
      const items = draft.items.map((l) =>
        (l.lineId === action.lineId ? { ...l, note: action.note } : l));
      return patchDraft(state, action.id, items);
    }

    case 'DRAFT_NOTE':
      return { ...state, draftNote: action.note };

    case 'CANCEL_DRAFT': {
      const draft = state.drafts[action.id];
      if (!draft) return state;
      return {
        ...state,
        drafts: { ...state.drafts, [action.id]: { ...draft, status: 'cancelled' } },
        basketId: state.basketId === action.id ? null : state.basketId,
        draftNote: '',
      };
    }

    /** Επιβεβαίωση. Nothing reaches the kitchen yet — this only opens the
     *  undo window. The POSTs happen in COMMIT_SEND, once it closes. */
    case 'CONFIRM_DRAFT': {
      const draft = state.drafts[action.id];
      if (!draft || draft.status !== 'pending') return state;
      return withPhase({
        ...state,
        drafts: { ...state.drafts, [action.id]: { ...draft, status: 'sending' } },
        basketId: state.basketId === action.id ? null : state.basketId,
        draftNote: '',
        pending: {
          draftId: action.id,
          items: draft.items.map((l) => ({ ...l })),
          note: state.draftNote,
          endsAt: action.endsAt,
        },
      });
    }

    /** Αναίρεση. The basket comes back exactly as it was. */
    case 'UNDO_SEND': {
      const p = state.pending;
      if (!p) return state;
      return withPhase({
        ...state,
        drafts: {
          ...state.drafts,
          [p.draftId]: { ...state.drafts[p.draftId], status: 'pending' },
        },
        basketId: p.draftId,
        draftNote: p.note,
        pending: null,
      });
    }

    /** The window closed, the POSTs have gone out. */
    case 'COMMIT_SEND': {
      const p = state.pending;
      if (!p) return state;
      const items = mergeLines(state.order.items, p.items);
      const eta = Math.max(...p.items.map((l) => getItem(l.itemId)?.prepMin ?? 8));
      return withPhase({
        ...state,
        drafts: {
          ...state.drafts,
          [p.draftId]: { ...state.drafts[p.draftId], status: 'confirmed' },
        },
        pending: null,
        order: {
          ...state.order,
          items,
          stage: 'received',
          placedAt: state.order.placedAt ?? clockLabel(state.clock),
          etaMin: eta,
        },
      });
    }

    case 'SEED_ORDER':
      return withPhase({ ...state, order: { ...state.order, ...action.order } });

    case 'ADVANCE_ORDER': {
      const idx = orderStages.findIndex((s) => s.id === state.order.stage);
      const nextStage = action.stage
        || orderStages[Math.min(idx + 1, orderStages.length - 1)].id;
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
          (s.id === action.id ? { ...s, status: action.status ?? 'delivered' } : s)),
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
      return {
        ...state,
        payment: state.payment ? { ...state.payment, receiptEmail: action.email } : null,
      };

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