import { createContext, useContext, useReducer, useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { reducer, initialState } from './state.js';
import { respond } from './intents.js';
import { scenarioById } from '../data/scenarios.js';
import { serviceItems, staff, getItem, applyLiveMenu } from '../data/restaurant.js';
import { subtotal } from './state.js';
import {
  fetchMenu, fetchActiveSession, fetchSessionOrders, submitOrder, callWaiter, requestPayment,
} from '../lib/api.js';

/**
 * The backend's `ready` flag alone can't tell "not cooked yet" apart from
 * "already picked up" — both look like `ready: false`. So we remember every
 * order_id that was ever seen with `ready: true`, and only call something
 * "served" once every approved item has gone through that ready → picked-up
 * cycle. `everReady` is a Set the caller keeps across polls.
 *
 * `relevantIds` scopes everything to only the orders THIS chat exchange
 * actually created — a table's session can accumulate many orders across
 * a whole meal, and older leftover ones (still pending, or long since
 * served) must never affect what this specific round shows the guest.
 */
function computeOrderStage(orders, everReady, relevantIds) {
  const relevant = orders.filter((o) => relevantIds.has(o.order_id));
  if (!relevant.length) return null;
  if (relevant.some((o) => o.status === 'PENDING_REVIEW')) return 'received';

  const approved = relevant.filter((o) => o.status === 'APPROVED');
  if (!approved.length) return null;

  approved.forEach((o) => { if (o.ready) everReady.add(o.order_id); });

  if (approved.some((o) => o.ready)) return 'ready';
  if (approved.every((o) => everReady.has(o.order_id))) return 'served';
  return 'preparing';
}

const SessionContext = createContext(null);
export const useSession = () => useContext(SessionContext);

/** Μοιάζει με σύνθεση πρότασης, όχι με spinner. */
const thinkTime = (text) => Math.min(1500, 480 + text.length * 7);

export function SessionProvider({ children, liveTableId = null }) {
  const [state, dispatch] = useReducer(
    reducer,
    liveTableId ? initialState : scenarioById('welcome').state,
  );
  // latest state for handlers that fire between renders
  const ref = useRef(state);
  useEffect(() => { ref.current = state; });
  const timers = useRef([]);

  // --- live mode: real menu + real session on the real backend ---
  const sessionIdRef = useRef(null);
  const everReadyRef = useRef(new Set());
  const currentOrderIdsRef = useRef(new Set());
  const [live, setLive] = useState({ menuLoaded: false, sessionId: null });

  useEffect(() => {
    if (!liveTableId) return undefined;
    let cancelled = false;

    fetchMenu()
      .then((backendMenu) => {
        if (cancelled) return;
        applyLiveMenu(backendMenu);
        setLive((l) => ({ ...l, menuLoaded: true }));
      })
      .catch(() => { if (!cancelled) setLive((l) => ({ ...l, menuLoaded: true })); });

    fetchActiveSession(liveTableId)
      .then((res) => {
        if (cancelled || !res.active) return;
        sessionIdRef.current = res.session_id;
        setLive((l) => ({ ...l, sessionId: res.session_id }));
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [liveTableId]);

  // Poll the real order while one is in flight, and translate its status
  // into the same four stages the demo already knows how to render.
  useEffect(() => {
    if (!live.sessionId || !state.order.stage || state.order.stage === 'served') return undefined;
    const id = setInterval(() => {
      fetchSessionOrders(live.sessionId)
        .then((orders) => {
          const stage = computeOrderStage(orders, everReadyRef.current, currentOrderIdsRef.current);
          if (stage && stage !== ref.current.order.stage) {
            dispatch({ type: 'ADVANCE_ORDER', stage });
          }
        })
        .catch(() => {});
    }, 4000);
    return () => clearInterval(id);
  }, [live.sessionId, state.order.stage]);

  const later = useCallback((fn, ms) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }, []);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const push = useCallback((message) => dispatch({ type: 'PUSH', message }), []);

  const toast = useCallback((text) => {
    dispatch({ type: 'TOAST', value: text });
    later(() => dispatch({ type: 'TOAST', value: null }), 2200);
  }, [later]);

  /** Guest turn → typing → composed answer, with any state effects applied. */
  const send = useCallback((text) => {
    const clean = text.trim();
    if (!clean) return;
    push({ role: 'guest', text: clean });
    dispatch({ type: 'TICK', minutes: 1 });
    dispatch({ type: 'TYPING', value: true });

    const reply = respond(clean, ref.current);
    later(() => {
      dispatch({ type: 'TYPING', value: false });
      (reply.pre ?? []).forEach((a) => dispatch(a));
      push({ role: 'ai', text: reply.text, blocks: reply.blocks });
      if (reply.sheet) later(() => dispatch({ type: 'OPEN_SHEET', sheet: reply.sheet.type }), 320);
    }, thinkTime(reply.text));
  }, [later, push]);

  /** AI turn with no guest question in front of it (confirmations, updates). */
  const say = useCallback((text, blocks, delay = 520) => {
    dispatch({ type: 'TYPING', value: true });
    later(() => {
      dispatch({ type: 'TYPING', value: false });
      push({ role: 'ai', text, blocks });
    }, delay);
  }, [later, push]);

  const api = useMemo(() => ({
    send,
    say,
    toast,

    openSheet: (type, payload) => dispatch({ type: 'OPEN_SHEET', sheet: type, payload }),
    closeSheet: () => dispatch({ type: 'CLOSE_SHEET' }),

    /** Add straight from a menu card — no round trip through the thread. */
    addItem: (itemId, qty = 1) => {
      const id = `d-${Date.now()}`;
      dispatch({ type: 'CREATE_DRAFT', id, items: [{ itemId, qty }] });
      dispatch({ type: 'TICK', minutes: 1 });
      const item = getItem(itemId);
      say(`${item.name} — προστέθηκε. Μόλις επιβεβαιώσετε, πάει κατευθείαν ${item.category === 'wine' || item.category === 'cocktails' ? 'στο μπαρ' : 'στην κουζίνα'}.`, [{ type: 'draft', id }], 420);
    },

    draftFromItems: (items) => {
      const id = `d-${Date.now()}`;
      dispatch({ type: 'CREATE_DRAFT', id, items });
      say('Ορίστε το τραπέζι όπως το έχω. Τίποτα δεν φεύγει για την κουζίνα πριν το επιβεβαιώσετε.', [{ type: 'draft', id }], 420);
    },

    draftQty: (id, itemId, delta) => dispatch({ type: 'DRAFT_QTY', id, itemId, delta }),

    cancelDraft: (id) => {
      dispatch({ type: 'CANCEL_DRAFT', id });
      say('Καθαρίστηκε. Τι άλλο να σας φέρω;', [{
        type: 'actions',
        options: [
          { label: 'Ο κατάλογος', act: 'ask', payload: { text: 'Δείξε μου τον κατάλογο' } },
          { label: 'Πρότεινέ μου κάτι', act: 'ask', payload: { text: 'Τι προτείνετε για δύο άτομα;' } },
        ],
      }], 380);
    },

    confirmDraft: (id) => {
      const draft = ref.current.drafts[id];
      dispatch({ type: 'CONFIRM_DRAFT', id });
      dispatch({ type: 'TICK', minutes: 1 });
      say('Τέλεια — το έστειλα στην κουζίνα.', [{ type: 'order-status' }], 500);

      if (sessionIdRef.current && draft) {
        everReadyRef.current.clear();
        currentOrderIdsRef.current = new Set();
        // Real order → real backend. The poller above picks up its real
        // status (pending review → approved → ready → picked up) from here,
        // scoped to only the order_ids this round actually created — not
        // every order this table has ever placed.
        draft.items.forEach((line) => {
          submitOrder(sessionIdRef.current, line.itemId, line.qty)
            .then((res) => { if (res && res.order_id) currentOrderIdsRef.current.add(res.order_id); })
            .catch(() => {});
        });
      } else {
        // Demo mode, no real session — fake the kitchen picking it up.
        later(() => dispatch({ type: 'ADVANCE_ORDER', stage: 'preparing' }), 7000);
      }
    },

    advanceOrder: () => dispatch({ type: 'ADVANCE_ORDER' }),

    requestService: (itemId) => {
      const def = serviceItems.find((s) => s.id === itemId);
      const id = `svc-${Date.now()}`;
      push({ role: 'guest', text: def.label });
      dispatch({ type: 'TICK', minutes: 1 });
      dispatch({ type: 'REQUEST_SERVICE', itemId, id });
      say(`${def.ack} Ενημέρωσα την ομάδα.`, [{ type: 'service', id }], 460);
    },

    requestWaiter: (reasonId, reasonLabel) => {
      const id = `w-${Date.now()}`;
      push({ role: 'guest', text: reasonLabel });
      dispatch({ type: 'TICK', minutes: 1 });
      dispatch({ type: 'REQUEST_WAITER', id, reasonId, reasonLabel });
      say(`Έγινε — η ${staff.maria.name} ειδοποιήθηκε και ξέρει για ποιο λόγο.`, [{ type: 'waiter', id }], 500);
      if (sessionIdRef.current) callWaiter(sessionIdRef.current).catch(() => {});
    },

    cancelWaiter: () => {
      dispatch({ type: 'CANCEL_WAITER' });
      toast('Το αίτημα ακυρώθηκε');
    },

    pay: (payment) => {
      dispatch({ type: 'CLOSE_SHEET' });
      dispatch({ type: 'TICK', minutes: 1 });

      if (sessionIdRef.current) {
        // Real payments complete staff-side (cash/card at the table), so the
        // guest side can only ever say "the team's been told" — never claim
        // the bill is actually settled, since we can't know that from here.
        requestPayment(sessionIdRef.current, payment.method).catch(() => {});
        say('Ενημερώσαμε την ομάδα — έρχονται με τον λογαριασμό.', undefined, 620);
      } else {
        dispatch({ type: 'PAY', payment });
        say(
          payment.mode === 'full'
            ? 'Όλα εντάξει. Ευχαριστούμε που δειπνήσατε μαζί μας.'
            : 'Το μερίδιό σας εξοφλήθηκε. Κρατάω ανοιχτό το υπόλοιπο του τραπεζιού.',
          [{ type: 'receipt' }],
          620,
        );
        if (payment.mode === 'full') {
          later(() => say('Πώς σας φάνηκαν όλα απόψε;', [{ type: 'feedback' }]), 2600);
        }
      }
    },

    setReceiptEmail: (email) => {
      dispatch({ type: 'SET_RECEIPT_EMAIL', email });
      toast(`Η απόδειξη στάλθηκε στο ${email}`);
    },

    rate: (stars) => dispatch({ type: 'RATE', stars }),
    toggleFeedbackTag: (tag) => dispatch({ type: 'TOGGLE_FEEDBACK_TAG', tag }),
    setFeedbackNote: (note) => dispatch({ type: 'FEEDBACK_NOTE', note }),
    submitFeedback: () => {
      dispatch({ type: 'SUBMIT_FEEDBACK' });
      const stars = ref.current.feedback?.stars ?? 5;
      say(
        stars >= 4
          ? 'Σας ευχαριστούμε — το μετέφερα στη Μαρία και στην κουζίνα. Ελπίζουμε να σας δούμε ξανά σύντομα.'
          : 'Ευχαριστούμε που μας το είπατε. Ο υπεύθυνος θα το δει απόψε, και θα θέλαμε την ευκαιρία να το κάνουμε καλύτερα.',
        undefined,
        520,
      );
    },

    loadScenario: (id) => {
      clearTimers();
      dispatch({ type: 'RESET', state: scenarioById(id).state });
    },
  }), [send, say, toast, later, push, clearTimers]);

  /** Single entry point for every action a block can emit. */
  const act = useCallback((option) => {
    const p = option.payload ?? {};
    switch (option.act) {
      case 'ask': return api.send(p.text);
      case 'draft': return api.draftFromItems(p.items);
      case 'service': return api.requestService(p.itemId);
      case 'waiter-reason': return api.requestWaiter(p.reasonId, p.reasonLabel);
      case 'cancel-waiter': return api.cancelWaiter();
      case 'open-sheet': return api.openSheet(p.sheet, p.payload);
      case 'advance': return api.advanceOrder();
      default: return undefined;
    }
  }, [api]);

  const value = useMemo(
    () => ({ state, api: { ...api, act }, dispatch, total: subtotal(state), live, isLive: !!liveTableId }),
    [state, api, act, live, liveTableId],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}