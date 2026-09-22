import { createClient } from "@supabase/supabase-js"

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function signUp(email: string, password: string, name?: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: name ? { data: { name } } : undefined,
  })
}

export function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export function signOut() {
  return supabase.auth.signOut()
}

export async function getCurrentUser() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.user
}
