import { d as defineEventHandler, g as getQuery, O as Options, c as createError } from '../../nitro/nitro.mjs';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { a as getLatestSeats } from '../../_/seats-storage.mjs';
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

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
class Seat {
  constructor(data) {
    __publicField(this, "login");
    __publicField(this, "id");
    __publicField(this, "team");
    __publicField(this, "created_at");
    __publicField(this, "last_activity_at");
    __publicField(this, "last_activity_editor");
    __publicField(this, "plan_type");
    this.login = data.assignee ? data.assignee.login : "deprecated";
    this.id = data.assignee ? data.assignee.id : 0;
    this.team = data.assigning_team ? data.assigning_team.name : "";
    this.created_at = data.created_at;
    this.last_activity_at = data.last_activity_at;
    this.last_activity_editor = data.last_activity_editor;
    this.plan_type = data.plan_type;
  }
}

const UI_MAX_PER_PAGE = 300;
const GITHUB_PER_PAGE = 100;
async function fetchAllTeamMembers(options, headers) {
  if (!(options.scope === "team-organization" || options.scope === "team-enterprise") || !options.githubTeam) {
    return [];
  }
  const membersUrl = options.getTeamMembersApiUrl();
  const perPage = 100;
  let page = 1;
  const members = [];
  while (true) {
    const pageData = await $fetch(membersUrl, {
      headers,
      params: { per_page: perPage, page }
    });
    if (!Array.isArray(pageData) || pageData.length === 0) break;
    members.push(...pageData);
    if (pageData.length < perPage) break;
    page += 1;
  }
  return members;
}
function deduplicateSeats(seats) {
  const uniqueSeats = /* @__PURE__ */ new Map();
  for (const seat of seats) {
    if (!seat.id || seat.id === 0) {
      continue;
    }
    const existingSeat = uniqueSeats.get(seat.id);
    if (!existingSeat) {
      uniqueSeats.set(seat.id, seat);
    } else {
      const seatActivity = seat.last_activity_at || "1970-01-01T00:00:00Z";
      const existingActivity = existingSeat.last_activity_at || "1970-01-01T00:00:00Z";
      if (seatActivity > existingActivity) {
        uniqueSeats.set(seat.id, seat);
      }
    }
  }
  return Array.from(uniqueSeats.values());
}
function paginateSeats(allSeats, page, perPage) {
  const total_seats = allSeats.length;
  const total_pages = Math.max(1, Math.ceil(total_seats / perPage));
  const safePage = Math.min(Math.max(1, page), total_pages);
  const start = (safePage - 1) * perPage;
  return {
    seats: allSeats.slice(start, start + perPage),
    total_seats,
    page: safePage,
    per_page: perPage,
    total_pages
  };
}
const seats = defineEventHandler(async (event) => {
  var _a, _b, _c;
  const logger = console;
  const query = getQuery(event);
  const options = Options.fromQuery(query);
  const uiPage = Math.max(1, parseInt(String((_a = query.page) != null ? _a : "1"), 10) || 1);
  const uiPerPage = Math.min(
    UI_MAX_PER_PAGE,
    Math.max(1, parseInt(String((_b = query.per_page) != null ? _b : "300"), 10) || 300)
  );
  const apiUrl = options.getSeatsApiUrl();
  const mockedDataPath = options.getSeatsMockDataPath();
  if (options.isDataMocked && mockedDataPath) {
    const path = resolve(mockedDataPath);
    const data = readFileSync(path, "utf8");
    const dataJson = JSON.parse(data);
    const seatsData2 = deduplicateSeats(
      dataJson.seats.map((item) => new Seat(item))
    );
    logger.info("Using mocked data");
    return paginateSeats(seatsData2, uiPage, uiPerPage);
  }
  if (!((_c = event.context.headers) == null ? void 0 : _c.has("Authorization"))) {
    if (process.env.ENABLE_HISTORICAL_MODE === "true") {
      logger.info("No auth in historical mode, serving latest seats from storage");
      const scope = options.scope || "organization";
      const identifier = options.githubOrg || options.githubEnt || "";
      const stored = identifier ? await getLatestSeats(scope, identifier) : null;
      const seats = stored ? deduplicateSeats(stored) : [];
      return paginateSeats(seats, uiPage, uiPerPage);
    }
    logger.error("No Authentication provided");
    throw createError({ statusCode: 401, statusMessage: "No Authentication provided" });
  }
  if (process.env.ENABLE_HISTORICAL_MODE === "true") {
    const scope = options.scope || "organization";
    const identifier = options.githubOrg || options.githubEnt || "";
    if (identifier) {
      const stored = await getLatestSeats(scope, identifier);
      if (stored) {
        logger.info(`Serving ${stored.length} seats from storage`);
        return paginateSeats(deduplicateSeats(stored), uiPage, uiPerPage);
      }
      logger.info("No seats in storage yet, falling back to live API");
    }
  }
  const teamMembers = await fetchAllTeamMembers(options, event.context.headers);
  const isOrgOnly = options.scope === "organization";
  if (isOrgOnly) {
    const offsetStart = (uiPage - 1) * uiPerPage;
    const offsetEnd = offsetStart + uiPerPage;
    const ghPageStart = Math.floor(offsetStart / GITHUB_PER_PAGE) + 1;
    const ghPageEnd = Math.ceil(offsetEnd / GITHUB_PER_PAGE);
    const localOffset = offsetStart - (ghPageStart - 1) * GITHUB_PER_PAGE;
    let firstResponse2;
    logger.info(`Fetching GitHub page ${ghPageStart} of seats for org scope (UI page ${uiPage})`);
    try {
      firstResponse2 = await $fetch(apiUrl, {
        headers: event.context.headers,
        params: { per_page: GITHUB_PER_PAGE, page: ghPageStart }
      });
    } catch (error) {
      logger.error("Error fetching seats data:", error);
      const status = typeof error === "object" && error && "statusCode" in error ? error.statusCode : 500;
      throw createError({ statusCode: status || 500, statusMessage: "Error fetching seats data. Error: " + String(error) });
    }
    const totalSeats = firstResponse2.total_seats;
    const totalPages = Math.max(1, Math.ceil(totalSeats / uiPerPage));
    const ghTotalPages = Math.ceil(totalSeats / GITHUB_PER_PAGE);
    const safeGhPageEnd = Math.min(ghPageEnd, ghTotalPages);
    let fetched = firstResponse2.seats.map((item) => new Seat(item));
    for (let p = ghPageStart + 1; p <= safeGhPageEnd; p++) {
      const resp = await $fetch(apiUrl, {
        headers: event.context.headers,
        params: { per_page: GITHUB_PER_PAGE, page: p }
      });
      fetched = fetched.concat(resp.seats.map((item) => new Seat(item)));
    }
    const deduped = deduplicateSeats(fetched);
    const pageSeats = deduped.slice(localOffset, localOffset + uiPerPage);
    return {
      seats: pageSeats,
      total_seats: totalSeats,
      page: uiPage,
      per_page: uiPerPage,
      total_pages: totalPages
    };
  }
  let firstResponse;
  logger.info(`Fetching 1st page of seats data from ${apiUrl}`);
  try {
    firstResponse = await $fetch(apiUrl, {
      headers: event.context.headers,
      params: { per_page: GITHUB_PER_PAGE, page: 1 }
    });
  } catch (error) {
    logger.error("Error fetching seats data:", error);
    const status = typeof error === "object" && error && "statusCode" in error ? error.statusCode : 500;
    throw createError({ statusCode: status || 500, statusMessage: "Error fetching seats data. Error: " + String(error) });
  }
  let seatsData = firstResponse.seats.map((item) => new Seat(item));
  const totalGhPages = Math.ceil(firstResponse.total_seats / GITHUB_PER_PAGE);
  for (let p = 2; p <= totalGhPages; p++) {
    const resp = await $fetch(apiUrl, {
      headers: event.context.headers,
      params: { per_page: GITHUB_PER_PAGE, page: p }
    });
    seatsData = seatsData.concat(resp.seats.map((item) => new Seat(item)));
  }
  let deduplicatedSeats = deduplicateSeats(seatsData);
  if (teamMembers.length > 0) {
    deduplicatedSeats = deduplicatedSeats.filter(
      (seat) => teamMembers.some((member) => member.id === seat.id)
    );
  }
  return paginateSeats(deduplicatedSeats, uiPage, uiPerPage);
});

export { seats as default, fetchAllTeamMembers };
//# sourceMappingURL=seats.mjs.map
