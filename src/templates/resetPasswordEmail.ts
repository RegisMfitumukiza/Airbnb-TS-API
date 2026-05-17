const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

export const passwordResetEmail = (
  name: string,
  resetToken: string
): string => {
  const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

  return `
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#f7f7f7; padding:24px 0;">
      <tr>
        <td align="center">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px; background:#ffffff; border-radius:12px; overflow:hidden;">
            <tr>
              <td style="padding:32px; font-family:Arial, Helvetica, sans-serif; color:#484848;">

                <h1 style="margin:0 0 16px; color:#FF5A5F; font-size:28px;">
                  Password Reset Request
                </h1>

                <p style="font-size:16px; line-height:1.6; margin:0 0 16px;">
                  Hi ${name},
                </p>

                <p style="font-size:16px; line-height:1.6; margin:0 0 16px;">
                  We received a request to reset your password.
                </p>

                <p style="font-size:16px; line-height:1.6; margin:0 0 24px;">
                  Click the button below to create a new password.
                  This link expires in <strong>1 hour</strong>.
                </p>

                <table border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center" bgcolor="#FF5A5F" style="border-radius:8px;">
                      <a href="${resetUrl}" target="_blank" style="font-size:16px; font-family:Arial, Helvetica, sans-serif; color:#ffffff; text-decoration:none; padding:12px 24px; display:inline-block; font-weight:bold;">
                        Reset Password
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="font-size:13px; color:#767676; margin-top:28px; line-height:1.5;">
                  If the button does not work, copy and paste this link into your browser:
                </p>

                <p style="font-size:13px; word-break:break-all;">
                  <a href="${resetUrl}" style="color:#FF5A5F;">
                    ${resetUrl}
                  </a>
                </p>

                <p style="font-size:13px; color:#999999; margin-top:32px; line-height:1.5;">
                  If you didn't request this password reset, you can safely ignore this email.
                </p>

              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
};