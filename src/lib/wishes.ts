// Server-only module (uses the file system and secrets); imported only by API routes.
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export type WishStatus = "pending" | "approved" | "hidden";
export type Wish = { id: string; name: string; message: string; at: string; status: WishStatus };

const FILE = path.join(process.cwd(), "data", "wishes.json");

// Serialize all file access so concurrent replies never overwrite each other.
let queue: Promise<unknown> = Promise.resolve();
function locked<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

async function load(): Promise<Wish[]> {
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as Wish[];
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
}

async function save(list: Wish[]) {
  await mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.tmp`;
  await writeFile(tmp, JSON.stringify(list, null, 2), "utf8");
  await rename(tmp, FILE);
}

export function addWish(name: string, message: string, at: string) {
  return locked(async () => {
    const list = await load();
    const wish: Wish = { id: randomUUID(), name, message, at, status: "pending" };
    list.push(wish);
    await save(list);
    return wish;
  });
}

export const allWishes = () => locked(load);

export async function approvedWishes() {
  return (await allWishes()).filter((w) => w.status === "approved").map(({ name, message, at }) => ({ name, message, at }));
}

export function setWishStatus(id: string, status: WishStatus) {
  return locked(async () => {
    const list = await load();
    const w = list.find((x) => x.id === id);
    if (!w) return null;
    w.status = status;
    await save(list);
    return w;
  });
}

const secret = () => process.env.ADMIN_PASSWORD || "admin123";

/** Signed token for one-click approve/hide links in the notification email. */
export function wishToken(id: string, action: "approve" | "hide") {
  return createHmac("sha256", secret()).update(`${id}:${action}`).digest("hex").slice(0, 32);
}

export function checkToken(id: string, action: "approve" | "hide", token: string) {
  if (!secret()) return false;
  const a = Buffer.from(wishToken(id, action));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function checkPassword(given: unknown) {
  const real = secret();
  if (!real || typeof given !== "string") return false;
  const a = Buffer.from(real);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}
