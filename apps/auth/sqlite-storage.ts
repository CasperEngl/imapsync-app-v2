import type { StorageAdapter } from "@openauthjs/openauth/storage/storage";
import { and, eq, gt, isNull, like, or } from "drizzle-orm";
import { db } from "./db/db";
import { schema } from "./db/schema";

export function SqliteStorage(): StorageAdapter {
  return {
    async get(key: string[]): Promise<Record<string, any> | undefined> {
      const now = new Date();
      const result = await db.query.authStorage.findFirst({
        where: and(
          eq(schema.authStorage.key, key.join(":")),
          or(isNull(schema.authStorage.expiry), gt(schema.authStorage.expiry, now))
        ),
      });

      if (!result) return undefined;
      return JSON.parse(result.value);
    },
    async set(key: string[], value: any, expiry?: Date): Promise<void> {
      const stringKey = key.join(":");
      const stringValue = JSON.stringify(value);

      await db
        .insert(schema.authStorage)
        .values({
          key: stringKey,
          value: stringValue,
          expiry: expiry ?? null,
        })
        .onConflictDoUpdate({
          target: schema.authStorage.key,
          set: {
            value: stringValue,
            expiry: expiry ?? null,
          },
        });
    },

    async remove(key: string[]): Promise<void> {
      await db
        .delete(schema.authStorage)
        .where(eq(schema.authStorage.key, key.join(":")));
    },

    async *scan(prefix: string[]): AsyncIterable<[string[], any]> {
      const now = new Date();
      const prefixStr = prefix.join(":");

      const results = await db
        .select()
        .from(schema.authStorage)
        .where(
          and(
            like(schema.authStorage.key, `${prefixStr}%`),
            or(isNull(schema.authStorage.expiry), gt(schema.authStorage.expiry, now))
          )
        );

      for (const result of results) {
        yield [result.key.split(":"), JSON.parse(result.value)];
      }
    },
  };
}