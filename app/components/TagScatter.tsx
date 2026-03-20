'use client'

import styles from './TagScatter.module.css'

const TAGS = [
  { text: 'Souls-like',   top: '8%',  left: '5%',  size: '0.9rem',  opacity: 0.07, dur: '11s' },
  { text: 'Open World',   top: '15%', left: '72%', size: '1.2rem',  opacity: 0.05, dur: '14s' },
  { text: 'Co-op',        top: '22%', left: '38%', size: '0.8rem',  opacity: 0.09, dur: '9s'  },
  { text: 'Indie',        top: '30%', left: '88%', size: '1.1rem',  opacity: 0.06, dur: '13s' },
  { text: 'RPG',          top: '40%', left: '12%', size: '1.4rem',  opacity: 0.04, dur: '15s' },
  { text: 'Strategy',     top: '50%', left: '60%', size: '0.85rem', opacity: 0.08, dur: '10s' },
  { text: 'Roguelike',    top: '60%', left: '25%', size: '1.0rem',  opacity: 0.07, dur: '12s' },
  { text: 'FPS',          top: '70%', left: '80%', size: '1.3rem',  opacity: 0.05, dur: '8s'  },
  { text: 'Sandbox',      top: '78%', left: '45%', size: '0.9rem',  opacity: 0.06, dur: '11s' },
  { text: 'Puzzle',       top: '85%', left: '8%',  size: '1.1rem',  opacity: 0.08, dur: '13s' },
  { text: 'Horror',       top: '12%', left: '52%', size: '0.8rem',  opacity: 0.10, dur: '9s'  },
  { text: 'Simulation',   top: '35%', left: '68%', size: '0.75rem', opacity: 0.09, dur: '14s' },
  { text: 'Platformer',   top: '55%', left: '4%',  size: '1.0rem',  opacity: 0.06, dur: '10s' },
  { text: 'Card Game',    top: '65%', left: '92%', size: '0.85rem', opacity: 0.07, dur: '12s' },
  { text: 'Metroidvania', top: '90%', left: '60%', size: '0.9rem',  opacity: 0.05, dur: '15s' },
  { text: 'Visual Novel', top: '45%', left: '82%', size: '0.8rem',  opacity: 0.08, dur: '11s' },
  { text: 'MMORPG',       top: '20%', left: '18%', size: '1.1rem',  opacity: 0.06, dur: '13s' },
  { text: 'Sports',       top: '75%', left: '35%', size: '0.9rem',  opacity: 0.07, dur: '8s'  },
  { text: 'Racing',       top: '5%',  left: '85%', size: '1.0rem',  opacity: 0.06, dur: '10s' },
  { text: 'Stealth',      top: '95%', left: '20%', size: '0.85rem', opacity: 0.08, dur: '14s' },
]

export default function TagScatter() {
  return (
    <div className={styles.scatter} aria-hidden="true">
      {TAGS.map((tag, i) => (
        <span
          key={tag.text}
          className={styles.tag}
          style={{
            top: tag.top,
            left: tag.left,
            fontSize: tag.size,
            color: `rgba(200, 241, 53, ${tag.opacity})`,
            animationDuration: tag.dur,
            animationDelay: `-${(i * 0.7).toFixed(1)}s`,
          }}
        >
          {tag.text}
        </span>
      ))}
    </div>
  )
}
