import { session, user, userRoleEnum } from "@/db/schema";
import { InferSelectModel } from "drizzle-orm";
import { auth } from "@/lib/auth";

export type UserAsDB = InferSelectModel<typeof user>;
export type UserAsBA = typeof auth.$Infer.Session.user;
export type Session = InferSelectModel<typeof session>;


export type Role = (typeof userRoleEnum.enumValues)[number];

export type RequireRoleOptions = {
  roles: readonly Role[];
};