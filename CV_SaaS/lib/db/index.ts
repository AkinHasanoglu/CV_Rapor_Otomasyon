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

export interface Store {
  // Kullanıcılar
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  createUser(data: NewUser): Promise<User>;
  updateUser(id: string, patch: Partial<User>): Promise<User | null>;

  // B2C Belge Geçmişi
  listDocuments(userId: string): Promise<Document[]>;
  getDocument(userId: string, id: string): Promise<Document | null>;
  createDocument(data: NewDocument): Promise<Document>;
  updateDocument(id: string, patch: Partial<Document>): Promise<Document | null>;
  deleteDocument(userId: string, id: string): Promise<void>;

  // B2B İşler
  createJob(data: NewJob): Promise<Job>;
  getJob(userId: string, id: string): Promise<Job | null>;
  listJobs(userId: string): Promise<Job[]>;
  updateJob(id: string, patch: Partial<Job>): Promise<Job | null>;
  listPendingJobs(limit?: number): Promise<Job[]>;

  // B2B İş Satırları
  createJobRows(rows: NewJobRow[]): Promise<void>;
  listJobRows(jobId: string, status?: string, limit?: number): Promise<JobRow[]>;
  countJobRows(jobId: string, status?: string): Promise<number>;
  updateJobRow(id: string, patch: Partial<JobRow>): Promise<JobRow | null>;
}

import { FileStore } from "./file-store";
import { PostgresStore } from "./postgres-store";

let cachedStore: Store | null = null;

export function getStore(): Store {
  if (cachedStore) return cachedStore;
  cachedStore = process.env.DATABASE_URL
    ? new PostgresStore(process.env.DATABASE_URL)
    : new FileStore();
  return cachedStore;
}

export function resetStore(): void {
  cachedStore = null;
}

export * from "./types";
