import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const rootDirectory = resolve(fileURLToPath(new URL(".", import.meta.url)));
const port = Number(process.env.PORT || 4173);
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

async function respond(response, filePath, status = 200) {
  const content = await readFile(filePath);
  response.writeHead(status, {
    "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-cache"
  });
  response.end(content);
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end("Method not allowed");
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url || "/", "http://localhost").pathname);
  } catch {
    response.writeHead(400);
    response.end("Invalid path");
    return;
  }

  const requestedPath = resolve(rootDirectory, "." + pathname);
  if (requestedPath !== rootDirectory && !requestedPath.startsWith(rootDirectory + sep)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const details = await stat(requestedPath);
    if (details.isFile()) {
      await respond(response, requestedPath);
      return;
    }
  } catch {
    if (extname(pathname)) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
  }

  await respond(response, resolve(rootDirectory, "index.html"));
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write("The Less Edit is running at http://127.0.0.1:" + port + "\n");
});
