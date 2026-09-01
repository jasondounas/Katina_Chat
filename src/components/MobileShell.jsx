import { useEffect, useRef, useState } from 'react';
import { useSession } from '../engine/session.jsx';
import { clockLabel } from '../engine/state.js';
import { Signal, Wifi, Battery } from './Icons.jsx';

/** Οι πραγματικές διαστάσεις της συσκευής — η αναλογία δεν αλλάζει ποτέ. */
const FRAME_H = 866;

/**
 * Μια μισοκομμένη συσκευή δεν είναι σκηνικό, είναι λάθος. Όταν το παράθυρο
 * είναι πιο κοντό από το πλαίσιο, σμικρύνουμε ολόκληρη τη συσκευή αντί να
 * αφήσουμε τη σελίδα να κυλήσει: η σκηνή μένει ακίνητη και κυλά μόνο το
 * περιεχόμενο μέσα στην οθόνη, όπως σε αληθινό κινητό.
 */
function useFrameFit(ref) {
  const [fit, setFit] = useState(1);

  useEffect(() => {
    const host = ref.current?.parentElement;
    if (!host || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(([entry]) => {
      const free = entry.contentRect.height;
      setFit(free > 0 ? Math.min(1, free / FRAME_H) : 1);
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, [ref]);

  return fit;
}

/**
 * Η συσκευή είναι σκηνικό στο desktop και εξαφανίζεται εντελώς σε πραγματικό
 * κινητό, όπου η εμπειρία του επισκέπτη πρέπει απλώς να γεμίζει την οθόνη.
 */
export default function MobileShell({ children }) {
  const { state } = useSession();
  const deviceRef = useRef(null);
  const fit = useFrameFit(deviceRef);

  return (
    <div className="device" ref={deviceRef} data-scaled={fit < 1 ? "" : undefined} style={{ "--device-fit": fit }}>
      <div className="device__frame">
        <div className="device__screen">
          <div className="device__island" />
          <div className="statusbar">
            <span>{clockLabel(state.clock)}</span>
            <span className="statusbar__right"><Signal /><Wifi /><Battery /></span>
          </div>
          {children}
          {state.toast && <div className="toast">{state.toast.text}</div>}
        </div>
      </div>
    </div>
  );
}
