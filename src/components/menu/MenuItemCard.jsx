import Plate, { DishPhoto } from '../Plate.jsx';
import TagList from './TagList.jsx';
import { money } from '../../data/restaurant.js';
import { useSession } from '../../engine/session.jsx';
import { Plus, Minus } from '../Icons.jsx';

export default function MenuItemCard({ item }) {
  const { state, api } = useSession();
  const draft = state.basketId ? state.drafts[state.basketId] : null;
  const qty = draft?.items.find((l) => l.itemId === item.id)?.qty || 0;

  const inc = (e) => {
    e.stopPropagation();
    if (item.available) api.addItem(item.id, 1);
  };
  const dec = (e) => {
    e.stopPropagation();
    if (state.basketId) api.draftQty(state.basketId, item.id, -1);
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
          qty > 0 ? (
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
          )
        )}
      </div>
    </article>
  );
}