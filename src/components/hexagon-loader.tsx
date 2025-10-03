import salesbayLogo from '@/assets/salesbay-logo.png'

interface HexagonLoaderProps {
  message?: string
}

export function HexagonLoader({ message = 'Loading…' }: HexagonLoaderProps) {
  return (
    <div className='flex flex-col items-center gap-6 text-center'>
      <div className='relative h-28 w-28 sm:h-32 sm:w-32'>
        <div className='absolute inset-0 rounded-full bg-primary/10 blur-2xl' />
        <div className='absolute inset-0 animate-ping rounded-full bg-primary/10 [animation-duration:2.2s]' />
        <img
          src={salesbayLogo}
          alt='Loading indicator'
          className='relative h-full w-full select-none drop-shadow-xl'
          style={{ animation: 'hexagon-spin 2.4s linear infinite' }}
        />
      </div>
      <p className='text-muted-foreground text-sm sm:text-base'>{message}</p>
      <style>{`
        @keyframes hexagon-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
