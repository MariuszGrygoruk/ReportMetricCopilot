import { k as defineOAuthGitHubEventHandler, u as useRuntimeConfig, l as setUserSession, m as sendRedirect } from '../../nitro/nitro.mjs';
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

const github_get = defineOAuthGitHubEventHandler({
  config: {
    scope: process.env.NUXT_OAUTH_GITHUB_CLIENT_SCOPE ? process.env.NUXT_OAUTH_GITHUB_CLIENT_SCOPE.split(",") : void 0
  },
  async onSuccess(event, { user, tokens }) {
    const config = useRuntimeConfig(event);
    const logger = console;
    await setUserSession(
      event,
      {
        user: {
          githubId: user.id,
          name: user.name,
          avatarUrl: user.avatar_url
        },
        secure: {
          tokens,
          expires_at: new Date(Date.now() + tokens.expires_in * 1e3)
        }
      }
    );
    if (config.public.isPublicApp) {
      try {
        const installationsResponse = await $fetch("https://api.github.com/user/installations", {
          headers: {
            Authorization: `token ${tokens.access_token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28"
          }
        });
        const installations = installationsResponse.installations;
        const organizations = installations.map((installation) => installation.account.login);
        await setUserSession(event, {
          organizations
        });
        logger.info("User organizations:", organizations);
        if (organizations.length === 0) {
          console.error("No organizations found for the user.");
          return sendRedirect(event, "/?error=No organizations found for the user.");
        }
        return sendRedirect(event, `/orgs/${organizations[0]}`);
      } catch (error) {
        logger.error("Error fetching installations:", error);
      }
    }
    return sendRedirect(event, "/");
  },
  // Optional, will return a json error and 401 status code by default
  onError(event, error) {
    console.error("GitHub OAuth error:", error);
    return sendRedirect(event, "/");
  }
});

export { github_get as default };
//# sourceMappingURL=github.get.mjs.map
