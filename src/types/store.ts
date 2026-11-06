export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  description: string;
  specs: Record<string, string>;
  badge?: string;
};

export type ProductDraft = Omit<Product, 'id' | 'image' | 'badge'> & { id?: string; image?: string };

export type StoreUser = { id: string; email: string; name: string; role: 'customer' | 'admin' };

export type Order = {
  id: string;
  total: number;
  status: string;
  payment_status: string;
  address: string;
  date: string;
  customer?: { email?: string; full_name?: string; phone?: string } | null;
  items: Array<{ product_name: string; quantity: number; unit_price: number }>;
};

export type DemoPayment = { orderId: string; amount: number; qrDataUrl: string };
