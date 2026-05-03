export const passwordResetEmail = (
  name: string,
  resetLink: string,
  resetToken: string
): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Password Reset Request</h1>

      <p>Hi ${name}, we received a request to reset your password.</p>

      <p>This reset token expires in 1 hour.</p>

      <p><strong>Your reset token:</strong></p>
      <p style="background:#f4f4f4; padding:12px; border-radius:4px; word-break:break-all;">
        ${resetToken}
      </p>

      <p>Use this endpoint in Postman:</p>
      <p style="background:#f4f4f4; padding:12px; border-radius:4px; word-break:break-all;">
        POST ${resetLink}
      </p>

      <p>Body:</p>
      <pre style="background:#f4f4f4; padding:12px; border-radius:4px;">
{
  "newPassword": "NewPassword123",
  "confirmNewPassword": "NewPassword123"
}
      </pre>

      <p style="color: #999; font-size: 12px;">
        If you didn't request this, ignore this email.
      </p>
    </div>
  `;
};