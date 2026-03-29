'use client'

import { useState } from 'react'
import Image from 'next/image'

interface Props {
  appid: number
  name: string
  priority: boolean
}

// 세로 이미지(library_600x900) 우선 시도, 없으면 가로 헤더 이미지로 폴백
export default function ThumbnailImage({ appid, name, priority }: Props) {
  const [src, setSrc] = useState(
    `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/library_600x900.jpg`
  )

  return (
    <Image
      src={src}
      alt={`${name} 게임 표지`}
      width={600}
      height={900}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      priority={priority}
      unoptimized
      onError={() =>
        setSrc(`https://cdn.akamai.steamstatic.com/steam/apps/${appid}/header.jpg`)
      }
    />
  )
}
