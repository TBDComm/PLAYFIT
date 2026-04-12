import resultLoadStyles from '@/app/result/[id]/loading.module.css'
import styles from './loading.module.css'

const SKELETON_COUNT = 3

function SkeletonCard() {
  return (
    <li className={resultLoadStyles.card} aria-hidden="true">
      <div className={`${resultLoadStyles.thumbBone} ${resultLoadStyles.bone}`} />
      <div className={resultLoadStyles.cardBody}>
        <div className={`${resultLoadStyles.nameBone} ${resultLoadStyles.bone}`} />
        <div className={resultLoadStyles.dividerBone} />
        <div className={resultLoadStyles.metaRow}>
          <div className={`${resultLoadStyles.priceBone} ${resultLoadStyles.bone}`} />
          <div className={`${resultLoadStyles.scoreBone} ${resultLoadStyles.bone}`} />
        </div>
        <div className={resultLoadStyles.reasonWrap}>
          <div className={`${resultLoadStyles.reasonLine} ${resultLoadStyles.bone}`} />
          <div className={`${resultLoadStyles.reasonLine} ${resultLoadStyles.bone}`} />
          <div className={`${resultLoadStyles.reasonLine} ${resultLoadStyles.bone}`} />
        </div>
        <div className={resultLoadStyles.tagRowCard}>
          <div className={`${resultLoadStyles.tagBoneCard} ${resultLoadStyles.bone}`} />
          <div className={`${resultLoadStyles.tagBoneCard} ${resultLoadStyles.bone}`} />
          <div className={`${resultLoadStyles.tagBoneCard} ${resultLoadStyles.bone}`} />
        </div>
        <div className={`${resultLoadStyles.storeLinkBone} ${resultLoadStyles.bone}`} />
      </div>
    </li>
  )
}

export default function SquadTokenLoading() {
  return (
    <main className={resultLoadStyles.main} aria-busy="true" aria-label="스쿼드 결과 불러오는 중">
      <header className={resultLoadStyles.header}>
        <div className={`${resultLoadStyles.backLinkBone} ${resultLoadStyles.bone}`} />
        <div className={`${resultLoadStyles.dateBone} ${resultLoadStyles.bone}`} />
      </header>

      {/* Summary 스켈레톤 */}
      <section className={`${resultLoadStyles.summarySection} ${styles.summaryLoading}`} aria-hidden="true">
        <div className={`${styles.scoreHeroBone} ${resultLoadStyles.bone}`} />
        <div className={`${resultLoadStyles.subtitleBone} ${resultLoadStyles.bone}`} />
        <div className={resultLoadStyles.tagRow}>
          <div className={`${resultLoadStyles.tagBone} ${resultLoadStyles.bone}`} />
          <div className={`${resultLoadStyles.tagBone} ${resultLoadStyles.bone}`} />
          <div className={`${resultLoadStyles.tagBone} ${resultLoadStyles.bone}`} />
        </div>
      </section>

      <ul className={resultLoadStyles.cardList}>
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </ul>
    </main>
  )
}
