-- TacFit Home — optional accounts/sync schema.
-- Run this once in your Supabase project's SQL Editor (https://app.supabase.com -> your project -> SQL Editor),
-- then copy the Project URL and anon public key (Project Settings -> API) into js/supabaseClient.js.

create table if not exists profiles (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  date date not null,
  weight_kg numeric not null,
  unique (user_id, date)
);

create table if not exists test_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  date date not null,
  pushups int not null,
  pullups int not null,
  unique (user_id, date)
);

create table if not exists workout_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  date date not null,
  day_index int not null,
  exercise_results jsonb not null,
  duration_min int not null,
  completion_pct int not null,
  unique (user_id, date, day_index)
);

-- Progress photos: this table holds only the pointer (date + storage path). The actual image
-- bytes live in the 'progress-photos' Storage bucket below, kept private — every read goes
-- through a short-lived signed URL rather than a public link, since these are sensitive photos.
create table if not exists progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  date date not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table weight_logs enable row level security;
alter table test_logs enable row level security;
alter table workout_history enable row level security;
alter table progress_photos enable row level security;

-- Each user can only ever read/write their own rows.
create policy "own profile" on profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own weight logs" on weight_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own test logs" on test_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own workout history" on workout_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own progress photos" on progress_photos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Private bucket for progress photo files. Path convention: {user_id}/{uuid}.ext — the
-- policies below key off the first path segment matching the signed-in user's id, so nobody
-- can read or write another user's photos even with a guessed path.
insert into storage.buckets (id, name, public)
  values ('progress-photos', 'progress-photos', false)
  on conflict (id) do nothing;

create policy "own progress photo files read" on storage.objects
  for select using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own progress photo files write" on storage.objects
  for insert with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "own progress photo files delete" on storage.objects
  for delete using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);
