export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted/30 p-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center justify-center gap-2 text-lg font-semibold tracking-tight">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            K
          </div>
          Kanzen Dock
        </div>
        {children}
      </div>
    </div>
  )
}
