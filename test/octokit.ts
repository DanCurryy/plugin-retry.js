import { Octokit } from "@octokit/core";
import { RequestError } from "@octokit/request-error";
import { retry } from "../src/index.ts";

function testPlugin(octokit: Octokit) {
  const t0 = Date.now();

  const __requestLog: string[] = [];
  const __requestTimings: number[] = [];

  octokit.hook.wrap("request", async (_, options) => {
    __requestLog.push(`START ${options.method} ${options.url}`);
    __requestTimings.push(Date.now() - t0);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const res = options.request.responses.shift();
    if (res.status >= 300) {
      const message =
        res.data.message != null
          ? res.data.message
          : `Test failed request (${res.status})`;
      const error = new RequestError(message, res.status, {
        headers: res.headers,
        request: options,
      });
      throw error;
    } else {
      __requestLog.push(`END ${options.method} ${options.url}`);
      __requestTimings.push(Date.now() - t0);
      return res;
    }
  });

  return { __requestLog, __requestTimings };
}

export const TestOctokitWithoutRetry = Octokit.plugin(testPlugin);
export const TestOctokit = Octokit.plugin(testPlugin, retry);
