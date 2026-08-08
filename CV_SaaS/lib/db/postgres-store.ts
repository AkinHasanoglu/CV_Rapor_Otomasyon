import { Pool } from "pg";
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

function rowToUser(r: Record<string, unknown>): User {
  return {
    id: r.id as string,
    email: r.email as string,
    passwordHash: r.password_hash as string,
    fullName: r.full_name as string,
    role: r.role as User["role"],
    plan: r.plan as User["plan"],
    subscriptionStatus: r.subscription_status as User["subscriptionStatus"],
    stripeCustomerId: (r.stripe_customer_id as string) ?? null,
    stripeSubscriptionId: (r.stripe_subscription_id as string) ?? null,
    subscriptionPeriodEnd: (r.subscription_period_end as string) ?? null,
    createdAt: r.created_at as string,
  };
}

function rowToDocument(r: Record<string, unknown>): Document {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    title: r.title as string,
    source: r.source as Document["source"],
    inputSummary: (r.input_summary as Record<string, unknown>) ?? null,
    cvData: r.cv_data as Record<string, unknown>,
    versions: (r.versions as Document["versions"]) ?? [],
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function rowToJob(r: Record<string, unknown>): Job {
  return {
    id: r.id as string,
    userId: r.user_id as string,
    title: r.title as string,
    outputType: r.output_type as Job["outputType"],
    totalRows: Number(r.total_rows),
    processedRows: Number(r.processed_rows),
    failedRows: Number(r.failed_rows),
    status: r.status as Job["status"],
    error: (r.error as string) ?? null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function rowToJobRow(r: Record<string, unknown>): JobRow {
  return {
    id: r.id as string,
    jobId: r.job_id as string,
    rowIndex: Number(r.row_index),
    candidateName: r.candidate_name as string,
    data: r.data as Record<string, unknown>,
    status: r.status as JobRow["status"],
    error: (r.error as string) ?? null,
    output: (r.output as Record<string, unknown>) ?? null,
    filename: (r.filename as string) ?? null,
    createdAt: r.created_at as string,
  };
}

/**
 * Serverless uyumlu PostgreSQL deposu (Neon / Supabase / Vercel Postgres).
 * Aynı Store arayüzünü uygular; uygulama DATABASE_URL varsa bunu kullanır.
 */
export class PostgresStore implements Store {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 5,
      ssl:
        connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
          ? undefined
          : { rejectUnauthorized: false },
    });
  }

  // ── Kullanıcılar ────────────────────────────────────────────

  async findUserByEmail(email: string): Promise<User | null> {
    const res = await this.pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
    return res.rows[0] ? rowToUser(res.rows[0]) : null;
  }

  async findUserById(id: string): Promise<User | null> {
    const res = await this.pool.query("SELECT * FROM users WHERE id = $1", [id]);
    return res.rows[0] ? rowToUser(res.rows[0]) : null;
  }

  async createUser(data: NewUser): Promise<User> {
    const res = await this.pool.query(
      `INSERT INTO users (id, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [randomUUID(), data.email.toLowerCase(), data.passwordHash, data.fullName, data.role]
    );
    return rowToUser(res.rows[0]);
  }

  async updateUser(id: string, patch: Partial<User>): Promise<User | null> {
    const colMap: Record<string, string> = {
      fullName: "full_name",
      role: "role",
      plan: "plan",
      subscriptionStatus: "subscription_status",
      stripeCustomerId: "stripe_customer_id",
      stripeSubscriptionId: "stripe_subscription_id",
      subscriptionPeriodEnd: "subscription_period_end",
      passwordHash: "password_hash",
      email: "email",
    };
    const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return this.findUserById(id);
    const sets = entries
      .map(([k], i) => `${colMap[k]} = $${i + 2}`)
      .join(", ");
    const res = await this.pool.query(
      `UPDATE users SET ${sets}, updated_at = now() WHERE id = $1 RETURNING *`,
      [id, ...entries.map(([, v]) => v)]
    );
    return res.rows[0] ? rowToUser(res.rows[0]) : null;
  }

  // ── B2C Belge Geçmişi ───────────────────────────────────────

  async listDocuments(userId: string): Promise<Document[]> {
    const res = await this.pool.query(
      "SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    return res.rows.map(rowToDocument);
  }

  async getDocument(userId: string, id: string): Promise<Document | null> {
    const res = await this.pool.query(
      "SELECT * FROM documents WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    return res.rows[0] ? rowToDocument(res.rows[0]) : null;
  }

  async createDocument(data: NewDocument): Promise<Document> {
    const res = await this.pool.query(
      `INSERT INTO documents (id, user_id, title, source, input_summary, cv_data)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        randomUUID(),
        data.userId,
        data.title,
        data.source,
        data.inputSummary ? JSON.stringify(data.inputSummary) : null,
        JSON.stringify(data.cvData),
      ]
    );
    return rowToDocument(res.rows[0]);
  }

  async updateDocument(id: string, patch: Partial<Document>): Promise<Document | null> {
    const colMap: Record<string, string> = {
      title: "title",
      cvData: "cv_data",
      versions: "versions",
    };
    const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return null;
    const sets = entries
      .map(([k], i) => `${colMap[k]} = $${i + 2}`)
      .join(", ");
    const res = await this.pool.query(
      `UPDATE documents SET ${sets}, updated_at = now() WHERE id = $1 RETURNING *`,
      [id, ...entries.map(([, v]) => (typeof v === "object" ? JSON.stringify(v) : v))]
    );
    return res.rows[0] ? rowToDocument(res.rows[0]) : null;
  }

  async deleteDocument(userId: string, id: string): Promise<void> {
    await this.pool.query("DELETE FROM documents WHERE id = $1 AND user_id = $2", [
      id,
      userId,
    ]);
  }

  // ── B2B İşler ───────────────────────────────────────────────

  async createJob(data: NewJob): Promise<Job> {
    const res = await this.pool.query(
      `INSERT INTO jobs (id, user_id, title, output_type, total_rows)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [randomUUID(), data.userId, data.title, data.outputType, data.totalRows]
    );
    return rowToJob(res.rows[0]);
  }

  async getJob(userId: string, id: string): Promise<Job | null> {
    const res = await this.pool.query("SELECT * FROM jobs WHERE id = $1 AND user_id = $2", [
      id,
      userId,
    ]);
    return res.rows[0] ? rowToJob(res.rows[0]) : null;
  }

  async listJobs(userId: string): Promise<Job[]> {
    const res = await this.pool.query(
      "SELECT * FROM jobs WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    return res.rows.map(rowToJob);
  }

  async updateJob(id: string, patch: Partial<Job>): Promise<Job | null> {
    const colMap: Record<string, string> = {
      title: "title",
      outputType: "output_type",
      totalRows: "total_rows",
      processedRows: "processed_rows",
      failedRows: "failed_rows",
      status: "status",
      error: "error",
    };
    const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return null;
    const sets = entries
      .map(([k], i) => `${colMap[k]} = $${i + 2}`)
      .join(", ");
    const res = await this.pool.query(
      `UPDATE jobs SET ${sets}, updated_at = now() WHERE id = $1 RETURNING *`,
      [id, ...entries.map(([, v]) => v)]
    );
    return res.rows[0] ? rowToJob(res.rows[0]) : null;
  }

  async listPendingJobs(limit = 10): Promise<Job[]> {
    const res = await this.pool.query(
      `SELECT * FROM jobs
       WHERE status IN ('queued', 'processing')
       ORDER BY created_at ASC
       LIMIT $1`,
      [limit]
    );
    return res.rows.map(rowToJob);
  }

  // ── B2B İş Satırları ────────────────────────────────────────

  async createJobRows(rows: NewJobRow[]): Promise<void> {
    if (rows.length === 0) return;
    const values: unknown[] = [];
    const placeholders: string[] = [];
    rows.forEach((r, i) => {
      const base = i * 6;
      placeholders.push(
        `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`
      );
      values.push(
        randomUUID(),
        r.jobId,
        r.rowIndex,
        r.candidateName,
        JSON.stringify(r.data),
        "queued"
      );
    });
    await this.pool.query(
      `INSERT INTO job_rows (id, job_id, row_index, candidate_name, data, status)
       VALUES ${placeholders.join(", ")}`,
      values
    );
  }

  async listJobRows(jobId: string, status?: string, limit = 500): Promise<JobRow[]> {
    const params: unknown[] = [jobId];
    let sql = "SELECT * FROM job_rows WHERE job_id = $1";
    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }
    params.push(limit);
    sql += ` ORDER BY row_index ASC LIMIT $${params.length}`;
    const res = await this.pool.query(sql, params);
    return res.rows.map(rowToJobRow);
  }

  async countJobRows(jobId: string, status?: string): Promise<number> {
    const params: unknown[] = [jobId];
    let sql = "SELECT COUNT(*)::int AS c FROM job_rows WHERE job_id = $1";
    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }
    const res = await this.pool.query(sql, params);
    return Number(res.rows[0].c);
  }

  async updateJobRow(id: string, patch: Partial<JobRow>): Promise<JobRow | null> {
    const colMap: Record<string, string> = {
      status: "status",
      error: "error",
      output: "output",
      filename: "filename",
      candidateName: "candidate_name",
    };
    const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return null;
    const sets = entries
      .map(([k], i) => `${colMap[k]} = $${i + 2}`)
      .join(", ");
    const res = await this.pool.query(
      `UPDATE job_rows SET ${sets}, updated_at = now() WHERE id = $1 RETURNING *`,
      [id, ...entries.map(([, v]) => (typeof v === "object" ? JSON.stringify(v) : v))]
    );
    return res.rows[0] ? rowToJobRow(res.rows[0]) : null;
  }
}
