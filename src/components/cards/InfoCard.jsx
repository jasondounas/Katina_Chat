import { useState } from 'react';

/** Πληροφορίες που διαβάζονται μία φορά και χρησιμοποιούνται — Wi-Fi, ωράριο, οδηγίες. */
export default function InfoCard({ title, rows = [], note }) {
  const [copied, setCopied] = useState(null);

  const copy = (value) => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopied(value);
    setTimeout(() => setCopied(null), 1600);
  };

  return (
    <div className="card">
      {title && (
        <div className="card__head"><span className="card__title">{title}</span></div>
      )}
      <div className="card__body">
        <div className="info">
          {rows.map((r) => (
            <div className="info__row" key={r.label}>
              <span className="info__label">{r.label}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`info__value ${r.mono ? 'info__value--mono' : ''}`}>{r.value}</span>
                {r.copy && (
                  <button className="info__copy" onClick={() => copy(r.value)}>
                    {copied === r.value ? 'Αντιγράφηκε' : 'Αντιγραφή'}
                  </button>
                )}
              </span>
            </div>
          ))}
        </div>
        {note && <p style={{ fontSize: 11.5, color: 'var(--text-3)', margin: '10px 0 0' }}>{note}</p>}
      </div>
    </div>
  );
}
