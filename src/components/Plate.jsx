import { useState } from 'react';

/**
 * Η απεικόνιση ενός είδους του καταλόγου. Τρεις περιπτώσεις, με σειρά:
 *
 *   1. `image` — πραγματική φωτογραφία (φαγητό).
 *   2. `vessel` — σχεδιασμένο ποτήρι ή φιάλη (ποτά). Μια stock φωτογραφία
 *      ποτηριού κρασιού δεν λέει τίποτα· το σχέδιο είναι καθαρότερο.
 *   3. `blobs` — το παραγόμενο πιάτο, ως δίχτυ ασφαλείας αν λείψει η εικόνα,
 *      ώστε να μην εμφανιστεί ποτέ σπασμένη εικόνα σε ζωντανή παρουσίαση.
 */

/** Φωτογραφία που γεμίζει τον χώρο της· πέφτει πίσω στο σχέδιο αν αποτύχει. */
export function DishPhoto({ item, className = '', children }) {
  const [failed, setFailed] = useState(false);

  if (item.image && !failed) {
    return (
      <img
        className={`photo ${className}`}
        src={item.image}
        alt={item.name}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    );
  }
  return children;
}

const VESSELS = {
  // [outer silhouette, liquid]
  wine: [
    'M30 14 H70 C70 40 62 52 52 54 V78 H64 V82 H36 V78 H48 V54 C38 52 30 40 30 14 Z',
    'M33 25 H67 C66 40 60 50 50 51 C40 50 34 40 33 25 Z',
  ],
  rocks: [
    'M33 30 H67 L64 82 C64 84 62 85 60 85 H40 C38 85 36 84 36 82 Z',
    'M35.4 44 H64.6 L62.4 79 H37.6 Z',
  ],
  highball: [
    'M37 18 H63 L61 84 C61 85 60 86 59 86 H41 C40 86 39 85 39 84 Z',
    'M38.6 34 H61.4 L60 80 H40 Z',
  ],
  bottle: [
    'M44 10 H56 V26 C56 31 62 35 62 43 V82 C62 85 60 87 57 87 H43 C40 87 38 85 38 82 V43 C38 35 44 31 44 26 Z',
    'M40 46 H60 V80 C60 82 59 83 57 83 H43 C41 83 40 82 40 80 Z',
  ],
};

export default function Plate({ art, size = 118, className = '' }) {
  if (!art) return null;

  if (art.vessel) {
    const [outline, liquid] = VESSELS[art.vessel] ?? VESSELS.wine;
    const colour = art.blobs?.[0]?.[0] ?? '#E7DC9A';
    return (
      <svg
        className={`vessel ${className}`}
        width={size}
        height={size}
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        <path d={outline} fill="rgba(239,233,224,0.07)" stroke="rgba(239,233,224,0.34)" strokeWidth="1.3" />
        <path d={liquid} fill={colour} opacity="0.9" />
        <path d={liquid} fill="url(#vessel-sheen)" opacity="0.5" />
        <defs>
          <linearGradient id="vessel-sheen" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0.34" />
            <stop offset="0.35" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  return (
    <div
      className={`plate ${className}`}
      // blur scales with the plate so a 30px chip and a 168px hero read alike
      style={{ width: size, height: size, background: art.base, '--plate-blur': `${size / 20}px` }}
      aria-hidden="true"
    >
      {art.blobs.map(([color, x, y, d], i) => (
        <i
          key={i}
          style={{
            background: color,
            left: `${x}%`,
            top: `${y}%`,
            width: `${d}%`,
            height: `${d}%`,
          }}
        />
      ))}
    </div>
  );
}
