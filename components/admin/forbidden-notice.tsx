"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function ForbiddenNotice() {
  const router = useRouter()
  useEffect(() => {
    toast.error("Недостаточно прав для просмотра этого раздела")
    router.replace("/admin")
  }, [router])
  return null
}
