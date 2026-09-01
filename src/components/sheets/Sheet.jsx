import { useEffect } from 'react';
import { useSession } from '../../engine/session.jsx';
import { Close } from '../Icons.jsx';

/** Κοινό κέλυφος bottom sheet: σκίαση, λαβή, τίτλος, καρφιτσωμένο υποσέλιδο. */
export default function Sheet({ title, eyebrow, children, footer, onClose }) {
  const { api } = useSession();
  const close = onClose ?? api.closeSheet;

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  return (
    <>
      <div className="scrim" onClick={close} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet__grab" />
        <div className="sheet__head">
          <div>
            {eyebrow && <div className="eyebrow" style={{ marginBottom: 4 }}>{eyebrow}</div>}
            <div className="sheet__title">{title}</div>
          </div>
          <button className="iconbtn" onClick={close} aria-label="Κλείσιμο">
            <Close width={16} height={16} />
          </button>
        </div>
        <div className="sheet__body">{children}</div>
        {footer && <div className="sheet__foot">{footer}</div>}
      </div>
    </>
  );
}
