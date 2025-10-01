const DEFAULT_SALT = "the_best_salt";

export class Encryption {
  private key: Promise<CryptoKey>;
  constructor(
    private readonly secret: string,
    private readonly salt = DEFAULT_SALT,
  ) {
    this.key = this.getKeypair();
  }

  private async getKeypair() {
    const material = await crypto.subtle.importKey(
      "pkcs8",
      new TextEncoder().encode(this.secret),
      {
        name: "PBKDF2",
      },
      false,
      ["deriveBits", "deriveKey"],
    );

    return await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: new TextEncoder().encode(this.salt),
        iterations: 100000,
        hash: "SHA-256",
      },
      material,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
  }

  public async encrypt(content: string) {
    const data = new TextEncoder().encode(content);
  }
}
