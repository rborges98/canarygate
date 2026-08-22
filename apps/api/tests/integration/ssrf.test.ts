import { describe, it, expect, vi, beforeEach } from 'vitest'

const { lookupMock } = vi.hoisted(() => ({ lookupMock: vi.fn() }))

vi.mock('node:dns/promises', () => ({
  lookup: lookupMock,
}))

import {
  isPrivateIpv4Address,
  isPrivateIpAddress,
  isBlockedWebhookHostname,
  assertPublicWebhookTarget
} from '../../src/utils/ssrf.ts'

describe('ssrf utils', () => {
  beforeEach(() => {
    lookupMock.mockReset()
  })

  describe('isPrivateIpv4Address', () => {
    it('detects private and reserved IPv4 ranges', () => {
      expect(isPrivateIpv4Address('10.0.0.1')).toBe(true)
      expect(isPrivateIpv4Address('172.16.0.1')).toBe(true)
      expect(isPrivateIpv4Address('172.31.255.255')).toBe(true)
      expect(isPrivateIpv4Address('192.168.1.1')).toBe(true)
      expect(isPrivateIpv4Address('127.0.0.1')).toBe(true)
      expect(isPrivateIpv4Address('169.254.169.254')).toBe(true)
      expect(isPrivateIpv4Address('0.0.0.0')).toBe(true)
    })

    it('returns false for public IPv4 addresses and invalid input', () => {
      expect(isPrivateIpv4Address('8.8.8.8')).toBe(false)
      expect(isPrivateIpv4Address('172.32.0.1')).toBe(false)
      expect(isPrivateIpv4Address('not-an-ip')).toBe(false)
      expect(isPrivateIpv4Address('')).toBe(false)
    })
  })

  describe('isPrivateIpAddress', () => {
    it('detects private IPv6 ranges', () => {
      expect(isPrivateIpAddress('::1')).toBe(true)
      expect(isPrivateIpAddress('fe80::1')).toBe(true)
      expect(isPrivateIpAddress('fc00::1')).toBe(true)
      expect(isPrivateIpAddress('fd00::1')).toBe(true)
    })

    it('detects IPv4-mapped IPv6 addresses of private ranges', () => {
      expect(isPrivateIpAddress('::ffff:10.0.0.1')).toBe(true)
      expect(isPrivateIpAddress('::ffff:127.0.0.1')).toBe(true)
      expect(isPrivateIpAddress('::ffff:8.8.8.8')).toBe(false)
    })
  })

  describe('isBlockedWebhookHostname', () => {
    it('blocks localhost variants', () => {
      expect(isBlockedWebhookHostname('localhost')).toBe(true)
      expect(isBlockedWebhookHostname('api.localhost')).toBe(true)
      expect(isBlockedWebhookHostname('host.docker.internal')).toBe(true)
    })

    it('blocks literal private IPs', () => {
      expect(isBlockedWebhookHostname('10.0.0.5')).toBe(true)
      expect(isBlockedWebhookHostname('192.168.1.1')).toBe(true)
    })

    it('allows public hostnames and public IPs', () => {
      expect(isBlockedWebhookHostname('hooks.example.com')).toBe(false)
      expect(isBlockedWebhookHostname('8.8.8.8')).toBe(false)
    })
  })

  describe('assertPublicWebhookTarget', () => {
    it('rejects non-https URLs', async () => {
      const result = await assertPublicWebhookTarget('http://example.com/hook')
      expect(result).toEqual({ ok: false, reason: expect.any(String) })
    })

    it('rejects localhost and private hostnames without DNS lookup', async () => {
      const result = await assertPublicWebhookTarget(
        'https://localhost:3000/hook'
      )
      expect(result.ok).toBe(false)
      expect(lookupMock).not.toHaveBeenCalled()
    })

    it('rejects hostnames that resolve to private IPs', async () => {
      lookupMock.mockResolvedValue([
        { address: '10.0.0.10', family: 4 },
        { address: '8.8.8.8', family: 4 }
      ])
      const result = await assertPublicWebhookTarget(
        'https://example.com/hook'
      )
      expect(result.ok).toBe(false)
    })

    it('rejects hostnames that cannot be resolved', async () => {
      lookupMock.mockRejectedValue(new Error('ENOTFOUND'))
      const result = await assertPublicWebhookTarget(
        'https://example.com/hook'
      )
      expect(result.ok).toBe(false)
    })

    it('accepts public hostnames that resolve to public IPs only', async () => {
      lookupMock.mockResolvedValue([
        { address: '8.8.8.8', family: 4 },
        { address: '1.1.1.1', family: 4 }
      ])
      const result = await assertPublicWebhookTarget(
        'https://hooks.example.com/hook'
      )
      expect(result).toEqual({ ok: true })
    })
  })
})