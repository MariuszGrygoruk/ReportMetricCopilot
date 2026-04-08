import { d as defineEventHandler, g as getQuery, r as readBody, O as Options, c as createError, i as isMockMode } from '../../../nitro/nitro.mjs';
import { s as syncUserMetrics, c as syncBulk, d as syncGaps, e as syncMetricsForDateRange, f as syncMetricsForDate } from '../../../_/sync-service.mjs';
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

const sync_post = defineEventHandler(async (event) => {
  const logger = console;
  const query = getQuery(event);
  const body = await readBody(event).catch(() => ({}));
  const params = { ...query, ...body };
  try {
    const options = Options.fromQuery(params);
    const validation = options.validate();
    if (!validation.isValid) {
      throw createError({
        statusCode: 400,
        statusMessage: JSON.stringify({ error: "Invalid options", details: validation.errors })
      });
    }
    const date = params.date;
    const action = params.action || "sync-date";
    const mockEnabled = isMockMode();
    const headers = event.context.headers || new Headers();
    if (!headers.has("Authorization") && !mockEnabled) {
      throw createError({ statusCode: 401, statusMessage: "Authorization header required" });
    }
    switch (action) {
      case "sync-date": {
        if (!date) {
          throw createError({ statusCode: 400, statusMessage: "date parameter required for sync-date action" });
        }
        logger.info(`Syncing metrics for ${date}`);
        const result = await syncMetricsForDate({
          scope: options.scope,
          identifier: options.githubOrg || options.githubEnt || "unknown",
          date,
          teamSlug: options.githubTeam,
          headers
        });
        return { action: "sync-date", result };
      }
      case "sync-range": {
        if (!options.since || !options.until) {
          throw createError({ statusCode: 400, statusMessage: "since and until parameters required for sync-range action" });
        }
        logger.info(`Syncing metrics from ${options.since} to ${options.until}`);
        const results = await syncMetricsForDateRange(
          options.scope,
          options.githubOrg || options.githubEnt || "unknown",
          options.since,
          options.until,
          headers,
          options.githubTeam
        );
        const successCount = results.filter((r) => r.success).length;
        const failureCount = results.filter((r) => !r.success).length;
        return {
          action: "sync-range",
          totalDays: results.length,
          successCount,
          failureCount,
          results
        };
      }
      case "sync-gaps": {
        if (!options.since || !options.until) {
          throw createError({ statusCode: 400, statusMessage: "since and until parameters required for sync-gaps action" });
        }
        logger.info(`Syncing gaps from ${options.since} to ${options.until}`);
        const results = await syncGaps(
          options.scope,
          options.githubOrg || options.githubEnt || "unknown",
          options.since,
          options.until,
          headers,
          options.githubTeam
        );
        const successCount = results.filter((r) => r.success).length;
        const failureCount = results.filter((r) => !r.success).length;
        return {
          action: "sync-gaps",
          gapsFilled: results.length,
          successCount,
          failureCount,
          results
        };
      }
      case "sync-bulk": {
        logger.info(`Running bulk sync for ${options.scope}:${options.githubOrg || options.githubEnt}`);
        const bulkResult = await syncBulk(
          options.scope,
          options.githubOrg || options.githubEnt || "unknown",
          headers,
          options.githubTeam
        );
        return {
          action: "sync-bulk",
          ...bulkResult
        };
      }
      case "sync-user-metrics": {
        logger.info(`Running user metrics sync for ${options.scope}:${options.githubOrg || options.githubEnt}`);
        const userResult = await syncUserMetrics(
          options.scope,
          options.githubOrg || options.githubEnt || "unknown",
          headers,
          options.githubTeam
        );
        return {
          action: "sync-user-metrics",
          ...userResult
        };
      }
      default:
        throw createError({
          statusCode: 400,
          statusMessage: JSON.stringify({ error: `Unknown action: ${action}` })
        });
    }
  } catch (error) {
    logger.error("Error in sync endpoint:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw createError({
      statusCode: 500,
      statusMessage: JSON.stringify({ error: "Sync failed", message: errorMessage })
    });
  }
});

export { sync_post as default };
//# sourceMappingURL=sync.post.mjs.map
