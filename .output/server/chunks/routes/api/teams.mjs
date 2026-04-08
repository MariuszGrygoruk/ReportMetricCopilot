import { d as defineEventHandler, c as createError, g as getQuery, O as Options, u as useRuntimeConfig } from '../../nitro/nitro.mjs';
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

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, key + "" , value);
class TeamsError extends Error {
  constructor(message, statusCode) {
    super(message);
    __publicField(this, "statusCode");
    this.name = "TeamsError";
    this.statusCode = statusCode;
  }
}
function parseLinkHeader(linkHeader) {
  const links = {};
  if (!linkHeader) return links;
  for (const part of linkHeader.split(",")) {
    const section = part.trim();
    const match = section.match(/^<([^>]+)>;\s*rel="([^"]+)"/);
    if (match) {
      const [, url, rel] = match;
      links[rel] = url;
    }
  }
  return links;
}
const teams = defineEventHandler(async (event) => {
  const logger = console;
  try {
    const teamsData = await getTeams(event);
    return teamsData;
  } catch (error) {
    logger.error("Error fetching teams data:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const statusCode = error && typeof error === "object" && "statusCode" in error ? error.statusCode : 500;
    throw createError({ statusCode, statusMessage: "Error fetching teams data: " + errorMessage });
  }
});
async function getTeams(event) {
  var _a;
  const logger = console;
  const query = getQuery(event);
  const options = Options.fromQuery(query);
  const config = useRuntimeConfig();
  if (!options.scope && config.public.scope) options.scope = config.public.scope;
  if (!options.githubOrg && config.public.githubOrg) options.githubOrg = config.public.githubOrg;
  if (!options.githubEnt && config.public.githubEnt) options.githubEnt = config.public.githubEnt;
  if (options.isDataMocked) {
    logger.info("Using mocked data for teams");
    const teams = [
      { name: "The A Team", slug: "the-a-team", description: "A team of elite agents" },
      { name: "Development Team", slug: "dev-team", description: "Team responsible for development" },
      { name: "Frontend Team", slug: "frontend-team", description: "Team responsible for frontend development" },
      { name: "Backend Team", slug: "backend-team", description: "Team responsible for backend development" },
      { name: "QA Team", slug: "qa-team", description: "Team responsible for quality assurance" }
    ];
    return teams;
  }
  if (!((_a = event.context.headers) == null ? void 0 : _a.has("Authorization"))) {
    logger.error("No Authentication provided");
    throw new TeamsError("No Authentication provided", 401);
  }
  const baseUrl = options.getTeamsApiUrl();
  const allTeams = [];
  let nextUrl = `${baseUrl}?per_page=100`;
  let page = 1;
  while (nextUrl) {
    logger.info(`Fetching teams page ${page} from ${nextUrl}`);
    const res = await $fetch.raw(nextUrl, {
      headers: event.context.headers
    });
    const data = res._data;
    for (const t of data) {
      const name = t.name;
      const slug = t.slug;
      const description = t.description || "";
      if (name && slug) allTeams.push({ name, slug, description });
    }
    const linkHeader = res.headers.get("link") || res.headers.get("Link");
    const links = parseLinkHeader(linkHeader);
    nextUrl = links["next"] || null;
    page += 1;
  }
  return allTeams;
}

export { teams as default, getTeams };
//# sourceMappingURL=teams.mjs.map
