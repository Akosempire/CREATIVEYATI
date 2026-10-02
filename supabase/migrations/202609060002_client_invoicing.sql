-- Client quotations, invoices and receipts.
-- Safe to run more than once in the Supabase SQL Editor.

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  document_type text not null default 'quote',
  client_name text not null,
  client_company text not null default '',
  client_email text not null,
  currency text not null default 'NGN' check (char_length(currency) = 3),
  subtotal_minor bigint not null default 0 check (subtotal_minor >= 0),
  discount_minor bigint not null default 0 check (discount_minor >= 0),
  total_minor bigint not null default 0 check (total_minor >= 0),
  status text not null default 'draft',
  issued_at timestamptz not null default now(),
  due_at timestamptz,
  valid_until timestamptz,
  accepted_at timestamptz,
  accepted_name text not null default '',
  paid_at timestamptz,
  payment_channel text,
  payment_reference text,
  checkout_id text,
  checkout_reference text unique,
  access_token text not null unique,
  notes text not null default '',
  video_id uuid references public.videos(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.invoices drop constraint if exists invoices_document_type_check;
alter table public.invoices add constraint invoices_document_type_check check (document_type in ('quote','invoice'));
-- 'overdue' is derived from due_at at read time, never stored, so it cannot go stale
alter table public.invoices drop constraint if exists invoices_status_check;
alter table public.invoices add constraint invoices_status_check check (status in ('draft','sent','accepted','declined','paid','void'));

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  unit_price_minor bigint not null default 0 check (unit_price_minor >= 0),
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  receipt_number text not null unique,
  amount_minor bigint not null check (amount_minor > 0),
  currency text not null,
  issued_to text not null,
  channel text,
  reference text,
  issued_at timestamptz not null default now()
);

create index if not exists invoices_status_idx on public.invoices(status, issued_at desc);
create index if not exists invoices_token_idx on public.invoices(access_token);
create index if not exists invoice_items_invoice_idx on public.invoice_items(invoice_id, display_order);
create index if not exists receipts_invoice_idx on public.receipts(invoice_id, issued_at desc);

-- document numbers are sequential per series and per year
create sequence if not exists public.invoice_number_seq;
create sequence if not exists public.quote_number_seq;
create sequence if not exists public.receipt_number_seq;

create or replace function public.next_invoice_number(document_type text)
returns text language sql volatile set search_path = public as $$
  select case when document_type = 'quote'
    then 'QT-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.quote_number_seq')::text, 4, '0')
    else 'INV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.invoice_number_seq')::text, 4, '0') end;
$$;

create or replace function public.next_receipt_number()
returns text language sql volatile set search_path = public as $$
  select 'RCT-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.receipt_number_seq')::text, 4, '0');
$$;

-- clients never sign in: they reach a document through its unguessable token, and
-- the public page reads it with the service role, so nothing is exposed to anon
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.receipts enable row level security;

drop policy if exists "admins manage invoices" on public.invoices;
create policy "admins manage invoices" on public.invoices for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage invoice items" on public.invoice_items;
create policy "admins manage invoice items" on public.invoice_items for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage receipts" on public.receipts;
create policy "admins manage receipts" on public.receipts for all using (public.is_admin()) with check (public.is_admin());
