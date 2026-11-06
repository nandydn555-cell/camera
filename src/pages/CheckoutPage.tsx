import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import DemoPaymentDialog from '../components/dialogs/DemoPaymentDialog';
import { useStore } from '../state/StoreContext';
import { money } from '../utils/format';

export default function CheckoutPage() {
  const { cart, products, user, profile, cartSubtotal, busy, startDemoCheckout, setAuthMode, setAuthOpen } = useStore();
  const cartProducts = Object.entries(cart)
    .map(([id, quantity]) => ({ product: products.find((item) => item.id === id), quantity }))
    .filter((item): item is { product: NonNullable<typeof item.product>; quantity: number } => Boolean(item.product));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await startDemoCheckout({
        name: String(form.get('name')),
        email: String(form.get('email')),
        phone: String(form.get('phone')),
        street: String(form.get('address')),
        city: String(form.get('city')),
      });
    } catch {
      // The provider displays the checkout error in the global toast.
    }
  };

  return (
    <section className="section checkout-page">
      <span className="eyebrow">ALMOST YOURS</span><h1>Secure <em>checkout.</em></h1>
      {!user ? <div className="empty"><p>Sign in to continue to checkout.</p><button className="button dark-button" onClick={() => { setAuthMode('login'); setAuthOpen(true); }}>Sign in</button></div>
        : !cartProducts.length ? <div className="empty"><p>Your bag is empty.</p><Link className="button dark-button" to="/shop">Shop gear</Link></div>
          : <div className="cart-layout">
            <form className="checkout-form" onSubmit={submit}>
              <h2>Contact & delivery</h2>
              <div className="form-grid">
                <label>Full name<input required name="name" autoComplete="name" defaultValue={profile?.full_name || user.name} /></label>
                <label>Email<input required type="email" name="email" autoComplete="email" defaultValue={user.email} /></label>
                <label className="span-2">Street address<input required name="address" autoComplete="street-address" placeholder="Apartment, street, district" /></label>
                <label>City<input required name="city" autoComplete="address-level2" defaultValue="Ulaanbaatar" /></label>
                <label>Phone<input required name="phone" type="tel" autoComplete="tel" defaultValue={profile?.phone || ''} placeholder="+976" /></label>
              </div>
              <h2>Payment method</h2>
              <div className="payment-choice"><span><b>Demo QR (simulation)</b><small>Туршилтын QR. Бодит банкны төлбөр авахгүй.</small></span></div>
              <button disabled={busy} className="button dark-button full">{busy ? 'Creating order…' : 'Place order'} <ArrowRight size={16} /></button>
            </form>
            <aside className="summary"><h3>Order summary</h3>{cartProducts.map(({ product, quantity }) => <div key={product.id}><span>{product.name} × {quantity}</span><b>{money(product.price * quantity)}</b></div>)}<div className="summary-total"><span>Total</span><b>{money(cartSubtotal)}</b></div></aside>
          </div>}
      <DemoPaymentDialog />
    </section>
  );
}
