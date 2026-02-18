import { CursorPayload } from "@/types/cursor";

export function decodeCursor(cursor?: string): CursorPayload | null {
  if (!cursor) return null;

  try {
    const json = Buffer.from(cursor, "base64").toString("utf-8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}
