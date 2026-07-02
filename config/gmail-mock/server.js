import express from "express";
import crypto from "crypto";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// State
let messages = [];
let sentMessages = [];
const requestLog = [];

function resetState() {
  messages = [
    {
      id: "msg-001",
      threadId: "thread-001",
      payload: {
        headers: [
          { name: "Subject", value: "Test Email 1" },
          { name: "From", value: "sender@example.com" },
          { name: "To", value: "test@example.com" },
          { name: "Date", value: new Date().toUTCString() },
        ],
        body: { data: Buffer.from("Hello from seed!").toString("base64url") },
      },
      snippet: "Hello from seed!",
      labelIds: ["INBOX", "UNREAD"],
    },
  ];
  sentMessages = [];
  requestLog.length = 0;
}
resetState();

// Normalize a seeded message into real Gmail API shape. Tests may pass either
// a raw message (already carrying `payload`, e.g. the default seed) or a
// friendly shape (`subject`, `from`, `to`, `body`, `attachments`) that is
// built up into `payload` here — matching how gmail-adapter.ts actually reads
// messages: headers for metadata, payload.body.data for a single-part body,
// payload.parts (multipart) with body.attachmentId + filename for attachments.
function normalizeGmailMessage(m) {
  // Raw passthrough — the message already carries a Gmail-shaped payload.
  if (m.payload) return m;

  const headers = [
    { name: "Subject", value: m.subject ?? "" },
    { name: "From", value: m.from ?? "" },
    { name: "To", value: m.to ?? "" },
    { name: "Date", value: m.date ?? new Date().toUTCString() },
  ];

  let payload;
  if (Array.isArray(m.attachments) && m.attachments.length > 0) {
    const textPart = {
      mimeType: "text/plain",
      body: { data: Buffer.from(m.body ?? "").toString("base64url") },
    };
    const attachmentParts = m.attachments.map((att, i) => {
      const bytes = Buffer.from(att.contentBase64 ?? "", "base64");
      return {
        mimeType: att.mimeType,
        // Inline attachments get no filename — collectAttachments() in the
        // adapter requires both attachmentId AND a non-empty filename, so
        // this makes the walker skip them (proves inline-skipping in tests).
        filename: att.inline ? "" : att.filename,
        body: {
          attachmentId: att.attachmentId ?? `att-${i}`,
          size: bytes.length,
          data: bytes.toString("base64url"),
        },
      };
    });
    payload = {
      mimeType: "multipart/mixed",
      headers,
      parts: [textPart, ...attachmentParts],
    };
  } else {
    payload = {
      mimeType: "text/plain",
      headers,
      body: { data: Buffer.from(m.body ?? "").toString("base64url") },
    };
  }

  return {
    id: m.id,
    threadId: m.threadId ?? `thread-${m.id}`,
    payload,
    snippet: (m.body ?? "").slice(0, 100),
    labelIds: m.labelIds ?? ["INBOX"],
  };
}

// ---- OAuth endpoint ----
app.post("/token", (req, res) => {
  const { refresh_token, grant_type } = req.body;
  requestLog.push({
    endpoint: "/token",
    grant_type,
    hasRefreshToken: !!refresh_token,
  });
  if (refresh_token === "invalid-refresh-token") {
    return res.status(401).json({ error: "invalid_grant" });
  }
  res.json({
    access_token: `mock-access-token-${crypto.randomBytes(4).toString("hex")}`,
    expires_in: 3600,
    token_type: "Bearer",
    scope: "https://www.googleapis.com/auth/gmail.modify",
  });
});

// ---- Gmail API surface ----
app.get("/gmail/v1/users/me/profile", (req, res) => {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ") || auth === "Bearer expired-token") {
    return res
      .status(401)
      .json({ error: { code: 401, message: "Invalid Credentials" } });
  }
  res.json({
    emailAddress: "test@example.com",
    messagesTotal: messages.length,
  });
});

app.get("/gmail/v1/users/me/messages", (req, res) => {
  requestLog.push({ endpoint: "/messages", query: req.query });
  res.json({
    messages: messages.map((m) => ({ id: m.id, threadId: m.threadId })),
    resultSizeEstimate: messages.length,
  });
});

app.get("/gmail/v1/users/me/messages/:id", (req, res) => {
  const msg = messages.find((m) => m.id === req.params.id);
  if (!msg)
    return res.status(404).json({ error: { code: 404, message: "Not Found" } });
  res.json(msg);
});

// Recursively search payload.parts for a part carrying a given attachmentId,
// mirroring findAttachmentPart() in gmail-adapter.ts.
function findAttachmentPart(part, attachmentId) {
  if (part.body?.attachmentId === attachmentId) return part;
  if (part.parts) {
    for (const child of part.parts) {
      const found = findAttachmentPart(child, attachmentId);
      if (found) return found;
    }
  }
  return null;
}

app.get(
  "/gmail/v1/users/me/messages/:id/attachments/:attachmentId",
  (req, res) => {
    requestLog.push({
      endpoint: "/gmail/v1/users/me/messages/:id/attachments/:attachmentId",
      messageId: req.params.id,
      attachmentId: req.params.attachmentId,
    });
    const msg = messages.find((m) => m.id === req.params.id);
    const part = msg?.payload
      ? findAttachmentPart(msg.payload, req.params.attachmentId)
      : null;
    if (!part)
      return res
        .status(404)
        .json({ error: { code: 404, message: "Not Found" } });
    res.json({
      size: part.body.size,
      data: part.body.data,
      attachmentId: req.params.attachmentId,
    });
  },
);

app.post("/gmail/v1/users/me/messages/send", (req, res) => {
  const { raw } = req.body;
  sentMessages.push({ raw, sentAt: new Date().toISOString() });
  res.json({ id: `sent-${crypto.randomBytes(4).toString("hex")}` });
});

// ---- Control plane ----
app.get("/control/health", (_req, res) => res.json({ ok: true }));
app.post("/control/reset", (_req, res) => {
  resetState();
  res.json({ ok: true });
});
app.post("/control/seed", (req, res) => {
  if (Array.isArray(req.body?.messages))
    messages = req.body.messages.map(normalizeGmailMessage);
  res.json({ ok: true });
});
app.get("/control/sent", (_req, res) => res.json(sentMessages));
app.get("/control/requests", (_req, res) => res.json(requestLog));

const port = Number(process.env.PORT ?? 9004);
app.listen(port, () => console.log(`gmail-mock listening on ${port}`));
