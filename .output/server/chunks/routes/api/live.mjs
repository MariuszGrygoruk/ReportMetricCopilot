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

const live = defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  return {
    status: "alive",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    version: config.public.version,
    pid: process.pid,
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    }
  };
});

export { live as default };
//# sourceMappingURL=live.mjs.map
