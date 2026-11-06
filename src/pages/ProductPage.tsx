import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useStore } from '../state/StoreContext';
import { money } from '../utils/format';

export default function ProductPage() {
  const { productId } = useParams();
  const { products, productsLoading, addToCart } = useStore();
  const product = products.find((item) => item.id === productId);
  if (productsLoading) return <section className="section loading-state" role="status">Loading product…</section>;
  if (!product) return <Navigate to="/shop" replace />;

  return (
    <section className="detail section">
      <Link className="back" to="/shop">← Back to collection</Link>
      <div className="detail-layout">
        <img className="detail-image" src={product.image} alt={product.name} />
        <div className="detail-copy">
          <span className="eyebrow">{product.brand} / {product.category}</span>
          <h1>{product.name}</h1>
          <strong className="detail-price">{money(product.price)}</strong>
          <p>{product.description}</p>
          <div className="stock">{product.stock > 0 ? <><span className="stock-dot" /> In stock · {product.stock} available</> : 'Currently unavailable'}</div>
          <button className="button dark-button full" disabled={!product.stock} onClick={() => void addToCart(product)}>Add to bag <ShoppingBag size={16} /></button>
          <div className="specs"><h3>Specifications</h3>{Object.entries(product.specs).map(([key, value]) => <div key={key}><span>{key}</span><b>{value}</b></div>)}</div>
        </div>
      </div>
      <div className="section-heading related-heading"><h2>You may also like</h2><Link className="text-link" to="/shop">View all <ArrowRight size={16} /></Link></div>
      <div className="product-grid">{products.filter((item) => item.id !== product.id && item.category === product.category).slice(0, 4).map((item) => <ProductCard key={item.id} product={item} onAdd={addToCart} />)}</div>
    </section>
  );
}
