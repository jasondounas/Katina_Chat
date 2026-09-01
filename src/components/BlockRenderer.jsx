import { categories, getItem } from '../data/restaurant.js';
import MenuCategoryCard from './menu/MenuCategoryCard.jsx';
import MenuItemCard from './menu/MenuItemCard.jsx';
import MenuItemRow from './menu/MenuItemRow.jsx';
import QuickActions from './QuickActions.jsx';
import OrderSummaryCard from './cards/OrderSummaryCard.jsx';
import OrderStatusCard from './cards/OrderStatusCard.jsx';
import { ServiceRequestCard, ServiceMenu } from './cards/ServiceRequestCard.jsx';
import { WaiterCard, WaiterReasons } from './cards/WaiterCard.jsx';
import BillCard from './cards/BillCard.jsx';
import ReceiptCard, { ReceiptEmail } from './cards/ReceiptCard.jsx';
import FeedbackCard from './cards/FeedbackCard.jsx';
import InfoCard from './cards/InfoCard.jsx';

/**
 * Ο υβριδικός κανόνας σε ένα σημείο: μια ατάκα του βοηθού είναι μία πρόταση
 * συν μηδέν ή περισσότερα τυποποιημένα blocks. Η δομημένη πληροφορία δεν
 * αφηγείται ποτέ σε πρόζα, και η πρόζα δεν στριμώχνεται ποτέ σε κάρτα.
 *
 * Τα blocks ζωντανής κατάστασης (παραγγελία, σερβιτόρος, λογαριασμός) κρατούν
 * μόνο ένα id, ώστε μια κάρτα δέκα ατάκες πριν να λέει ακόμα την αλήθεια.
 */

/** Τα full-bleed blocks διαχειρίζονται μόνα τους τα οριζόντια περιθώρια. */
const BLEED = new Set(['categories', 'items']);

export default function BlockRenderer({ block }) {
  switch (block.type) {
    case 'categories':
      return (
        <div className="cats">
          {categories.map((c, i) => (
            <MenuCategoryCard key={c.id} category={c} wide={i === categories.length - 1} />
          ))}
        </div>
      );

    case 'items': {
      const items = block.ids.map(getItem).filter(Boolean);
      if (block.layout === 'list') {
        return (
          <div>
            {block.label && <RowLabel>{block.label}</RowLabel>}
            <div className="rows">
              {items.map((item) => <MenuItemRow key={item.id} item={item} />)}
            </div>
          </div>
        );
      }
      return (
        <div>
          {block.label && <RowLabel>{block.label}</RowLabel>}
          <div className="carousel">
            {items.map((item) => <MenuItemCard key={item.id} item={item} />)}
          </div>
        </div>
      );
    }

    case 'actions': return <QuickActions options={block.options} />;
    case 'draft': return <OrderSummaryCard id={block.id} />;
    case 'order-status': return <OrderStatusCard />;
    case 'service': return <ServiceRequestCard id={block.id} />;
    case 'service-menu': return <ServiceMenu />;
    case 'waiter-reasons': return <WaiterReasons />;
    case 'waiter': return <WaiterCard id={block.id} />;
    case 'bill': return <BillCard compact={block.compact} />;
    case 'receipt': return <ReceiptCard />;
    case 'feedback': return <FeedbackCard />;
    case 'receipt-email': return <div className="card"><div className="card__foot"><ReceiptEmail /></div></div>;

    case 'info':
      return <InfoCard title={block.title} rows={block.rows} note={block.note} />;

    default:
      return null;
  }
}

export const isBleed = (block) => BLEED.has(block.type);

function RowLabel({ children }) {
  return (
    <div className="rowlabel">
      <span className="eyebrow">{children}</span>
      <span className="rowlabel__line" />
    </div>
  );
}
