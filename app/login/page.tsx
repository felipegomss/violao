import { CompassoWordmark } from '@/components/compasso-wordmark'
import { LoginForm } from './login-form'

const MOINHO = ['D#m7(5-)', 'E/D', 'C#m7', 'Cº', 'Ebº']

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>
}) {
  const { erro } = await searchParams
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper p-4">
      <div className="grid w-full max-w-[900px] min-h-[560px] overflow-hidden rounded-xl border border-ink/18 bg-folha shadow-[0_30px_60px_-28px_rgba(38,33,27,.45)] md:grid-cols-2">
        <div className="flex flex-col justify-between gap-10 bg-teal p-12 text-[#f0e9da] md:p-14">
          {/* marca */}
          <CompassoWordmark size={30} />

          {/* frase */}
          <h2 className="font-editorial text-[44px] font-medium leading-[1.04] tracking-[-.015em]">
            As músicas que você toca, num lugar só.
          </h2>

          {/* assinatura — acordes como referência sutil */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-[#f0e9da]/15 pt-4 font-cifra text-[13px] text-[#f0e9da]/50">
            {MOINHO.map((chord) => (
              <span key={chord}>{chord}</span>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center p-12 md:p-16">
          <LoginForm linkError={erro === 'link'} />
        </div>
      </div>
    </main>
  )
}
