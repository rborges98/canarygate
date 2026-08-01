type Props = {
  children: React.ReactNode
  environment: React.ReactNode
}

export default function FlagsListLayout({ environment }: Props) {
  return <>{environment}</>
}
