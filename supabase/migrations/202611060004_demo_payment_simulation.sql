-- This deliberately records a simulated payment only. It does not verify or
-- represent a real QPay/bank payment.
create or replace function public.complete_demo_payment(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  update public.orders o
  set payment_status = 'demo_paid'
  where o.id = p_order_id
    and o.user_id = v_user_id
    and o.payment_status = 'pending'
    and exists (
      select 1
      from public.payments p
      where p.order_id = o.id
        and p.payment_method = 'DEMO'
        and p.payment_status = 'pending'
    );

  if not found then
    raise exception 'No pending demo payment found for this order';
  end if;

  update public.payments p
  set payment_status = 'demo_paid'
  where p.order_id = p_order_id
    and p.payment_method = 'DEMO'
    and p.payment_status = 'pending';
end;
$$;

revoke all on function public.complete_demo_payment(uuid) from public, anon;
grant execute on function public.complete_demo_payment(uuid) to authenticated;
