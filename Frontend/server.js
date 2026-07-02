import { createServer } from "http";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");

const readJson = async (fileName) => {
  const filePath = path.join(publicDir, fileName);
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw);
};

const writeJson = async (fileName, data) => {
  const filePath = path.join(publicDir, fileName);
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
};

const parseBody = async (request) => {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  const bodyString = Buffer.concat(chunks).toString();
  try {
    return JSON.parse(bodyString);
  } catch {
    return {};
  }
};

const sendJson = (response, data, status = 200) => {
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  response.end(JSON.stringify(data));
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const { pathname } = url;

  if (request.method === "OPTIONS") {
    sendJson(response, { ok: true });
    return;
  }

  try {
    if (request.method === "GET" && pathname === "/api/voters/eligible") {
      const data = await readJson("voters.json");
      sendJson(response, data);
      return;
    }

    if (request.method === "POST" && pathname === "/api/voters/verify") {
      const { studentId } = await parseBody(request);
      const data = await readJson("voters.json");
      const valid = data.eligibleStudentIds.includes(studentId);
      sendJson(response, { valid });
      return;
    }

    if (request.method === "GET" && pathname === "/api/candidates") {
      // Serve candidates from elections.json (positions of the active election)
      const elections = await readJson("elections.json");
      const active = Array.isArray(elections) ? elections.find((e) => e.status === "active") ?? elections[0] : null;
      const positions = active?.positions ?? [];
      sendJson(response, { positions });
      return;
    }

    if (
      request.method === "GET" &&
      (pathname === "/api/elections" || pathname === "/elections")
    ) {
      const data = await readJson("elections.json");
      sendJson(response, data);
      return;
    }

    if (
      request.method === "POST" &&
      (pathname === "/api/elections" || pathname === "/elections")
    ) {
      const body = await parseBody(request);
      const electionsData = await readJson("elections.json");
      const nextElection = {
        id: Date.now().toString(),
        name: body.name ?? body.title ?? "Untitled Election",
        description: body.description ?? "",
        status: body.status ?? "draft",
        startDate: body.startDate ?? "",
        endDate: body.endDate ?? "",
        // accept either an array of positions or a numeric count
        positions: Array.isArray(body.positions) ? body.positions : Number(body.positions ?? 0),
        eligibleVoters: Number(body.eligibleVoters ?? 0),
      };
      electionsData.push(nextElection);
      await writeJson("elections.json", electionsData);
      sendJson(response, nextElection, 201);
      return;
    }

    if (request.method === "POST" && pathname === "/api/votes") {
      const body = await parseBody(request);
      const votesData = await readJson("votes.json");
      const nextVote = {
        studentId: body.studentId,
        selections: body.selections ?? [],
        timestamp: new Date().toISOString(),
      };
      votesData.votes.push(nextVote);
      await writeJson("votes.json", votesData);
      sendJson(response, { success: true });
      return;
    }

    if (request.method === "POST" && pathname === "/api/voters/otp") {
      const { otp } = await parseBody(request);
      const valid = otp === "000000";
      sendJson(response, { valid });
      return;
    }

    sendJson(response, { error: "Not found" }, 404);
  } catch (error) {
    console.error(error);
    sendJson(response, { error: "Server error" }, 500);
  }
});

const port = process.env.PORT || 4001;
server.listen(port, () => {
  console.log(`Local JSON API server listening on http://localhost:${port}`);
});
