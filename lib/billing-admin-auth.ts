import { NextRequest } from "next/server"

export function isBillingAdminRequest(req: NextRequest) {
  const adminKey = process.env.BILLING_ADMIN_KEY
  const provided = req.headers.get("x-billing-admin-key") ?? ""
  if (!adminKey || provided !== adminKey) return false
  return true
}
