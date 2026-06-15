import React from 'react'

export default function ValidationMessage({ error }) {
  if (!error) return null
  return (
    <p className="text-rose-500 dark:text-rose-400 text-xs font-semibold mt-1 flex items-center gap-1.5 animate-fade-in-up">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400 animate-pulse" />
      {error.message || 'Invalid input'}
    </p>
  )
}
