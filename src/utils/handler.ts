import type { Context } from "hono";
export interface HealthCheckOptions {
  appName: string;
  version?: string;
  dependencies?: Array<() => Promise<boolean>>;
  includeMetrics?: boolean;
}

export const healthHandler = (options: HealthCheckOptions) => {
  return async (c: Context) => {
    const startTime = process.hrtime();
    const now = new Date();

    // Format: "15 December, 2025"
    const formattedDate = now.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const healthcheck = {
      status: "OK",
      appName: options.appName,
      timestamp: formattedDate,
      uptime: process.uptime(),
      ...(options.version && { version: options.version }),
    };

    try {
      // Check dependencies if provided
      if (options.dependencies && options.dependencies.length > 0) {
        const dependencyChecks = await Promise.allSettled(
          options.dependencies.map((check) => check())
        );

        const allHealthy = dependencyChecks.every(
          (result) => result.status === "fulfilled" && result.value === true
        );

        if (!allHealthy) {
          return c.json(
            {
              ...healthcheck,
              status: "degraded",
              message: "Some dependencies are unhealthy",
            },
            503
          );
        }
      }

      // Add response time if metrics enabled
      if (options.includeMetrics) {
        const hrtime = process.hrtime(startTime);
        const responseTime = hrtime[0] * 1000 + hrtime[1] / 1_000_000;
        Object.assign(healthcheck, {
          responseTime: `${responseTime.toFixed(2)}ms`,
        });
      }

      return c.json(healthcheck, 200);
    } catch (error) {
      console.error("Health check failed:", error);
      return c.json(
        {
          ...healthcheck,
          status: "error",
          message: "Health check failed",
        },
        503
      );
    }
  };
};
