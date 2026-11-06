import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useStore } from '../state/StoreContext';
import { money } from '../utils/format';

export default function CartPage() {
  const { products, cart, user, cartSubtotal, changeQuantity, setAuthMode, setAuthOpen } = useStore();
  const cartProducts = Object.entries(cart)
    .map(([id, quantity]) => ({ product: products.find((item) => item.id === id), quantity }))
    .filter((item): item is { product: NonNullable<typeof item.product>; quantity: number } => Boolean(item.product));

  if (!cartProducts.length) {
    return <section className="section cart-page"><span className="eyebrow">YOUR SELECTION</span><h1>Shopping <em>bag.</em></h1><div className="empty"><ShoppingBag /><h3>Your bag is waiting.</h3><p>{user ? 'Your database cart is empty.' : 'Sign in to use your account cart.'}</p>{user ? <Link className="button dark-button" to="/shop">Explore the collection</Link> : <button className="button dark-button" onClick={() => { setAuthMode('login'); setAuthOpen(true); }}>Sign in</button>}</div></section>;
  }

  return (
    <section className="section cart-page">
      <span className="eyebrow">YOUR SELECTION</span><h1>Shopping <em>bag.</em></h1>
      <div className="cart-layout">
        <div>{cartProducts.map(({ product, quantity }) => (
          <div className="cart-row" key={product.id}>
            <img src={product.image} alt={product.name} />
            <div className="cart-product"><span className="eyebrow">{product.brand}</span><h3>{product.name}</h3><span>{money(product.price)}</span></div>
            <div className="quantity"><button aria-label={`Remove one ${product.name}`} onClick={() => void changeQuantity(product.id, quantity - 1)}><Minus size={14} /></button><span>{quantity}</span><button aria-label={`Add one ${product.name}`} disabled={quantity >= product.stock} onClick={() => void changeQuantity(product.id, Math.min(product.stock, quantity + 1))}><Plus size={14} /></button></div>
            <b>{money(quantity * product.price)}</b>
            <button className="icon-action" aria-label={`Remove ${product.name}`} onClick={() => void changeQuantity(product.id, 0)}><Trash2 size={17} /></button>
          </div>
        ))}</div>
        <aside className="summary"><h3>Order summary</h3><div><span>Subtotal</span><b>{money(cartSubtotal)}</b></div><div><span>Shipping</span><span>Calculated at checkout</span></div><div className="summary-total"><span>Total</span><b>{money(cartSubtotal)}</b></div><Link className="button dark-button full" to="/checkout">Continue to checkout</Link><p>Order totals and inventory are verified by Supabase at checkout.</p></aside>
      </div>
    </section>
  );
}
