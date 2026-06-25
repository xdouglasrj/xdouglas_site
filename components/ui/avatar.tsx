interface AvatarProps {
  photoUrl?: string | null
  alt: string
  size?: number
}

export function Avatar({ photoUrl, alt, size = 36 }: AvatarProps) {
  return (
    <div
      style={{ width: size, height: size }}
      className="relative shrink-0 rounded-full overflow-hidden bg-white/10 border border-gate-azure flex items-center justify-center"
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <svg
          width={size * 0.55}
          height={size * 0.55}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-gate-blue"
        >
          <circle cx="12" cy="8" r="4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
        </svg>
      )}
    </div>
  )
}
