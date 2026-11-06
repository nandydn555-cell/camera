import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { useStore } from '../state/StoreContext';

export type CollectionType = 'all' | 'cameras' | 'accessories';
const cameraCategories = new Set(['DSLR Cameras', 'Mirrorless Cameras', 'Compact Cameras', 'Action Cameras']);
const accessoryCategories = new Set(['Camera Lenses', 'Camera Accessories', 'Tripods', 'Camera Bags']);

export default function CatalogPage({ collection }: { collection: CollectionType }) {
  const { products, productsLoading, addToCart } = useStore();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [brand, setBrand] = useState('All');
  const [sort, setSort] = useState('featured');
  useEffect(() => {
    setQuery('');
    setCategory('All');
    setBrand('All');
  }, [collection]);
  const collectionProducts = useMemo(() => products.filter((product) => collection === 'all'
    || (collection === 'cameras' && cameraCategories.has(product.category))
    || (collection === 'accessories' && accessoryCategories.has(product.category))), [products, collection]);
  const categories = useMemo(() => ['All', ...new Set(collectionProducts.map((product) => product.category))], [collectionProducts]);
  const brands = useMemo(() => ['All', ...new Set(collectionProducts.map((product) => product.brand))], [collectionProducts]);

  const filteredProducts = useMemo(() => collectionProducts
    .filter((product) => category === 'All' || product.category === category)
    .filter((product) => brand === 'All' || product.brand === brand)
    .filter((product) => `${product.name} ${product.brand} ${product.category}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => sort === 'low' ? a.price - b.price : sort === 'high' ? b.price - a.price : 0),
  [collectionProducts, category, brand, query, sort]);

  const title = collection === 'cameras' ? 'Cameras' : collection === 'accessories' ? 'Accessories' : 'Shop';
  const subtitle = collection === 'cameras'
    ? 'Browse DSLR, mirrorless, compact and action cameras.'
    : collection === 'accessories'
      ? 'Browse lenses, bags, tripods and camera essentials.'
      : 'Considered equipment for every way of seeing.';

  return (
    <section className="shop section">
      <div className="shop-title"><span className="eyebrow">THE COLLECTION</span><h1>{title} <em>{collection === 'all' ? 'all gear.' : collection === 'cameras' ? 'for every shot.' : 'for your kit.'}</em></h1><p>{subtitle}</p></div>
      <div className="filterbar">
        <label className="searchbox"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search cameras, lenses, brands" aria-label="Search products" /></label>
        <label className="visually-hidden" htmlFor="category-filter">Category</label>
        <select id="category-filter" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select>
        <label className="visually-hidden" htmlFor="brand-filter">Brand</label>
        <select id="brand-filter" value={brand} onChange={(event) => setBrand(event.target.value)}>{brands.map((item) => <option key={item}>{item}</option>)}</select>
        <label className="visually-hidden" htmlFor="sort-filter">Sort products</label>
        <select id="sort-filter" value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select>
        <span className="result-count">{filteredProducts.length} pieces</span>
      </div>
      {productsLoading ? <div className="empty" role="status">Loading products…</div> : filteredProducts.length ? (
        <div className="product-grid">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} />)}</div>
      ) : (
        <div className="empty"><SlidersHorizontal /><h3>{products.length ? 'No gear found' : 'Products will appear here'}</h3><p>{products.length ? 'Try another search or category.' : 'Connect Supabase and add products with your admin account.'}</p><button className="text-link" onClick={() => { setQuery(''); setCategory('All'); setBrand('All'); }}>Clear filters</button></div>
      )}
    </section>
  );
}
