-- SNC SmartResto initial schema

create extension if not exists "pgcrypto";

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  role text not null check (role in ('admin', 'cashier', 'kitchen')),
  created_at timestamptz not null default now()
);

-- Categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- Menu items
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  is_available boolean not null default true,
  estimated_prep_minutes integer check (estimated_prep_minutes is null or estimated_prep_minutes > 0),
  created_at timestamptz not null default now()
);

-- Dining tables
create table public.dining_tables (
  id uuid primary key default gen_random_uuid(),
  table_number text not null unique,
  capacity integer,
  status text not null default 'available' check (status in ('available', 'occupied'))
);

-- Orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.dining_tables (id),
  created_by uuid not null references public.profiles (id),
  status text not null default 'open' check (
    status in ('open', 'preparing', 'ready', 'served', 'completed', 'cancelled')
  ),
  ordered_at timestamptz not null default now(),
  preparation_started_at timestamptz,
  ready_at timestamptz,
  served_at timestamptz,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create unique index orders_one_active_per_table
  on public.orders (table_id)
  where status not in ('completed', 'cancelled');

-- Order items
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  menu_item_id uuid references public.menu_items (id),
  quantity integer not null check (quantity > 0),
  unit_price_snapshot numeric(10, 2) not null,
  item_name_snapshot text not null,
  notes text
);

-- Payments
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id),
  amount numeric(10, 2) not null check (amount >= 0),
  method text not null check (method in ('cash')),
  cash_tendered numeric(10, 2),
  change_due numeric(10, 2),
  paid_at timestamptz not null default now(),
  recorded_by uuid not null references public.profiles (id)
);

