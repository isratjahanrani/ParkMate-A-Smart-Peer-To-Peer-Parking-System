-- Enable PostGIS for location features
create extension if not exists "postgis";

-- 1. USERS (Public profile mirroring auth.users)
create type user_role as enum ('driver', 'host', 'admin');

create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  role user_role default 'driver',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on Security
alter table public.users enable row level security;
create policy "Public profiles are viewable by everyone." on public.users for select using (true);
create policy "Users can update own profile." on public.users for update using (auth.uid() = id);

-- 2. USER PROFILES
create table public.user_profiles (
  user_id uuid references public.users(id) on delete cascade not null primary key,
  full_name text,
  phone_number text,
  business_name text, -- For Hosts
  avatar_url text,
  address text,
  is_verified boolean default false,
  preferences jsonb default '{}'::jsonb, -- Newsletters etc
  metadata jsonb default '{}'::jsonb
);

alter table public.user_profiles enable row level security;
create policy "Profiles viewable by self and relevant hosts." on public.user_profiles for select using (auth.uid() = user_id); 
create policy "Users can update own profile details." on public.user_profiles for update using (auth.uid() = user_id);

-- 3. VEHICLES
create table public.vehicles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null, -- car, bike, truck
  license_plate text,
  model text,
  is_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.vehicles enable row level security;
create policy "Users manage own vehicles" on public.vehicles for all using (auth.uid() = user_id);

-- 4. PARKING SPOTS
create table public.parking_spots (
  id uuid default gen_random_uuid() primary key,
  host_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  description text,
  address text not null,
  
  -- Geolocation
  location geography(Point) not null,
  
  spot_type text, -- garage, open-lot
  total_spots int default 1,
  
  -- Pricing
  base_price_hr decimal(10,2) not null,
  daily_rate decimal(10,2),
  
  -- Features
  amenities jsonb default '[]'::jsonb, -- ['cctv', 'light']
  allowed_vehicles jsonb default '["car"]'::jsonb,
  images jsonb default '[]'::jsonb,
  
  -- Config
  availability_settings jsonb default '{"is_24_7": true}'::jsonb,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Index for fast location search
create index parking_spots_geo_index on public.parking_spots using GIST (location);

alter table public.parking_spots enable row level security;
create policy "Anyone can view active spots" on public.parking_spots for select using (is_active = true);
create policy "Hosts can manage own spots" on public.parking_spots for all using (auth.uid() = host_id);

-- 5. BOOKINGS
create type booking_status as enum ('pending', 'confirmed', 'completed', 'cancelled');

create table public.bookings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null, -- Driver
  spot_id uuid references public.parking_spots(id) not null,
  vehicle_id uuid references public.vehicles(id),
  
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  
  total_amount decimal(10,2) not null,
  status booking_status default 'pending',
  
  special_requests jsonb default '{}'::jsonb, -- valet, wash
  qr_code text,
  
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.bookings enable row level security;
-- Drivers can see their bookings, Hosts can see bookings for their spots
create policy "Drivers view own" on public.bookings for select using (auth.uid() = user_id);
create policy "Hosts view received" on public.bookings for select using (
  exists (select 1 from public.parking_spots where id = bookings.spot_id and host_id = auth.uid())
);
create policy "Drivers can create" on public.bookings for insert with check (auth.uid() = user_id);

-- 6. TRANSACTIONS
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  booking_id uuid references public.bookings(id),
  user_id uuid references public.users(id),
  amount decimal(10,2) not null,
  method text not null, -- bkash, card
  status text default 'success',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.transactions enable row level security;
create policy "Users view own txns" on public.transactions for select using (auth.uid() = user_id);

-- TRIGGER: Handle New User Signup
-- Automatically inserts into public.users when a user signs up via Supabase Auth
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, 'driver'); -- Default to driver, can be updated later
  
  insert into public.user_profiles (user_id)
  values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RPC: Find Nearby Spots
-- Frontend calls: supabase.rpc('find_nearby_spots', { lat, lng, radius_meters })
create or replace function find_nearby_spots(lat float, lng float, radius_meters float)
returns setof public.parking_spots as $$
begin
  return query
  select *
  from public.parking_spots
  where ST_DWithin(
    location,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326),
    radius_meters
  )
  and is_active = true;
end;
$$ language plpgsql;
