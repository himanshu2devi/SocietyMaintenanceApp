import { Link } from 'react-router-dom'

export function BrandMark({ className = 'h-10 w-10' }) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="24" cy="24" r="23" fill="#FFF1EB" />
      <path d="M11 35V20.6L24 13l13 7.6V35H11Z" fill="#102A43" />
      <path d="M18 35V24h12v11H18Z" fill="#FF7A45" />
      <path d="M15 23h3v3h-3v-3Zm15 0h3v3h-3v-3Zm-15 6h3v3h-3v-3Zm15 0h3v3h-3v-3Z" fill="#fff" />
      <path d="M28.5 34.5c4.5-.3 7.5-2.6 9-6.8-3.9.5-6.9 2.7-9 6.8Z" fill="#0F9D8A" />
    </svg>
  )
}

export function Brand({ compact = false, light = false }) {
  return (
    <Link to="/" className="group inline-flex min-w-0 max-w-full items-center gap-2 sm:gap-2.5" aria-label="SocietyWale home">
      <BrandMark className="h-8 w-8 shrink-0 transition-transform duration-200 group-hover:scale-105 sm:h-9 sm:w-9" />
      {!compact && (
        <span className={`truncate text-base font-extrabold tracking-tight sm:text-lg ${light ? 'text-white' : 'text-slate-950'}`}>
          Society<span className="text-orange-500">Wale</span>
        </span>
      )}
    </Link>
  )
}
