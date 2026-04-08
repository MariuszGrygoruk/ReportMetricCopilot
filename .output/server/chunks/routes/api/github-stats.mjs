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

const githubStats = defineEventHandler(async (event) => {
  try {
    const { metrics: metricsData, reportData } = await getMetricsDataV2(event);
    const stats = calculateGitHubStats(metricsData, reportData || []);
    return stats;
  } catch (error) {
    const logger = console;
    logger.error("Error in github-stats endpoint:", error);
    throw createError({ statusCode: 500, statusMessage: "Error fetching metrics data: " + (error instanceof Error ? error.message : String(error)) });
  }
});
function calculateGitHubStats(metrics, reportData) {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  const totals = metrics.reduce((acc, metric) => {
    var _a2, _b2, _c2, _d2, _e2;
    acc.totalIdeCodeCompletionUsers += ((_a2 = metric.copilot_ide_code_completions) == null ? void 0 : _a2.total_engaged_users) || 0;
    acc.totalIdeChatUsers += ((_b2 = metric.copilot_ide_chat) == null ? void 0 : _b2.total_engaged_users) || 0;
    acc.totalDotcomChatUsers += ((_c2 = metric.copilot_dotcom_chat) == null ? void 0 : _c2.total_engaged_users) || 0;
    acc.totalDotcomPRUsers += ((_d2 = metric.copilot_dotcom_pull_requests) == null ? void 0 : _d2.total_engaged_users) || 0;
    if ((_e2 = metric.copilot_dotcom_pull_requests) == null ? void 0 : _e2.repositories) {
      acc.totalPRSummariesCreated += metric.copilot_dotcom_pull_requests.repositories.reduce((repoSum, repo) => {
        var _a3;
        return repoSum + (((_a3 = repo.models) == null ? void 0 : _a3.reduce((modelSum, model) => {
          return modelSum + (model.total_pr_summaries_created || 0);
        }, 0)) || 0);
      }, 0);
    }
    return acc;
  }, {
    totalIdeCodeCompletionUsers: 0,
    totalIdeChatUsers: 0,
    totalDotcomChatUsers: 0,
    totalDotcomPRUsers: 0,
    totalPRSummariesCreated: 0
  });
  const modelSets = {
    ideCodeCompletion: /* @__PURE__ */ new Set(),
    ideChat: /* @__PURE__ */ new Set(),
    dotcomChat: /* @__PURE__ */ new Set(),
    dotcomPR: /* @__PURE__ */ new Set()
  };
  const modelMaps = {
    ideCodeCompletion: /* @__PURE__ */ new Map(),
    ideChat: /* @__PURE__ */ new Map(),
    dotcomChat: /* @__PURE__ */ new Map(),
    dotcomPR: /* @__PURE__ */ new Map()
  };
  for (const metric of metrics) {
    (_b = (_a = metric.copilot_ide_code_completions) == null ? void 0 : _a.editors) == null ? void 0 : _b.forEach((editor) => {
      var _a2;
      (_a2 = editor.models) == null ? void 0 : _a2.forEach((model) => {
        modelSets.ideCodeCompletion.add(model.name);
        const key = `${model.name}-${editor.name}`;
        if (!modelMaps.ideCodeCompletion.has(key)) {
          modelMaps.ideCodeCompletion.set(key, {
            name: model.name,
            editor: editor.name,
            model_type: model.is_custom_model ? "Custom" : "Default",
            total_engaged_users: 0
          });
        }
        modelMaps.ideCodeCompletion.get(key).total_engaged_users += model.total_engaged_users;
      });
    });
    (_d = (_c = metric.copilot_ide_chat) == null ? void 0 : _c.editors) == null ? void 0 : _d.forEach((editor) => {
      var _a2;
      (_a2 = editor.models) == null ? void 0 : _a2.forEach((model) => {
        modelSets.ideChat.add(model.name);
        const key = `${model.name}-${editor.name}`;
        if (!modelMaps.ideChat.has(key)) {
          modelMaps.ideChat.set(key, {
            name: model.name,
            editor: editor.name,
            model_type: model.is_custom_model ? "Custom" : "Default",
            total_engaged_users: 0,
            total_chats: 0,
            total_chat_insertion_events: 0,
            total_chat_copy_events: 0
          });
        }
        const entry = modelMaps.ideChat.get(key);
        entry.total_engaged_users += model.total_engaged_users;
        entry.total_chats += model.total_chats;
        entry.total_chat_insertion_events += model.total_chat_insertion_events;
        entry.total_chat_copy_events += model.total_chat_copy_events;
      });
    });
    (_f = (_e = metric.copilot_dotcom_chat) == null ? void 0 : _e.models) == null ? void 0 : _f.forEach((model) => {
      modelSets.dotcomChat.add(model.name);
      if (!modelMaps.dotcomChat.has(model.name)) {
        modelMaps.dotcomChat.set(model.name, {
          name: model.name,
          model_type: model.is_custom_model ? "Custom" : "Default",
          total_engaged_users: 0,
          total_chats: 0
        });
      }
      const entry = modelMaps.dotcomChat.get(model.name);
      entry.total_engaged_users += model.total_engaged_users;
      entry.total_chats += model.total_chats;
    });
    (_h = (_g = metric.copilot_dotcom_pull_requests) == null ? void 0 : _g.repositories) == null ? void 0 : _h.forEach((repo) => {
      var _a2;
      (_a2 = repo.models) == null ? void 0 : _a2.forEach((model) => {
        modelSets.dotcomPR.add(model.name);
        const key = `${model.name}-${repo.name}`;
        if (!modelMaps.dotcomPR.has(key)) {
          modelMaps.dotcomPR.set(key, {
            name: model.name,
            repository: repo.name,
            model_type: model.is_custom_model ? "Custom" : "Default",
            total_engaged_users: 0,
            total_pr_summaries_created: 0
          });
        }
        const entry = modelMaps.dotcomPR.get(key);
        entry.total_engaged_users += model.total_engaged_users;
        entry.total_pr_summaries_created += model.total_pr_summaries_created;
      });
    });
  }
  const labels = metrics.map((m) => m.date);
  const agentModeChartData = {
    labels,
    datasets: [
      {
        label: "Code Completions",
        data: metrics.map((m) => {
          var _a2;
          return ((_a2 = m.copilot_ide_code_completions) == null ? void 0 : _a2.total_engaged_users) || 0;
        }),
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.1
      },
      {
        label: "Chat",
        data: metrics.map((m) => {
          var _a2;
          return ((_a2 = m.copilot_ide_chat) == null ? void 0 : _a2.total_engaged_users) || 0;
        }),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        tension: 0.1
      }
    ]
  };
  const modelUsageChartData = {
    labels: ["Code Completions", "Chat"],
    datasets: [{
      label: "Total Models",
      data: [modelSets.ideCodeCompletion.size, modelSets.ideChat.size],
      backgroundColor: ["rgba(75, 192, 192, 0.6)", "rgba(255, 99, 132, 0.6)"],
      borderColor: ["rgb(75, 192, 192)", "rgb(255, 99, 132)"],
      borderWidth: 1
    }]
  };
  const hasReportData = reportData.length > 0;
  const mfMap = /* @__PURE__ */ new Map();
  const featureMap = /* @__PURE__ */ new Map();
  const modelMap = /* @__PURE__ */ new Map();
  for (const day of reportData) {
    for (const mf of day.totals_by_model_feature || []) {
      const key = `${mf.model}|${mf.feature}`;
      const existing = mfMap.get(key);
      if (existing) {
        existing.interactions += mf.user_initiated_interaction_count;
        existing.codeGenerations += mf.code_generation_activity_count;
        existing.codeAcceptances += mf.code_acceptance_activity_count;
        existing.locAdded += mf.loc_added_sum;
        existing.locDeleted += mf.loc_deleted_sum;
      } else {
        mfMap.set(key, {
          model: mf.model,
          feature: mf.feature,
          interactions: mf.user_initiated_interaction_count,
          codeGenerations: mf.code_generation_activity_count,
          codeAcceptances: mf.code_acceptance_activity_count,
          locAdded: mf.loc_added_sum,
          locDeleted: mf.loc_deleted_sum
        });
      }
      const fEntry = featureMap.get(mf.feature) || { feature: mf.feature, interactions: 0, codeGenerations: 0, locAdded: 0 };
      fEntry.interactions += mf.user_initiated_interaction_count;
      fEntry.codeGenerations += mf.code_generation_activity_count;
      fEntry.locAdded += mf.loc_added_sum;
      featureMap.set(mf.feature, fEntry);
      const mEntry = modelMap.get(mf.model) || { model: mf.model, interactions: 0, codeGenerations: 0, locAdded: 0 };
      mEntry.interactions += mf.user_initiated_interaction_count;
      mEntry.codeGenerations += mf.code_generation_activity_count;
      mEntry.locAdded += mf.loc_added_sum;
      modelMap.set(mf.model, mEntry);
    }
    for (const f of day.totals_by_feature || []) {
      if (!featureMap.has(f.feature)) {
        featureMap.set(f.feature, { feature: f.feature, interactions: 0, codeGenerations: 0, locAdded: 0 });
      }
      const entry = featureMap.get(f.feature);
      if (!(day.totals_by_model_feature || []).some((mf) => mf.feature === f.feature)) {
        entry.interactions += f.user_initiated_interaction_count;
        entry.codeGenerations += f.code_generation_activity_count;
        entry.locAdded += f.loc_added_sum;
      }
    }
  }
  const allModels = [...new Set(reportData.flatMap((d) => (d.totals_by_model_feature || []).map((m) => m.model)))];
  const allFeatures = [...new Set(reportData.flatMap((d) => (d.totals_by_feature || []).map((f) => f.feature)))];
  const dailyActiveUsers = reportData.map((d) => ({
    day: d.day,
    daily: d.daily_active_users || 0,
    weekly: d.weekly_active_users || 0,
    monthly: d.monthly_active_users || 0
  }));
  const agentUsers = reportData.map((d) => ({
    day: d.day,
    monthlyAgentUsers: d.monthly_active_agent_users || 0,
    monthlyChatUsers: d.monthly_active_chat_users || 0
  }));
  return {
    ...totals,
    totalIdeCodeCompletionModels: modelSets.ideCodeCompletion.size,
    totalIdeChatModels: modelSets.ideChat.size,
    totalDotcomChatModels: modelSets.dotcomChat.size,
    totalDotcomPRModels: modelSets.dotcomPR.size,
    ideCodeCompletionModels: Array.from(modelMaps.ideCodeCompletion.values()),
    ideChatModels: Array.from(modelMaps.ideChat.values()),
    dotcomChatModels: Array.from(modelMaps.dotcomChat.values()),
    dotcomPRModels: Array.from(modelMaps.dotcomPR.values()),
    agentModeChartData,
    modelUsageChartData,
    hasReportData,
    allModels,
    allFeatures,
    modelFeatureTable: [...mfMap.values()].sort((a, b) => b.locAdded - a.locAdded),
    featureSummary: [...featureMap.values()].sort((a, b) => b.codeGenerations - a.codeGenerations),
    modelSummary: [...modelMap.values()].sort((a, b) => b.locAdded - a.locAdded),
    dailyActiveUsers,
    agentUsers
  };
}

export { githubStats as default };
//# sourceMappingURL=github-stats.mjs.map
