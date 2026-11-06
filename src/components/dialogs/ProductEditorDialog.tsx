import type { FormEvent } from 'react';
import { Check } from 'lucide-react';
import { useStore } from '../../state/StoreContext';
import type { ProductDraft } from '../../types/store';

export default function ProductEditorDialog() {
  const { productDialogOpen, editingProduct, closeProductDialog, saveProduct, busy } = useStore();
  if (!productDialogOpen) return null;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const imageFile = form.get('image');
    const draft: ProductDraft = {
      id: editingProduct?.id,
      name: String(form.get('name')),
      brand: String(form.get('brand')),
      category: String(form.get('category')),
      price: Number(form.get('price')),
      stock: Number(form.get('stock')),
      description: String(form.get('description')),
      specs: editingProduct?.specs || {},
      image: editingProduct?.image || '',
    };
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
        <label>Name<input required name="name" defaultValue={editingProduct?.name} /></label>
        <div className="form-grid">
          <label>Brand<input required name="brand" defaultValue={editingProduct?.brand} /></label>
          <label>Category<input required name="category" defaultValue={editingProduct?.category} /></label>
          <label>Price (₮)<input required type="number" min="0" name="price" defaultValue={editingProduct?.price} /></label>
          <label>Stock<input required type="number" min="0" name="stock" defaultValue={editingProduct?.stock} /></label>
        </div>
        <label>Product image {editingProduct?.image && <small>Current image is kept if no file is selected.</small>}<input type="file" name="image" accept="image/jpeg,image/png,image/webp" required={!editingProduct} /></label>
        <label>Description<textarea required name="description" defaultValue={editingProduct?.description} /></label>
        <button disabled={busy} className="button dark-button full">{busy ? 'Saving…' : 'Save product'} <Check size={16} /></button>
      </form>
    </div>
  );
}
