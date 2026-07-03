import 'server-only'
import { Resend } from 'resend'

const FROM = 'Compasso <compasso@lfng.dev>'

function client() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY não configurada')
  return new Resend(key)
}

export async function sendMagicLink(email: string, url: string) {
  await client().emails.send({
    from: FROM,
    to: email,
    subject: 'Seu link de acesso ao Compasso',
    html: `<div style="font-family:system-ui;max-width:420px;margin:0 auto">
      <h2 style="font-weight:600">Compasso</h2>
      <p>Clique pra entrar. O link vale por 15 minutos.</p>
      <p><a href="${url}" style="display:inline-block;background:#1c3c4c;color:#f8f3e8;padding:12px 20px;border-radius:8px;text-decoration:none">Entrar no Compasso</a></p>
      <p style="color:#8a8073;font-size:13px">Se não foi você, ignore este email.</p>
    </div>`,
  })
}
