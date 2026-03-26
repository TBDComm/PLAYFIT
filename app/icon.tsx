// app/icon.tsx
// Next.js App Router — generates /favicon.ico + /icon.png automatically
// Uses guildeline-logo.png pre-resized to 32×32, base64-embedded (no URL fetch needed)

import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

const LOGO_B64 = 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAPoAAAD6AG1e1JrAAAEQElEQVR4nO1Wa2wUVRTeUlTA9w9FDD9MgA0FsRgwpIbQ0LS189juLmRLbRWMFYjYpokaTEzo9IH6QyE2EMJWu4UYDBklatOtgXb3zuzu3G1l46skxq0tO7Od2c6jGIwxMVGvuTOzODEq29b+IOmX3Jx7Zu459zvnnntmXK5FLOJWAUKuIga5lmD5XyO/ZkEIuBZg7U3BIGYJlpHJutKoSIaBRIe5KWoASyDS4SiWEhEGEn5HDQKJ7B/V9rhNW8aynReQHQ00qEhcJQaASD4HJLIlmnnqpeEM0QwkohlkyBYuS7UOTdbsE1QiOmp4P7Nt50eARYFiLGOq99mERmWGJl6710nqn4gOTzStTBqkLEzv8pk+WMvHnCO/+PUrdwoGNR7PeZv6QPmyz8WdG4F66C6EUBGEgeXvnCtb/+6HnpV4o/QfNXdgG0H3vgo16koqmLrNcjaHmmDt6BM5T1dyhr6M53zWX/HFdQJFMp7TFklU3NlbCo+cLlG72cADtmkRAGAp1MkxqHoPO30VDIaxzi4i7l2T0El1RA9U5N9xck0o9ROJuPGGnVjvCm7Z3hFah9p7HjuB9WBqixk1L/u8yRlKTmUOrHJmtCAgu3ig4TkPdc95PAeofKkp042reaXqOi+TlwcHu82Ut/dsOtERcqM3zz5ZZq4B1lpo0GGoe3pnlQVkXzsh568YuUZNJ8S9a/IR5J1wU/Shsd8plMj5W7B+kiUfagu6NaanBOLayEfLSYFNyRlKj2Xrtzl9FwROIVIxhW77O3ur46Gi4UwlzynVv0TSFsE3Qk80HD3rRh3vPd5s2rAbbscylvO8HZMJ3uG6sKPgFOKbmEwddqY0TwDLiFjNcVNVv4LxprVY7wpt3dN1xo3ag5tbTQJXLAJ8ljgak8nRv1J8EwKsfW+FXICCBqngM89vnM8En6UPjv1Go9iU72Wsn7rgf/BIcJ3CBNenAEA3yEL1mbVQpzRBqdsxqyNAdhEKmqdf0OgzziJMiM8/zCvVP/IK8SUAfcvwM6bn0eNdfW701vtlO5w3QdCpj5Na7Tmnz1n1/5jSuAHqpD46HTCr24xeqQmlfibQ0MSuSqzjyu8M4dRvDDo350R/FTSoHLi675E5fRdYO92C6jkGdSqO53E5sJ2TK1FUpMzNMNpOlVx6/aRbPX7Bv8rZQ6BOpaDmY6zo59COkV0sn3zVeh80qKtJzV//6Xe1d1/6oXLrSLrxHjPafnpFZ+/m0u4Pylfj8x1MW604ofpehAadhtKx5U5fswZrM49Pew8mZ6jv+1PMin9zmH828G3D/UmDysDpQMO8PkY2bmyUNGgBavRHQNr9NCf6DvCStwmPSKZ2P5C9L4Csb39kcnddXCXDo9dqL/5vPybILshotn5bJEPEohJpDzx36CLBYz0iEiCerSt1FvOt/UuWB65ulnUVFzIWhMAiFuFaIPwJtxZ6mhqxjpAAAAAASUVORK5CYII='

export default function Icon() {
  return new ImageResponse(
    (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={`data:image/png;base64,${LOGO_B64}`} width={32} height={32} alt="" />
    ),
    { ...size }
  )
}
