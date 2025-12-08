import { NextResponse } from "next/server";
import crypto from "crypto";
import path from "path";
import { promises as fs } from "fs";

export const dynamic = "force-dynamic";

const SIGNATURE_HEADERS = ["x-pf-signature", "x-printful-signature"];
const EVENT_ID_HEADERS = [
  "x-pf-event-id",
  "x-printful-event-id",
  "x-pf-delivery-id",
  "x-printful-delivery-id",
];

const DEFAULT_ARCHIVE_DIR = "Images/diagnostics";
const MAX_BODY_SIZE_BYTES = 5_000_000; // Guardrail against oversized payloads.

const sanitizeId = (value: string) =>
  value.replace(/[^a-zA-Z0-9_.-]/g, "_").slice(0, 120);

const getHeader = (headers: Headers, keys: string[]) => {
  for (const key of keys) {
    const value = headers.get(key);
    if (value) return value;
  }
  return null;
};

const toHeaderRecord = (headers: Headers) => {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key] = value;
  });
  return record;
};

const verifySignature = (secret: string, rawBody: string, provided: string) => {
  const normalized = provided.replace(/^sha256=/i, "").trim();
  const expectedHex = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const expectedBase64 = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("base64");

  const safeEquals = (expected: string, actual: string) => {
    const expectedBuf = Buffer.from(expected);
    const actualBuf = Buffer.from(actual);
    return (
      expectedBuf.length === actualBuf.length &&
      crypto.timingSafeEqual(expectedBuf, actualBuf)
    );
  };

  return (
    safeEquals(expectedHex, normalized) || safeEquals(expectedBase64, normalized)
  );
};

const deriveEventId = (
  headers: Headers,
  payload: unknown,
  rawBody: string,
): string => {
  const headerId = getHeader(headers, EVENT_ID_HEADERS);
  if (headerId) {
    return sanitizeId(headerId);
  }

  if (payload && typeof payload === "object") {
    const candidate =
      (payload as { id?: string | number }).id ??
      (payload as { event_id?: string | number }).event_id ??
      (payload as { eventId?: string | number }).eventId;
    if (candidate !== undefined && candidate !== null) {
      return sanitizeId(String(candidate));
    }
  }

  const digest = crypto
    .createHash("sha256")
    .update(rawBody)
    .digest("hex")
    .slice(0, 12);
  return sanitizeId(`body-${digest}`);
};

const ensureArchiveDir = async (dir: string) => {
  await fs.mkdir(dir, { recursive: true });
};

const findExistingEvent = async (dir: string, eventId: string) => {
  const entries = await fs.readdir(dir).catch(() => []);
  const match = entries.find((entry) => entry.includes(eventId));
  return match ? path.join(dir, match) : null;
};

export async function POST(request: Request) {
  const lengthHeader = request.headers.get("content-length");
  if (lengthHeader) {
    const size = Number.parseInt(lengthHeader, 10);
    if (!Number.isNaN(size) && size > MAX_BODY_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Request body too large" },
        { status: 413 },
      );
    }
  }

  const rawBody = await request.text();
  let payload: unknown;
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const signatureHeader = getHeader(request.headers, SIGNATURE_HEADERS);
  let signatureValidated = false;
  const webhookSecret = process.env.PRINTFUL_WEBHOOK_SECRET ?? "";
  if (webhookSecret) {
    if (!signatureHeader) {
      return NextResponse.json(
        {
          error: "Missing Printful signature header.",
          hint: "Include X-PF-Signature or X-Printful-Signature.",
        },
        { status: 400 },
      );
    }

    signatureValidated = verifySignature(
      webhookSecret,
      rawBody,
      signatureHeader,
    );
    if (!signatureValidated) {
      return NextResponse.json(
        { error: "Invalid Printful signature." },
        { status: 400 },
      );
    }
  }

  const eventId = deriveEventId(request.headers, payload, rawBody);
  const archiveRoot =
    process.env.PRINTFUL_WEBHOOK_ARCHIVE_DIR ?? DEFAULT_ARCHIVE_DIR;
  const archiveDir = path.resolve(process.cwd(), archiveRoot);
  await ensureArchiveDir(archiveDir);

  const existing = await findExistingEvent(archiveDir, eventId);
  if (existing) {
    return NextResponse.json(
      {
        received: true,
        eventId,
        duplicateOf: path.relative(process.cwd(), existing),
        signatureValidated,
      },
      { status: 200 },
    );
  }

  const timestamp = new Date().toISOString();
  const filename = `printful-webhook-${timestamp.replace(/[:.]/g, "-")}-${eventId}.json`;
  const archivePath = path.join(archiveDir, filename);

  const headersRecord = toHeaderRecord(request.headers);
  const archivePayload = {
    receivedAt: timestamp,
    eventId,
    signature: signatureHeader ?? null,
    signatureValidated,
    headers: headersRecord,
    payload,
  };

  await fs.writeFile(archivePath, JSON.stringify(archivePayload, null, 2), "utf8");

  return NextResponse.json(
    {
      received: true,
      eventId,
      archivedPath: path.relative(process.cwd(), archivePath),
      signatureValidated,
      usingUnverifiedFallback: !webhookSecret,
    },
    { status: 200 },
  );
}
