declare module "wawoff2" {
  export function compress(
    input: Buffer | Uint8Array | ArrayBuffer
  ): Promise<Uint8Array>;
  export function decompress(
    input: Buffer | Uint8Array | ArrayBuffer
  ): Promise<Uint8Array>;
}
