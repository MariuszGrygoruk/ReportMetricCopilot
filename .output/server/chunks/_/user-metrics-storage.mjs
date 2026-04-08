import { a as getPool } from '../nitro/nitro.mjs';

async function saveUserMetrics(scope, scopeIdentifier, reportStartDay, reportEndDay, userTotals) {
  const pool = getPool();
  await pool.query(
    `INSERT INTO user_metrics (scope, identifier, report_start_day, report_end_day, user_totals)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (scope, identifier, report_start_day, report_end_day)
     DO UPDATE SET user_totals = $5, updated_at = NOW()`,
    [scope, scopeIdentifier, reportStartDay, reportEndDay, JSON.stringify(userTotals)]
  );
}
async function getLatestUserMetrics(scope, scopeIdentifier) {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT report_start_day, report_end_day, user_totals
     FROM user_metrics
     WHERE scope = $1 AND identifier = $2
     ORDER BY report_end_day DESC LIMIT 1`,
    [scope, scopeIdentifier]
  );
  if (rows.length === 0) return null;
  return {
    reportStartDay: rows[0].report_start_day,
    reportEndDay: rows[0].report_end_day,
    userTotals: rows[0].user_totals
  };
}
async function hasUserMetrics(scope, scopeIdentifier, reportStartDay, reportEndDay) {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT 1 FROM user_metrics
     WHERE scope = $1 AND identifier = $2
       AND report_start_day = $3 AND report_end_day = $4
     LIMIT 1`,
    [scope, scopeIdentifier, reportStartDay, reportEndDay]
  );
  return rows.length > 0;
}
function calcAcceptanceRate(generated, accepted) {
  return generated > 0 ? parseFloat((accepted / generated * 100).toFixed(1)) : 0;
}
async function getUserTimeSeries(scope, scopeIdentifier, login) {
  var _a;
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT report_end_day, user_totals
     FROM user_metrics
     WHERE scope = $1 AND identifier = $2
     ORDER BY report_end_day ASC`,
    [scope, scopeIdentifier]
  );
  const series = [];
  for (const row of rows) {
    const totals = row.user_totals;
    const user = totals.find((u) => u.login === login);
    if (!user) continue;
    const gen = user.code_generation_activity_count;
    const acc = user.code_acceptance_activity_count;
    series.push({
      report_end_day: new Date(row.report_end_day).toISOString().slice(0, 10),
      total_active_days: user.total_active_days,
      user_initiated_interaction_count: user.user_initiated_interaction_count,
      code_generation_activity_count: gen,
      code_acceptance_activity_count: acc,
      loc_added_sum: user.loc_added_sum,
      premium_requests_total: (_a = user.premium_requests_total) != null ? _a : 0,
      acceptance_rate: calcAcceptanceRate(gen, acc)
    });
  }
  return series;
}
async function getUserMetricsHistory(scope, scopeIdentifier) {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT report_start_day, report_end_day, user_totals
     FROM user_metrics
     WHERE scope = $1 AND identifier = $2
     ORDER BY report_end_day ASC`,
    [scope, scopeIdentifier]
  );
  return rows.map((row) => {
    const totals = row.user_totals;
    const total_gen = totals.reduce((s, u) => s + u.code_generation_activity_count, 0);
    const total_acc = totals.reduce((s, u) => s + u.code_acceptance_activity_count, 0);
    return {
      report_start_day: new Date(row.report_start_day).toISOString().slice(0, 10),
      report_end_day: new Date(row.report_end_day).toISOString().slice(0, 10),
      total_users: totals.length,
      active_users: totals.filter((u) => u.total_active_days >= 7).length,
      total_premium_requests: totals.reduce((s, u) => {
        var _a;
        return s + ((_a = u.premium_requests_total) != null ? _a : 0);
      }, 0),
      avg_acceptance_rate: calcAcceptanceRate(total_gen, total_acc)
    };
  });
}

export { getUserMetricsHistory as a, getLatestUserMetrics as b, getUserTimeSeries as g, hasUserMetrics as h, saveUserMetrics as s };
//# sourceMappingURL=user-metrics-storage.mjs.map
