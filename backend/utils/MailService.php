<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as MailException;

class MailService {
    private ?string $lastLogPath = null;
    private ?string $lastError = null;
    private bool $usedLogFallback = false;

    public function getLastLogPath(): ?string {
        return $this->lastLogPath;
    }

    public function getLastError(): ?string {
        return $this->lastError;
    }

    public function usedLogFallback(): bool {
        return $this->usedLogFallback;
    }

    private function driver(): string {
        return strtolower(trim($_ENV['MAIL_DRIVER'] ?? 'smtp'));
    }

    private function logPath(): string {
        $preferredDir = __DIR__ . '/../logs';
        $preferred = $preferredDir . '/mail.log';

        if (!is_dir($preferredDir)) {
            @mkdir($preferredDir, 0775, true);
        }
        if (is_dir($preferredDir) && is_writable($preferredDir)) {
            return $preferred;
        }

        return rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'triunfo-go-mail.log';
    }

    private function writeLogEntry(string $path, $toEmail, $toName, $subject, $textBody): bool {
        $dir = dirname($path);
        if (!is_dir($dir)) {
            @mkdir($dir, 0775, true);
        }

        $entry = str_repeat('=', 72) . "\n"
            . date('Y-m-d H:i:s') . "\n"
            . "Para: {$toName} <{$toEmail}>\n"
            . "Asunto: {$subject}\n"
            . str_repeat('-', 72) . "\n"
            . $textBody . "\n";

        if (@file_put_contents($path, $entry, FILE_APPEND | LOCK_EX) === false) {
            return false;
        }

        $this->lastLogPath = (realpath($path) ?: $path);
        return true;
    }

    private function sendViaLog($toEmail, $toName, $subject, $htmlBody, $textBody): bool {
        $paths = [
            $this->logPath(),
            rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'triunfo-go-mail.log',
        ];
        $paths = array_values(array_unique($paths));

        foreach ($paths as $path) {
            if ($this->writeLogEntry($path, $toEmail, $toName, $subject, $textBody)) {
                return true;
            }
        }

        error_log('MailService: no se pudo escribir el correo en ningún archivo de log.');
        return false;
    }

    private function createMailer() {
        $mail = new PHPMailer(true);

        $host = trim($_ENV['MAIL_HOST'] ?? '');
        $port = (int)($_ENV['MAIL_PORT'] ?? 587);
        $user = trim($_ENV['MAIL_USERNAME'] ?? '');
        $pass = $_ENV['MAIL_PASSWORD'] ?? '';
        $from = $_ENV['MAIL_FROM_ADDRESS'] ?? 'noreply@triunfogo.com';
        $fromName = $_ENV['MAIL_FROM_NAME'] ?? 'TRIUNFO GO';
        $encryption = strtolower($_ENV['MAIL_ENCRYPTION'] ?? 'tls');

        $mail->CharSet = 'UTF-8';
        $mail->setFrom($from, $fromName);

        if ($host !== '') {
            $mail->isSMTP();
            $mail->Host = $host;
            $mail->Port = $port;
            $mail->Timeout = 20;
            $mail->SMTPAuth = ($user !== '');
            if ($user !== '') {
                $mail->Username = $user;
                $mail->Password = $pass;
            }
            if ($encryption === 'ssl') {
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
            } elseif ($encryption === 'tls') {
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            } else {
                $mail->SMTPSecure = false;
                $mail->SMTPAutoTLS = false;
            }
        } else {
            $mail->isMail();
        }

        return $mail;
    }

    public function sendPasswordResetCode($toEmail, $nombre, $code, $expiresMinutes = 15) {
        $subject = 'Código de recuperación de contraseña — TRIUNFO GO';
        $html = $this->buildPasswordResetHtml($nombre, $code, $expiresMinutes);
        $text = "Hola {$nombre},\n\n"
            . "Recibimos una solicitud para restablecer tu contraseña en TRIUNFO GO.\n\n"
            . "Tu código de verificación es: {$code}\n\n"
            . "Este código expira en {$expiresMinutes} minutos.\n\n"
            . "Si no solicitaste este cambio, ignora este correo.\n\n"
            . "— Equipo TRIUNFO GO";

        return $this->send($toEmail, $nombre, $subject, $html, $text);
    }

