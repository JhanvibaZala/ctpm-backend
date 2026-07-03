import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { v4 as uuidv4 } from 'uuid';
import pool from './dbconfig';
import { ENV } from './envConfig';

passport.use(
  new GoogleStrategy(
    {
      clientID: ENV.GOOGLE_CLIENT_ID,
      clientSecret: ENV.GOOGLE_CLIENT_SECRET,
      callbackURL: ENV.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile , done) => {
      try {
        const email = profile.emails && profile.emails.length > 0 ? profile.emails[0]?.value : null;
        if (!email) return done(new Error('No email from Google'), false);

        // 1. Check if user already exists via SSO
        const [rows]: any = await pool.query(
          `SELECT * FROM users 
           WHERE sso_provider = 'google' AND sso_provider_id = ?`,
          [profile.id]
        );

        if (rows.length > 0) {
          // Existing SSO user → just return them
          const user={
            ...rows[0],
            email:rows[0].email_id
          }
          return done(null, user);
        }

        // 2. Check if email already registered via password
        const [emailRows]: any = await pool.query(
          `SELECT * FROM users WHERE email_id = ?`,
          [email]
        );
        if (emailRows.length > 0) {
          // Email exists but used password auth — you can
          // either link accounts or reject. Rejecting is safer:
          return done(null, false, { 
            message: 'Email already registered with password. Please log in normally.' 
          });
        }

        // 3. New user — create them
        const newId = uuidv4();
        // Auto-generate a unique username from Google display name
        const baseUsername = profile.displayName
          .replace(/\s+/g, '_')
          .toLowerCase();
        const username = `${baseUsername}_${newId.slice(0, 6)}`;

        await pool.query(
          `INSERT INTO users 
            (id, username, first_name, last_name, email_id, 
             sso_provider, sso_provider_id, account_status)
           VALUES (?, ?, ?, ?, ?, 'google', ?, 'Active')`,
          [
            newId,
            username,
            profile.name?.givenName || profile.displayName,
            profile.name?.familyName || null,
            email,
            profile.id,
          ]
        );

        const [newUser]: any = await pool.query(
          `SELECT * FROM users WHERE id = ?`, [newId]
        );

        const user={
          ...newUser[0],
          email:newUser[0].email_id
        }
        return done(null, user);

      } catch (err) {
        return done(err, false);
      }
    }
  )
);

// Not using sessions — passport still needs these as stubs
passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser((id, done) => done(null, id as any));

export default passport;