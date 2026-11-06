import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { useStore } from '../state/StoreContext';
import { money } from '../utils/format';

const paymentLabel = (status: string) => status === 'paid' ? 'Paid' : status === 'demo_paid' ? 'Demo paid (simulated)' : 'Payment pending';

export default function OrdersPage() {
  const { orders, user, setAuthMode, setAuthOpen } = useStore();
  return (
    <section className="section">
      <span className="eyebrow">YOUR ACCOUNT</span><h1>Order <em>history.</em></h1>
      {!user ? <div className="empty"><Package /><h3>Sign in to view your orders</h3><button className="button dark-button" onClick={() => { setAuthMode('login'); setAuthOpen(true); }}>Sign in</button></div>
        : orders.length ? orders.map((order) => <article className="order-card" key={order.id}>
          <div><span className="eyebrow">{order.id} · {new Date(order.date).toLocaleDateString()}</span><h3>{order.items.map((item) => `${item.product_name} × ${item.quantity}`).join(', ')}</h3><span>{order.address}</span></div>
          <div><b>{money(order.total)}</b><small>{paymentLabel(order.payment_status)} · {order.status}</small></div>
        </article>)
          : <div className="empty"><Package /><h3>No orders yet</h3><p>Your purchases will appear here.</p><Link className="button dark-button" to="/shop">Browse gear</Link></div>}
    </section>
  );
}
