'use client'

import Link from 'next/link'
import { Logo } from '@/components/logo'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

type LandingNavProps = {
  transparent?: boolean
}

export function LandingNav({ transparent = false }: LandingNavProps) {
  const [isOpen, setIsOpen] = useState(false)

  const navLinks = [
    { href: '/docs', label: 'Docs' },
    { href: '/docs/getting-started/quickstart', label: 'Pricing' },
    { href: '/login', label: 'Log in' },
  ]

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        transparent
          ? ''
          : 'border-cg-bg-100 bg-background/80 border-b backdrop-blur-md'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Link href="/" className="flex items-center">
          <Logo />
        </Link>

        {/* Mobile menu button */}
        <button
          className="text-cg-neutral-100 md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-cg-neutral-300 hover:text-cg-neutral-100 text-sm transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="bg-cg-indigo-400 hover:bg-cg-indigo-300 inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors"
          >
            Get started free
          </Link>
        </nav>
      </div>

      {/* Mobile nav */}
      {isOpen && (
        <nav className="border-cg-bg-100 bg-background/95 border-b px-4 py-6 md:hidden">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-cg-neutral-300 hover:text-cg-neutral-100 text-lg transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="bg-cg-indigo-400 hover:bg-cg-indigo-300 inline-flex items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Get started free
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}
