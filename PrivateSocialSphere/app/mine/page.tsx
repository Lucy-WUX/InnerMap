import { redirect } from "next/navigation"

export default function MinePage() {
  redirect("/?tab=mine")
}
