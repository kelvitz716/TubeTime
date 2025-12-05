import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { db } from '../db/database';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      console.log('Passport checking username:', username);
      const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
      const user = result[0];
      console.log('Passport user found:', user);

      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      console.log('Password valid:', isValid);
      if (!isValid) {
        return done(null, false, { message: 'Incorrect password.' });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    const user = result[0];
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;
