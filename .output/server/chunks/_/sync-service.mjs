import { a as getPool, h as hasMetrics, f as fetchLatestUserReport, b as fetchLatestReport, e as fetchReportForDate, t as transformDayToMetrics, s as saveMetrics, $ as $fetch$1 } from '../nitro/nitro.mjs';
import { h as hasUserMetrics, s as saveUserMetrics } from './user-metrics-storage.mjs';

async function saveSyncStatus(status) {
  var _a, _b, _c;
  const pool = getPool();
  await pool.query(
    `INSERT INTO sync_status (scope, identifier, team_slug, metrics_date, status, error_message, attempt_count, last_attempt_at, completed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (scope, identifier, team_slug, metrics_date)
     DO UPDATE SET status = $5, error_message = $6, attempt_count = $7, last_attempt_at = $8, completed_at = $9`,
    [
      status.scope,
      status.scopeIdentifier,
      status.teamSlug || "",
      status.metricsDate,
      status.status,
      (_a = status.errorMessage) != null ? _a : null,
      status.attemptCount,
      (_b = status.lastAttemptAt) != null ? _b : null,
      (_c = status.completedAt) != null ? _c : null
    ]
  );
}
async function getSyncStatus(scope, scopeIdentifier, metricsDate, teamSlug) {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT scope, identifier, team_slug, metrics_date, status, error_message,
            attempt_count, last_attempt_at, completed_at, created_at
     FROM sync_status
     WHERE scope = $1 AND identifier = $2 AND team_slug = $3 AND metrics_date = $4`,
    [scope, scopeIdentifier, teamSlug || "", metricsDate]
  );
  if (rows.length === 0) return null;
  return rowToSyncStatus(rows[0]);
}
async function createPendingSyncStatus(scope, scopeIdentifier, metricsDate, teamSlug) {
  const status = {
    scope,
    scopeIdentifier,
    teamSlug,
    metricsDate,
    status: "pending",
    attemptCount: 0,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await saveSyncStatus(status);
  return status;
}
async function markSyncInProgress(scope, scopeIdentifier, metricsDate, teamSlug) {
  const pool = getPool();
  const { rowCount } = await pool.query(
    `UPDATE sync_status SET status = 'in_progress', attempt_count = attempt_count + 1, last_attempt_at = NOW()
     WHERE scope = $1 AND identifier = $2 AND team_slug = $3 AND metrics_date = $4`,
    [scope, scopeIdentifier, teamSlug || "", metricsDate]
  );
  if (rowCount === 0) throw new Error("Sync status not found");
}
async function markSyncCompleted(scope, scopeIdentifier, metricsDate, teamSlug) {
  const pool = getPool();
  const { rowCount } = await pool.query(
    `UPDATE sync_status SET status = 'completed', completed_at = NOW()
     WHERE scope = $1 AND identifier = $2 AND team_slug = $3 AND metrics_date = $4`,
    [scope, scopeIdentifier, teamSlug || "", metricsDate]
  );
  if (rowCount === 0) throw new Error("Sync status not found");
}
async function markSyncFailed(scope, scopeIdentifier, metricsDate, errorMessage, teamSlug) {
  const pool = getPool();
  const { rowCount } = await pool.query(
    `UPDATE sync_status SET status = 'failed', error_message = $5
     WHERE scope = $1 AND identifier = $2 AND team_slug = $3 AND metrics_date = $4`,
    [scope, scopeIdentifier, teamSlug || "", metricsDate, errorMessage]
  );
  if (rowCount === 0) throw new Error("Sync status not found");
}
async function getPendingSyncs() {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT * FROM sync_status WHERE status = 'pending' ORDER BY created_at DESC`
  );
  return rows.map(rowToSyncStatus);
}
async function getFailedSyncs() {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT * FROM sync_status WHERE status = 'failed' ORDER BY created_at DESC`
  );
  return rows.map(rowToSyncStatus);
}
function rowToSyncStatus(row) {
  return {
    scope: row.scope,
    scopeIdentifier: row.identifier,
    teamSlug: row.team_slug || void 0,
    metricsDate: row.metrics_date.toISOString().split("T")[0],
    status: row.status,
    errorMessage: row.error_message,
    attemptCount: row.attempt_count,
    lastAttemptAt: row.last_attempt_at ? row.last_attempt_at.toISOString() : void 0,
    completedAt: row.completed_at ? row.completed_at.toISOString() : void 0,
    createdAt: row.created_at.toISOString()
  };
}

typeof $fetch !== "undefined" ? $fetch : $fetch$1;
async function saveDayData(scope, identifier, dayData, teamSlug) {
  const metrics = transformDayToMetrics(dayData);
  await saveMetrics(scope, identifier, dayData.day, metrics, teamSlug, dayData);
}
async function syncBulk(scope, identifier, headers, teamSlug) {
  const logger = console;
  const result = {
    success: true,
    totalDays: 0,
    savedDays: 0,
    skippedDays: 0,
    errors: []
  };
  try {
    const request = { scope, identifier, teamSlug };
    logger.info(`Starting bulk sync for ${scope}:${identifier}`);
    const report = await fetchLatestReport(request, headers);
    result.totalDays = report.day_totals.length;
    logger.info(`Downloaded report with ${result.totalDays} days (${report.report_start_day} to ${report.report_end_day})`);
    for (const dayData of report.day_totals) {
      try {
        const exists = await hasMetrics(scope, identifier, dayData.day, teamSlug);
        if (exists) {
          result.skippedDays++;
          continue;
        }
        await saveDayData(scope, identifier, dayData, teamSlug);
        result.savedDays++;
        logger.info(`Saved metrics for ${dayData.day}`);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        result.errors.push({ date: dayData.day, error: msg });
        logger.error(`Failed to save ${dayData.day}: ${msg}`);
      }
    }
    result.success = result.errors.length === 0;
    logger.info(`Bulk sync complete: ${result.savedDays} saved, ${result.skippedDays} skipped, ${result.errors.length} errors`);
    return result;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`Bulk sync failed: ${msg}`);
    return { ...result, success: false, errors: [{ date: "bulk", error: msg }] };
  }
}
async function syncMetricsForDate(request) {
  const { scope, identifier, date, teamSlug, headers } = request;
  const logger = console;
  try {
    const exists = await hasMetrics(scope, identifier, date, teamSlug);
    if (exists) {
      logger.info(`Metrics for ${date} already synced, skipping`);
      return { success: true, date, metricsCount: 1 };
    }
    const syncStatus = await getSyncStatus(scope, identifier, date, teamSlug);
    if (!syncStatus) {
      await createPendingSyncStatus(scope, identifier, date, teamSlug);
    }
    await markSyncInProgress(scope, identifier, date, teamSlug);
    logger.info(`Fetching metrics for ${scope}:${identifier} on ${date}`);
    const apiRequest = { scope, identifier, teamSlug };
    const report = await fetchReportForDate(apiRequest, headers, date);
    let syncedCount = 0;
    for (const dayData of report.day_totals) {
      if (dayData.day === date) {
        await saveDayData(scope, identifier, dayData, teamSlug);
        syncedCount++;
        logger.info(`Saved metrics for ${date}`);
      }
    }
    await markSyncCompleted(scope, identifier, date, teamSlug);
    return { success: true, date, metricsCount: syncedCount };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to sync metrics for ${date}:`, errorMessage);
    try {
      await markSyncFailed(scope, identifier, date, errorMessage, teamSlug);
    } catch (statusError) {
      logger.error("Failed to update sync status:", statusError);
    }
    return { success: false, date, error: errorMessage, metricsCount: 0 };
  }
}
async function syncMetricsForDateRange(scope, identifier, startDate, endDate, headers, teamSlug) {
  const logger = console;
  const request = { scope, identifier};
  const report = await fetchLatestReport(request, headers);
  const results = [];
  for (const dayData of report.day_totals) {
    if (dayData.day < startDate || dayData.day > endDate) continue;
    try {
      const exists = await hasMetrics(scope, identifier, dayData.day, teamSlug);
      if (exists) {
        results.push({ success: true, date: dayData.day, metricsCount: 1 });
        continue;
      }
      await saveDayData(scope, identifier, dayData, teamSlug);
      results.push({ success: true, date: dayData.day, metricsCount: 1 });
      logger.info(`Saved metrics for ${dayData.day}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      results.push({ success: false, date: dayData.day, error: msg, metricsCount: 0 });
    }
  }
  return results;
}
async function detectGaps(scope, identifier, startDate, endDate, teamSlug) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const missingDates = [];
  const current = new Date(start);
  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];
    const exists = await hasMetrics(scope, identifier, dateStr, teamSlug);
    if (!exists) {
      missingDates.push(dateStr);
    }
    current.setDate(current.getDate() + 1);
  }
  return missingDates;
}
async function syncGaps(scope, identifier, startDate, endDate, headers, teamSlug) {
  const missingDates = await detectGaps(scope, identifier, startDate, endDate, teamSlug);
  if (missingDates.length === 0) {
    console.log("No gaps detected, all dates already synced");
    return [];
  }
  console.log(`Found ${missingDates.length} missing dates, syncing via bulk download...`);
  const request = { scope, identifier};
  const report = await fetchLatestReport(request, headers);
  const missingSet = new Set(missingDates);
  const results = [];
  for (const dayData of report.day_totals) {
    if (!missingSet.has(dayData.day)) continue;
    try {
      await saveDayData(scope, identifier, dayData, teamSlug);
      results.push({ success: true, date: dayData.day, metricsCount: 1 });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      results.push({ success: false, date: dayData.day, error: msg, metricsCount: 0 });
    }
  }
  return results;
}
async function getSyncStats(scope, identifier, startDate, endDate, teamSlug) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let totalDays = 0;
  let syncedDays = 0;
  const missingDates = [];
  const current = new Date(start);
  while (current <= end) {
    totalDays++;
    const dateStr = current.toISOString().split("T")[0];
    const exists = await hasMetrics(scope, identifier, dateStr, teamSlug);
    if (exists) {
      syncedDays++;
    } else {
      missingDates.push(dateStr);
    }
    current.setDate(current.getDate() + 1);
  }
  return { totalDays, syncedDays, missingDays: totalDays - syncedDays, missingDates };
}
async function syncUserMetrics(scope, identifier, headers, teamSlug) {
  const logger = console;
  try {
    const request = { scope, identifier, teamSlug };
    logger.info(`Starting user metrics sync for ${scope}:${identifier}`);
    const report = await fetchLatestUserReport(request, headers);
    if (!report.user_totals || report.user_totals.length === 0) {
      logger.info("No user totals in report, skipping save");
      return {
        success: true,
        reportStartDay: report.report_start_day,
        reportEndDay: report.report_end_day,
        userCount: 0
      };
    }
    const alreadySynced = await hasUserMetrics(
      scope,
      identifier,
      report.report_start_day,
      report.report_end_day
    );
    if (alreadySynced) {
      logger.info(`User metrics for ${report.report_start_day}\u2013${report.report_end_day} already synced, skipping`);
      return {
        success: true,
        reportStartDay: report.report_start_day,
        reportEndDay: report.report_end_day,
        userCount: report.user_totals.length
      };
    }
    await saveUserMetrics(scope, identifier, report.report_start_day, report.report_end_day, report.user_totals);
    logger.info(`Saved user metrics: ${report.user_totals.length} users for ${report.report_start_day}\u2013${report.report_end_day}`);
    return {
      success: true,
      reportStartDay: report.report_start_day,
      reportEndDay: report.report_end_day,
      userCount: report.user_totals.length
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`User metrics sync failed: ${msg}`);
    return {
      success: false,
      reportStartDay: "",
      reportEndDay: "",
      userCount: 0,
      error: msg
    };
  }
}

export { getPendingSyncs as a, getFailedSyncs as b, syncBulk as c, syncGaps as d, syncMetricsForDateRange as e, syncMetricsForDate as f, getSyncStats as g, syncUserMetrics as s };
//# sourceMappingURL=sync-service.mjs.map
