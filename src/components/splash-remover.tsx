'use client'

import { useEffect } from 'react'

export function SplashRemover() {
  useEffect(() => {
    const splash = document.getElementById('splash')
    if (!splash) return
    splash.style.transition = 'opacity 0.3s'
    splash.style.opacity = '0'
    setTimeout(() => splash.remove(), 300)
  }, [])
  return null
}
