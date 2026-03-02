'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const current = theme === 'system' ? systemTheme : theme
  const isDark = current === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span className="h-4 w-4">
        {isDark ? (
          // Moon icon
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 text-yellow-300"
            aria-hidden="true"
            fill="currentColor"
          >
            <path d="M20.742 13.045A8 8 0 0 1 11 3.258 8 8 0 1 0 20.742 13.045Z" />
          </svg>
        ) : (
          // Sun icon
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 text-yellow-500"
            aria-hidden="true"
            fill="currentColor"
          >
            <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm0 4a1 1 0 0 1-1-1v-1.5a1 1 0 1 1 2 0V21a1 1 0 0 1-1 1Zm0-16a1 1 0 0 1-1-1V3a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1Zm10 7a1 1 0 0 1-1 1h-2a1 1 0 1 1 0-2h2a1 1 0 0 1 1 1ZM5 12a1 1 0 0 1-1 1H2a1 1 0 1 1 0-2h2a1 1 0 0 1 1 1Zm11.657 6.657a1 1 0 0 1-1.414 0L14.4 17.814a1 1 0 0 1 1.414-1.414l1.843 1.843a1 1 0 0 1 0 1.414Zm-9.9-9.9a1 1 0 0 1-1.414 0L3.5 7.914A1 1 0 0 1 4.914 6.5l1.843 1.843a1 1 0 0 1 0 1.414Zm9.9-1.414a1 1 0 0 1 0-1.414L17.914 3.5A1 1 0 0 1 19.328 4.914l-1.843 1.843a1 1 0 0 1-1.414 0ZM7.157 18.657a1 1 0 0 1 0-1.414L9 15.4a1 1 0 0 1 1.414 1.414l-1.843 1.843a1 1 0 0 1-1.414 0Z" />
          </svg>
        )}
      </span>
      <span>{isDark ? 'Dark' : 'Light'}</span>
    </button>
  )
}

