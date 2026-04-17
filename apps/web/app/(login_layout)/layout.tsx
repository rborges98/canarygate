import { BorderBeam } from '@/components/ui/border-beam'
import Header from '@/components/header'

export default function AuthLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-cg-bg-400 relative flex min-h-screen flex-col overflow-hidden md:flex-row">
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,var(--color-cg-indigo-900)_0%,transparent_70%)]" />
      <div className="pointer-events-none absolute right-1/3 top-1/3 h-96 w-96 rounded-full bg-[radial-gradient(circle,var(--color-cg-indigo-950)_0%,transparent_70%)]" />

      <div className="w-105 relative z-10 hidden shrink-0 flex-col justify-between px-14 py-14 md:flex">
        <Header />

        <div>
          <p className="mb-3 text-[30px] font-extrabold leading-tight tracking-tight text-white">
            Deploy on Friday.
            <br />
            <span className="text-cg-indigo-300">Sleep on Saturday.</span>
          </p>
          <span className="text-cg-neutral-300 font-mono text-[12px]">
            no more rollbacks
          </span>
        </div>

        <p className="text-cg-neutral-300 font-mono text-[10px]">
          canarygate.com · open source
        </p>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-10 md:px-12 md:py-14">
        <div className="mb-8 self-start text-[17px] font-bold text-white md:hidden">
          <Header />
        </div>

        <div className="max-w-85 w-full">
          <div className="relative rounded-[18px] border p-6 md:p-8">
            <BorderBeam
              borderWidth={2}
              colorFrom="var(--color-cg-indigo-400)"
              colorTo="var(--color-cg-indigo-100)"
              size={200}
            />
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
