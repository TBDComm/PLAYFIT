export const runtime = 'edge'

// Reserved for D-series: public taste profile page.
// Route exists to prevent future URL conflicts.
import { redirect } from 'next/navigation'

export default function UserProfilePage() {
  redirect('/')
}
