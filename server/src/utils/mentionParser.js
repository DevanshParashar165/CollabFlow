import WorkspaceMember from "../models/WorkspaceMember.js";
import User from "../models/User.js";

/**
 * Extracts @mentions from text content.
 * Supports:
 * - @"Full Name" (quoted)
 * - @email@example.com (email)
 * - @username or @firstname (single-word handles)
 */
export const parseMentions = (content) => {
  if (!content || typeof content !== "string") return [];

  const regex =
    /@"([^"]+)"|@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|@([a-zA-Z0-9_][a-zA-Z0-9_.-]*)/g;
  const mentions = new Set();
  let match;

  while ((match = regex.exec(content)) !== null) {
    const raw = match[1] || match[2] || match[3];
    if (raw) {
      // Strip trailing sentence punctuation
      const cleaned = raw.replace(/[.,:;!?]+$/, "").trim();
      if (cleaned.length > 0) {
        mentions.add(cleaned);
      }
    }
  }

  return [...mentions];
};

/**
 * Finds a matching user from a workspace user list for a given mention token.
 * Enforces: "Do not resolve ambiguous display names."
 */
export const findMatchingUser = (token, users = []) => {
  if (!token || typeof token !== "string") return null;
  const cleanToken = token.trim().toLowerCase();
  if (!cleanToken) return null;

  // 1. Direct email match (email is unique)
  const emailMatches = users.filter(
    (u) => u.email && u.email.toLowerCase() === cleanToken
  );
  if (emailMatches.length === 1) return emailMatches[0];

  // 2. Exact full display name match
  const exactNameMatches = users.filter(
    (u) => u.name && u.name.trim().toLowerCase() === cleanToken
  );
  if (exactNameMatches.length > 1) {
    // Ambiguous: multiple users share this exact full name
    return null;
  }

  // 3. First name / single-word match
  const firstNameMatches = !cleanToken.includes(" ")
    ? users.filter((u) => {
        if (!u.name) return false;
        return u.name.trim().split(/\s+/)[0].toLowerCase() === cleanToken;
      })
    : [];

  if (firstNameMatches.length > 1) {
    // Ambiguous: multiple users share this first name
    return null;
  }

  if (exactNameMatches.length === 1) return exactNameMatches[0];
  if (firstNameMatches.length === 1) return firstNameMatches[0];

  return null;
};

/**
 * Resolves mention strings to actual User documents who are members of workspaceId.
 * Ignores non-members and unresolved/ambiguous mentions.
 */
export const resolveMentions = async (contentOrMentions, workspaceId) => {
  if (!workspaceId) return [];
  const tokens = Array.isArray(contentOrMentions)
    ? contentOrMentions
    : parseMentions(contentOrMentions);

  if (!tokens || tokens.length === 0) return [];

  let query = WorkspaceMember.find({ workspaceId });
  if (query && typeof query.populate === "function") {
    query = query.populate("userId", "name email avatar");
  }
  const members = (await query) || [];

  const workspaceUsers = [];
  for (const m of members) {
    if (!m) continue;
    if (m.userId && typeof m.userId === "object" && m.userId.name) {
      workspaceUsers.push(m.userId);
    } else if (m.userId) {
      const u = await User.findById(m.userId);
      if (u) workspaceUsers.push(u);
    }
  }

  const resolvedMap = new Map();
  for (const token of tokens) {
    const matched = findMatchingUser(token, workspaceUsers);
    if (matched && matched._id) {
      resolvedMap.set(matched._id.toString(), matched);
    }
  }

  return [...resolvedMap.values()];
};

export default {
  parseMentions,
  findMatchingUser,
  resolveMentions,
};
