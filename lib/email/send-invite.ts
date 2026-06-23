import { Resend } from 'resend'
import type { RegisterType } from '@/lib/invites/code'

// ============================================================
// Cliente Resend — só inicializa se a chave estiver configurada.
// Sem RESEND_API_KEY, o envio degrada para "false" e o admin
// copia o link manualmente (fallback).
// ============================================================

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

interface SendInviteParams {
  to: string
  inviteCode: string
  registrationUrl: string
  accountType: RegisterType
}

/** Envia o email com o link de convite. Retorna true se enviado. */
export async function sendInviteEmail({
  to,
  inviteCode,
  registrationUrl,
  accountType,
}: SendInviteParams): Promise<boolean> {
  const resend = getResend()
  if (!resend) return false

  const from = process.env.EMAIL_FROM ?? 'convite@xdouglas.com.br'

  try {
    const { error } = await resend.emails.send({
      from: `xDouglas <${from}>`,
      to,
      subject: 'Seu convite para a comunidade xDouglas',
      html: inviteEmailHtml({ inviteCode, registrationUrl, accountType }),
    })
    return !error
  } catch {
    return false
  }
}

// ============================================================
// Template HTML do email (estilos inline, compatível com clients)
// ============================================================

function inviteEmailHtml({
  inviteCode,
  registrationUrl,
  accountType,
}: {
  inviteCode: string
  registrationUrl: string
  accountType: RegisterType
}): string {
  const tipoLabel = accountType === 'artist' ? 'músico/produtor' : 'ouvinte'

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
                Seu convite chegou 🎉
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 0 32px;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#728094;">
                Seu pedido foi aceito! Você foi convidado para criar sua conta de
                <strong style="color:#ffffff;">${tipoLabel}</strong> na comunidade xDouglas.
                Clique no botão abaixo para concluir o cadastro.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;text-align:center;">
              <a href="${registrationUrl}" style="display:inline-block;background-color:#a124c3;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">
                Criar minha conta
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 8px 32px;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#728094;">
                Ou copie e cole este link no navegador:
              </p>
              <p style="margin:6px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#a124c3;word-break:break-all;">
                ${registrationUrl}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 0 32px;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#728094;">
                Sua chave de convite (já vem no link, uso único):
                <strong style="color:#ffffff;font-family:monospace;letter-spacing:1px;">${inviteCode}</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 32px 32px;border-top:1px solid #3e4c59;margin-top:24px;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6;color:#3e4c59;">
                Se você não solicitou este convite, pode ignorar este email.
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
