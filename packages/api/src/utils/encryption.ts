import type { Logger } from "./commons";

export class Cryptography {
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();
  private SALT_LENGTH = 16; // Length of the salt in bytes
  private IV_LENGTH = 12; // Length of the IV in bytes for AES-GCM
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger ?? console;
  }

  private async deriveKey(secret: string, salt: Uint8Array) {
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      this.encoder.encode(secret),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"],
    );

    return await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000, // High iteration count for security
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
  }

  public async encrypt(content: string, secret: string) {
    const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH)); // AES-GCM standard IV length
    const key = await this.deriveKey(secret, salt);
    const encrypted = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      this.encoder.encode(content),
    );

    const combined = new Uint8Array(
      salt.length + iv.length + encrypted.byteLength,
    );
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    return Buffer.from(combined).toString("base64");
  }

  public async decrypt(encrypted: string, secret: string) {
    const combined = new Uint8Array(Buffer.from(encrypted, "base64"));
    const salt = combined.slice(0, this.SALT_LENGTH);
    const iv = combined.slice(
      this.SALT_LENGTH,
      this.SALT_LENGTH + this.IV_LENGTH,
    );
    const data = combined.slice(this.SALT_LENGTH + this.IV_LENGTH);

    const key = await this.deriveKey(secret, salt);

    try {
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        data,
      );
      return {
        success: true,
        data: this.decoder.decode(decrypted),
      } as const;
    } catch {
      this.logger.error("decryption failed");
      return {
        success: false,
        data: null,
      } as const;
    }
  }
}

export const cryptography = new Cryptography();
