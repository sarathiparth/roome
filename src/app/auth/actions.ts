"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { validate, loginSchema, signupSchema } from "@/lib/validation"
import { logger } from "@/lib/logger"

export async function login(formData: FormData) {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  const v = validate(loginSchema, raw)
  if (!v.success) return { error: v.error }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.auth.signInWithPassword({
    email: v.data.email,
    password: v.data.password,
  })

  if (error) {
    logger.warn("login_failed", { email: v.data.email, reason: error.message })
    return { error: error.message }
  }

  logger.info("login_success", { email: v.data.email })
  revalidatePath("/", "layout")
  redirect("/explore")
}

export async function signup(formData: FormData) {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    name: formData.get("name") as string,
  }

  const v = validate(signupSchema, raw)
  if (!v.success) return { error: v.error }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { error } = await supabase.auth.signUp({
    email: v.data.email,
    password: v.data.password,
    options: {
      data: { full_name: v.data.name },
    },
  })

  if (error) {
    logger.warn("signup_failed", { email: v.data.email, reason: error.message })
    return { error: error.message }
  }

  logger.info("signup_success", { email: v.data.email })
  revalidatePath("/", "layout")
  redirect("/onboarding")
}

export async function logout() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  await supabase.auth.signOut()
  logger.info("logout")
  revalidatePath("/", "layout")
  redirect("/login")
}
