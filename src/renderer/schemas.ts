import * as v from "valibot";

export const TransferEndpoint = v.object({
  host: v.string(),
  user: v.string(),
  password: v.string(),
});

export type TransferEndpoint = v.InferOutput<typeof TransferEndpoint>;

export const Transfer = v.object({
  id: v.string(),
  source: TransferEndpoint,
  destination: TransferEndpoint,
});

export type Transfer = v.InferOutput<typeof Transfer>;

export const TransferProgress = v.object({
  current: v.number(),
  total: v.number(),
  message: v.string(),
  progress: v.number(),
});

export type TransferProgress = v.InferOutput<typeof TransferProgress>;

export const TransferStatus = v.picklist([
  "idle",
  "syncing",
  "completed",
  "error",
]);

export type TransferStatus = v.InferOutput<typeof TransferStatus>;

export const TransferState = v.object({
  id: v.string(),
  status: TransferStatus,
  error: v.nullable(v.string()),
  progress: v.optional(TransferProgress),
  createdAt: v.number(),
  outputs: v.string(),
});

export type TransferState = v.InferOutput<typeof TransferState>;

export const TransferWithState = v.object({
  ...TransferState.entries,
  ...Transfer.entries,
});

export type TransferWithState = v.InferOutput<typeof TransferWithState>;
