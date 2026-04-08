import { a as getPool } from '../nitro/nitro.mjs';

async function getLatestSeats(scope, scopeIdentifier) {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT seats FROM seats WHERE scope = $1 AND identifier = $2
     ORDER BY snapshot_date DESC LIMIT 1`,
    [scope, scopeIdentifier]
  );
  return rows.length > 0 ? rows[0].seats : null;
}
async function getSeatsHistorySummary(scope, scopeIdentifier) {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT snapshot_date, seats
     FROM seats
     WHERE scope = $1 AND identifier = $2
     ORDER BY snapshot_date ASC`,
    [scope, scopeIdentifier]
  );
  const MS_7D = 7 * 24 * 60 * 60 * 1e3;
  const MS_30D = 30 * 24 * 60 * 60 * 1e3;
  return rows.map((row) => {
    const snapshotMs = new Date(row.snapshot_date).getTime();
    const seats = row.seats;
    let never_active = 0;
    let inactive_7d = 0;
    let inactive_30d = 0;
    for (const seat of seats) {
      if (!seat.last_activity_at) {
        never_active++;
        inactive_7d++;
        inactive_30d++;
      } else {
        const activityMs = new Date(seat.last_activity_at).getTime();
        if (snapshotMs - activityMs > MS_7D) inactive_7d++;
        if (snapshotMs - activityMs > MS_30D) inactive_30d++;
      }
    }
    return {
      snapshot_date: new Date(row.snapshot_date).toISOString().split("T")[0],
      total_seats: seats.length,
      never_active,
      inactive_7d,
      inactive_30d
    };
  });
}

export { getLatestSeats as a, getSeatsHistorySummary as g };
//# sourceMappingURL=seats-storage.mjs.map
