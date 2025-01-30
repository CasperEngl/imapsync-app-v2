import * as v from "valibot";

export const Transfer = v.object({
  host: v.string(),
  user: v.string(),
  password: v.string(),
  port: v.optional(v.string()),
  ssl: v.optional(v.boolean()),
  tls: v.optional(v.boolean()),
});

export type Transfer = v.InferOutput<typeof Transfer>;

export const TransferProgress = v.object({
  current: v.number(),
  total: v.number(),
  message: v.string(),
  progress: v.number(),
});

export const TransferOutput = v.object({
  content: v.string(),
  isError: v.boolean(),
  timestamp: v.number(),
});

export const TransferStatus = v.picklist([
  "idle",
  "syncing",
  "completed",
  "error",
  "paused",
]);

export type TransferStatus = v.InferOutput<typeof TransferStatus>;

export const TransferState = v.object({
  id: v.string(),
  status: TransferStatus,
  error: v.nullable(v.string()),
  progress: v.optional(TransferProgress),
  createdAt: v.number(),
  outputs: v.array(TransferOutput),
});

export type TransferState = v.InferOutput<typeof TransferState>;

export const TransferWithState = v.object({
  ...TransferState.entries,
  source: Transfer,
  destination: Transfer,
});

export type TransferWithState = v.InferOutput<typeof TransferWithState>;
