import { issuer } from "@openauthjs/openauth";
import { CodeProvider } from "@openauthjs/openauth/provider/code";
import type { StorageAdapter } from "@openauthjs/openauth/storage/storage";
import { CodeUI } from "@openauthjs/openauth/ui/code";
import { and, eq, gt, isNull, like, or } from "drizzle-orm";
import { subjects } from "./subjects";
import { db } from "./db/db";
import { schema } from "./db/schema";

function SqliteStorage(): StorageAdapter {
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

async function getUser(email: string) {
  // Look up the user in the database by email
  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, email),
  });

  if (user) {
    return user;
  }

  // If user doesn't exist, create a new one
  const [newUser] = await db.insert(schema.users).values({ email }).returning();

  return newUser;
}

export default issuer({
  subjects,
  storage: SqliteStorage(),
  providers: {
    code: CodeProvider(
      CodeUI({
        sendCode: async (claims, code) => {
          // In production, you would send this code via email
          console.log(`[CodeProvider] Auth code for ${claims.email}: ${code}`);
        },
      })
    ),
  },
  success: async (ctx, value) => {
    if (value.provider === "code") {
      const user = await getUser(value.claims.email);
      return ctx.subject("user", {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
      });
    }
    throw new Error("Invalid provider");
  },
});
