/**
 * Mobile Fullscreen Enhancement
 * Auto-hide address bar on mobile devices
 */

if (typeof window !== 'undefined') {
  // Detect if running on mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )

  if (isMobile) {
    // Force scroll to hide address bar on page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.scrollTo(0, 1)
      }, 100)
    })

    // Re-trigger on orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        window.scrollTo(0, 1)
      }, 100)
    })

    // Prevent zoom on double tap (iOS)
    let lastTouchEnd = 0
    document.addEventListener('touchend', (event) => {
      const now = Date.now()
      if (now - lastTouchEnd <= 300) {
        event.preventDefault()
      }
      lastTouchEnd = now
    }, false)

    // Set theme color meta tag dynamically
    const setThemeColor = (color: string) => {
      let metaThemeColor = document.querySelector('meta[name="theme-color"]')
      if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta')
        metaThemeColor.setAttribute('name', 'theme-color')
        document.head.appendChild(metaThemeColor)
      }
      metaThemeColor.setAttribute('content', color)
    }

    // Set orange theme color for mobile
    setThemeColor('#FB923C')

    // Update theme color based on scroll position (optional)
    let ticking = false
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY
          if (scrollY > 100) {
            setThemeColor('#EA7C2C') // Darker orange when scrolled
          } else {
            setThemeColor('#FB923C') // Default orange
          }
          ticking = false
        })
        ticking = true
      }
    })
  }
}

export {}
