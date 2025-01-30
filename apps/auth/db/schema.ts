import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const todos = sqliteTable("todos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  text: text("text").notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
});

export const authStorage = sqliteTable("auth_storage", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  expiry: integer("expiry", { mode: "timestamp" }),
});

export const usersRelations = relations(users, ({ many }) => ({
  todos: many(todos),
}));

export const todosRelations = relations(todos, ({ one }) => ({
  user: one(users, {
    fields: [todos.userId],
    references: [users.id],
  }),
}));

export type Todo = typeof todos.$inferSelect;
export type NewTodo = Omit<typeof todos.$inferInsert, "userId">;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export * as schema from "./schema";
