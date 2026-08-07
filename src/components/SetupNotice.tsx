import { PeacockFeather, AuroraBlobs } from '@/components/Decor'

/**
 * Shown instead of the site when the Supabase env vars are missing, so a
 * fresh clone explains itself rather than failing with a blank screen.
 */
export function SetupNotice() {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-paper px-4 py-16">
      <AuroraBlobs />
      <div className="relative w-full max-w-2xl rounded-4xl border border-night-950/10 bg-white p-8 stack-shadow sm:p-12">
        <div className="flex items-center gap-3">
          <PeacockFeather className="h-14 w-auto" />
          <div>
            <h1 className="font-display text-3xl font-black text-night-950">Utkarsh</h1>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-marigold-600">
              Heritage Festival
            </p>
          </div>
        </div>

        <h2 className="mt-8 text-2xl font-black text-night-950">Almost there — one setup step</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-night-950/70">
          The site is running, but it has not been told where its database lives yet. Create a
          Supabase project, then add its URL and anon key to a{' '}
          <code className="rounded bg-night-950/6 px-1.5 py-0.5 font-mono text-[13px]">.env</code>{' '}
          file in the project root:
        </p>

        <pre className="mt-5 overflow-x-auto rounded-2xl bg-night-950 p-5 font-mono text-[13px] leading-relaxed text-cream-100">
          <code>{`VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...`}</code>
        </pre>

        <ol className="mt-6 space-y-3 text-[15px] text-night-950/75">
          {[
            <>
              Create a project at{' '}
              <a
                className="font-semibold text-peacock-700 underline decoration-peacock-300 underline-offset-2"
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer noopener"
              >
                supabase.com/dashboard
              </a>
            </>,
            <>
              In the SQL editor, run{' '}
              <code className="rounded bg-night-950/6 px-1.5 py-0.5 font-mono text-[13px]">
                supabase/schema.sql
              </code>{' '}
              then{' '}
              <code className="rounded bg-night-950/6 px-1.5 py-0.5 font-mono text-[13px]">
                supabase/seed.sql
              </code>
            </>,
            <>
              Copy the URL and anon key from <strong>Project Settings → API</strong> into{' '}
              <code className="rounded bg-night-950/6 px-1.5 py-0.5 font-mono text-[13px]">.env</code>
            </>,
            <>Restart the dev server</>,
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-marigold-500 text-xs font-black text-white">
                {i + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>

        <p className="mt-7 rounded-2xl border border-peacock-200 bg-peacock-50 p-4 text-sm leading-relaxed text-peacock-900">
          Full instructions, including how to create the first admin account, are in the
          project's <strong>README.md</strong>.
        </p>
      </div>
    </div>
  )
}
