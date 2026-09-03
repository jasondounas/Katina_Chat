import Plate, { DishPhoto } from '../Plate.jsx';
import { money, tags as tagDefs } from '../../data/restaurant.js';
import { useSession } from '../../engine/session.jsx';
import { Plus, Minus } from '../Icons.jsx';

/** Πυκνή εκδοχή — όταν μια φιλτραρισμένη απάντηση επιστρέφει πολλά πιάτα. */
export default function MenuItemRow({ item, highlight }) {
  const { state, api } = useSession();
  const draft = state.basketId ? state.drafts[state.basketId] : null;
  const qty = draft?.items.find((l) => l.itemId === item.id)?.qty || 0;

  const inc = () => api.addItem(item.id, 1);
  const dec = () => { if (state.basketId) api.draftQty(state.basketId, item.id, -1); };

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
      {qty > 0 ? (
        <span className="qty">
          <button onClick={dec} aria-label={`Ένα λιγότερο: ${item.name}`}>
            <Minus width={12} height={12} />
          </button>
          <span>{qty}</span>
          <button onClick={inc} aria-label={`Ένα ακόμα: ${item.name}`}>
            <Plus width={12} height={12} />
          </button>
        </span>
      ) : (
        <button className="add" onClick={inc} aria-label={`Προσθήκη: ${item.name}`}>
          <Plus width={14} height={14} />
        </button>
      )}
    </div>
  );
}