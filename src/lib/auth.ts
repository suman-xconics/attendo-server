import { db } from "@/db";
import env from "@/env";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware, openAPI } from "better-auth/plugins";
import { UserFields, userFields } from "./fields/user";
import { generateRandomId, generateUID } from "@/utils/gen-id";
import { PasswordUtils } from "@/utils/password";
import { eq } from "drizzle-orm";
const isDev = env.NODE_ENV === "development";
import * as authSchema from "@/db/schema/auth";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  basePath: env.BETTER_AUTH_API_PATH,
  trustedOrigins: env.WHITELISTED_ORIGINS,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    password: {
      hash: async (password) => await PasswordUtils.hash(password),
      verify: async ({ password, hash }) =>
        await PasswordUtils.verify(password, hash),
    },
  },
  plugins: [
    openAPI({
      disableDefaultReference: true,
      theme: "purple",
    }),
  ],
  // Custom Fields
  user: {
    additionalFields: Array.isArray(userFields)
      ? Object.fromEntries(
          userFields.map((field: UserFields) => [
            field.name,
            {
              type: field.type,
              input: field.input,
              required: field.required,
            },
          ])
        )
      : userFields,
  },
  logger: {
    level: isDev ? "debug" : "info",
    disabled: false,
    disableColors: !isDev,
  },
  session: {
    expiresIn: 604_800, // 7 days
    updateAge: 86_400, // 1 day
    storeSessionInDatabase: true,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
      refreshCache: false,
    },
  },
  rateLimit: {
    enabled: true,
    window: 60, // KV minimum TTL is 60 seconds
    max: 200, // requests per window
    customRules: {
      "/sign-in/email": {
        window: 60,
        max: 20,
      },
      "/sign-up/email": {
        window: 60,
        max: 20,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({
          data: {
            ...user,
            id: generateUID(),
          },
        }),
      },
    },
  },
  advanced: {
    disableCSRFCheck: isDev,
    crossSubDomainCookies: {
      enabled: true,
    
    },
    database: {
      generateId: () => generateRandomId(),
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const path = ctx.path;
      const returned = ctx.context.returned;
      const isAuthPath = path === "/sign-in/email" || path === "/sign-up/email";

      if (
        isAuthPath &&
        returned &&
        typeof returned === "object" &&
        "user" in returned &&
        returned.user &&
        typeof returned.user === "object" &&
        "id" in returned.user
      ) {
        const userId = returned.user.id as string;

        const [user] = await db
          .select({
            id: authSchema.user.id,
            email: authSchema.user.email,
            role: authSchema.user.role,
            macAddress: authSchema.user.macAddress,
          })
          .from(authSchema.user)
          .where(eq(authSchema.user.id, userId))
          .limit(1);

        return { ...returned, user };
      }

      return returned;
    }),
  },
});
