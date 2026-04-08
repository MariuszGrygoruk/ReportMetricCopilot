import { d as defineEventHandler, g as getQuery, O as Options, c as createError, f as fetchLatestUserReport } from '../../nitro/nitro.mjs';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { b as getLatestUserMetrics } from '../../_/user-metrics-storage.mjs';
import 'date-holidays';
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

const userMetrics = defineEventHandler(async (event) => {
  var _a, _b;
  const logger = console;
  const query = getQuery(event);
  const options = Options.fromQuery(query);
  if (options.isDataMocked) {
    const mockPath = options.getUserMetricsMockDataPath();
    try {
      const path = resolve(mockPath);
      const data = readFileSync(path, "utf8");
      const report = JSON.parse(data);
      return report.user_totals;
    } catch (err) {
      logger.error("Failed to read user metrics mock data:", err);
      return [];
    }
  }
  if (process.env.ENABLE_HISTORICAL_MODE === "true") {
    try {
      const scope = options.scope || "organization";
      const identifier = options.githubOrg || options.githubEnt || "";
      const stored = await getLatestUserMetrics(scope, identifier);
      if (stored) {
        logger.info(`Returning ${stored.userTotals.length} user metrics entries from storage (${stored.reportStartDay}\u2013${stored.reportEndDay})`);
        return stored.userTotals;
      }
      logger.info("No user metrics in storage yet, attempting live fetch");
    } catch (err) {
      logger.warn("Storage lookup failed, falling back to live fetch:", err);
    }
  }
  if (!((_a = event.context.headers) == null ? void 0 : _a.has("Authorization"))) {
    logger.error("No Authentication provided for user-metrics endpoint");
    throw createError({ statusCode: 401, statusMessage: "No Authentication provided" });
  }
  try {
    const scope = options.scope || "organization";
    const identifier = options.githubOrg || options.githubEnt || "";
    if (!identifier) {
      throw createError({ statusCode: 400, statusMessage: "GitHub organization or enterprise must be configured" });
    }
    logger.info(`Fetching user metrics for ${scope}:${identifier}`);
    const report = await fetchLatestUserReport(
      { scope, identifier, teamSlug: options.githubTeam },
      event.context.headers
    );
    const userTotals = (_b = report.user_totals) != null ? _b : [];
    logger.info(`Returned ${userTotals.length} user records for ${scope}:${identifier}`);
    return userTotals;
  } catch (error) {
    logger.error("Error fetching user metrics:", error);
    const status = typeof error === "object" && error && "statusCode" in error ? error.statusCode : 500;
    throw createError({
      statusCode: status || 500,
      statusMessage: "Error fetching user metrics. Error: " + String(error)
    });
  }
});

export { userMetrics as default };
//# sourceMappingURL=user-metrics.mjs.map
