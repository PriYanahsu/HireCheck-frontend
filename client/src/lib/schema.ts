import { z } from "zod";

/** Frontend-only types + form schemas (Spring/JPA owns the DB). */

export const insertUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  company: z.string().optional().nullable(),
});

export const insertTestSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  duration: z.number(),
  passingScore: z.number().optional().nullable(),
  shuffleQuestions: z.boolean().optional().nullable(),
  createdBy: z.number(),
});

export const insertQuestionSchema = z.object({
  testId: z.number(),
  type: z.string().min(1),
  content: z.string().min(1),
  codeSnippet: z.string().optional().nullable(),
  options: z.any().optional().nullable(),
  answer: z.string().optional().nullable(),
  testCases: z.any().optional().nullable(),
  evaluationGuidelines: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  points: z.number().optional().nullable(),
  order: z.number().optional().nullable(),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTest = z.infer<typeof insertTestSchema>;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;

export type User = {
  id: number;
  username: string;
  password: string;
  email: string;
  name: string;
  company?: string | null;
};

export type Test = {
  id: number;
  title: string;
  description?: string | null;
  duration: number;
  passingScore?: number | null;
  shuffleQuestions?: boolean | null;
  createdBy: number;
  createdAt?: string | null;
};

export type Question = {
  id: number;
  testId: number;
  type: string;
  content: string;
  codeSnippet?: string | null;
  options?: unknown;
  answer?: string | null;
  testCases?: unknown;
  evaluationGuidelines?: string | null;
  imageUrl?: string | null;
  points?: number | null;
  order?: number | null;
};

export type Candidate = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  testId: number;
  invitedBy: number;
  testLink: string;
  status?: string | null;
  invitedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  score?: number | null;
  autoSubmitted?: boolean | null;
  ipAddress?: string | null;
};

export type Response = {
  id: number;
  candidateId: number;
  questionId: number;
  response: string;
  isCorrect?: boolean | null;
  points?: number | null;
  submittedAt?: string | null;
};
