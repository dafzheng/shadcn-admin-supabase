import { ExternalLink, Key } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

export function MissingSupabaseConfig() {
  const codeBlock =
    'bg-foreground/10 rounded-sm py-0.5 px-1 text-xs text-foreground font-bold'

  return (
    <div className='bg-background flex min-h-svh flex-col items-center justify-center p-6'>
      <div className='w-full max-w-2xl space-y-6 text-left sm:text-center'>
        <Alert>
          <Key className='size-4' />
          <AlertTitle>Missing Supabase configuration</AlertTitle>
          <AlertDescription>
            <p className='text-balance'>
              Provide your Supabase project credentials inside the{' '}
              <code className={codeBlock}>.env</code> file before using the
              authentication flow.
            </p>
          </AlertDescription>
        </Alert>

        <div className='space-y-4'>
          <h1 className='text-2xl font-semibold'>Configure Supabase</h1>
          <ol className='text-foreground/75 list-inside list-decimal space-y-1.5'>
            <li>
              Visit the{' '}
              <a
                href='https://supabase.com/dashboard/projects'
                target='_blank'
                rel='noreferrer'
                className='underline decoration-dashed underline-offset-4 hover:decoration-solid'
              >
                Supabase dashboard
                <sup>
                  <ExternalLink className='inline-block size-4' />
                </sup>
              </a>{' '}
              and create a project if you have not already.
            </li>
            <li>
              In your project settings, copy the project URL and anon public key.
            </li>
            <li>
              Rename <code className={codeBlock}>.env.example</code> to{' '}
              <code className={codeBlock}>.env</code>.
            </li>
            <li>
              Paste your credentials into the corresponding variables.
            </li>
          </ol>
        </div>

        <div className='@container space-y-2 rounded-md bg-slate-800 px-3 py-3 text-sm text-slate-200'>
          <span className='ps-1'>.env</span>
          <pre className='overflow-auto overscroll-x-contain rounded bg-slate-950 px-2 py-1 text-left text-xs sm:text-center'>
            <code>
              <span className='before:text-slate-400 md:before:pe-2 md:before:content-["1."]'>
                VITE_SUPABASE_URL=https://your-project.supabase.co
              </span>
              {'\n'}
              <span className='before:text-slate-400 md:before:pe-2 md:before:content-["2."]'>
                VITE_SUPABASE_ANON_KEY=your-public-anon-key
              </span>
            </code>
          </pre>
        </div>

        <Separator className='my-4' />
        <p className='text-sm text-muted-foreground'>
          Once the environment variables are set, restart the dev server so the
          dashboard can initialise Supabase authentication.
        </p>
        <p className='text-sm text-muted-foreground'>
          Tip: point password reset and email confirmation redirects to{' '}
          <code className={codeBlock}>/reset-password</code> inside the Supabase
          dashboard so the built-in handler can process those flows.
        </p>
      </div>
    </div>
  )
}
