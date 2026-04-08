import { d as defineEventHandler, j as getMetricsDataV2, c as createError } from '../../nitro/nitro.mjs';
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
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
class BreakdownData {
  constructor(data) {
    __publicField(this, "language");
    __publicField(this, "editor");
    __publicField(this, "suggestions_count");
    __publicField(this, "acceptances_count");
    __publicField(this, "lines_suggested");
    __publicField(this, "lines_accepted");
    __publicField(this, "active_users");
    __publicField(this, "chat_acceptances");
    __publicField(this, "chat_turns");
    __publicField(this, "active_chat_users");
    this.language = data.language;
    this.editor = data.editor;
    this.suggestions_count = data.suggestions_count;
    this.acceptances_count = data.acceptances_count;
    this.lines_suggested = data.lines_suggested;
    this.lines_accepted = data.lines_accepted;
    this.active_users = data.active_users;
    this.chat_acceptances = data.chat_acceptances;
    this.chat_turns = data.chat_turns;
    this.active_chat_users = data.active_chat_users;
  }
}
class Metrics {
  constructor(data) {
    __publicField(this, "total_suggestions_count");
    __publicField(this, "total_acceptances_count");
    __publicField(this, "total_lines_suggested");
    __publicField(this, "total_lines_accepted");
    __publicField(this, "total_active_users");
    __publicField(this, "total_chat_acceptances");
    __publicField(this, "total_chat_turns");
    __publicField(this, "total_active_chat_users");
    __publicField(this, "acceptance_rate_by_count");
    __publicField(this, "acceptance_rate_by_lines");
    __publicField(this, "day");
    __publicField(this, "breakdown");
    this.total_suggestions_count = data.total_suggestions_count;
    this.total_acceptances_count = data.total_acceptances_count;
    this.total_lines_suggested = data.total_lines_suggested;
    this.total_lines_accepted = data.total_lines_accepted;
    this.total_active_users = data.total_active_users;
    this.total_chat_acceptances = data.total_chat_acceptances;
    this.total_chat_turns = data.total_chat_turns;
    this.total_active_chat_users = data.total_active_chat_users;
    this.day = data.day;
    this.breakdown = data.breakdown.map((item) => new BreakdownData(item));
    this.acceptance_rate_by_count = this.total_suggestions_count !== 0 ? this.total_acceptances_count / this.total_suggestions_count * 100 : 0;
    this.acceptance_rate_by_lines = this.total_lines_suggested !== 0 ? this.total_lines_accepted / this.total_lines_suggested * 100 : 0;
  }
}

const convertToMetrics = (copilotMetrics) => {
  try {
    if (!copilotMetrics || copilotMetrics.length === 0) {
      return [];
    }
    const usageData = copilotMetrics.map((metric) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i;
      if (!metric) {
        return new Metrics({
          day: "",
          total_suggestions_count: 0,
          total_acceptances_count: 0,
          total_lines_suggested: 0,
          total_lines_accepted: 0,
          total_active_users: 0,
          total_chat_acceptances: 0,
          total_chat_turns: 0,
          total_active_chat_users: 0,
          breakdown: []
        });
      }
      const breakdown = [];
      (_b = (_a = metric.copilot_ide_code_completions) == null ? void 0 : _a.editors) == null ? void 0 : _b.forEach((editor) => {
        if (editor && editor.models) {
          editor.models.forEach((model) => {
            if (model && model.languages) {
              model.languages.forEach((language) => {
                if (language) {
                  breakdown.push(new BreakdownData({
                    language: language.name,
                    editor: editor.name,
                    suggestions_count: language.total_code_suggestions || 0,
                    acceptances_count: language.total_code_acceptances || 0,
                    lines_suggested: language.total_code_lines_suggested || 0,
                    lines_accepted: language.total_code_lines_accepted || 0,
                    active_users: language.total_engaged_users || 0
                  }));
                }
              });
            }
          });
        }
      });
      const totalChatInsertions = ((_d = (_c = metric.copilot_ide_chat) == null ? void 0 : _c.editors) == null ? void 0 : _d.reduce((sum, editor) => {
        if (editor && editor.models) {
          return sum + editor.models.reduce((modelSum, model) => {
            return modelSum + ((model == null ? void 0 : model.total_chat_insertion_events) || 0);
          }, 0);
        }
        return sum;
      }, 0)) || 0;
      const totalChatCopies = ((_f = (_e = metric.copilot_ide_chat) == null ? void 0 : _e.editors) == null ? void 0 : _f.reduce((sum, editor) => {
        if (editor && editor.models) {
          return sum + editor.models.reduce((modelSum, model) => {
            return modelSum + ((model == null ? void 0 : model.total_chat_copy_events) || 0);
          }, 0);
        }
        return sum;
      }, 0)) || 0;
      const totalChatTurns = ((_h = (_g = metric.copilot_ide_chat) == null ? void 0 : _g.editors) == null ? void 0 : _h.reduce((sum, editor) => {
        if (editor && editor.models) {
          return sum + editor.models.reduce((modelSum, model) => {
            return modelSum + ((model == null ? void 0 : model.total_chats) || 0);
          }, 0);
        }
        return sum;
      }, 0)) || 0;
      return new Metrics({
        day: metric.date,
        total_suggestions_count: breakdown.reduce((sum, item) => sum + (item.suggestions_count || 0), 0),
        total_acceptances_count: breakdown.reduce((sum, item) => sum + (item.acceptances_count || 0), 0),
        total_lines_suggested: breakdown.reduce((sum, item) => sum + (item.lines_suggested || 0), 0),
        total_lines_accepted: breakdown.reduce((sum, item) => sum + (item.lines_accepted || 0), 0),
        total_active_users: metric.total_active_users || 0,
        total_chat_acceptances: totalChatInsertions + totalChatCopies,
        total_chat_turns: totalChatTurns,
        total_active_chat_users: ((_i = metric.copilot_ide_chat) == null ? void 0 : _i.total_engaged_users) || 0,
        breakdown
      });
    });
    return usageData;
  } catch (error) {
    console.error("Error converting metrics to usage format:", error);
    return [];
  }
};

function sortMetricsByDay(metrics) {
  return [...metrics].sort((left, right) => left.day.localeCompare(right.day));
}
const metrics = defineEventHandler(async (event) => {
  const logger = console;
  try {
    const { metrics: usageData, reportData } = await getMetricsDataV2(event);
    const metricsData = sortMetricsByDay(convertToMetrics(usageData));
    const result = { metrics: metricsData, usage: usageData, reportData };
    return result;
  } catch (error) {
    logger.error("Error fetching metrics data:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const statusCode = error && typeof error === "object" && "statusCode" in error ? error.statusCode : 500;
    throw createError({ statusCode, statusMessage: "Error fetching metrics data: " + errorMessage });
  }
});

export { metrics as default };
//# sourceMappingURL=metrics.mjs.map
