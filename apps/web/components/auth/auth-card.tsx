type Props = {
  children: React.ReactNode
}

export function AuthCard({ children }: Props) {
  return (
    <div className="bg-cg-bg-100 w-full max-w-85 rounded-[18px] p-6 md:p-8">
      {children}
    </div>
  )
}
