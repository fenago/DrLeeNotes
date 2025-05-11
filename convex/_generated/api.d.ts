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
import type * as gemini from "../gemini.js";
import type * as incredibly_fast_whisper from "../incredibly_fast_whisper.js";
import type * as llm from "../llm.js";
import type * as notes from "../notes.js";
import type * as openai from "../openai.js";
import type * as together from "../together.js";
import type * as utils from "../utils.js";
import type * as whisper from "../whisper.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  gemini: typeof gemini;
  incredibly_fast_whisper: typeof incredibly_fast_whisper;
  llm: typeof llm;
  notes: typeof notes;
  openai: typeof openai;
  together: typeof together;
  utils: typeof utils;
  whisper: typeof whisper;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
