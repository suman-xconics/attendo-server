import { Context, Next } from 'hono';
import type { AppBindings } from '@/types/app';
import { auth } from '@/lib/auth';
import env from '@/env';
import { RequireRoleOptions, Role} from '@/types/models';
import { getUserRole } from '@/utils/functions';

export type AppMiddlewareHandler = (
  c: Context<AppBindings>,
  next: Next
) => Promise<Response | void>;


export const sessionMiddleware: AppMiddlewareHandler = async (c, next) => {
  // Skip Better Auth endpoints
  if (c.req.path.startsWith(`/${env.BETTER_AUTH_API_PATH}`)) {
    return next();
  }

  try {
    const session = await auth.api.getSession({
      headers: new Headers(c.req.raw.headers),
    });

    // ✅ Set user/session for ALL routes consistently
    c.set('user', session?.user || null);
    c.set('session', session?.session || null);
  } catch (error) {
    c.set('user', null);
    c.set('session', null);
  }

  return next();
};

export const authMiddleware: AppMiddlewareHandler = async (c, next) => {
  // Skip public/auth endpoints
  if (c.req.path.startsWith(`/${env.BETTER_AUTH_API_PATH}`)) {
    return next();
  }

  try {
    const session = await auth.api.getSession({
      headers: new Headers(c.req.raw.headers),
    });

    if (!session?.user) {
      return c.json(
        {
          success: false,
          error: {
            name: "Unauthorized",
            message: "Authentication required",
          },
        },
        401
      );
    }

    // ✅ Set context for protected routes
    c.set('user', session.user);
    c.set('session', session.session);

    return await next();
  } catch (error) {
    return c.json(
      {
        success: false,
        error: {
          name: "AuthError",
          message: "Authentication failed",
        },
      },
      401
    );
  }
};

// ✅ FIXED: Renamed and simplified role middleware
export const roleCheckMiddleware = (options: RequireRoleOptions): AppMiddlewareHandler => {
  return async (c, next) => {
    // 1. Ensure user exists (runs AFTER authMiddleware)
    const user = c.get('user');
    if (!user) {
      return c.json(
        {
          success: false,
          error: {
            name: "Unauthorized",
            message: "User not authenticated",
          },
        },
        401
      );
    }

    // 2. Get user role
    const { role } = getUserRole(user);
    if (!role) {
      return c.json(
        {
          success: false,
          error: {
            name: "Forbidden",
            message: "Invalid or missing user role",
          },
        },
        403
      );
    }

    // 3. Check required roles
    if (!options.roles.includes(role)) {
      return c.json(
        {
          success: false,
          error: {
            name: "Forbidden",
            message: `Required role: ${options.roles.join(', ')}`,
          },
        },
        403
      );
    }

    // ✅ Set role in context for handlers
    c.set('role', role);
    
    return await next();
  };
};
