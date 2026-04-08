import { d as defineEventHandler, c as createError, g as getQuery, O as Options } from '../../nitro/nitro.mjs';
import { g as getUserTimeSeries, a as getUserMetricsHistory } from '../../_/user-metrics-storage.mjs';
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

const userMetricsHistory = defineEventHandler(async (event) => {
  const logger = console;
  if (process.env.ENABLE_HISTORICAL_MODE !== "true") {
    throw createError({
      statusCode: 503,
      statusMessage: "user-metrics-history endpoint requires ENABLE_HISTORICAL_MODE=true"
    });
  }
  const query = getQuery(event);
  const options = Options.fromQuery(query);
  const scope = options.scope || "organization";
  const identifier = options.githubOrg || options.githubEnt || "";
  const login = typeof query.login === "string" ? query.login.trim() : "";
  if (!identifier) {
    throw createError({ statusCode: 400, statusMessage: "GitHub org or enterprise must be configured" });
  }
  try {
    if (login) {
      const series = await getUserTimeSeries(scope, identifier, login);
      logger.info(`Returning ${series.length} time-series entries for user "${login}" in ${scope}:${identifier}`);
      return series;
    }
    const history = await getUserMetricsHistory(scope, identifier);
    logger.info(`Returning ${history.length} user-metrics history entries for ${scope}:${identifier}`);
    return history;
  } catch (error) {
    logger.error("Error fetching user-metrics history:", error);
    throw createError({ statusCode: 500, statusMessage: "Error fetching user-metrics history: " + String(error) });
  }
});

export { userMetricsHistory as default };
//# sourceMappingURL=user-metrics-history.mjs.map
