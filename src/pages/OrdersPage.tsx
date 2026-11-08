import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Search } from 'lucide-react';
import { useStore } from '../state/StoreContext';
import { money } from '../utils/format';

const paymentLabel = (status: string) => status === 'paid' ? 'Paid' : status === 'demo_paid' ? 'Demo paid (simulated)' : 'Payment pending';

export default function OrdersPage() {
  const { orders, user, setAuthMode, setAuthOpen } = useStore();
  const [query, setQuery] = useState('');
  const filteredOrders = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return orders;
    return orders.filter((order) => [
      order.id,
      order.date,
      order.address,
      order.status,
      paymentLabel(order.payment_status),
      ...order.items.map((item) => item.product_name),
    ].some((value) => value.toLowerCase().includes(term)));
  }, [orders, query]);

  return (
    <section className="section">
      <span className="eyebrow">YOUR ACCOUNT</span><h1>Order <em>history.</em></h1>
      {!user ? <div className="empty"><Package /><h3>Sign in to view your orders</h3><button className="button dark-button" onClick={() => { setAuthMode('login'); setAuthOpen(true); }}>Sign in</button></div>
        : orders.length ? <>
          <label className="filterbar searchbox"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search order number, product, or status" aria-label="Search orders" /></label>
          {filteredOrders.length ? filteredOrders.map((order) => <article className="order-card" key={order.id}>
            <div><span className="eyebrow">{order.id} · {new Date(order.date).toLocaleDateString()}</span><h3>{order.items.map((item) => `${item.product_name} × ${item.quantity}`).join(', ')}</h3><span>{order.address}</span></div>
            <div><b>{money(order.total)}</b><small>{paymentLabel(order.payment_status)} · {order.status}</small></div>
          </article>) : <div className="empty"><Package /><h3>No matching orders</h3><p>Try another order number, product, or status.</p><button className="text-link" onClick={() => setQuery('')}>Clear search</button></div>}
        </>
          : <div className="empty"><Package /><h3>No orders yet</h3><p>Your purchases will appear here.</p><Link className="button dark-button" to="/shop">Browse gear</Link></div>}
    </section>
  );
}
