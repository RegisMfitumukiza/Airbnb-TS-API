const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

const emailLayout = (content: string) => `
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#f7f7f7; padding:24px 0;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px; background:#ffffff; border-radius:12px; overflow:hidden;">
          <tr>
            <td style="padding:32px; font-family:Arial, Helvetica, sans-serif; color:#484848;">
              ${content}

              <p style="font-size:12px; color:#999999; margin-top:32px; line-height:1.5;">
                Airbnb Clone Platform
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

const button = (href: string, label: string) => `
  <table border="0" cellspacing="0" cellpadding="0" style="margin-top:24px;">
    <tr>
      <td align="center" bgcolor="#FF5A5F" style="border-radius:8px;">
        <a href="${href}" target="_blank" style="font-size:16px; font-family:Arial, Helvetica, sans-serif; color:#ffffff; text-decoration:none; padding:12px 24px; display:inline-block; font-weight:bold;">
          ${label}
        </a>
      </td>
    </tr>
  </table>
`;

export const hostRequestSubmittedEmail = (
  name: string
): string => {
  const requestUrl = `${frontendUrl}/dashboard/host-request`;

  return emailLayout(`
    <h1 style="margin:0 0 16px; color:#FF5A5F; font-size:28px;">
      Host Request Submitted
    </h1>

    <p style="font-size:16px; line-height:1.6;">
      Hello ${name},
    </p>

    <p style="font-size:16px; line-height:1.6;">
      Your request to become a host has been submitted successfully.
    </p>

    <p style="font-size:16px; line-height:1.6;">
      An admin will review your request and notify you once a decision is made.
    </p>

    ${button(requestUrl, "View Request Status")}
  `);
};

export const hostRequestApprovedEmail = (
  name: string
): string => {
  const hostDashboardUrl = `${frontendUrl}/host/dashboard`;

  return emailLayout(`
    <h1 style="margin:0 0 16px; color:#008A05; font-size:28px;">
      Host Request Approved 🎉
    </h1>

    <p style="font-size:16px; line-height:1.6;">
      Hello ${name},
    </p>

    <p style="font-size:16px; line-height:1.6;">
      Congratulations! Your request to become a host has been approved.
    </p>

    <p style="font-size:16px; line-height:1.6;">
      You can now create listings, manage bookings, and access your host dashboard.
    </p>

    ${button(hostDashboardUrl, "Go to Host Dashboard")}
  `);
};

export const hostRequestRejectedEmail = (
  name: string,
  reason?: string
): string => {
  const supportUrl = `${frontendUrl}/support`;

  return emailLayout(`
    <h1 style="margin:0 0 16px; color:#FF5A5F; font-size:28px;">
      Host Request Update
    </h1>

    <p style="font-size:16px; line-height:1.6;">
      Hello ${name},
    </p>

    <p style="font-size:16px; line-height:1.6;">
      Unfortunately, your request to become a host was not approved at this time.
    </p>

    ${
      reason
        ? `
      <div style="background:#f4f4f4; padding:16px; border-radius:8px; margin-top:16px;">
        <p style="margin:0; font-size:15px;">
          <strong>Reason:</strong> ${reason}
        </p>
      </div>
    `
        : ""
    }

    <p style="font-size:16px; line-height:1.6; margin-top:20px;">
      You may contact support or improve your profile and try again later.
    </p>

    ${button(supportUrl, "Contact Support")}
  `);
};

export const adminNewHostRequestEmail = (
  adminName: string,
  userName: string
): string => {
  const adminReviewUrl = `${frontendUrl}/admin/host-requests`;

  return emailLayout(`
    <h1 style="margin:0 0 16px; color:#FF5A5F; font-size:28px;">
      New Host Request
    </h1>

    <p style="font-size:16px; line-height:1.6;">
      Hello ${adminName},
    </p>

    <p style="font-size:16px; line-height:1.6;">
      <strong>${userName}</strong> has submitted a request to become a host.
    </p>

    <p style="font-size:16px; line-height:1.6;">
      Please review the application from the admin dashboard.
    </p>

    ${button(adminReviewUrl, "Review Request")}
  `);
};