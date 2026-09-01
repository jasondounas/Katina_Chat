import { useState } from 'react';
import Plate, { DishPhoto } from '../Plate.jsx';
import TagList from './TagList.jsx';
import { money } from '../../data/restaurant.js';
import { useSession } from '../../engine/session.jsx';
import { Plus, Check } from '../Icons.jsx';

export default function MenuItemCard({ item }) {
  const { api } = useSession();
  const [added, setAdded] = useState(false);

  const add = (e) => {
    e.stopPropagation();
    if (!item.available || added) return;
    setAdded(true);
    api.addItem(item.id, 1);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <article className={`dish ${item.available ? '' : 'dish--out'}`}>
      <button
        className="dish__art plate-well"
        onClick={() => api.openSheet('item', { itemId: item.id })}
        aria-label={`${item.name}, ${money(item.price)}. Άνοιγμα λεπτομερειών`}
      >
        <DishPhoto item={item}>
          <Plate art={item.art} size={item.art.vessel ? 104 : 92} />
        </DishPhoto>
        {item.badge && item.available && <span className="dish__badge">{item.badge}</span>}
        {!item.available && <span className="dish__badge dish__badge--out">{item.unavailableNote}</span>}
      </button>

      <div className="dish__body">
        <h4 className="dish__name">{item.name}</h4>
        <p className="dish__desc">{item.description}</p>
        <TagList ids={item.tags} max={2} />
      </div>

      <div className="dish__foot">
        <span className="price dish__price">{money(item.price)}</span>
        {item.available && (
          <button
            className={`add ${added ? 'add--done' : ''}`}
            onClick={add}
            aria-label={added ? `${item.name} — προστέθηκε` : `Προσθήκη: ${item.name}`}
          >
            {added ? <Check width={13} height={13} /> : <Plus width={14} height={14} />}
          </button>
        )}
      </div>
    </article>
  );
}
