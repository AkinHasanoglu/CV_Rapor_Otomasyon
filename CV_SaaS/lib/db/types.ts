export type UserRole = "b2c" | "b2b";
export type Plan = "free" | "individual" | "business";
export type SubscriptionStatus =
  | "inactive"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  plan: Plan;
  subscriptionStatus: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionPeriodEnd: string | null;
  createdAt: string;
}

export type NewUser = Pick<
  User,
  "email" | "passwordHash" | "fullName" | "role"
>;

export interface DocumentVersion {
  id: string;
  title: string;
  cvData: Record<string, unknown>;
  createdAt: string;
}

export interface Document {
  id: string;
  userId: string;
  title: string;
  source: "draft" | "form";
  inputSummary: Record<string, unknown> | null;
  cvData: Record<string, unknown>;
  versions: DocumentVersion[];
  createdAt: string;
  updatedAt: string;
}

export type NewDocument = Pick<
  Document,
  "userId" | "title" | "source" | "inputSummary" | "cvData"
>;

export type JobStatus =
  | "queued"
  | "processing"
  | "completed"
  | "partial"
  | "failed";
export type OutputType = "professional" | "resume" | "project";

export interface Job {
  id: string;
  userId: string;
  title: string;
  outputType: OutputType;
  totalRows: number;
  processedRows: number;
  failedRows: number;
  status: JobStatus;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NewJob = Pick<Job, "userId" | "title" | "outputType" | "totalRows">;

export type JobRowStatus = "queued" | "processing" | "completed" | "failed";

export interface JobRow {
  id: string;
  jobId: string;
  rowIndex: number;
  candidateName: string;
  data: Record<string, unknown>;
  status: JobRowStatus;
  error: string | null;
  output: Record<string, unknown> | null;
  filename: string | null;
  createdAt: string;
}

export type NewJobRow = Pick<
  JobRow,
  "jobId" | "rowIndex" | "candidateName" | "data"
>;
