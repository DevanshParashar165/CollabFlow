import { emitToWorkspace } from "./index.js";

export const actorPayload = (actor) => ({
  id: actor?._id?.toString?.() || actor?._id,
  name: actor?.name || "User",
  avatar: actor?.avatar || "",
});

export const emitWorkspaceEvent = (workspaceId, event, payload) =>
  emitToWorkspace(workspaceId, event, payload);

export default { actorPayload, emitWorkspaceEvent };
