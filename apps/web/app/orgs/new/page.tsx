import { getSession } from '@/shared/auth'
import { CreateOrgForm } from '@/components/org/create-org-form'

export default async function Page() {
  const session = await getSession()

  return <CreateOrgForm user={session?.user ?? null} />
}
