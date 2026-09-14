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

/** One basket line → one row in `orders` → one kitchen ticket.
 *  `extras` carries the free removals at price 0 (the column was built for
 *  paid add-ons). `idempotency_key` is the lineId, so a retry can't double. */
export function submitOrder(sessionId, itemId, qty, opts = {}) {
  const { note = '', extras = [], idempotencyKey } = opts;
  const params = new URLSearchParams({
    session_id: sessionId,
    item: itemId,
    qty: String(qty),
    note,
    extras: JSON.stringify(extras),
  });
 // if (idempotencyKey) params.set('idempotency_key', idempotencyKey);
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