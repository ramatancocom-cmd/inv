// Server-only module for managing RSVPs in both .txt and .json formats
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile, appendFile } from "node:fs/promises";
import path from "node:path";

export type RsvpEntry = {
  id: string;
  name: string;
  attending: "yes" | "no";
  guests: number;
  message: string;
  at: string;
  ip?: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const TXT_FILE = path.join(DATA_DIR, "rsvps.txt");
const JSON_FILE = path.join(DATA_DIR, "rsvps.json");

let queue: Promise<unknown> = Promise.resolve();
function locked<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

async function loadJson(): Promise<RsvpEntry[]> {
  try {
    const raw = await readFile(JSON_FILE, "utf8");
    return JSON.parse(raw) as RsvpEntry[];
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      // If JSON does not exist but TXT does, parse existing TXT
      return await parseTxtFallback();
    }
    throw e;
  }
}

async function parseTxtFallback(): Promise<RsvpEntry[]> {
  try {
    const content = await readFile(TXT_FILE, "utf8");
    const lines = content.split("\n").filter((l) => l.trim().length > 0);
    const entries: RsvpEntry[] = [];
    for (const line of lines) {
      const parts = line.split(" | ").map((p) => p.trim());
      if (parts.length >= 3) {
        const at = parts[0] || "";
        const name = parts[1] || "";
        const status = parts[2] === "ATTENDING" ? "yes" : "no";
        let guests = status === "yes" ? 1 : 0;
        if (parts[3] && parts[3].startsWith("guests=")) {
          const g = parseInt(parts[3].replace("guests=", ""), 10);
          if (!isNaN(g)) guests = g;
        }
        const message = parts.slice(4).join(" | ") || "";
        entries.push({
          id: randomUUID(),
          name,
          attending: status,
          guests,
          message,
          at,
        });
      }
    }
    return entries;
  } catch {
    return [];
  }
}

async function saveJson(list: RsvpEntry[]) {
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = `${JSON_FILE}.tmp`;
  await writeFile(tmp, JSON.stringify(list, null, 2), "utf8");
  await rename(tmp, JSON_FILE);
}

function formatTxtLine(entry: RsvpEntry): string {
  const statusStr = entry.attending === "yes" ? "ATTENDING" : "DECLINED";
  const cleanMsg = (entry.message || "-").replace(/\r?\n|\r/g, " ").trim();
  return `${entry.at} | ${entry.name} | ${statusStr} | guests=${entry.guests} | ${cleanMsg}\n`;
}

async function rebuildTxtFile(list: RsvpEntry[]) {
  await mkdir(DATA_DIR, { recursive: true });
  const content = list.map(formatTxtLine).join("");
  const tmp = `${TXT_FILE}.tmp`;
  await writeFile(tmp, content, "utf8");
  await rename(tmp, TXT_FILE);
}

export async function addRsvp(data: {
  name: string;
  attending: "yes" | "no";
  guests: number;
  message: string;
  at: string;
  ip?: string;
}): Promise<RsvpEntry> {
  return locked(async () => {
    await mkdir(DATA_DIR, { recursive: true });
    const list = await loadJson();
    const entry: RsvpEntry = {
      id: randomUUID(),
      name: data.name,
      attending: data.attending,
      guests: data.attending === "yes" ? data.guests : 0,
      message: data.message,
      at: data.at,
      ip: data.ip,
    };
    list.push(entry);
    await saveJson(list);

    // Append to .txt file in the server
    const line = formatTxtLine(entry);
    await appendFile(TXT_FILE, line, "utf8");

    return entry;
  });
}

export const allRsvps = () => locked(loadJson);

export function deleteRsvp(id: string) {
  return locked(async () => {
    const list = await loadJson();
    const updated = list.filter((r) => r.id !== id);
    if (updated.length !== list.length) {
      await saveJson(updated);
      await rebuildTxtFile(updated);
      return true;
    }
    return false;
  });
}

export async function getRsvpsTxtContent(): Promise<string> {
  try {
    return await readFile(TXT_FILE, "utf8");
  } catch {
    const list = await allRsvps();
    return list.map(formatTxtLine).join("");
  }
}
