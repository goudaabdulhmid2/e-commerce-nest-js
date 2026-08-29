export const verificationEmailTemplate = (otp: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Email Verification</title>
      </head>

      <body>
        <h2>Verify Your Email</h2>

        <p>
          Your verification code is:
        </p>

        <h1>${otp}</h1>

        <p>
          This code will expire soon.
        </p>

        <p>
          If you didn't request this code, you can ignore this email.
        </p>
      </body>
    </html>
  `;
};
