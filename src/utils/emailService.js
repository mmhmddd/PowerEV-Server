const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
};

// Send reset password email
exports.sendResetPasswordEmail = async (userEmail, resetToken) => {
  try {
    const transporter = createTransporter();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const mailOptions = {
      from: `"PowerEV" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Password Reset Request - PowerEV',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #4CAF50;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background-color: #4CAF50;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 20px;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
            .warning {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 10px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You requested to reset your password for your PowerEV account.</p>
              <p>Click the button below to reset your password:</p>
              
              <center>
                <a href="${resetUrl}" class="button">Reset Password</a>
              </center>
              
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #4CAF50;">${resetUrl}</p>
              
              <div class="warning">
                <strong>⚠️ Important:</strong> This link will expire in 10 minutes.
              </div>
              
              <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
              
              <p>Best regards,<br>PowerEV Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request
        
        Hello,
        
        You requested to reset your password for your PowerEV account.
        
        Please click the following link to reset your password:
        ${resetUrl}
        
        This link will expire in 10 minutes.
        
        If you didn't request this password reset, please ignore this email.
        
        Best regards,
        PowerEV Team
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Reset password email sent to:', userEmail);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    throw new Error('Failed to send reset password email');
  }
};

// Send welcome email (optional)
exports.sendWelcomeEmail = async (userEmail, userName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"PowerEV" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Welcome to PowerEV',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #4CAF50;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚡ Welcome to PowerEV!</h1>
            </div>
            <div class="content">
              <p>Hello ${userName},</p>
              <p>Welcome to PowerEV! Your account has been successfully created.</p>
              <p>You can now log in and start using our services.</p>
              <p>If you have any questions, feel free to contact our support team.</p>
              <p>Best regards,<br>PowerEV Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent to:', userEmail);
    return true;
  } catch (error) {
    console.error('❌ Error sending welcome email:', error.message);
    // Don't throw error for welcome email - it's not critical
    return false;
  }
};