import { describe, expect, test } from "bun:test";

import { Encryption } from "./encryption";

describe("Encryption", () => {
  const secret = "123";
  const encryption = new Encryption(secret, console);

  test("encrypt and decrypt", async () => {
    const text = "hello";
    const encrypted = await encryption.encrypt(text);
    const decrypted = await encryption.decrypt(encrypted);
    expect(decrypted.data).toBe(text);
  });
});
