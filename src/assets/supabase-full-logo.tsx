import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { SupabaseLogo } from './supabase-logo'

export function SupabaseLogoFull({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col items-center gap-4 text-white', className)}
      {...props}
    >
      <SupabaseLogo className='w-28' />
      <div className='flex flex-col items-center text-center tracking-wide'>
        <span className='text-3xl font-semibold uppercase'>Supabase</span>
        <span className='text-sm text-white/70'>Authorized Access</span>
      </div>
    </div>
  )
}
