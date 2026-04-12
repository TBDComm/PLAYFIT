-- SQ-1: squad_sessions 테이블 생성
-- Squad MVP: 2~4명 Steam URL 기반 취향 분석 세션 저장
-- TTL 7일, share_token으로 공개 읽기, 비로그인 INSERT 허용

create table if not exists public.squad_sessions (
  id               uuid        primary key default gen_random_uuid(),
  share_token      text        unique not null,  -- crypto.randomUUID() 앞 10자 base36 (서버 생성)
  host_user_id     uuid        references auth.users(id) on delete set null,
  member_steam_ids text[]      not null,
  member_count     int         not null,
  merged_profile   jsonb       not null,
  result_cards     jsonb       not null,         -- SquadRecommendationCard[]
  match_scores     jsonb       not null,         -- { steamId: score(0-100) }
  avg_match_score  int         not null,
  top_shared_tags  text[]      not null,
  conflict_tags    text[]      not null,
  budget_krw       int,
  free_only        boolean     default false,
  created_at       timestamptz default now(),
  expires_at       timestamptz default now() + interval '7 days'
);

create index squad_sessions_share_token_idx on public.squad_sessions (share_token);
create index squad_sessions_expires_at_idx  on public.squad_sessions (expires_at);

alter table public.squad_sessions enable row level security;

-- 누구나 유효한(만료 안 된) 세션 읽기 가능
create policy "Public read non-expired" on public.squad_sessions
  for select using (expires_at > now());

-- 호스트 로그인 여부 무관하게 INSERT 허용 (비로그인 Squad = host_user_id null)
create policy "Host or anon insert" on public.squad_sessions
  for insert with check (auth.uid() = host_user_id or host_user_id is null);
