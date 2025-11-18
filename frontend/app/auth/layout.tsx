import { ReactNode } from "react"

export const runtime = 'edge';
export const dynamic = "force-dynamic"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return children
}
