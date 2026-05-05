export type UserRole = 'admin' | 'manager' | 'operator';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  areaIds?: string[];
  createdAt?: any;
}

export interface Area {
  id: string;
  name: string;
  createdAt?: any;
}

export type Priority = 'high' | 'medium' | 'low';
export type ProblemStatus = 'open' | 'in_progress' | 'closed';

export interface Problem {
  id: string;
  title: string;
  description: string;
  areaId: string;
  priority: Priority;
  status: ProblemStatus;
  userId: string;
  reporterName?: string;
  occurrenceDate: string;
  recurrenceCount?: number;
  resolutionText?: string;
  resolvedBy?: string;
  resolvedAt?: any;
  createdAt: any;
}

export interface ProblemOccurrence {
  id: string;
  userId: string;
  date: string;
  note?: string;
  createdAt: any;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}