-- Auto-create profile on signup (role defaults to kitchen unless metadata provided)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'kitchen')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Atomic cash payment
create or replace function public.complete_cash_payment(
  p_order_id uuid,
  p_amount numeric,
  p_cash_tendered numeric,
  p_recorded_by uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_total numeric(10, 2);
  v_payment_id uuid;
begin
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if v_order.status <> 'served' then
    raise exception 'Order must be served before payment';
  end if;

  if exists (select 1 from public.payments where order_id = p_order_id) then
    raise exception 'Payment already recorded';
  end if;

  select coalesce(sum(quantity * unit_price_snapshot), 0)
    into v_total
  from public.order_items
  where order_id = p_order_id;

  if p_amount <> v_total then
    raise exception 'Payment amount must equal order total';
  end if;

  if p_recorded_by is distinct from auth.uid() then
    raise exception 'Recorder must be the signed-in staff member';
  end if;

  if public.current_user_role() not in ('admin', 'cashier') then
    raise exception 'Not allowed to record payments';
  end if;

  if p_cash_tendered is not null and p_cash_tendered < v_total then
    raise exception 'Cash tendered is less than total';
  end if;

  insert into public.payments (
    order_id, amount, method, cash_tendered, change_due, recorded_by
  )
  values (
    p_order_id,
    p_amount,
    'cash',
    p_cash_tendered,
    case when p_cash_tendered is null then null else p_cash_tendered - v_total end,
    p_recorded_by
  )
  returning id into v_payment_id;

  update public.orders
    set status = 'completed', completed_at = now()
    where id = p_order_id;

  update public.dining_tables
    set status = 'available'
    where id = v_order.table_id;

  return v_payment_id;
end;
$$;

grant execute on function public.complete_cash_payment(uuid, numeric, numeric, uuid) to authenticated, service_role;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

grant execute on function public.current_user_role() to authenticated, service_role;

-- RLS
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.dining_tables enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;

create policy "profiles_select_own_or_staff"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (public.current_user_role() = 'admin');

create policy "categories_read"
  on public.categories for select to authenticated using (true);

create policy "categories_write_admin"
  on public.categories for all to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "menu_read"
  on public.menu_items for select to authenticated using (true);

create policy "menu_write_admin"
  on public.menu_items for all to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "tables_read"
  on public.dining_tables for select to authenticated using (true);

create policy "tables_write_front"
  on public.dining_tables for update to authenticated
  using (public.current_user_role() in ('admin', 'cashier'))
  with check (public.current_user_role() in ('admin', 'cashier'));

create policy "orders_read"
  on public.orders for select to authenticated using (true);

create policy "orders_insert_front"
  on public.orders for insert to authenticated
  with check (public.current_user_role() in ('admin', 'cashier'));

create policy "orders_update_staff"
  on public.orders for update to authenticated
  using (public.current_user_role() in ('admin', 'cashier', 'kitchen'));

create policy "order_items_read"
  on public.order_items for select to authenticated using (true);

create policy "order_items_write_front"
  on public.order_items for all to authenticated
  using (public.current_user_role() in ('admin', 'cashier'))
  with check (public.current_user_role() in ('admin', 'cashier'));

create policy "payments_read_finance"
  on public.payments for select to authenticated
  using (public.current_user_role() in ('admin', 'cashier'));

create policy "payments_insert_finance"
  on public.payments for insert to authenticated
  with check (public.current_user_role() in ('admin', 'cashier'));

create or replace function public.create_dine_in_order(p_table_id uuid, p_items jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_menu public.menu_items%rowtype;
  v_qty integer;
begin
  if public.current_user_role() not in ('admin', 'cashier') then
    raise exception 'Not allowed to create orders';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 then
    raise exception 'Order must include at least one item';
  end if;

  if exists (
    select 1 from public.orders
    where table_id = p_table_id and status not in ('completed', 'cancelled')
  ) then
    raise exception 'Table already has an active order';
  end if;

  insert into public.orders (table_id, created_by, status, ordered_at)
  values (p_table_id, auth.uid(), 'open', now())
  returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    select * into v_menu
    from public.menu_items
    where id = (v_item->>'menu_item_id')::uuid;

    if not found then
      raise exception 'Menu item not found';
    end if;
    if not v_menu.is_available then
      raise exception 'Item is not available: %', v_menu.name;
    end if;

    v_qty := coalesce((v_item->>'quantity')::integer, 0);
    if v_qty <= 0 then
      raise exception 'Quantity must be a positive integer';
    end if;

    insert into public.order_items (
      order_id, menu_item_id, quantity, unit_price_snapshot, item_name_snapshot, notes
    ) values (
      v_order_id,
      v_menu.id,
      v_qty,
      v_menu.price,
      v_menu.name,
      nullif(v_item->>'notes', '')
    );
  end loop;

  update public.dining_tables set status = 'occupied' where id = p_table_id;
  return v_order_id;
end;
$$;

create or replace function public.replace_order_items(p_order_id uuid, p_items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_item jsonb;
  v_menu public.menu_items%rowtype;
  v_qty integer;
begin
  if public.current_user_role() not in ('admin', 'cashier') then
    raise exception 'Not allowed to edit orders';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found';
  end if;
  if v_order.status not in ('open', 'preparing') then
    raise exception 'Completed or locked orders cannot be edited';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 then
    raise exception 'Order must include at least one item';
  end if;

  delete from public.order_items where order_id = p_order_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    select * into v_menu from public.menu_items where id = (v_item->>'menu_item_id')::uuid;
    if not found then
      raise exception 'Menu item not found';
    end if;
    if not v_menu.is_available then
      raise exception 'Item is not available: %', v_menu.name;
    end if;
    v_qty := coalesce((v_item->>'quantity')::integer, 0);
    if v_qty <= 0 then
      raise exception 'Quantity must be a positive integer';
    end if;
    insert into public.order_items (
      order_id, menu_item_id, quantity, unit_price_snapshot, item_name_snapshot, notes
    ) values (
      p_order_id, v_menu.id, v_qty, v_menu.price, v_menu.name, nullif(v_item->>'notes', '')
    );
  end loop;
end;
$$;

create or replace function public.transition_order_status(p_order_id uuid, p_to text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_role text := public.current_user_role();
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found';
  end if;

  if p_to = 'cancelled' then
    if v_role not in ('admin', 'cashier') then
      raise exception 'Not allowed to cancel orders';
    end if;
    if v_order.status not in ('open', 'preparing') then
      raise exception 'Invalid status transition: % → cancelled', v_order.status;
    end if;
    update public.orders set status = 'cancelled' where id = p_order_id;
    update public.dining_tables set status = 'available' where id = v_order.table_id;
    return;
  end if;

  if v_role not in ('admin', 'cashier', 'kitchen') then
    raise exception 'Not allowed to update kitchen status';
  end if;

  if v_order.status = 'open' and p_to = 'preparing' then
    update public.orders
      set status = 'preparing', preparation_started_at = coalesce(preparation_started_at, now())
      where id = p_order_id;
  elsif v_order.status = 'preparing' and p_to = 'ready' then
    update public.orders
      set status = 'ready', ready_at = coalesce(ready_at, now())
      where id = p_order_id;
  elsif v_order.status = 'ready' and p_to = 'served' then
    update public.orders
      set status = 'served', served_at = coalesce(served_at, now())
      where id = p_order_id;
  else
    raise exception 'Invalid status transition: % → %', v_order.status, p_to;
  end if;
end;
$$;

grant execute on function public.create_dine_in_order(uuid, jsonb) to authenticated;
grant execute on function public.replace_order_items(uuid, jsonb) to authenticated;
grant execute on function public.transition_order_status(uuid, text) to authenticated;
