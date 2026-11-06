-- Server-authoritative order creation: prices, stock and line items come from PostgreSQL.
drop policy if exists "orders owner create" on public.orders;
drop policy if exists "order items owner insert" on public.order_items;
drop policy if exists "payments owner create" on public.payments;

-- Product deletion must not block admin CRUD or erase historical order line snapshots.
alter table public.cart_items drop constraint if exists cart_items_product_id_fkey;
alter table public.cart_items add constraint cart_items_product_id_fkey foreign key(product_id) references public.products(id) on delete cascade;
alter table public.order_items drop constraint if exists order_items_product_id_fkey;
alter table public.order_items add constraint order_items_product_id_fkey foreign key(product_id) references public.products(id) on delete set null;

create or replace function public.current_profile_role() returns public.app_role
language sql stable security definer set search_path=public
as $$ select role from public.profiles where id=auth.uid() $$;
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own safe fields" on public.profiles for update
using(id=auth.uid()) with check(id=auth.uid() and role=public.current_profile_role());

create or replace function public.checkout_cart(p_shipping_address jsonb, p_payment_method text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_cart_id uuid;
  v_order_id uuid;
  v_total numeric(12,2);
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_shipping_address is null or p_shipping_address = '{}'::jsonb then raise exception 'Shipping address is required'; end if;
  if p_payment_method not in ('DEMO','QPay') then raise exception 'Unsupported payment method'; end if;

  select id into v_cart_id from public.carts where user_id=v_user_id for update;
  if v_cart_id is null then raise exception 'Cart is empty'; end if;
  if not exists(select 1 from public.cart_items where cart_id=v_cart_id) then raise exception 'Cart is empty'; end if;

  perform p.id from public.products p join public.cart_items ci on ci.product_id=p.id
    where ci.cart_id=v_cart_id for update of p;
  if exists(select 1 from public.cart_items ci join public.products p on p.id=ci.product_id where ci.cart_id=v_cart_id and ci.quantity>p.stock) then
    raise exception 'One or more products no longer have enough stock';
  end if;

  select sum(p.price*ci.quantity) into v_total from public.cart_items ci join public.products p on p.id=ci.product_id where ci.cart_id=v_cart_id;
  insert into public.orders(user_id,total_amount,status,payment_status,shipping_address)
    values(v_user_id,v_total,'pending','pending',p_shipping_address) returning id into v_order_id;
  insert into public.order_items(order_id,product_id,product_name,quantity,unit_price)
    select v_order_id,p.id,p.name,ci.quantity,p.price from public.cart_items ci join public.products p on p.id=ci.product_id where ci.cart_id=v_cart_id;
  update public.products p set stock=p.stock-ci.quantity from public.cart_items ci where ci.cart_id=v_cart_id and ci.product_id=p.id;
  insert into public.payments(order_id,amount,payment_method,payment_status)
    values(v_order_id,v_total,p_payment_method,'pending');
  delete from public.cart_items where cart_id=v_cart_id;
  return v_order_id;
end;
$$;
revoke all on function public.checkout_cart(jsonb,text) from public;
grant execute on function public.checkout_cart(jsonb,text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('product-images','product-images',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=10485760,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
create policy "product image public read" on storage.objects for select using(bucket_id='product-images');
create policy "admins upload product images" on storage.objects for insert to authenticated with check(bucket_id='product-images' and public.is_admin());
create policy "admins update product images" on storage.objects for update to authenticated using(bucket_id='product-images' and public.is_admin()) with check(bucket_id='product-images' and public.is_admin());
create policy "admins delete product images" on storage.objects for delete to authenticated using(bucket_id='product-images' and public.is_admin());
