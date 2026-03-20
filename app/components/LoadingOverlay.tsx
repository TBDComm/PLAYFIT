import styles from './LoadingOverlay.module.css'

interface Props {
  message: string
}

export default function LoadingOverlay({ message }: Props) {
  return (
    <div className={styles.overlay} role="status" aria-live="polite" aria-label={message}>
      <div className={styles.content}>
        <div className={styles.logo} aria-hidden="true">G</div>
        <div className={styles.dots} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p className={styles.message}>{message}</p>
      </div>
    </div>
  )
}
