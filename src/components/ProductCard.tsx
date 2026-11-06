import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import type { Product } from '../types/store';

const money = (amount: number) => '₮' + new Intl.NumberFormat('en-US').format(amount);

export default function ProductCard({ product, onAdd }: { product: Product; onAdd: (product: Product) => void }) {
  return (
    <article className="product-card">
      <Link className="product-image" to={`/products/${product.id}`} aria-label={`View details for ${product.name}`}>
        <img src={product.image} alt={product.name} loading="lazy" />
        {product.badge && <span className="badge">{product.badge}</span>}
        <span className="quick-add">View details <ArrowRight size={15} /></span>
      </Link>
      <div className="product-meta">
        <div><span className="eyebrow">{product.brand}</span><h3>{product.name}</h3></div>
        <button className="icon-action" aria-label={`Add ${product.name} to bag`} disabled={!product.stock} onClick={() => onAdd(product)}><ShoppingBag size={17} /></button>
      </div>
      <div className="product-foot"><span>{product.category}</span><strong>{money(product.price)}</strong></div>
    </article>
  );
}
