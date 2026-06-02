import { z } from "zod";

// Disable Zod v4's JIT fast-path so it never calls `new Function(...)`,
// which would trip our CSP `script-src` (no `'unsafe-eval'`).
// Must run before any `z.object(...)` is constructed — import `z` from here,
// not from `"zod"` directly.
z.config({ jitless: true });

export { z };
