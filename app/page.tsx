import App from "../src/App"
import type { TabKey } from "../src/components/app/types"

function parseTab(tab: string | string[] | undefined): TabKey {
  const v = Array.isArray(tab) ? tab[0] : tab
  if (v === "home") return "home"
  if (v === "relations") return "relations"
  if (v === "mine") return "mine"
  return "relations"
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>
}) {
  const sp = await searchParams
  return <App initialTab={parseTab(sp.tab)} />
}
