import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

export function normalizeHostname(hostname: string) {
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    return hostname.slice(1, -1)
  }

  return hostname
}

export function isPrivateIpv4Address(hostname: string) {
  const octets = hostname.split('.').map(Number)
  if (octets.length !== 4 || octets.some((octet) => Number.isNaN(octet))) {
    return false
  }

  const [firstOctet, secondOctet] = octets

  return (
    firstOctet === 0 ||
    firstOctet === 10 ||
    firstOctet === 127 ||
    (firstOctet === 169 && secondOctet === 254) ||
    (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) ||
    (firstOctet === 192 && secondOctet === 168)
  )
}

export function isBlockedWebhookHostname(hostname: string) {
  const normalizedHostname = normalizeHostname(hostname).toLowerCase()

  if (
    normalizedHostname === 'localhost' ||
    normalizedHostname.endsWith('.localhost') ||
    normalizedHostname === 'host.docker.internal'
  ) {
    return true
  }

  const ipVersion = isIP(normalizedHostname)
  if (ipVersion === 4) {
    return isPrivateIpv4Address(normalizedHostname)
  }

  if (ipVersion === 6) {
    return (
      normalizedHostname === '::1' ||
      normalizedHostname.startsWith('fe80:') ||
      normalizedHostname.startsWith('fc') ||
      normalizedHostname.startsWith('fd')
    )
  }

  return false
}

function firstHextetValue(ip: string) {
  const first = ip.split(':')[0]
  if (!/^[0-9a-f]{1,4}$/.test(first)) {
    return null
  }

  return parseInt(first, 16)
}

function ipv4FromMappedSuffix(suffix: string) {
  if (suffix.includes('.')) {
    const octets = suffix.split('.').map(Number)
    if (octets.length < 1 || octets.length > 4) {
      return null
    }

    const padded = [0, 0, 0, 0]
    for (let i = 0; i < octets.length; i++) {
      padded[4 - octets.length + i] = octets[i]
    }

    if (padded.some((octet) => octet < 0 || octet > 255)) {
      return null
    }

    return padded.join('.')
  }

  const hex = suffix
    .split(':')
    .map((group) => group.padStart(4, '0'))
    .join('')
  if (!/^[0-9a-f]{8}$/.test(hex)) {
    return null
  }

  const int = parseInt(hex, 16)
  return [
    (int >>> 24) & 0xff,
    (int >>> 16) & 0xff,
    (int >>> 8) & 0xff,
    int & 0xff
  ].join('.')
}

export function isPrivateIpAddress(ip: string) {
  const normalized = normalizeHostname(ip).toLowerCase()
  const version = isIP(normalized)

  if (version === 4) {
    return isPrivateIpv4Address(normalized)
  }

  if (version === 6) {
    if (normalized === '::' || normalized === '::1') {
      return true
    }

    const firstValue = firstHextetValue(normalized)
    if (firstValue !== null) {
      if (firstValue >= 0xfe80 && firstValue <= 0xfebf) {
        return true
      }

      if (firstValue >= 0xfc00 && firstValue <= 0xfdff) {
        return true
      }

      if (firstValue >= 0xff00) {
        return true
      }
    }

    if (normalized.startsWith('::ffff:')) {
      const ipv4 = ipv4FromMappedSuffix(normalized.slice(7))
      return ipv4 !== null && isPrivateIpv4Address(ipv4)
    }

    const dottedMatch = normalized.match(/(\d{1,3}(?:\.\d{1,3}){1,3})$/)
    if (dottedMatch) {
      const ipv4 = ipv4FromMappedSuffix(dottedMatch[1])
      return ipv4 !== null && isPrivateIpv4Address(ipv4)
    }
  }

  return false
}

export async function assertPublicWebhookTarget(
  url: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return { ok: false, reason: 'Webhook URL is not a valid URL' }
  }

  if (parsedUrl.protocol !== 'https:') {
    return { ok: false, reason: 'Webhook URL must use HTTPS' }
  }

  const hostname = normalizeHostname(parsedUrl.hostname).toLowerCase()

  if (isBlockedWebhookHostname(hostname)) {
    return {
      ok: false,
      reason: 'Webhook URL cannot target localhost or private network addresses'
    }
  }

  let addresses: { address: string }[]
  try {
    addresses = await lookup(hostname, { all: true })
  } catch {
    return { ok: false, reason: 'Webhook URL hostname could not be resolved' }
  }

  if (addresses.length === 0) {
    return { ok: false, reason: 'Webhook URL hostname could not be resolved' }
  }

  if (addresses.some(({ address }) => isPrivateIpAddress(address))) {
    return {
      ok: false,
      reason: 'Webhook URL resolves to a private or non-public IP address'
    }
  }

  return { ok: true }
}