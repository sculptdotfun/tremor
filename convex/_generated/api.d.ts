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
import type * as aiActions from "../aiActions.js";
import type * as aiAnalysis from "../aiAnalysis.js";
import type * as aiService from "../aiService.js";
import type * as cleanup from "../cleanup.js";
import type * as crons from "../crons.js";
import type * as debugMarket from "../debugMarket.js";
import type * as events from "../events.js";
import type * as http from "../http.js";
import type * as marketSummary from "../marketSummary.js";
import type * as markets from "../markets.js";
import type * as migrate from "../migrate.js";
import type * as movements from "../movements.js";
import type * as prioritization from "../prioritization.js";
import type * as scoring from "../scoring.js";
import type * as searchEvents from "../searchEvents.js";
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
  aiActions: typeof aiActions;
  aiAnalysis: typeof aiAnalysis;
  aiService: typeof aiService;
  cleanup: typeof cleanup;
  crons: typeof crons;
  debugMarket: typeof debugMarket;
  events: typeof events;
  http: typeof http;
  marketSummary: typeof marketSummary;
  markets: typeof markets;
  migrate: typeof migrate;
  movements: typeof movements;
  prioritization: typeof prioritization;
  scoring: typeof scoring;
  searchEvents: typeof searchEvents;
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
