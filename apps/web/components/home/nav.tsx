'use client'

import Link from 'next/link'
import { Logo } from '@/components/branding/logo'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

type LandingNavProps = {
  transparent?: boolean
}

export function LandingNav({ transparent = false }: LandingNavProps) {
  const [isOpen, setIsOpen] = useState(false)

  const navLinks = [{ href: '/docs', label: 'Docs' }]

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        transparent
          ? ''
          : 'border-cg-bg-100 bg-background/80 border-b backdrop-blur-md'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Link
          href="/"
          className="focus-visible:ring-cg-indigo-300 flex items-center rounded-lg focus-visible:ring-2"
        >
          <Logo />
        </Link>

        {/* Mobile menu button */}
        <button
          className="text-cg-neutral-100 focus-visible:ring-cg-indigo-300 md:hidden focus-visible:ring-2"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop nav */}
        <nav aria-label="Main navigation" className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-cg-neutral-300 hover:text-cg-neutral-100 focus-visible:ring-cg-indigo-300 text-sm transition-colors focus-visible:ring-2"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="bg-cg-indigo-400 hover:bg-cg-indigo-300 focus-visible:ring-cg-indigo-300 inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors focus-visible:ring-2"
          >
            Get started free
          </Link>
        </nav>
      </div>

      {/* Mobile nav */}
      {isOpen && (
        <nav
          aria-label="Main navigation"
          className="border-cg-bg-100 bg-background/95 border-b px-4 py-6 md:hidden"
        >
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-cg-neutral-300 hover:text-cg-neutral-100 focus-visible:ring-cg-indigo-300 text-lg transition-colors focus-visible:ring-2"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="bg-cg-indigo-400 hover:bg-cg-indigo-300 focus-visible:ring-cg-indigo-300 inline-flex items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors focus-visible:ring-2"
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
