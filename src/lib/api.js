/**
 * Thin wrapper around the real KatinaBot backend (main.py on Render).
 *
 * This is the ONLY file that knows the backend's URLs and shapes. Everything
 * else in the app talks to `session.jsx`, which decides what to do with the
 * responses. CORS on the backend already allows any origin, so this works
 * from `npm run dev` on localhost with zero backend changes.
 */

export const API_BASE = 'https://katina-bot.onrender.com';

async function asJson(res) {
  if (!res.ok) throw new Error(`request failed: ${res.status}`);
  return res.json();
}

export function fetchMenu() {
  return fetch(`${API_BASE}/menu`).then(asJson);
}

export function fetchActiveSession(tableId) {
  return fetch(`${API_BASE}/tables/${encodeURIComponent(tableId)}/active-session`).then(asJson);
}

export function fetchSession(sessionId) {
  return fetch(`${API_BASE}/sessions/${encodeURIComponent(sessionId)}`).then(asJson);
}

export function fetchSessionOrders(sessionId) {
  return fetch(`${API_BASE}/sessions/${encodeURIComponent(sessionId)}/orders`).then(asJson);
}

export function submitOrder(sessionId, itemId, qty, note = '') {
  const params = new URLSearchParams({
    session_id: sessionId,
    item: itemId,
    qty: String(qty),
    note,
  });
  return fetch(`${API_BASE}/orders?${params.toString()}`, { method: 'POST' }).then(asJson);
}

export function callWaiter(sessionId) {
  return fetch(`${API_BASE}/sessions/${encodeURIComponent(sessionId)}/call-waiter`, {
    method: 'POST',
  }).then(asJson);
}

export function requestPayment(sessionId, method) {
  const params = new URLSearchParams({ method: method || '' });
  return fetch(`${API_BASE}/sessions/${encodeURIComponent(sessionId)}/request-payment?${params.toString()}`, {
    method: 'POST',
  }).then(asJson);
}
