/** biome-ignore-all lint/complexity/noStaticOnlyClass: forced */

export class PasswordUtils {
  // Hash password using PBKDF2 with Web Crypto API (edge-compatible, no dependencies)
  static async hash(password: string): Promise<string> {
    if (!password || typeof password !== "string") {
      throw new Error("Password must be a non-empty string");
    }

    // Generate random salt
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // Hash with PBKDF2
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );

    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: 50_000, // increased for security and consistency
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );

    // Combine salt + hash and encode as base64
    const hashArray = new Uint8Array(hashBuffer);
    const combined = new Uint8Array(salt.length + hashArray.length);
    combined.set(salt);
    combined.set(hashArray, salt.length);

    return btoa(String.fromCharCode(...combined));
  }

  // Verify password against hash
  static async verify(password: string, hash: string): Promise<boolean> {
    if (!(password && hash)) {
      return false;
    }

    try {
      // Decode hash
      const combined = Uint8Array.from(atob(hash), (c) => c.charCodeAt(0));
      const salt = combined.slice(0, 16);
      const originalHash = combined.slice(16);

      // Hash input password with same salt
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
      );

      const hashBuffer = await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt,
          iterations: 50_000,
          hash: "SHA-256",
        },
        keyMaterial,
        256
      );

      const newHash = new Uint8Array(hashBuffer);

      // Constant-time comparison
      if (newHash.length !== originalHash.length) {
        return false;
      }
      let diff = 0;
      for (let i = 0; i < newHash.length; i++) {
        // biome-ignore lint/suspicious/noBitwiseOperators: Using bitwise operators for constant-time comparison
        diff |= newHash[i] ^ originalHash[i];
      }
      return diff === 0;
    } catch {
      return false;
    }
  }
}
