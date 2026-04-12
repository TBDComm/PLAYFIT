// /squad 페이지 로딩 시 간단한 스켈레톤
import resultLoadStyles from '@/app/result/[id]/loading.module.css'

export default function SquadLoading() {
  return (
    <main
      className={resultLoadStyles.main}
      aria-busy="true"
      aria-label="스쿼드 페이지 불러오는 중"
    >
      <section className={resultLoadStyles.summarySection} aria-hidden="true">
        <div className={`${resultLoadStyles.titleBone} ${resultLoadStyles.bone}`} />
        <div className={`${resultLoadStyles.subtitleBone} ${resultLoadStyles.bone}`} />
      </section>
    </main>
  )
}
