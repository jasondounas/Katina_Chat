import { useSession } from '../engine/session.jsx';
import PaymentSheet from './sheets/PaymentSheet.jsx';
import SplitBillSheet from './sheets/SplitBillSheet.jsx';
import CartSheet from './sheets/CartSheet.jsx';
import CatalogSheet from './sheets/CatalogSheet.jsx';
import { CategorySheet, ItemSheet } from './sheets/MenuSheet.jsx';

export default function SheetHost() {
  const { state } = useSession();
  if (!state.sheet) return null;

  const { type, payload } = state.sheet;
  switch (type) {
    case 'payment': return <PaymentSheet payload={payload} />;
    case 'split': return <SplitBillSheet />;
    case 'catalog': return <CatalogSheet />;
    case 'category': return <CategorySheet payload={payload} />;
    case 'item': return <ItemSheet payload={payload} />;
    case 'cart': return <CartSheet />;
    default: return null;
  }
}