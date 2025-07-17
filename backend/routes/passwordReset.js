const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { Resend } = require('resend');
const router = express.Router();
const pool = require('../db/pool');

// Email configuration
let resend = null;
const fromEmail = 'onboarding@resend.dev'; // Resend's default domain - works immediately
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

// Generate reset token
function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Send password reset email
async function sendPasswordResetEmail(email, resetToken) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/reset-password?token=${resetToken}`;
  
  // If no API key, log to console for development
  if (!resend) {
    return true; // Return success for development
  }
  
  try {
    const { data, error } = await resend.emails.send({
      from: `Supplement Checker <${fromEmail}>`,
      to: [email],
      subject: 'Password Reset Request - Supplement Checker',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin:0 auto;">
          <h2 style="color: #333">Password Reset Request</h2>
          <p>You requested a password reset for your Supplement Checker account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0">Reset Password</a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <hr>
          <p style="color: #666">This is an automated message from Supplement Checker.</p>
        </div>
      `
    });

    if (error) {
      console.error('Email sending failed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}

// POST /password-reset/request - Request password reset
router.post('/request', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Check if user exists
    const userResult = await pool.query('SELECT id, email FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      // Dont reveal if email exists or not for security
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    const user = userResult.rows[0];
    const resetToken = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1hour from now

    // Store reset token in database
    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, resetToken, expiresAt]
    );

    // Send email
    const emailSent = await sendPasswordResetEmail(email, resetToken);
    
    if (emailSent) {
      res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    } else {
      res.status(500).json({ error: 'Failed to send password reset email' });
    }
  } catch (error) {
    console.error('Password reset request failed:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// POST /password-reset/reset - Reset password with token
router.post('/reset', async (req, res) => {
  const { token, password } = req.body;
  
  if (!token || !password) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    // Find valid reset token
    const tokenResult = await pool.query(
      `SELECT prt.user_id, prt.expires_at, u.email 
       FROM password_reset_tokens prt 
       JOIN users u ON prt.user_id = u.id 
       WHERE prt.token = $1 AND prt.used = false AND prt.expires_at > NOW()`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const resetToken = tokenResult.rows[0];
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Update user password
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, resetToken.user_id]
    );
    
    // Mark token as used
    await pool.query(
      'UPDATE password_reset_tokens SET used = true WHERE token = $1',
      [token]
    );

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Password reset failed:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// GET /password-reset/verify - Verify reset token
router.get('/verify/:token', async (req, res) => {
  const { token } = req.params;
  
  try {
    const tokenResult = await pool.query(
      `SELECT prt.user_id, prt.expires_at, u.email 
       FROM password_reset_tokens prt 
       JOIN users u ON prt.user_id = u.id 
       WHERE prt.token = $1 AND prt.used = false AND prt.expires_at > NOW()`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    res.json({ valid: true, email: tokenResult.rows[0].email });
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(500).json({ error: 'Failed to verify token' });
  }
});

module.exports = router; 