import { useEffect, useState, type FormEvent } from 'react';
import { Check } from 'lucide-react';
import { useStore } from '../../state/StoreContext';
import type { ProductDraft } from '../../types/store';
import { requireSupabase } from '../../lib/supabase';

function ProductChoice({ label, name, options, initialValue = '', disabled }: {
  label: string; name: string; options: string[]; initialValue?: string; disabled: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const choices = [...new Set([...options, ...(initialValue ? [initialValue] : [])])];
  return <div>
    <label>{label}<select required name={value === '__new__' ? undefined : name} value={value} disabled={disabled} onChange={(event) => setValue(event.target.value)}>
      <option value="" disabled>Select {label.toLowerCase()}</option>
      {choices.map((choice) => <option key={choice} value={choice}>{choice}</option>)}
      <option value="__new__">+ Add new {label.toLowerCase()}</option>
    </select></label>
    {value === '__new__' && <label>New {label.toLowerCase()}<input required name={name} placeholder={`Enter ${label.toLowerCase()}`} /></label>}
  </div>;
}

export default function ProductEditorDialog() {
  const { productDialogOpen, editingProduct, closeProductDialog, saveProduct, busy } = useStore();
  const [options, setOptions] = useState<{ brands: string[]; categories: string[] }>({ brands: [], categories: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!productDialogOpen) return;
    let active = true;
    setLoading(true);
    setLoadError('');
    async function loadOptions() {
      try {
        const client = requireSupabase();
        const [brands, categories] = await Promise.all([
          client.from('brands').select('name').order('name'),
          client.from('categories').select('name').order('name'),
        ]);
        if (brands.error) throw brands.error;
        if (categories.error) throw categories.error;
        if (active) setOptions({ brands: (brands.data ?? []).map((row) => row.name), categories: (categories.data ?? []).map((row) => row.name) });
      } catch {
        if (active) setLoadError('Could not load brands and categories. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadOptions();
    return () => { active = false; };
  }, [productDialogOpen, retry]);
  if (!productDialogOpen) return null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const imageFile = form.get('image');
    const draft: ProductDraft = {
      id: editingProduct?.id,
      name: String(form.get('name')),
      brand: String(form.get('brand') || '').trim(),
      category: String(form.get('category') || '').trim(),
      price: Number(form.get('price')),
      stock: Number(form.get('stock')),
      description: String(form.get('description')),
      specs: editingProduct?.specs || {},
      image: editingProduct?.image || '',
    };
    if (!draft.brand || !draft.category) return;
    try {
      await saveProduct(draft, imageFile instanceof File && imageFile.size ? imageFile : null);
    } catch {
      // The provider reports the save error in the global toast.
    }
  };

  return (
    <div className="modal-backdrop" onClick={closeProductDialog}>
      <form className="modal product-form" role="dialog" aria-modal="true" aria-labelledby="product-dialog-title" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
        <button className="modal-close" type="button" onClick={closeProductDialog} aria-label="Close product editor">×</button>
        <span className="eyebrow">INVENTORY</span>
        <h2 id="product-dialog-title">{editingProduct ? 'Edit product' : 'Add product'}</h2>
        {loading && <p role="status">Loading brands and categories…</p>}
        {loadError && <div role="alert">{loadError} <button type="button" className="text-link" onClick={() => setRetry((value) => value + 1)}>Try again</button></div>}
        <label>Name<input required name="name" defaultValue={editingProduct?.name} /></label>
        <div className="form-grid">
          <ProductChoice key={`brand-${editingProduct?.id || 'new'}`} label="Brand" name="brand" options={options.brands} initialValue={editingProduct?.brand} disabled={loading || Boolean(loadError)} />
          <ProductChoice key={`category-${editingProduct?.id || 'new'}`} label="Category" name="category" options={options.categories} initialValue={editingProduct?.category} disabled={loading || Boolean(loadError)} />
          <label>Price (₮)<input required type="number" min="0" name="price" defaultValue={editingProduct?.price} /></label>
          <label>Stock<input required type="number" min="0" name="stock" defaultValue={editingProduct?.stock} /></label>
        </div>
        <label>Product image {editingProduct?.image && <small>Current image is kept if no file is selected.</small>}<input type="file" name="image" accept="image/jpeg,image/png,image/webp" required={!editingProduct} /></label>
        <label>Description<textarea required name="description" defaultValue={editingProduct?.description} /></label>
        <button disabled={busy || loading || Boolean(loadError)} className="button dark-button full">{busy ? 'Saving…' : 'Save product'} <Check size={16} /></button>
      </form>
    </div>
  );
}
