import { useEffect, useEffectEvent } from 'react'

type UseKeyboardShortcutOptions = {
  key: string
  handler: () => void
  enabled?: boolean
  metaOrCtrl?: boolean
  altKey?: boolean
  shiftKey?: boolean
  preventDefault?: boolean
  ignoreWhenTyping?: boolean
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
    target.isContentEditable
}

function normalizeKey(value: string) {
  return value.length === 1 ? value.toLowerCase() : value
}

export function useKeyboardShortcut({
  key,
  handler,
  enabled = true,
  metaOrCtrl = false,
  altKey = false,
  shiftKey = false,
  preventDefault = false,
  ignoreWhenTyping = false
}: UseKeyboardShortcutOptions) {
  const onMatch = useEffectEvent(handler)

  useEffect(() => {
    if (!enabled) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (normalizeKey(event.key) !== normalizeKey(key)) {
        return
      }

      if (metaOrCtrl && !(event.metaKey || event.ctrlKey)) {
        return
      }

      if (altKey && !event.altKey) {
        return
      }

      if (shiftKey && !event.shiftKey) {
        return
      }

      if (ignoreWhenTyping && isTypingTarget(event.target)) {
        return
      }

      if (preventDefault) {
        event.preventDefault()
      }

      onMatch()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [altKey, enabled, ignoreWhenTyping, key, metaOrCtrl, preventDefault, shiftKey])
}