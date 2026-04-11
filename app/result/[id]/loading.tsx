import styles from './loading.module.css'

// 실제 카드 수가 결정되기 전 표시할 skeleton 카드 수
const SKELETON_COUNT = 3

function SkeletonCard() {
  return (
    <li className={styles.card} aria-hidden="true">
      {/* 썸네일 */}
      <div className={`${styles.thumbBone} ${styles.bone}`} />

      {/* 카드 바디 */}
      <div className={styles.cardBody}>
        <div className={`${styles.nameBone} ${styles.bone}`} />
        <div className={styles.dividerBone} />

        <div className={styles.metaRow}>
          <div className={`${styles.priceBone} ${styles.bone}`} />
          <div className={`${styles.scoreBone} ${styles.bone}`} />
        </div>

        <div className={styles.reasonWrap}>
          <div className={`${styles.reasonLine} ${styles.bone}`} />
          <div className={`${styles.reasonLine} ${styles.bone}`} />
          <div className={`${styles.reasonLine} ${styles.bone}`} />
        </div>

        <div className={styles.tagRowCard}>
          <div className={`${styles.tagBoneCard} ${styles.bone}`} />
          <div className={`${styles.tagBoneCard} ${styles.bone}`} />
          <div className={`${styles.tagBoneCard} ${styles.bone}`} />
        </div>

        <div className={`${styles.storeLinkBone} ${styles.bone}`} />
      </div>

      {/* 피드백 버튼 영역 */}
      <div className={styles.feedbackSide} aria-hidden="true">
        <div className={`${styles.fbBone} ${styles.bone}`} />
        <div className={`${styles.fbBone} ${styles.bone}`} />
      </div>
    </li>
  )
}

export default function ResultLoading() {
  return (
    <main className={styles.main} aria-busy="true" aria-label="추천 결과 불러오는 중">
      {/* Header */}
      <header className={styles.header}>
        <div className={`${styles.backLinkBone} ${styles.bone}`} />
        <div className={`${styles.dateBone} ${styles.bone}`} />
      </header>

      {/* Summary */}
      <section className={styles.summarySection} aria-hidden="true">
        <div className={`${styles.titleBone} ${styles.bone}`} />
        <div className={`${styles.subtitleBone} ${styles.bone}`} />
        <div className={styles.tagRow}>
          <div className={`${styles.tagBone} ${styles.bone}`} />
          <div className={`${styles.tagBone} ${styles.bone}`} />
          <div className={`${styles.tagBone} ${styles.bone}`} />
        </div>
      </section>

      {/* Feedback hint */}
      <div className={`${styles.hintBone} ${styles.bone}`} aria-hidden="true" />

      {/* Card list */}
      <ul className={styles.cardList}>
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </ul>
    </main>
  )
}
