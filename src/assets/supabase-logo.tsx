import { type SVGProps } from 'react'

export function SupabaseLogo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox='0 0 64 64'
      role='img'
      aria-label='Supabase logo'
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id='supabaseGradient' x1='0%' y1='0%' x2='0%' y2='100%'>
          <stop offset='0%' stopColor='#3ecf8e' />
          <stop offset='100%' stopColor='#1b8a5a' />
        </linearGradient>
      </defs>
      <path
        d='M29.9 5.2a3.5 3.5 0 014.7 1L58.3 37c1.8 2.7-.2 6.3-3.4 6.3H36.6v15.4a3.5 3.5 0 01-6 2.4L5.6 29.9c-2.4-2.2-.9-6.2 2.4-6.4l21.9-.9z'
        fill='url(#supabaseGradient)'
      />
      <path
        d='M33 11.8v14.1h16.7L25.2 56.2V41.1H8.5z'
        fill='#0f172a'
        opacity={0.35}
      />
    </svg>
  )
}
