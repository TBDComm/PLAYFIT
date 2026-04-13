-- SQ-7: game_comments 테이블 생성
-- Game Boards MVP: 게임별 댓글 (500자 제한, 대댓글 1단계)
-- RLS: 공개 읽기, 인증 유저만 쓰기, 본인만 삭제

create table if not exists public.game_comments (
  id          uuid        primary key default gen_random_uuid(),
  appid       text        not null,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  body        text        not null check (char_length(body) <= 500),
  parent_id   uuid        references public.game_comments(id) on delete cascade,
  created_at  timestamptz default now()
);

create index game_comments_appid_idx     on public.game_comments (appid, created_at desc);
create index game_comments_user_id_idx   on public.game_comments (user_id);
create index game_comments_parent_id_idx on public.game_comments (parent_id);

alter table public.game_comments enable row level security;

-- 누구나 읽기 가능
create policy "Public read" on public.game_comments
  for select using (true);

-- 로그인 유저만 작성 (자신의 user_id로만)
create policy "Authed insert" on public.game_comments
  for insert with check (auth.uid() = user_id);

-- 본인 댓글만 삭제
create policy "Owner delete" on public.game_comments
  for delete using (auth.uid() = user_id);
