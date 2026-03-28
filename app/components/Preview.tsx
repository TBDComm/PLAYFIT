import Link from 'next/link'
import Image from 'next/image'
import styles from '../page.module.css'

const PREVIEW_POOL = [
    { appid: 1245620, name: 'Elden Ring',           tags: ['Souls-like', 'Open World', 'Action RPG', 'Difficult'] },
    { appid: 1145360, name: 'Hades',                tags: ['Roguelike', 'Action', 'Fast-Paced', 'Story Rich'] },
    { appid: 413150,  name: 'Stardew Valley',       tags: ['Farming Sim', 'Relaxing', 'Pixel Art', 'Indie'] },
    { appid: 367520,  name: 'Hollow Knight',        tags: ['Metroidvania', 'Souls-like', 'Atmospheric', 'Indie'] },
    { appid: 292030,  name: 'The Witcher 3',        tags: ['Open World', 'RPG', 'Story Rich', 'Dark Fantasy'] },
    { appid: 105600,  name: 'Terraria',             tags: ['Sandbox', 'Crafting', 'Building', 'Exploration'] },
    { appid: 504230,  name: 'Celeste',              tags: ['Platformer', 'Difficult', 'Pixel Art', 'Story Rich'] },
    { appid: 588650,  name: 'Dead Cells',           tags: ['Roguelike', 'Action', 'Metroidvania', 'Fast-Paced'] },
    { appid: 620,     name: 'Portal 2',             tags: ['Puzzle', 'Co-op', 'Physics', 'First-Person'] },
    { appid: 1086940, name: "Baldur's Gate 3",      tags: ['RPG', 'Turn-Based', 'Co-op', 'Story Rich'] },
    { appid: 1091500, name: 'Cyberpunk 2077',       tags: ['Open World', 'RPG', 'Action', 'Sci-Fi'] },
    { appid: 814380,  name: 'Sekiro',               tags: ['Souls-like', 'Action', 'Difficult', 'Stealth'] },
    { appid: 548430,  name: 'Deep Rock Galactic',   tags: ['Co-op', 'FPS', 'Mining', 'Procedural'] },
    { appid: 1794680, name: 'Vampire Survivors',    tags: ['Roguelike', 'Bullet Hell', 'Pixel Art', 'Survival'] },
    { appid: 646570,  name: 'Slay the Spire',       tags: ['Card Game', 'Roguelike', 'Strategy', 'Turn-Based'] },
]

export default function Preview() {
    return (
        <section className={styles.previewSection}>
            <div className={styles.inner}>
                <p className={styles.previewLabel}>미리보기</p>
                <p className={styles.previewTitle}>Steam 인기 게임</p>
            </div>
            <div className={styles.inner}>
                <div className={styles.previewGrid}>
                    {PREVIEW_POOL.map((tile, idx) => (
                        <Link
                            href={`/games/${tile.appid}`}
                            key={tile.appid}
                            className={styles.previewTile}
                            style={{ animationDelay: `${idx * 28}ms` }}
                        >
                            <Image
                                unoptimized
                                src={`https://cdn.akamai.steamstatic.com/steam/apps/${tile.appid}/library_600x900.jpg`}
                                width={600}
                                height={900}
                                alt={tile.name}
                                className={styles.previewTileImg}
                            />
                            <div className={styles.previewTileOverlay}>
                                <span className={styles.previewTileName}>{tile.name}</span>
                                <div className={styles.previewTileChips}>
                                    {tile.tags.map(t => (
                                        <span key={t} className={styles.previewTileChip}>{t}</span>
                                    ))}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
            <div className={styles.inner}>
                <a href="#recommend-form" className={styles.previewCta}>내 추천 받기 ↑</a>
            </div>
        </section>
    )
}
