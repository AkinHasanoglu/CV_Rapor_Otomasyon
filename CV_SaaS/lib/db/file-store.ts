import { mkdir, readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Store } from "./index";
import type {
  Document,
  Job,
  JobRow,
  NewDocument,
  NewJob,
  NewJobRow,
  NewUser,
  User,
} from "./types";

/**
 * Yerel geliştirme deposu: DATABASE_URL tanımlı değilse verileri
 * .data/ dizinindeki JSON dosyalarında saklar. Production'da
 * PostgresStore kullanılır; bu depo arayüzü birebir aynıdır.
 */
export class FileStore implements Store {
  private dir: string;
  private cache = new Map<string, unknown[]>();

  constructor(dir = path.join(process.cwd(), ".data")) {
    this.dir = dir;
  }

  private file(name: string): string {
    return path.join(this.dir, `${name}.json`);
  }

  private async load<T>(name: string): Promise<T[]> {
    if (this.cache.has(name)) return this.cache.get(name) as T[];
    try {
      if (existsSync(this.file(name))) {
        const raw = await readFile(this.file(name), "utf-8");
        const arr = raw ? (JSON.parse(raw) as T[]) : [];
        this.cache.set(name, arr);
        return arr;
      }
    } catch {
      // bozuk dosya -> boş dizi ile devam
    }
    this.cache.set(name, []);
    return [] as T[];
  }

  private async persist<T>(name: string, rows: T[]): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    await writeFile(this.file(name), JSON.stringify(rows, null, 2), "utf-8");
  }

  private async add<T extends { id: string }>(
    name: string,
    row: T
  ): Promise<T> {
    const rows = await this.load<T>(name);
    rows.push(row);
    await this.persist(name, rows);
    return row;
  }

  private async patch<T extends { id: string }>(
    name: string,
    id: string,
    patch: Partial<T>
  ): Promise<T | null> {
    const rows = await this.load<T>(name);
    const idx = rows.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    rows[idx] = { ...rows[idx], ...patch, id };
    await this.persist(name, rows);
    return rows[idx];
  }

  private async list<T>(name: string, predicate?: (r: T) => boolean): Promise<T[]> {
    const rows = await this.load<T>(name);
    return predicate ? rows.filter(predicate) : [...rows];
  }

  // ── Kullanıcılar ────────────────────────────────────────────

  async findUserByEmail(email: string): Promise<User | null> {
    const rows = await this.list<User>("users", (u) => u.email === email.toLowerCase());
    return rows[0] ?? null;
  }

  async findUserById(id: string): Promise<User | null> {
    const rows = await this.list<User>("users", (u) => u.id === id);
    return rows[0] ?? null;
  }

  async createUser(data: NewUser): Promise<User> {
    const now = new Date().toISOString();
    const user: User = {
      id: randomUUID(),
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      fullName: data.fullName,
      role: data.role,
      plan: "free",
      subscriptionStatus: "inactive",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionPeriodEnd: null,
      createdAt: now,
    };
    return this.add("users", user);
  }

  async updateUser(id: string, patch: Partial<User>): Promise<User | null> {
    return this.patch<User>("users", id, patch);
  }

  async listAllUsers(): Promise<User[]> {
    return this.list<User>("users");
  }

  // ── B2C Belge Geçmişi ───────────────────────────────────────

  async listDocuments(userId: string): Promise<Document[]> {
    const rows = await this.list<Document>("documents", (d) => d.userId === userId);
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getDocument(userId: string, id: string): Promise<Document | null> {
    const rows = await this.list<Document>("documents", (d) => d.id === id && d.userId === userId);
    return rows[0] ?? null;
  }

  async createDocument(data: NewDocument): Promise<Document> {
    const now = new Date().toISOString();
    const doc: Document = {
      id: randomUUID(),
      userId: data.userId,
      title: data.title,
      source: data.source,
      inputSummary: data.inputSummary ?? null,
      cvData: data.cvData,
      versions: [],
      createdAt: now,
      updatedAt: now,
    };
    return this.add("documents", doc);
  }

  async updateDocument(id: string, patch: Partial<Document>): Promise<Document | null> {
    const updated = await this.patch<Document>("documents", id, {
      ...patch,
      updatedAt: new Date().toISOString(),
    });
    return updated;
  }

  async deleteDocument(userId: string, id: string): Promise<void> {
    const rows = await this.load<Document>("documents");
    const next = rows.filter((d) => !(d.id === id && d.userId === userId));
    await this.persist("documents", next);
    this.cache.set("documents", next);
  }

  // ── B2B İşler ───────────────────────────────────────────────

  async createJob(data: NewJob): Promise<Job> {
    const now = new Date().toISOString();
    const job: Job = {
      id: randomUUID(),
      userId: data.userId,
      title: data.title,
      outputType: data.outputType,
      totalRows: data.totalRows,
      processedRows: 0,
      failedRows: 0,
      status: "queued",
      error: null,
      createdAt: now,
      updatedAt: now,
    };
    return this.add("jobs", job);
  }

  async getJob(userId: string, id: string): Promise<Job | null> {
    const rows = await this.list<Job>("jobs", (j) => j.id === id && j.userId === userId);
    return rows[0] ?? null;
  }

  async listJobs(userId: string): Promise<Job[]> {
    const rows = await this.list<Job>("jobs", (j) => j.userId === userId);
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async updateJob(id: string, patch: Partial<Job>): Promise<Job | null> {
    const updated = await this.patch<Job>("jobs", id, {
      ...patch,
      updatedAt: new Date().toISOString(),
    });
    return updated;
  }

  async listPendingJobs(limit = 10): Promise<Job[]> {
    const rows = await this.list<Job>(
      "jobs",
      (j) => j.status === "queued" || j.status === "processing"
    );
    return rows
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(0, limit);
  }

  // ── B2B İş Satırları ────────────────────────────────────────

  async createJobRows(rows: NewJobRow[]): Promise<void> {
    const now = new Date().toISOString();
    const records: JobRow[] = rows.map((r) => ({
      id: randomUUID(),
      jobId: r.jobId,
      rowIndex: r.rowIndex,
      candidateName: r.candidateName,
      data: r.data,
      status: "queued",
      error: null,
      output: null,
      filename: null,
      createdAt: now,
    }));
    const existing = await this.load<JobRow>("job_rows");
    existing.push(...records);
    await this.persist("job_rows", existing);
  }

  async listJobRows(jobId: string, status?: string, limit = 500): Promise<JobRow[]> {
    const rows = await this.list<JobRow>("job_rows", (r) => {
      if (r.jobId !== jobId) return false;
      if (status && r.status !== status) return false;
      return true;
    });
    return rows.sort((a, b) => a.rowIndex - b.rowIndex).slice(0, limit);
  }

  async countJobRows(jobId: string, status?: string): Promise<number> {
    const rows = await this.list<JobRow>("job_rows", (r) => {
      if (r.jobId !== jobId) return false;
      if (status && r.status !== status) return false;
      return true;
    });
    return rows.length;
  }

  async updateJobRow(id: string, patch: Partial<JobRow>): Promise<JobRow | null> {
    return this.patch<JobRow>("job_rows", id, patch);
  }
}
