import { createClient } from '@supabase/supabase-js';
import type { Order, Product, ProductDraft } from '../types/store';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const supabaseConfigured = Boolean(
  url && anonKey && !url.includes('your-project') && !anonKey.includes('your-public'),
);

export const supabase = supabaseConfigured
  ? createClient(url!, anonKey!, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  })
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add the project URL and public key to .env.local, then restart the dev server.');
  }
  return supabase;
}

type NamedRelation = { name: string } | { name: string }[] | null;
type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  stock: number;
  image_url: string | null;
  specifications: unknown;
  categories: NamedRelation;
  brands: NamedRelation;
};

function relationName(relation: NamedRelation, fallback: string) {
  if (Array.isArray(relation)) return relation[0]?.name || fallback;
  return relation?.name || fallback;
}

function stringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, String(item)]));
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await requireSupabase()
    .from('products')
    .select('*, categories(name), brands(name)')
    .order('created_at', { ascending: false });
  if (error) throw error;

  return ((data ?? []) as unknown as ProductRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description || '',
    price: Number(row.price),
    stock: row.stock,
    image: row.image_url || '',
    specs: stringRecord(row.specifications),
    category: relationName(row.categories, 'Camera Accessories'),
    brand: relationName(row.brands, 'Lensline'),
  }));
}

export async function getOrCreateCart(userId: string): Promise<string> {
  const client = requireSupabase();
  const readCart = async () => {
    const { data, error } = await client.from('carts').select('id').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return data?.id as string | undefined;
  };

  const existingId = await readCart();
  if (existingId) return existingId;

  const { data, error } = await client.from('carts').insert({ user_id: userId }).select('id').single();
  if (!error) return data.id as string;

  // Another tab may have created the unique per-user cart at the same time.
  if (error.code === '23505') {
    const concurrentCartId = await readCart();
    if (concurrentCartId) return concurrentCartId;
  }
  throw error;
}

export async function getCart(userId: string): Promise<Record<string, number>> {
  const cartId = await getOrCreateCart(userId);
  const { data, error } = await requireSupabase()
    .from('cart_items')
    .select('product_id,quantity')
    .eq('cart_id', cartId);
  if (error) throw error;
  return Object.fromEntries((data ?? []).map((row) => [row.product_id, row.quantity]));
}

export async function setCartQuantity(userId: string, productId: string, quantity: number): Promise<void> {
  if (!Number.isInteger(quantity)) throw new Error('Cart quantity must be a whole number.');
  const client = requireSupabase();
  const cartId = await getOrCreateCart(userId);

  if (quantity <= 0) {
    const { error } = await client.from('cart_items').delete().eq('cart_id', cartId).eq('product_id', productId);
    if (error) throw error;
    return;
  }

  const { error } = await client.from('cart_items').upsert(
    { cart_id: cartId, product_id: productId, quantity },
    { onConflict: 'cart_id,product_id' },
  );
  if (error) throw error;
}

type OrderRow = {
  id: string;
  total_amount: number | string;
  status: string;
  payment_status: string;
  shipping_address: Record<string, unknown> | string | null;
  created_at: string;
  profiles: Order['customer'];
  order_items: Order['items'] | null;
};

function formatAddress(value: OrderRow['shipping_address']) {
  if (typeof value === 'string') return value;
  return Object.values(value || {}).filter((part) => part !== null && part !== undefined && part !== '').map(String).join(', ');
}

export async function getOrders(userId: string, isAdmin = false): Promise<Order[]> {
  const client = requireSupabase();
  let query = client.from('orders')
    .select('*, order_items(product_name,quantity,unit_price), profiles(full_name,email,phone)')
    .order('created_at', { ascending: false });
  if (!isAdmin) query = query.eq('user_id', userId);

  const { data, error } = await query;
  if (error) throw error;

  return ((data ?? []) as unknown as OrderRow[]).map((row) => ({
    id: row.id,
    total: Number(row.total_amount),
    status: row.status,
    payment_status: row.payment_status,
    address: formatAddress(row.shipping_address),
    date: row.created_at,
    customer: row.profiles,
    items: row.order_items || [],
  }));
}

export async function saveProduct(product: ProductDraft, file: File | null): Promise<void> {
  const client = requireSupabase();
  const [{ data: brand, error: brandError }, { data: category, error: categoryError }] = await Promise.all([
    client.from('brands').upsert({ name: product.brand }, { onConflict: 'name' }).select('id').single(),
    client.from('categories').upsert({ name: product.category }, { onConflict: 'name' }).select('id').single(),
  ]);
  if (brandError) throw brandError;
  if (categoryError) throw categoryError;

  let imageUrl = product.image || '';
  let uploadedPath: string | null = null;
  if (file) {
    uploadedPath = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error } = await client.storage.from('product-images').upload(uploadedPath, file, {
      upsert: false,
      contentType: file.type,
    });
    if (error) throw error;
    imageUrl = client.storage.from('product-images').getPublicUrl(uploadedPath).data.publicUrl;
  }

  const row = {
    name: product.name,
    brand_id: brand.id,
    category_id: category.id,
    price: product.price,
    stock: product.stock,
    description: product.description,
    image_url: imageUrl,
    specifications: product.specs || {},
  };
  const query = product.id
    ? client.from('products').update(row).eq('id', product.id)
    : client.from('products').insert(row);
  const { error } = await query;
  if (error) {
    if (uploadedPath) await client.storage.from('product-images').remove([uploadedPath]);
    throw error;
  }
}

export async function createOrder(
  address: Record<string, string>,
  paymentMethod: 'DEMO',
): Promise<string> {
  // The database function derives user ID, prices and stock from the authenticated session and database.
  const { data, error } = await requireSupabase().rpc('checkout_cart', {
    p_shipping_address: address,
    p_payment_method: paymentMethod,
  });
  if (error) throw error;
  return data as string;
}

export async function getOrderPaymentDetails(orderId: string): Promise<{ id: string; amount: number }> {
  const { data, error } = await requireSupabase().from('orders').select('id,total_amount').eq('id', orderId).single();
  if (error) throw error;
  return { id: data.id as string, amount: Number(data.total_amount) };
}

export async function markDemoPaymentPaid(orderId: string): Promise<void> {
  const { error } = await requireSupabase().rpc('complete_demo_payment', { p_order_id: orderId });
  if (error) throw error;
}
