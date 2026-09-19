import 'dotenv/config';

import crypto from 'crypto';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import User, { PLATFORM_ROLES } from '../src/models/User.js';

/**
 * Trusted maintainer-only CLI script / helper to bootstrap a Superadmin user.
 * 
 * Supports both CLI arguments:
 *   node scripts/createSuperadmin.js --email super@collabflow.io --name "Super Admin" --password "MySecretPass"
 * and Environment Variables:
 *   SUPERADMIN_EMAIL, SUPERADMIN_NAME, SUPERADMIN_PASSWORD
 */
export async function bootstrapSuperadmin({ email, name, password } = {}) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Valid email address is required to bootstrap Superadmin.');
  }

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    if (existingUser.platformRole === PLATFORM_ROLES.SUPERADMIN) {
      console.log(`User ${normalizedEmail} is already a SUPERADMIN. No changes made.`);
      return { user: existingUser, created: false, elevated: false };
    }

    existingUser.platformRole = PLATFORM_ROLES.SUPERADMIN;
    await existingUser.save();
    console.log(`Successfully elevated existing user ${normalizedEmail} to SUPERADMIN.`);
    return { user: existingUser, created: false, elevated: true };
  }

  // Create new SUPERADMIN
  let generatedPassword = null;
  let finalPassword = password;
  if (!finalPassword) {
    generatedPassword = crypto.randomBytes(12).toString('base64url') + '!Aa1';
    finalPassword = generatedPassword;
  }

  const newUser = await User.create({
    name: (name || 'Superadmin User').trim(),
    email: normalizedEmail,
    password: finalPassword,
    platformRole: PLATFORM_ROLES.SUPERADMIN,
  });

  console.log(`Successfully created new SUPERADMIN user: ${normalizedEmail}`);
  if (generatedPassword) {
    console.log(`\n======================================================`);
    console.log(`⚠️  [SENSITIVE] Generated Temporary Password:`);
    console.log(`   ${generatedPassword}`);
    console.log(`   Please record this password securely and change it.`);
    console.log(`======================================================\n`);
  }

  return { user: newUser, created: true, generatedPassword };
}

// Parse CLI arguments if executed directly
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('createSuperadmin.js') || 
  process.argv[1].endsWith('createSuperadmin.mjs')
);

if (isDirectRun) {
  const parseArgs = () => {
    const args = process.argv.slice(2);
    const parsed = {
      email: process.env.SUPERADMIN_EMAIL,
      name: process.env.SUPERADMIN_NAME,
      password: process.env.SUPERADMIN_PASSWORD,
    };

    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--email' && args[i + 1]) parsed.email = args[++i];
      else if (args[i] === '--name' && args[i + 1]) parsed.name = args[++i];
      else if (args[i] === '--password' && args[i + 1]) parsed.password = args[++i];
    }
    return parsed;
  };

  (async () => {
    try {
      await connectDB();
      const options = parseArgs();
      await bootstrapSuperadmin(options);
      process.exit(0);
    } catch (err) {
      console.error('Superadmin bootstrap failed:', err.message);
      process.exit(1);
    } finally {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
    }
  })();
}
