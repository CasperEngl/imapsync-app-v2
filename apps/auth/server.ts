import { cors } from "@elysiajs/cors";
import { Context, Elysia } from "elysia";
import { auth, callback, login, logout } from "./actions";

async function authMiddleware(context: Context) {
  const user = await auth(context.request);
  if (!user) {
    throw new Error("Authentication required");
  }
  return { user };
}

const app = new Elysia()
  .use(cors())
  .get("/api/auth/login", async ({ request }) => {
    return login(request);
  })
  .get("/api/auth/logout", async ({ request }) => {
    return logout(request);
  })
  .get("/api/callback", async ({ request }) => {
    return callback(request);
  })
  .derive(authMiddleware)

app.listen(3000);

console.log("🚀 Server started on http://localhost:3000");
