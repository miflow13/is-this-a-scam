export class AnalysisError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "AnalysisError";
    this.status = status;
  }
}

// Bound streamed bodies too: Content-Length is optional and cannot be trusted.
export async function readBounded(
  stream: ReadableStream<Uint8Array> | null,
  max: number,
): Promise<Buffer> {
  if (!stream) return Buffer.alloc(0);
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) {
        await reader.cancel();
        throw new AnalysisError(
          "That upload is too large. Choose an image under 8 MB.",
          413,
        );
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks);
  } finally {
    reader.releaseLock();
  }
}
