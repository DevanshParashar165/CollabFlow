import 'dotenv/config';

import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import User, { PLATFORM_ROLES } from '../src/models/User.js';

/**
 * Backfill platformRole for users created before the platform-role migration.
 *
 * The migration only touches documents that do not have platformRole yet, so
 * it is safe to run repeatedly and will not downgrade an existing SUPERADMIN.
 */
export async function migrateUserRoles() {
  await connectDB();

  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database connection not established.');
  }

  const filter = {
    $or: [
      { platformRole: { $exists: false } },
      { platformRole: null },
    ],
  };
  const update = { $set: { platformRole: PLATFORM_ROLES.USER } };
  const matchingCount = await User.countDocuments(filter);
  const result = await User.updateMany(filter, update);
  const modifiedCount = result.modifiedCount ?? result.nModified ?? result.n ?? 0;

  console.log(`Found ${matchingCount} user(s) requiring platformRole.`);
  console.log(`Migration complete. Migrated: ${modifiedCount} user(s).`);

  return { matchedCount: matchingCount, modifiedCount };
}

try {
  await migrateUserRoles();
  process.exitCode = 0;
} catch (error) {
  console.error('User role migration failed:', error);
  process.exitCode = 1;
} finally {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}