export const runtime = 'nodejs'

export function GET() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const content = [
    '# CanaryGate',
    '',
    '> CanaryGate is a developer platform for feature flags: create flags in the dashboard, roll them out gradually, and update them in real time with no redeploys. Official SDKs cover JavaScript, Go, Python, C#, and Java.',
    '',
    `- [CanaryGate](${base}/)`,
    `- [Quickstart](${base}/docs/getting-started/quickstart)`,
    `- [Documentation](${base}/docs)`,
    `- [Pricing](${base}/#pricing)`,
    `- [Terms of Use](${base}/terms)`,
    `- [Privacy Policy](${base}/privacy)`,
    `- [JavaScript SDK](${base}/docs/sdk/javascript)`,
    `- [Go SDK](${base}/docs/sdk/go)`,
    `- [Python SDK](${base}/docs/sdk/python)`,
    `- [C# SDK](${base}/docs/sdk/csharp)`,
    `- [Java SDK](${base}/docs/sdk/java)`
  ].join('\n')

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  })
}
