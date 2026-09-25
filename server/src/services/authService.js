import User, { PLATFORM_ROLES } from "../models/User.js";
import ApiError from "../utils/ApiError.js";

/**
 * Register a new user with the standard USER platform role.
 */
export const registerUser = async ({ name, email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  // Check if email is already registered
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  // Security: Explicitly enforce USER platform role for all self-registered users.
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    platformRole: PLATFORM_ROLES.USER,
  });

  return user;
};

/**
 * Authenticate user credentials and return sanitized user profile.
 */
export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  // Explicitly select password field since it is configured with select: false
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password",
  );

  // Generic 401 error message for both non-existent users and mismatched passwords
  // to defend against user enumeration attacks.
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  return user;
};

/**
 * Retrieve user by ID for session validation and profile loading.
 */
export const getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(401, "User session invalid or user no longer exists");
  }

  return user;
};

export default {
  registerUser,
  loginUser,
  getUserById,
};
