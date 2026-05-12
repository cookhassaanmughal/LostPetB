const nodemailer = require('nodemailer');

const sendVerificationEmail = async (email, token) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"PetRescue" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify your email for PetRescue',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #06b6d4;">Welcome to PetRescue!</h2>
        <p>Thank you for joining our community. Please verify your email address to activate your account.</p>
        <a href="${url}" style="display: inline-block; background: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Verify Email Address</a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="color: #666; font-size: 12px;">${url}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendResetPasswordEmail = async (email, token) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"PetRescue" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset your PetRescue password',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #06b6d4;">Password Reset Request</h2>
        <p>You requested a password reset. Please click the button below to set a new password. This link will expire in 1 hour.</p>
        <a href="${url}" style="display: inline-block; background: #06b6d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Reset Password</a>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">PetRescue Support Team</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail, sendResetPasswordEmail };
