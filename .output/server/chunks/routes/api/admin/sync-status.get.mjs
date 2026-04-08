import { d as defineEventHandler, g as getQuery, O as Options, c as createError } from '../../../nitro/nitro.mjs';
import { g as getSyncStats, a as getPendingSyncs, b as getFailedSyncs } from '../../../_/sync-service.mjs';
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
import '../../../_/user-metrics-storage.mjs';

const syncStatus_get = defineEventHandler(async (event) => {
  const logger = console;
  const query = getQuery(event);
  try {
    const options = Options.fromQuery(query);
    if (options.scope && (options.githubOrg || options.githubEnt)) {
      const identifier = options.githubOrg || options.githubEnt || "";
      const endDate = options.until || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const startDate = options.since || new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
      const stats = await getSyncStats(
        options.scope,
        identifier,
        startDate,
        endDate,
        options.githubTeam
      );
      return {
        scope: options.scope,
        identifier,
        teamSlug: options.githubTeam,
        dateRange: {
          start: startDate,
          end: endDate
        },
        stats
      };
    }
    const pending = await getPendingSyncs();
    const failed = await getFailedSyncs();
    pending.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    failed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return {
      pending: pending.length,
      failed: failed.length,
      pendingSyncs: pending.slice(0, 10),
      // 10 most recent pending
      failedSyncs: failed.slice(0, 10)
      // 10 most recent failed
    };
  } catch (error) {
    logger.error("Error getting sync status:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw createError({
      statusCode: 500,
      statusMessage: JSON.stringify({ error: "Failed to get sync status", message: errorMessage })
    });
  }
});

export { syncStatus_get as default };
//# sourceMappingURL=sync-status.get.mjs.map
