import { useEffect, useState } from 'react';
import { useSession } from '../engine/session.jsx';

/**
 * Η αναίρεση. Visible only while a confirmed round is still unsent —
 * nothing has been POSTed to the backend, and no waiter has been pinged,
 * until this bar disappears on its own.
 */
export default function UndoBar() {
  const { state, api } = useSession();
  const endsAt = state.pending?.endsAt;
  const [, tick] = useState(0);

  useEffect(() => {
    if (!endsAt) return undefined;
    const id = setInterval(() => tick((n) => n + 1), 250);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!endsAt) return null;
  const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));

  return (
    <div className="undobar" role="status">
      <span className="undobar__text">
        Αποστολή σε {left}″ — μπορείτε να αναιρέσετε
      </span>
      <button className="undobar__btn" onClick={api.undoSend}>Αναίρεση</button>
    </div>
  );
}