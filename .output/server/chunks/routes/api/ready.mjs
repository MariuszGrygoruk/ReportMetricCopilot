import { d as defineEventHandler, u as useRuntimeConfig } from '../../nitro/nitro.mjs';
import 'date-holidays';
import 'fs';
import 'path';
import 'crypto';
import 'node:http';
import 'node:https';
import 'node:crypto';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'undici';
import 'pg';
import 'node:url';

const ready = defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  return {
    status: "ready",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    version: config.public.version,
    checks: {
      server: "ok",
      config: "ok"
    }
  };
});

export { ready as default };
//# sourceMappingURL=ready.mjs.map
