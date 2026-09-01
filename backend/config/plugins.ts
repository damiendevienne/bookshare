export default () => ({
  email: {
    config: {
      // Use sendmail for local development. Set EMAIL_PROVIDER=nodemailer and
      // the SMTP_* variables in .env for real confirmation/reset emails.
      provider: process.env.EMAIL_PROVIDER || 'sendmail',
      providerOptions: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USERNAME ? {
          user: process.env.SMTP_USERNAME,
          pass: process.env.SMTP_PASSWORD,
        } : undefined,
      },
      settings: {
        defaultFrom: process.env.EMAIL_DEFAULT_FROM || 'noreply@bookmybook.local',
        defaultReplyTo: process.env.EMAIL_DEFAULT_REPLY_TO || process.env.EMAIL_DEFAULT_FROM || 'noreply@bookmybook.local',
      },
    },
  },
  upload: {
    config: {
      // Keep user-uploaded book images reasonably small (5 MB per file).
      sizeLimit: 5 * 1024 * 1024,
    },
  },
});
