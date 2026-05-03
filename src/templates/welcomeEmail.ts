export const welcomeEmail = (name: string): string => {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";
  
  return `
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <div style="font-family: Arial, sans-serif; max-width: 600px; text-align: left;">
            <h1 style="color: #FF5A5F;">Welcome to Airbnb, ${name}! 🎉</h1>
            <p style="font-size: 16px; color: #484848;">Your account has been created successfully.</p>
            <p style="font-size: 16px; color: #484848;">Start exploring listings and book your next stay.</p>
            
            <table border="0" cellspacing="0" cellpadding="0" style="margin-top: 20px;">
              <tr>
                <td align="center" bgcolor="#FF5A5F" style="border-radius: 4px;">
                  <a href="${baseUrl}" target="_blank" style="font-size: 16px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; padding: 12px 24px; display: inline-block; font-weight: bold;">
                    Explore Listings
                  </a>
                </td>
              </tr>
            </table>
          </div>
        </td>
      </tr>
    </table>
  `;
}
