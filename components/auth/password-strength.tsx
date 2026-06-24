export function getPasswordChecks(pw: string) {
  return {
    length: pw.length >= 8,
    uppercase: (pw.match(/[A-Z]/g) ?? []).length >= 2,
    special: (pw.match(/[^A-Za-z0-9]/g) ?? []).length >= 2,
  }
}

export function isPasswordValid(pw: string) {
  const checks = getPasswordChecks(pw)
  return checks.length && checks.uppercase && checks.special
}

export function PasswordStrengthMeter({ password }: { password: string }) {
  const checks = getPasswordChecks(password)
  const score = Number(checks.length) + Number(checks.uppercase) + Number(checks.special)

  const levels = [
    { label: 'Muito fraca', color: 'bg-red-500' },
    { label: 'Fraca', color: 'bg-orange-500' },
    { label: 'Média', color: 'bg-yellow-400' },
    { label: 'Forte', color: 'bg-green-500' },
  ]
  const level = password.length === 0 ? null : levels[score]

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition ${
              level && score > i ? level.color : 'bg-white/10'
            }`}
          />
        ))}
      </div>
      {level && (
        <p className="mt-1 text-xs text-gate-blue">
          Força: <span className="font-semibold">{level.label}</span>
        </p>
      )}
      <ul className="mt-1.5 space-y-0.5 text-xs">
        <li className={checks.length ? 'text-green-400' : 'text-gate-blue/60'}>
          {checks.length ? '✓' : '•'} Mínimo 8 caracteres
        </li>
        <li className={checks.uppercase ? 'text-green-400' : 'text-gate-blue/60'}>
          {checks.uppercase ? '✓' : '•'} Pelo menos 2 letras maiúsculas
        </li>
        <li className={checks.special ? 'text-green-400' : 'text-gate-blue/60'}>
          {checks.special ? '✓' : '•'} Pelo menos 2 caracteres especiais (ex: !@#$%)
        </li>
      </ul>
    </div>
  )
}
