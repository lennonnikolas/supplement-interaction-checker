const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const AppleStrategy = require('passport-apple');
const pool = require('../db/pool');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;

const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID;
const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID;
const APPLE_KEY_ID = process.env.APPLE_KEY_ID;
const APPLE_PRIVATE_KEY = process.env.APPLE_PRIVATE_KEY;
const APPLE_CALLBACK_URL = process.env.APPLE_CALLBACK_URL;

function initPassport() {
  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Find or create user
      const email = profile.emails[0].value;
      const oauth_id = profile.id;
      let userRes = await pool.query('SELECT id, email FROM users WHERE oauth_provider = $1 AND oauth_id = $2', ['google', oauth_id]);
      let user = userRes.rows[0];
      if (!user) {
        // If not found, check if email exists (upgrade to OAuth)
        const emailRes = await pool.query('SELECT id, email FROM users WHERE email = $1', [email]);
        if (emailRes.rows.length > 0) {
          // Update existing user with OAuth info
          user = emailRes.rows[0];
          await pool.query('UPDATE users SET oauth_provider = $1, oauth_id = $2 WHERE id = $3', ['google', oauth_id, user.id]);
        } else {
          // Create new user
          const insertRes = await pool.query(
            'INSERT INTO users (email, oauth_provider, oauth_id) VALUES ($1, $2, $3) RETURNING id, email',
            [email, 'google', oauth_id]
          );
          user = insertRes.rows[0];
        }
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  // Apple OAuth strategy
  passport.use(new AppleStrategy({
    clientID: APPLE_CLIENT_ID,
    teamID: APPLE_TEAM_ID,
    keyID: APPLE_KEY_ID,
    privateKey: APPLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // handle env newlines
    callbackURL: APPLE_CALLBACK_URL,
    scope: ['name', 'email'],
    passReqToCallback: false,
  }, async (accessToken, refreshToken, idToken, profile, done) => {
    try {
      // Apple may not always provide email after first login
      const email = profile && profile.email ? profile.email : null;
      const oauth_id = profile.id;
      let userRes = await pool.query('SELECT id, email FROM users WHERE oauth_provider = $1 AND oauth_id = $2', ['apple', oauth_id]);
      let user = userRes.rows[0];
      if (!user) {
        // If not found, check if email exists (upgrade to OAuth)
        if (email) {
          const emailRes = await pool.query('SELECT id, email FROM users WHERE email = $1', [email]);
          if (emailRes.rows.length > 0) {
            user = emailRes.rows[0];
            await pool.query('UPDATE users SET oauth_provider = $1, oauth_id = $2 WHERE id = $3', ['apple', oauth_id, user.id]);
          } else {
            const insertRes = await pool.query(
              'INSERT INTO users (email, oauth_provider, oauth_id) VALUES ($1, $2, $3) RETURNING id, email',
              [email, 'apple', oauth_id]
            );
            user = insertRes.rows[0];
          }
        } else {
          // No email, create user with just oauth_id
          const insertRes = await pool.query(
            'INSERT INTO users (oauth_provider, oauth_id) VALUES ($1, $2) RETURNING id, email',
            ['apple', oauth_id]
          );
          user = insertRes.rows[0];
        }
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser(async (id, done) => {
    try {
      const res = await pool.query('SELECT id, email FROM users WHERE id = $1', [id]);
      done(null, res.rows[0]);
    } catch (err) {
      done(err);
    }
  });
}

module.exports = initPassport; 