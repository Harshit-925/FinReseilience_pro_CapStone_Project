/**
 * PocketBase client singleton.
 * 
 * Used for auth, reads/realtime, and direct writes (goals, reports).
 * The SDK handles session persistence internally.
 */
import PocketBase from "pocketbase";

const pb = new PocketBase(
  import.meta.env.VITE_POCKETBASE_URL || "http://localhost:8090"
);

export default pb;
