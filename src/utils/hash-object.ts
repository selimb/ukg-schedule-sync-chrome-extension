/**
 * Computes a checksum of an arbitrary object.
 * Note that this does not do any fancy normalization, so it's the caller's
 * responsibility to ensure that the object is stable (e.g. by sorting arrays).
 */
export async function hashObject(obj: unknown): Promise<string> {
  const json = JSON.stringify(obj);

  const encoder = new TextEncoder();
  const buf = encoder.encode(json);

  // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest#converting_a_digest_to_a_hex_string
  const hashBuf = await crypto.subtle.digest("SHA-256", buf);
  const hashArray = [...new Uint8Array(hashBuf)];
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}
