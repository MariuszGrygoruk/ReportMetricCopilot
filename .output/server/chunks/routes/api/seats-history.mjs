import { d as defineEventHandler, c as createError, g as getQuery, O as Options } from '../../nitro/nitro.mjs';
import { g as getSeatsHistorySummary } from '../../_/seats-storage.mjs';
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

const seatsHistory = defineEventHandler(async (event) => {
  const logger = console;
  if (process.env.ENABLE_HISTORICAL_MODE !== "true") {
    throw createError({
      statusCode: 503,
      statusMessage: "seats-history endpoint requires ENABLE_HISTORICAL_MODE=true"
    });
  }
  const query = getQuery(event);
  const options = Options.fromQuery(query);
  const scope = options.scope || "organization";
  const identifier = options.githubOrg || options.githubEnt || "";
  if (!identifier) {
    throw createError({ statusCode: 400, statusMessage: "GitHub org or enterprise must be configured" });
  }
  try {
    const history = await getSeatsHistorySummary(scope, identifier);
    logger.info(`Returning ${history.length} seat history entries for ${scope}:${identifier}`);
    return history;
  } catch (error) {
    logger.error("Error fetching seats history:", error);
    throw createError({ statusCode: 500, statusMessage: "Error fetching seats history: " + String(error) });
  }
});

export { seatsHistory as default };
//# sourceMappingURL=seats-history.mjs.map
