import { useSession } from '../engine/session.jsx';
import PaymentSheet from './sheets/PaymentSheet.jsx';
import SplitBillSheet from './sheets/SplitBillSheet.jsx';
import { CategorySheet, ItemSheet } from './sheets/MenuSheet.jsx';

export default function SheetHost() {
  const { state } = useSession();
  if (!state.sheet) return null;

  const { type, payload } = state.sheet;
  switch (type) {
    case 'payment': return <PaymentSheet payload={payload} />;
    case 'split': return <SplitBillSheet />;
    case 'category': return <CategorySheet payload={payload} />;
    case 'item': return <ItemSheet payload={payload} />;
    default: return null;
  }
}
