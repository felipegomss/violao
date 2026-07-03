import 'server-only'
import { Resend } from 'resend'

const FROM = 'Compasso <compasso@lfng.dev>'

function client() {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('RESEND_API_KEY não configurada')
  return new Resend(key)
}

// Paleta editorial "Caderno" do Compasso: papel/folha, tinta, teal, ferrugem.
function magicLinkHtml(url: string): string {
  const serif = "Georgia, 'Times New Roman', serif"
  const mono = "'SF Mono', Menlo, Consolas, monospace"
  return `<!doctype html>
<html lang="pt-BR"><body style="margin:0;padding:32px 16px;background:#e9e0cc;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;border-collapse:collapse;background:#f8f3e8;border:1px solid rgba(38,33,27,.14);border-radius:16px;overflow:hidden;">
        <tr><td style="padding:38px 42px;">

          <div style="line-height:1;">
            <svg width="24" height="18" viewBox="8 11 24 18" style="vertical-align:-2px;margin-right:9px;">
              <ellipse cx="20" cy="20" rx="12" ry="8.4" fill="#1c3c4c"></ellipse>
              <ellipse cx="20" cy="20" rx="7.9" ry="3.1" transform="rotate(-28 20 20)" fill="#f8f3e8"></ellipse>
            </svg><span style="font-family:${serif};font-size:25px;font-weight:600;letter-spacing:-.005em;color:#26211b;">Compasso</span>
          </div>

          <h1 style="margin:16px 0 0;font-family:${serif};font-size:29px;font-weight:600;line-height:1.12;color:#26211b;">Seu link de acesso</h1>
          <p style="margin:14px 0 0;font-family:${serif};font-size:17px;font-style:italic;line-height:1.5;color:#5f574a;">Clique pra entrar no seu caderno. O link vale por 15 minutos e só funciona uma vez.</p>

          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:30px 0 0;border-collapse:collapse;">
            <tr><td style="border-radius:10px;background:#1c3c4c;">
              <a href="${url}" style="display:inline-block;padding:15px 30px;font-family:${mono};font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#f8f3e8;text-decoration:none;">Entrar no Compasso</a>
            </td></tr>
          </table>

          <p style="margin:22px 0 0;font-family:${serif};font-size:13px;line-height:1.5;color:#8a8073;">ou cole no navegador:<br>
            <a href="${url}" style="color:#1c3c4c;word-break:break-all;">${url}</a></p>

          <div style="margin:30px 0 0;padding-top:18px;border-top:1px solid rgba(38,33,27,.12);font-family:${mono};font-size:12px;letter-spacing:.1em;color:#1c3c4c;opacity:.5;">D#m7(5-)&nbsp;&middot;&nbsp;E/D&nbsp;&middot;&nbsp;C#m7&nbsp;&middot;&nbsp;Cº&nbsp;&middot;&nbsp;Ebº</div>
          <p style="margin:18px 0 0;font-family:${serif};font-size:12px;color:#a89e8d;">Se não foi você que pediu, pode ignorar este email — nada acontece.</p>

        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

export async function sendMagicLink(email: string, url: string) {
  await client().emails.send({
    from: FROM,
    to: email,
    subject: 'Seu link de acesso ao Compasso',
    html: magicLinkHtml(url),
  })
}
