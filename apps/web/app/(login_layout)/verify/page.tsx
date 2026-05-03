import { VerifyForm } from '@/components/verify-form'

type Props = {
  searchParams: Promise<{ e?: string }>
}

export default async function Page({ searchParams }: Props) {
  const { e } = await searchParams
  const email = e ? atob(e) : ''
  return <VerifyForm email={email} />
}
