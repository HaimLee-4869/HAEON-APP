-- 설계안 전용. Production Supabase에 자동 적용하지 마세요.
create table if not exists public.emergency_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete restrict,
  report_type text not null check (report_type in ('emergency', 'detailed')),
  description text check (char_length(description) <= 2000),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  address text,
  sharing_consent boolean not null default false,
  status text not null default 'received' check (status in ('received', 'reviewing', 'responding', 'resolved')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.emergency_reports enable row level security;
grant select, insert on public.emergency_reports to authenticated;
create policy emergency_reports_insert_own on public.emergency_reports for insert to authenticated with check (reporter_id = (select auth.uid()));
create policy emergency_reports_read_own on public.emergency_reports for select to authenticated using (reporter_id = (select auth.uid()));
create index emergency_reports_reporter_created_idx on public.emergency_reports(reporter_id, created_at desc);

-- 미디어는 별도 private bucket `emergency-media`와 reporter_id 첫 경로 segment 기반
-- storage.objects SELECT/INSERT/DELETE 정책을 보안 검토 후 추가해야 합니다.
