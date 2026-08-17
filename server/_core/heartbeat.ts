import { runAgentCycleForUser } from "../services/agentEngine";

export function startHeartbeatWorker() {
  console.log("[Heartbeat] Automated agent scheduler started.");
  
  setInterval(async () => {
    try {
      console.log("[Heartbeat] Checking scheduled agent execution...");
    } catch (e) {
      console.error("[Heartbeat Error]", e);
    }
  }, 60 * 60 * 1000);
}
