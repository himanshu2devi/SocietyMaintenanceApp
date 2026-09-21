import { Link } from 'react-router-dom'

const LOGO_SRC = '/images/societysimplify-logo.svg'

export function BrandMark({ className = 'h-11 w-auto' }) {
  return (
    <img
      src={LOGO_SRC}
      alt=""
      width={220}
      height={56}
      className={`object-contain object-left ${className}`}
      decoding="async"
    />
  )
}

/**
 * SocietySimplify wordmark. On dark surfaces use light=true for contrast.
 */
export function Brand({ compact = false, light = false }) {
  return (
    <Link
      to="/"
      className={`group inline-flex min-w-0 max-w-full items-center ${light ? 'rounded-md bg-black/40 p-1.5 ring-1 ring-white/10' : ''}`}
      aria-label="SocietySimplify home"
    >
      <img
        src={LOGO_SRC}
        alt="SocietySimplify"
        width={compact ? 180 : 260}
        height={compact ? 44 : 56}
        className={`w-auto object-contain object-left transition-opacity duration-200 group-hover:opacity-90 ${
          compact
            ? 'h-9 max-w-[min(100%,11.5rem)] sm:h-10 sm:max-w-[14rem]'
            : 'h-9 max-w-[min(100%,12.75rem)] sm:h-11 sm:max-w-[15.5rem] md:h-12 md:max-w-[17rem]'
        }`}
        decoding="async"
        fetchPriority="high"
      />
    </Link>
  )
}
