"use client"

import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CircleAlert, MailCheck } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/use-auth"
import { signUp } from "@/lib/auth"

export default function RegisterPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmEmailSent, setConfirmEmailSent] = useState(false)

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard")
    }
  }, [authLoading, user, router])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const { data, error } = await signUp(email, password, name || undefined)

    if (error) {
      setError(error.message)
      setSubmitting(false)
      return
    }

    // Email confirmation is required for this project, so signUp returns a
    // user but no session — the account isn't usable until it's confirmed.
    if (!data.session) {
      setConfirmEmailSent(true)
      setSubmitting(false)
      return
    }

    router.push("/dashboard")
  }

  if (authLoading || user) {
    return (
      <div className="flex justify-center py-10">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    )
  }

  if (confirmEmailSent) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Empty className="border-0">
            <EmptyMedia variant="icon">
              <MailCheck />
            </EmptyMedia>
            <EmptyTitle>Check your email</EmptyTitle>
            <EmptyDescription>
              We sent a confirmation link to <strong>{email}</strong>. Click
              it to activate your account, then{" "}
              <Link href="/login">log in</Link>.
            </EmptyDescription>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Get started with your own Kanzen Dock workspace.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            {error && (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Field>
              <FieldLabel htmlFor="name">Full name</FieldLabel>
              <Input
                id="name"
                placeholder="Jane Doe"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Field>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting && <Spinner />}
                Create account
              </Button>
            </Field>
            <FieldDescription className="text-center">
              Already have an account? <Link href="/login">Log in</Link>
            </FieldDescription>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
