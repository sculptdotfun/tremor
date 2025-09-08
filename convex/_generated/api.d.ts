/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as actions from "../actions.js";
import type * as activity from "../activity.js";
import type * as cleanup from "../cleanup.js";
import type * as crons from "../crons.js";
import type * as events from "../events.js";
import type * as http from "../http.js";
import type * as markets from "../markets.js";
import type * as migrate from "../migrate.js";
import type * as prioritization from "../prioritization.js";
import type * as scoring from "../scoring.js";
import type * as trades from "../trades.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  actions: typeof actions;
  activity: typeof activity;
  cleanup: typeof cleanup;
  crons: typeof crons;
  events: typeof events;
  http: typeof http;
  markets: typeof markets;
  migrate: typeof migrate;
  prioritization: typeof prioritization;
  scoring: typeof scoring;
  trades: typeof trades;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
