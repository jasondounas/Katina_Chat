import Plate, { DishPhoto } from '../Plate.jsx';
import { itemsIn } from '../../data/restaurant.js';
import { useSession } from '../../engine/session.jsx';

/**
 * Πλακίδιο για μία κατηγορία.
 *
 * Αντί για θολό υποκατάστατο φωτογραφίας, το πλακίδιο κρατά μια μικρή στοίβα
 * από τα πραγματικά πιάτα της κατηγορίας — καθαρά, επικαλυπτόμενα, ειλικρινή
 * ως προς το τι είναι. Δείχνει και την ποικιλία με μια ματιά.
 */
export default function MenuCategoryCard({ category, wide }) {
  const { api } = useSession();
  const items = itemsIn(category.id);
  const available = items.filter((i) => i.available);
  const stack = [...available].sort((a, b) => (b.badge ? 1 : 0) - (a.badge ? 1 : 0)).slice(0, 3);

  return (
    <button
      className={`cat ${wide ? 'cat--wide' : ''}`}
      onClick={() => api.openSheet('category', { categoryId: category.id })}
    >
      <span className="cat__stack">
        {stack.map((item) => (
          <span className="cat__chip" key={item.id}>
            <DishPhoto item={item} className="photo--chip">
              <Plate art={item.art} size={30} />
            </DishPhoto>
          </span>
        ))}
      </span>
      <span className="cat__name">{category.name}</span>
      <span className="cat__count">{available.length} {category.unit}</span>
    </button>
  );
}
