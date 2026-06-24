import { Resend } from 'resend'

// ============================================================
// Cliente Resend — mesmo padrão de lib/email/send-invite.ts.
// Sem RESEND_API_KEY, o envio degrada para "false" (sem fallback
// manual aqui, já que o token não deve ser exibido na tela).
// ============================================================

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

interface SendPasswordResetParams {
  to: string
  username: string
  resetUrl: string
}

/** Envia o email com o link de redefinição de senha. Retorna true se enviado. */
export async function sendPasswordResetEmail({
  to,
  username,
  resetUrl,
}: SendPasswordResetParams): Promise<boolean> {
  const resend = getResend()
  if (!resend) return false

  const from = process.env.EMAIL_FROM ?? 'convite@xdouglas.com.br'

  try {
    const { error } = await resend.emails.send({
      from: `xDouglas <${from}>`,
      to,
      subject: 'Redefinição de senha — xDouglas',
      html: passwordResetEmailHtml({ username, resetUrl }),
    })
    return !error
  } catch {
    return false
  }
}

// ============================================================
// Template HTML do email (estilos inline, compatível com clients)
// ============================================================

function passwordResetEmailHtml({
  username,
  resetUrl,
}: {
  username: string
  resetUrl: string
}): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#000000;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#0a0a0a;border:1px solid #3e4c59;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 24px 32px;text-align:center;">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:26px;font-weight:700;color:#ffffff;">
                x<span style="color:#a124c3;">Douglas</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 8px 32px;">
              <h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;color:#ffffff;">
                Redefinição de senha
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 0 32px;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#728094;">
                Recebemos um pedido para redefinir a senha da sua conta na comunidade xDouglas.
                Clique no botão abaixo para escolher uma nova senha. O link expira em 1 hora.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 0 32px;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#728094;">
                Seu login: <span style="color:#ffffff;font-weight:700;">${username}</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;text-align:center;">
              <a href="${resetUrl}" style="display:inline-block;background-color:#a124c3;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">
                Redefinir minha senha
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 8px 32px;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#728094;">
                Ou copie e cole este link no navegador:
              </p>
              <p style="margin:6px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#a124c3;word-break:break-all;">
                ${resetUrl}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 32px 32px;border-top:1px solid #3e4c59;margin-top:24px;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6;color:#3e4c59;">
                Se você não solicitou esta redefinição, pode ignorar este email — sua senha
                continua a mesma.
                © xDouglas · Comunidade musical independente
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
