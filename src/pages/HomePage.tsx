import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useStore } from '../state/StoreContext';

export default function HomePage() {
  const { products, productsLoading, addToCart } = useStore();
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow light">THE ART OF SEEING</span>
          <h1>Make every<br /><em>frame count.</em></h1>
          <p>Tools for the moments that matter.<br />Curated cameras, lenses and essentials.</p>
          <Link className="button light-button" to="/shop">Explore the collection <ArrowRight size={16} /></Link>
          <div className="hero-index"><b>01</b><span /> CURATED FOR CREATORS</div>
        </div>
        <div className="hero-photo">
          <img src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1500&q=90" alt="Professional camera on a dark studio background" />
          <div className="hero-caption">PRECISION IN EVERY DETAIL <span>01 / 03</span></div>
        </div>
      </section>
      <section className="intro">
        <span className="eyebrow">LENS LINE — ULAANBAATAR</span>
        <h2>For the curious.<br /><em>For the committed.</em></h2>
        <p>Thoughtfully selected imaging gear to help you create with confidence.</p>
      </section>
      <section className="section collection">
        <div className="section-heading">
          <div><span className="eyebrow">THE EDIT</span><h2>Featured gear</h2></div>
          <Link className="text-link" to="/shop">View all products <ArrowRight size={16} /></Link>
        </div>
        {productsLoading ? <p className="loading-state" role="status">Loading products…</p> : products.length ? (
          <div className="product-grid">{products.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} />)}</div>
        ) : <p className="loading-state">Products will appear here when the catalog is set up.</p>}
      </section>
      <section className="brand-strip"><span>TRUSTED TOOLS</span>{['CANON', 'SONY', 'NIKON', 'FUJIFILM', 'DJI', 'GOPRO'].map((brand) => <b key={brand}>{brand}</b>)}</section>
      <section className="promo">
        <div><span className="eyebrow light">A BETTER WAY TO BEGIN</span><h2>Your next chapter<br />starts with a camera.</h2><Link className="button light-button" to="/cameras">Find your camera <ArrowRight size={16} /></Link></div>
        <img src="https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=1200&q=85" alt="Photographer at work" loading="lazy" />
      </section>
    </>
  );
}
