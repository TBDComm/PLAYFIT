import Link from 'next/link'
import type { ArticleMeta } from '@/lib/articles'

export const meta: ArticleMeta = {
  slug: 'guildeline-guide',
  title: '태그로 내 취향 게임 찾기 — Guildeline 활용법',
  description: 'Guildeline으로 내 스팀 취향을 분석하고 다음 게임을 찾는 방법을 알려드립니다.',
  date: '2026-03-20',
  tags: ['Guildeline', '취향분석', '가이드'],
}

export default function Content() {
  return (
    <>
      <p>
        스팀에는 82,000개가 넘는 게임이 있습니다. &ldquo;다음에 뭐 하지?&rdquo;를 결정하는 게 생각보다 어렵습니다. 친구 추천은 취향이 다르고, 인기 순위는 이미 해봤거나 내 장르가 아닙니다. Guildeline은 내 실제 플레이 기록을 분석해서 다음 게임을 추천합니다. 어떻게 작동하는지, 어떻게 쓰는지 정리했습니다.
      </p>

      <h2>어떻게 작동하나요</h2>
      <p>
        Steam 계정을 연동하면 Guildeline이 플레이 기록을 가져옵니다. 많이 플레이한 게임의 태그에 더 높은 가중치가 붙습니다. 예를 들어 Hades를 100시간 플레이했다면 &ldquo;로그라이크&rdquo;, &ldquo;액션&rdquo; 태그 선호도가 올라갑니다. 이 가중치를 기반으로 아직 플레이하지 않은 게임 중 가장 잘 맞을 것을 추려냅니다.
      </p>
      <p>
        인기 게임 순위가 아닙니다. 많이 팔린 게임이 아닌, 내 플레이 패턴에서 도출된 추천입니다.
      </p>

      <h2>시작하는 방법</h2>
      <ul>
        <li>
          <strong>Steam 계정 연동:</strong> <Link href="/">Guildeline 홈</Link>에서 Steam ID 또는 프로필 URL을 입력합니다. Steam 라이브러리가 공개 설정이어야 분석이 가능합니다.
        </li>
        <li>
          <strong>Google 계정 로그인 (선택):</strong> 추천 결과를 저장하거나 위시리스트를 관리하려면 Google 계정으로 로그인 후 Steam을 연동합니다.
        </li>
        <li>
          <strong>예산 설정:</strong> 원하는 가격 범위를 설정하면 그 범위 내 게임만 나옵니다.
        </li>
      </ul>

      <h2>Steam 라이브러리 공개 설정 방법</h2>
      <p>
        Guildeline이 플레이 기록을 읽으려면 Steam 라이브러리가 공개로 설정되어 있어야 합니다.
      </p>
      <ul>
        <li>Steam 클라이언트 → 본인 이름 클릭 → &ldquo;프로필 편집&rdquo;</li>
        <li>개인 정보 설정 → &ldquo;게임 세부 정보&rdquo; → &ldquo;공개&rdquo; 선택</li>
        <li>저장 후 Guildeline에서 다시 시도</li>
      </ul>

      <h2>추천 결과 읽는 방법</h2>
      <p>
        각 게임이 추천된 이유가 태그로 표시됩니다. &ldquo;이 게임이 추천된 이유: 로그라이크, 픽셀 아트, 솔로 플레이&rdquo;처럼 내 취향과 맞는 태그가 강조됩니다. 이 태그를 보면서 &ldquo;아, 나는 이런 걸 좋아했구나&rdquo;를 새롭게 발견하는 경우도 있습니다.
      </p>

      <h2>태그 직접 검색하기</h2>
      <p>
        &ldquo;협동&rdquo;, &ldquo;공포&rdquo;, &ldquo;픽셀 아트&rdquo;, &ldquo;턴제&rdquo; 같은 태그를 직접 조합해서 찾아볼 수도 있습니다. 태그를 여러 개 선택할수록 더 좁혀진 결과가 나옵니다.
      </p>

      <h2>결과가 이상하다면</h2>
      <p>
        Steam 라이브러리가 공개 설정인지 먼저 확인하세요. 플레이 시간이 기록된 게임이 적다면 샘플이 부족해서 정확도가 낮을 수 있습니다. 최소 10개 이상의 게임에 플레이 시간이 기록되어 있을 때 결과가 더 정확합니다. 라이브러리에 선물 받은 게임이나 세일 충동구매가 많다면 데이터가 희석될 수 있습니다.
      </p>

      <h2>지금 바로 해보세요</h2>
      <p>
        설치 없이, 가입 없이 Steam ID만 입력하면 됩니다. <Link href="/">Guildeline 홈 →</Link>
      </p>
    </>
  )
}
