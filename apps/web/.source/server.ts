// @ts-nocheck
import * as __fd_glob_30 from "../content/docs/sdk/javascript/typescript-types.mdx?collection=docs"
import * as __fd_glob_29 from "../content/docs/sdk/javascript/realtime-sse.mdx?collection=docs"
import * as __fd_glob_28 from "../content/docs/sdk/javascript/initialization.mdx?collection=docs"
import * as __fd_glob_27 from "../content/docs/sdk/javascript/index.mdx?collection=docs"
import * as __fd_glob_26 from "../content/docs/sdk/javascript/evaluate-flags.mdx?collection=docs"
import * as __fd_glob_25 from "../content/docs/guides/migrate-from-env-vars.mdx?collection=docs"
import * as __fd_glob_24 from "../content/docs/guides/canary-deploys.mdx?collection=docs"
import * as __fd_glob_23 from "../content/docs/guides/ab-testing-with-rollout.mdx?collection=docs"
import * as __fd_glob_22 from "../content/docs/getting-started/quickstart.mdx?collection=docs"
import * as __fd_glob_21 from "../content/docs/getting-started/installation.mdx?collection=docs"
import * as __fd_glob_20 from "../content/docs/getting-started/create-first-flag.mdx?collection=docs"
import * as __fd_glob_19 from "../content/docs/concepts/webhooks.mdx?collection=docs"
import * as __fd_glob_18 from "../content/docs/concepts/sse-realtime.mdx?collection=docs"
import * as __fd_glob_17 from "../content/docs/concepts/schedule-auto-rollout.mdx?collection=docs"
import * as __fd_glob_16 from "../content/docs/concepts/rollout.mdx?collection=docs"
import * as __fd_glob_15 from "../content/docs/concepts/organizations-projects.mdx?collection=docs"
import * as __fd_glob_14 from "../content/docs/concepts/flags.mdx?collection=docs"
import * as __fd_glob_13 from "../content/docs/concepts/environments.mdx?collection=docs"
import * as __fd_glob_12 from "../content/docs/concepts/audit-history.mdx?collection=docs"
import * as __fd_glob_11 from "../content/docs/api-reference/webhooks.mdx?collection=docs"
import * as __fd_glob_10 from "../content/docs/api-reference/sdk-endpoint.mdx?collection=docs"
import * as __fd_glob_9 from "../content/docs/api-reference/flags.mdx?collection=docs"
import * as __fd_glob_8 from "../content/docs/api-reference/authentication.mdx?collection=docs"
import * as __fd_glob_7 from "../content/docs/index.mdx?collection=docs"
import { default as __fd_glob_6 } from "../content/docs/sdk/javascript/meta.json?collection=docs"
import { default as __fd_glob_5 } from "../content/docs/sdk/meta.json?collection=docs"
import { default as __fd_glob_4 } from "../content/docs/guides/meta.json?collection=docs"
import { default as __fd_glob_3 } from "../content/docs/getting-started/meta.json?collection=docs"
import { default as __fd_glob_2 } from "../content/docs/concepts/meta.json?collection=docs"
import { default as __fd_glob_1 } from "../content/docs/api-reference/meta.json?collection=docs"
import { default as __fd_glob_0 } from "../content/docs/meta.json?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.docs("docs", "content/docs", {"meta.json": __fd_glob_0, "api-reference/meta.json": __fd_glob_1, "concepts/meta.json": __fd_glob_2, "getting-started/meta.json": __fd_glob_3, "guides/meta.json": __fd_glob_4, "sdk/meta.json": __fd_glob_5, "sdk/javascript/meta.json": __fd_glob_6, }, {"index.mdx": __fd_glob_7, "api-reference/authentication.mdx": __fd_glob_8, "api-reference/flags.mdx": __fd_glob_9, "api-reference/sdk-endpoint.mdx": __fd_glob_10, "api-reference/webhooks.mdx": __fd_glob_11, "concepts/audit-history.mdx": __fd_glob_12, "concepts/environments.mdx": __fd_glob_13, "concepts/flags.mdx": __fd_glob_14, "concepts/organizations-projects.mdx": __fd_glob_15, "concepts/rollout.mdx": __fd_glob_16, "concepts/schedule-auto-rollout.mdx": __fd_glob_17, "concepts/sse-realtime.mdx": __fd_glob_18, "concepts/webhooks.mdx": __fd_glob_19, "getting-started/create-first-flag.mdx": __fd_glob_20, "getting-started/installation.mdx": __fd_glob_21, "getting-started/quickstart.mdx": __fd_glob_22, "guides/ab-testing-with-rollout.mdx": __fd_glob_23, "guides/canary-deploys.mdx": __fd_glob_24, "guides/migrate-from-env-vars.mdx": __fd_glob_25, "sdk/javascript/evaluate-flags.mdx": __fd_glob_26, "sdk/javascript/index.mdx": __fd_glob_27, "sdk/javascript/initialization.mdx": __fd_glob_28, "sdk/javascript/realtime-sse.mdx": __fd_glob_29, "sdk/javascript/typescript-types.mdx": __fd_glob_30, });