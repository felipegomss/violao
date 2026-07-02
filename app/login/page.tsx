import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper p-4">
      <div className="grid w-full max-w-[900px] min-h-[560px] overflow-hidden rounded-xl border border-ink/18 bg-folha shadow-[0_30px_60px_-28px_rgba(38,33,27,.45)] md:grid-cols-2">
        <div className="flex flex-col justify-between bg-teal p-12 text-[#f0e9da] md:p-14">
          <div className="font-cifra text-[10px] uppercase tracking-[.28em] text-[#f0e9da]/55">
            Caderno pessoal · violão
          </div>

          <div>
            <div className="mb-4 font-cifra text-[11px] tracking-[.2em] text-[#f0e9da]/50">
              EST. 2026
            </div>
            <h2 className="font-editorial text-[52px] leading-[.98] font-medium tracking-[-.015em]">
              Caderno
              <br />
              de Violão
            </h2>
            <p className="mt-5 max-w-[300px] font-editorial text-[20px] leading-snug text-[#f0e9da]/70 italic">
              Suas cifras, seu repertório, seu estudo — reunidos num só
              lugar.
            </p>

            <div className="mt-8 grid grid-cols-4 border-t border-b border-[#f0e9da]/20">
              {['Gmaj7', 'Em7', 'Am7', 'D7'].map((chord, i) => (
                <div
                  key={chord}
                  className={`py-2.5 text-center font-cifra text-[13px] text-[#f0e9da]/60 ${
                    i !== 3 ? 'border-r border-[#f0e9da]/16' : ''
                  }`}
                >
                  {chord}
                </div>
              ))}
            </div>
          </div>

          <div className="font-cifra text-[11px] tracking-[.18em] text-[#f0e9da]/45">
            afinação padrão · E A D G B E
          </div>
        </div>

        <div className="flex flex-col justify-center p-12 md:p-16">
          <LoginForm />
        </div>
      </div>
    </main>
  )
}