    private function buildPasswordResetHtml($nombre, $code, $expiresMinutes) {
        $safeName = htmlspecialchars($nombre ?: 'Usuario', ENT_QUOTES, 'UTF-8');
        $safeCode = htmlspecialchars($code, ENT_QUOTES, 'UTF-8');
        $year = date('Y');

        return <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Recuperación de contraseña</title>
</head>
<body style="margin:0;padding:0;background-color:#F3F4F6;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F3F4F6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#2E7D32,#43A047);padding:28px 32px;text-align:center;">
              <div style="font-size:28px;line-height:1;">🌿</div>
              <h1 style="margin:12px 0 4px;color:#FFFFFF;font-size:22px;letter-spacing:0.08em;">TRIUNFO GO</h1>
              <p style="margin:0;color:rgba(255,255,255,0.9);font-size:14px;">Gestión Agrícola</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">Recuperación de contraseña</h2>
              <p style="margin:0 0 20px;color:#4B5563;font-size:15px;line-height:1.6;">
                Hola <strong>{$safeName}</strong>,<br><br>
                Recibimos una solicitud para restablecer la contraseña de tu cuenta. Utiliza el siguiente código de verificación para continuar con el proceso:
              </p>
              <div style="text-align:center;margin:28px 0;">
                <span style="display:inline-block;padding:16px 32px;background:#F0FDF4;border:2px dashed #2E7D32;border-radius:12px;font-size:32px;font-weight:700;letter-spacing:0.35em;color:#1B5E20;">{$safeCode}</span>
              </div>
              <p style="margin:0 0 8px;color:#6B7280;font-size:14px;line-height:1.6;text-align:center;">
                Este código expira en <strong>{$expiresMinutes} minutos</strong>.
              </p>
              <div style="margin-top:28px;padding:16px;background:#FFFBEB;border-left:4px solid #F59E0B;border-radius:8px;">
                <p style="margin:0;color:#92400E;font-size:13px;line-height:1.5;">
                  <strong>Importante:</strong> Si no solicitaste este cambio, puedes ignorar este correo de forma segura. Tu contraseña actual no será modificada.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#F9FAFB;border-top:1px solid #E5E7EB;text-align:center;">
              <p style="margin:0;color:#9CA3AF;font-size:12px;">
                © {$year} TRIUNFO GO · Este es un mensaje automático, por favor no respondas.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
    }

    private function send($toEmail, $toName, $subject, $htmlBody, $textBody) {
        if ($this->driver() === 'log') {
            return $this->sendViaLog($toEmail, $toName, $subject, $htmlBody, $textBody);
        }

        $mail = null;
        try {
            $mail = $this->createMailer();
            $mail->addAddress($toEmail, $toName ?: $toEmail);
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $htmlBody;
            $mail->AltBody = $textBody;
            $mail->send();
            return true;
        } catch (MailException $e) {
            $detail = ($mail && $mail->ErrorInfo) ? $mail->ErrorInfo : $e->getMessage();
            $this->lastError = $detail;
            error_log('MailService error: ' . $detail);

            if ($this->isPermissionDenied($detail) && $this->sendViaLog($toEmail, $toName, $subject, $htmlBody, $textBody)) {
                $this->usedLogFallback = true;
                return true;
            }

            // Último recurso: guardar en log local para no perder el código en desarrollo.
            if ($this->sendViaLog($toEmail, $toName, $subject, $htmlBody, $textBody)) {
                $this->usedLogFallback = true;
                $this->lastError = 'SMTP falló; código guardado en log local. ' . $detail;
                return true;
            }
            return false;
        }
    }

    private function isPermissionDenied($detail) {
        $detail = strtolower((string)$detail);
        return str_contains($detail, 'permission denied')
            || str_contains($detail, 'could not connect to smtp host');
    }
}
?>
