import { issuer } from "@openauthjs/openauth";
import { CodeProvider } from "@openauthjs/openauth/provider/code";
import { CodeUI } from "@openauthjs/openauth/ui/code";
import { subjects } from "auth-subjects/subjects.js";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "./db/db";
import { schema } from "./db/schema";
import { SqliteStorage } from "./sqlite-storage";
import { config } from "dotenv";

config({ path: "../../.env.local" });

const resend = new Resend(process.env.RESEND_API_KEY);

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
          if (process.env.NODE_ENV === "production") {
            const { error } = await resend.emails.send({
              from: "noreply@casperengelmann.com",
              to: claims.email,
              subject: "Your imapsync App code",
              text: `Your code is: ${code}`,
            });

            if (error) {
              console.error(`[CodeProvider] Error sending email: ${error}`);
            }
          } else {
            console.log(`[CodeProvider] Auth code for ${claims.email}: ${code}`);
          }
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
