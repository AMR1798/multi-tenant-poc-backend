import nodemailer from 'nodemailer';
import config from '../config/config';
import logger from '../config/logger';

const transport = nodemailer.createTransport(config.email.smtp);
/* istanbul ignore next */
if (config.env !== 'test') {
  transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch(() =>
      logger.warn(
        'Unable to connect to email server. Make sure you have configured the SMTP options in .env'
      )
    );
}

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  const msg = { from: config.email.from, to, subject, text, html };
  await transport.sendMail(msg);
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to: string, token: string, tenant?: string) => {
  const subject = 'Reset password';
  // replace this url with the link to the reset password page of your front-end app
  const resetPasswordUrl = `http://${tenant ? tenant + '.' : ''}${
    config.host.app
  }/reset-password?token=${token}`;
  const text = `Dear user,
To reset your password, click on this link: ${resetPasswordUrl}
If you did not request any password resets, then ignore this email.`;
  await sendEmail(to, subject, text);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendVerificationEmail = async (to: string, token: string, tenant?: string) => {
  const subject = 'Email Verification';
  const domain = `${tenant ? tenant + '.' : ''}${config.host.app}`;
  // replace this url with the link to the email verification page of your front-end app
  const verificationEmailUrl = `http://${domain}/verify-email?token=${token}`;
  const text = `Dear user,
To verify your email, click on this link: ${verificationEmailUrl}`;
  await sendEmail(to, subject, text, getVerificationEmailHtml(domain, verificationEmailUrl));
};

const getVerificationEmailHtml = (domain: string, url: string): string => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Your Email Template</title>
    <style>
      /* Add your custom styling here */
      /* ... (the rest of your HTML template's styling) */
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Hello there!</h1>
      <p>Your account registration on ${domain} is a success, but you still need to verify your account.</p>
      <p>To do so, you will need to click the link below</p>
      <p><a href="${url}" target="_blank">Verify Account</a></p>
      <p>Note: this is a test website, do not use your actual email to register on this website</p>
    </div>
  </body>
  </html>
`;
};

export default {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail
};
