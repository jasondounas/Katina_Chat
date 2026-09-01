import { tags as tagDefs } from '../../data/restaurant.js';

/** Chips διατροφής και αλλεργιογόνων, με τη διατροφή πριν τον κίνδυνο. */
export default function TagList({ ids = [], max = 3, short = true }) {
  if (!ids.length) return null;
  const ordered = [...ids].sort((a, b) => {
    const rank = { diet: 0, heat: 1, allergen: 2 };
    return rank[tagDefs[a].tone] - rank[tagDefs[b].tone];
  });
  return (
    <div className="tags">
      {ordered.slice(0, max).map((id) => (
        <span key={id} className={`tag tag--${tagDefs[id].tone}`}>
          {short ? tagDefs[id].short : tagDefs[id].label}
        </span>
      ))}
    </div>
  );
}
