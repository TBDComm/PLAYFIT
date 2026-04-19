-- SQ-ENH-2/3: squad_sessions에 member_picks, analysis_reason 컬럼 추가
-- member_picks: Record<steamId, SquadRecommendationCard[]> — 멤버별 개인 추천 2개
-- analysis_reason: 1~2문장 그룹 분석 요약 (Claude 생성)

alter table public.squad_sessions
  add column if not exists member_picks    jsonb,
  add column if not exists analysis_reason text;
