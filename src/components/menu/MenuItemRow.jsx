import { useState } from 'react';
import Plate, { DishPhoto } from '../Plate.jsx';
import { money, tags as tagDefs } from '../../data/restaurant.js';
import { useSession } from '../../engine/session.jsx';
import { Plus, Check } from '../Icons.jsx';

/** Πυκνή εκδοχή — όταν μια φιλτραρισμένη απάντηση επιστρέφει πολλά πιάτα. */
export default function MenuItemRow({ item, highlight }) {
  const { api } = useSession();
  const [added, setAdded] = useState(false);

  const add = () => {
    setAdded(true);
    api.addItem(item.id, 1);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="row">
      <button
        className="row__main"
        onClick={() => api.openSheet('item', { itemId: item.id })}
        aria-label={`${item.name}, ${money(item.price)}. Άνοιγμα λεπτομερειών`}
      >
        <DishPhoto item={item} className="photo--thumb">
          <Plate art={item.art} size={40} />
        </DishPhoto>
        <span className="row__body">
          <span className="row__name">{item.name}</span>
          <span className="row__desc">
            {highlight ? tagDefs[highlight].label : item.description}
          </span>
        </span>
        <span className="price row__price">{money(item.price)}</span>
      </button>
      <button
        className={`add ${added ? 'add--done' : ''}`}
        onClick={add}
        aria-label={`Προσθήκη: ${item.name}`}
      >
        {added ? <Check width={13} height={13} /> : <Plus width={14} height={14} />}
      </button>
    </div>
  );
}
