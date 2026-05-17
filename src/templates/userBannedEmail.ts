const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

export const userBannedEmail = (name: string, reason?: string): string => {
  const supportUrl = `${frontendUrl}/contact`;

  return `
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#f7f7f7; padding:24px 0;">
      <tr>
        <td align="center">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px; background:#ffffff; border-radius:12px; overflow:hidden;">
            <tr>
              <td style="padding:32px; font-family:Arial, Helvetica, sans-serif; color:#484848;">
                <h1 style="margin:0 0 16px; color:#FF5A5F; font-size:28px;">
                  Account suspended
                </h1>

                <p style="font-size:16px; line-height:1.6; margin:0 0 12px;">
                  Hello ${name},
                </p>

                <p style="font-size:16px; line-height:1.6; margin:0 0 12px;">
                  Your account has been banned by an administrator.
                </p>

                ${
                  reason
                    ? `<p style="font-size:16px; line-height:1.6; margin:0 0 12px;">
                        <strong>Reason:</strong> ${reason}
                      </p>`
                    : ""
                }

                <p style="font-size:16px; line-height:1.6; margin:0 0 24px;">
                  If you believe this was a mistake, please contact support.
                </p>

                <table border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center" bgcolor="#FF5A5F" style="border-radius:8px;">
                      <a href="${supportUrl}" target="_blank" style="font-size:16px; font-family:Arial, Helvetica, sans-serif; color:#ffffff; text-decoration:none; padding:12px 24px; display:inline-block; font-weight:bold;">
                        Contact Support
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="font-size:13px; color:#767676; margin-top:28px; line-height:1.5;">
                  If the button does not work, copy and paste this link into your browser:<br />
                  <a href="${supportUrl}" style="color:#FF5A5F; word-break:break-all;">${supportUrl}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
};