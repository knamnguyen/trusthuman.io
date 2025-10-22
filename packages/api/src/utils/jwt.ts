import type { z } from "zod";

export async function sha256(input: string, secret: string) {
  // Combine token and input
  const combined = new TextEncoder().encode(`${secret}:${input}`);
  const buffer = await crypto.subtle.digest("SHA-256", combined);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function base64url(input: string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlDecode(input: string): string {
  // Pad the string to a multiple of 4
  input = input.replace(/-/g, "+").replace(/_/g, "/");
  while (input.length % 4) {
    input += "=";
  }
  return Buffer.from(input, "base64").toString("utf8");
}

async function decodeJwt(token: string, secret: string) {
  const [encodedHeader, encodedPayload, signature] = token.split(".");
  if (!encodedHeader || !encodedPayload || !signature) {
    return {
      success: false,
      error: "Invalid JWT token format",
    } as const;
  }

  const headerJson = base64urlDecode(encodedHeader);
  const payloadJson = base64urlDecode(encodedPayload);

  let header, payload;
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    header = JSON.parse(headerJson);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    payload = JSON.parse(payloadJson);
  } catch {
    return {
      success: false,
      error: "Invalid JWT token format",
    } as const;
  }

  // Verify signature
  const data = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = await sha256(data, secret);

  if (signature !== expectedSignature) {
    return {
      success: false,
      error: "Invalid JWT signature",
    } as const;
  }

  return {
    success: true,
    data: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      header,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      payload,
      signature,
    },
  } as const;
}

async function generateJwt(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: Record<string, any>,
  secret: string,
  expiresInMs: number,
) {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + expiresInMs / 1000;
  const fullPayload = { payload, exp };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(fullPayload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = await sha256(data, secret);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function jwtFactory<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Schema extends z.ZodObject<any>,
>(schema: Schema, expiresInMs: number, defaultSecret: string) {
  return {
    encode: (payload: z.input<Schema>, secret?: string) =>
      generateJwt(schema.parse(payload), secret ?? defaultSecret, expiresInMs),
    decode: async (
      token: string,
      opts?: {
        secret?: string;
        expiryCheck?: boolean;
      },
    ) => {
      const { secret, expiryCheck = true } = opts ?? {};
      const decoded = await decodeJwt(token, secret ?? defaultSecret);

      if (decoded.success === false) {
        return {
          success: false,
          error: decoded.error,
        } as const;
      }

      const payload = decoded.data.payload as {
        payload?: unknown;
        exp?: number;
      };
      const exp = payload.exp;

      if (!exp) {
        return {
          success: false,
          error: "JWT token missing expiry",
        } as const;
      }
      if (expiryCheck && exp && Date.now() > exp * 1000) {
        return {
          success: false,
          error: "JWT token has expired",
        } as const;
      }

      const parsed = schema.safeParse(payload.payload);
      if (!parsed.success) {
        return {
          success: false,
          error: "Invalid JWT payload",
        } as const;
      }

      return {
        success: true,
        payload: parsed.data as z.output<Schema>,
      };
    },
  };
}
