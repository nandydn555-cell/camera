import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  createOrder,
  getCart,
  getOrderPaymentDetails,
  getOrders,
  getProducts,
  markDemoPaymentPaid,
  requireSupabase,
  saveProduct as saveProductToDb,
  setCartQuantity,
  supabase,
} from '../lib/supabase';
import type { DemoPayment, Order, Product, ProductDraft, StoreUser } from '../types/store';

type AuthIdentity = { id: string; email: string };

type StoreContextValue = {
  products: Product[];
  productsLoading: boolean;
  cart: Record<string, number>;
  orders: Order[];
  user: StoreUser | null;
  profile: { full_name: string; phone: string | null } | null;
  notice: string;
  busy: boolean;
  authOpen: boolean;
  authMode: 'login' | 'register';
  productDialogOpen: boolean;
  editingProduct: Product | null;
  demoPayment: DemoPayment | null;
  cartCount: number;
  cartSubtotal: number;
  toast: (message: string) => void;
  dismissNotice: () => void;
  setAuthOpen: (open: boolean) => void;
  setAuthMode: (mode: 'login' | 'register') => void;
  addToCart: (product: Product) => Promise<void>;
  openCreateProduct: () => void;
  openEditProduct: (product: Product) => void;
  closeProductDialog: () => void;
  authenticate: (values: { email: string; password: string; name?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (values: { fullName: string; phone: string }) => Promise<void>;
  changeQuantity: (productId: string, quantity: number) => Promise<void>;
  startDemoCheckout: (address: Record<string, string>) => Promise<void>;
  completeDemoPayment: () => Promise<void>;
  dismissDemoPayment: () => void;
  saveProduct: (product: ProductDraft, file: File | null) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
};

const StoreContext = createContext<StoreContextValue | null>(null);

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<StoreUser | null>(null);
  const [profile, setProfile] = useState<{ full_name: string; phone: string | null } | null>(null);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [demoPayment, setDemoPayment] = useState<DemoPayment | null>(null);

  const toast = useCallback((message: string) => setNotice(message), []);
  const dismissNotice = useCallback(() => setNotice(''), []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(''), 4000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const refreshProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      setProducts(await getProducts() as Product[]);
    } catch (error) {
      toast(messageOf(error));
    } finally {
      setProductsLoading(false);
    }
  }, [toast]);

  const refreshUserData = useCallback(async (identity: AuthIdentity | null) => {
    if (!identity) {
      setCart({});
      setOrders([]);
      setProfile(null);
      setUser(null);
      return;
    }

    try {
      const client = requireSupabase();
      let { data: profileRow, error } = await client
        .from('profiles')
        .select('id,email,full_name,phone,role')
        .eq('id', identity.id)
        .maybeSingle();
      if (error) throw error;

      if (!profileRow) {
        const authUser = (await client.auth.getUser()).data.user;
        if (!authUser || authUser.id !== identity.id) {
          throw new Error('Your session could not be verified. Please sign in again.');
        }
        const { data: created, error: createError } = await client
          .from('profiles')
          .insert({
            id: authUser.id,
            email: authUser.email || identity.email,
            full_name: authUser.user_metadata?.full_name || '',
          })
          .select('id,email,full_name,phone,role')
          .single();
        if (createError) {
          const { data: existing, error: readError } = await client
            .from('profiles')
            .select('id,email,full_name,phone,role')
            .eq('id', identity.id)
            .maybeSingle();
          if (readError || !existing) throw createError;
          profileRow = existing;
        } else {
          profileRow = created;
        }
      }

      const [nextCart, nextOrders] = await Promise.all([
        getCart(identity.id),
        getOrders(identity.id, profileRow.role === 'admin'),
      ]);
      setProfile({ full_name: profileRow.full_name || '', phone: profileRow.phone });
      setUser({
        id: profileRow.id,
        email: profileRow.email,
        name: profileRow.full_name || profileRow.email,
        role: profileRow.role,
      });
      setCart(nextCart);
      setOrders(nextOrders as Order[]);
    } catch (error) {
      toast(messageOf(error));
    }
  }, [toast]);

  useEffect(() => {
    void refreshProducts();
    if (!supabase) return;

    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const authUser = data.session?.user;
      void refreshUserData(authUser ? { id: authUser.id, email: authUser.email || '' } : null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => {
        if (!active) return;
        const authUser = session?.user;
        void refreshUserData(authUser ? { id: authUser.id, email: authUser.email || '' } : null);
      }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [refreshProducts, refreshUserData]);

  const cartCount = useMemo(() => Object.values(cart).reduce((sum, quantity) => sum + quantity, 0), [cart]);
  const cartSubtotal = useMemo(() => Object.entries(cart).reduce((sum, [id, quantity]) => {
    const product = products.find((candidate) => candidate.id === id);
    return sum + (product ? product.price * quantity : 0);
  }, 0), [cart, products]);

  const authenticate = useCallback(async ({ email, password, name }: { email: string; password: string; name?: string }) => {
    setBusy(true);
    try {
      const client = requireSupabase();
      if (authMode === 'register') {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: { data: { full_name: name || '' } },
        });
        if (error) throw error;
        toast(data.session ? 'Account created and signed in' : 'Account created. Check your email to confirm, then sign in.');
      } else {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast('Signed in');
      }
      setAuthOpen(false);
    } catch (error) {
      toast(messageOf(error));
      throw error;
    } finally {
      setBusy(false);
    }
  }, [authMode, toast]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await requireSupabase().auth.signOut();
      if (error) throw error;
      toast('Signed out');
    } catch (error) {
      toast(messageOf(error));
      throw error;
    }
  }, [toast]);

  const updateProfile = useCallback(async ({ fullName, phone }: { fullName: string; phone: string }) => {
    if (!user) return;
    setBusy(true);
    try {
      const { error } = await requireSupabase().from('profiles')
        .update({ full_name: fullName, phone })
        .eq('id', user.id);
      if (error) throw error;
      await refreshUserData({ id: user.id, email: user.email });
      toast('Profile updated');
    } catch (error) {
      toast(messageOf(error));
      throw error;
    } finally {
      setBusy(false);
    }
  }, [refreshUserData, toast, user]);

  const changeQuantity = useCallback(async (productId: string, quantity: number) => {
    if (!user) return;
    try {
      await setCartQuantity(user.id, productId, quantity);
      setCart(await getCart(user.id));
    } catch (error) {
      toast(messageOf(error));
    }
  }, [toast, user]);

  const addToCart = useCallback(async (product: Product) => {
    if (!user) {
      setAuthMode('login');
      setAuthOpen(true);
      toast('Sign in to add items to your account cart');
      return;
    }
    const quantity = Math.min((cart[product.id] || 0) + 1, product.stock);
    if (!quantity) return;
    try {
      await setCartQuantity(user.id, product.id, quantity);
      setCart(await getCart(user.id));
      toast('Added to your bag');
    } catch (error) {
      toast(messageOf(error));
    }
  }, [cart, toast, user]);

  const startDemoCheckout = useCallback(async (address: Record<string, string>) => {
    if (!user) throw new Error('Sign in to place an order.');
    setBusy(true);
    try {
      const orderId = await createOrder(address, 'DEMO');
      const { amount } = await getOrderPaymentDetails(orderId);
      const { toDataURL } = await import('qrcode');
      const qrDataUrl = await toDataURL(
        `LENSLINE DEMO ONLY\nNOT A REAL PAYMENT\nOrder: ${orderId}\nAmount: MNT ${amount}`,
        { width: 256, margin: 1, errorCorrectionLevel: 'M' },
      );
      setDemoPayment({ orderId, amount, qrDataUrl });
      await refreshUserData({ id: user.id, email: user.email });
    } catch (error) {
      toast(messageOf(error));
      throw error;
    } finally {
      setBusy(false);
    }
  }, [refreshUserData, toast, user]);

  const completeDemoPayment = useCallback(async () => {
    if (!demoPayment) return;
    setBusy(true);
    try {
      await markDemoPaymentPaid(demoPayment.orderId);
      if (user) await refreshUserData({ id: user.id, email: user.email });
      setDemoPayment(null);
      toast('Demo payment recorded. No real payment was taken.');
    } catch (error) {
      toast(messageOf(error));
      throw error;
    } finally {
      setBusy(false);
    }
  }, [demoPayment, refreshUserData, toast, user]);

  const dismissDemoPayment = useCallback(() => setDemoPayment(null), []);

  const saveProduct = useCallback(async (product: ProductDraft, file: File | null) => {
    setBusy(true);
    try {
      await saveProductToDb(product, file);
      await refreshProducts();
      setProductDialogOpen(false);
      setEditingProduct(null);
      toast('Product saved');
    } catch (error) {
      toast(messageOf(error));
      throw error;
    } finally {
      setBusy(false);
    }
  }, [refreshProducts, toast]);

  const deleteProduct = useCallback(async (productId: string) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      const { error } = await requireSupabase().from('products').delete().eq('id', productId);
      if (error) throw error;
      await refreshProducts();
      toast('Product deleted');
    } catch (error) {
      toast(messageOf(error));
    }
  }, [refreshProducts, toast]);

  const updateOrderStatus = useCallback(async (orderId: string, status: string) => {
    try {
      const { error } = await requireSupabase().from('orders').update({ status }).eq('id', orderId);
      if (error) throw error;
      if (user) await refreshUserData({ id: user.id, email: user.email });
      toast('Order status updated');
    } catch (error) {
      toast(messageOf(error));
    }
  }, [refreshUserData, toast, user]);

  const value = useMemo<StoreContextValue>(() => ({
    products, productsLoading, cart, orders, user, profile, notice, busy,
    authOpen, authMode, productDialogOpen, editingProduct, demoPayment, cartCount, cartSubtotal,
    toast, dismissNotice, setAuthOpen, setAuthMode, addToCart,
    openCreateProduct: () => { setEditingProduct(null); setProductDialogOpen(true); },
    openEditProduct: (product) => { setEditingProduct(product); setProductDialogOpen(true); },
    closeProductDialog: () => { setProductDialogOpen(false); setEditingProduct(null); },
    authenticate, signOut, updateProfile, changeQuantity, startDemoCheckout,
    completeDemoPayment, dismissDemoPayment, saveProduct, deleteProduct, updateOrderStatus,
  }), [
    products, productsLoading, cart, orders, user, profile, notice, busy,
    authOpen, authMode, productDialogOpen, editingProduct, demoPayment, cartCount, cartSubtotal,
    toast, dismissNotice, addToCart, authenticate, signOut, updateProfile, changeQuantity,
    startDemoCheckout, completeDemoPayment, dismissDemoPayment, saveProduct, deleteProduct, updateOrderStatus,
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used inside StoreProvider');
  return context;
}
