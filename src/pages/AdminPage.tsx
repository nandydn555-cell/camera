import { Link } from 'react-router-dom';
import { useStore } from '../state/StoreContext';
import ProductEditorDialog from '../components/dialogs/ProductEditorDialog';
import { money } from '../utils/format';

export default function AdminPage() {
  const { products, orders, user, openCreateProduct, openEditProduct, deleteProduct, updateOrderStatus } = useStore();
  if (user?.role !== 'admin') return <section className="section"><span className="eyebrow">STORE MANAGEMENT</span><h1>Admin <em>dashboard.</em></h1><div className="empty"><h3>Administrator access required</h3><p>Sign in with an admin account to manage the catalog and orders.</p><Link className="button dark-button" to="/profile">Account details</Link></div></section>;

  const paidRevenue = orders.filter((order) => order.payment_status === 'paid').reduce((sum, order) => sum + order.total, 0);
  return (
    <section className="section">
      <span className="eyebrow">STORE MANAGEMENT</span><h1>Admin <em>dashboard.</em></h1>
      <div className="admin-stats"><div><span>Products</span><b>{products.length}</b></div><div><span>Orders</span><b>{orders.length}</b></div><div><span>Verified paid revenue</span><b>{money(paidRevenue)}</b></div></div>
      <button className="button dark-button" onClick={openCreateProduct}>＋ Add product</button>
      <div className="admin-list">{products.map((product) => <div key={product.id}><img src={product.image} alt="" /><div><b>{product.name}</b><small>{product.brand} · {money(product.price)} · stock {product.stock}</small></div><button className="text-link" onClick={() => openEditProduct(product)}>Edit</button><button className="text-link danger" onClick={() => void deleteProduct(product.id)}>Delete</button></div>)}</div>
      <h2>Recent orders</h2>
      {orders.map((order) => <article className="order-card" key={order.id}><div><span className="eyebrow">{order.id} · {order.customer?.email || 'Customer'}</span><h3>{order.items.map((item) => `${item.product_name} × ${item.quantity}`).join(', ')}</h3><span>{order.address}</span></div><div><b>{money(order.total)}</b><small>{order.payment_status} · {order.status}</small><label className="visually-hidden" htmlFor={`status-${order.id}`}>Update order status</label><select id={`status-${order.id}`} value={order.status} onChange={(event) => void updateOrderStatus(order.id, event.target.value)}>{['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => <option key={status}>{status}</option>)}</select></div></article>)}
      <ProductEditorDialog />
    </section>
  );
}
