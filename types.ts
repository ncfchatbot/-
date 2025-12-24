
export type Grade = 'G1' | 'G2' | 'G3' | 'G4' | 'G5' | 'G6' | 'M1' | 'M2' | 'M3' | 'M4' | 'M5' | 'M6';
export type Language = 'Thai' | 'English';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export enum ProgramType {
  Standard = 'Standard',
  EP = 'English Program',
  Gifted = 'Gifted'
}

export interface School {
  id: string;
  name: string;
  affiliation: string;
  programs: ProgramType[];
}

// Added Subject interface to fix import errors in constants.ts and ExamBuilder.tsx
export interface Subject {
  id: string;
  name: string;
  nameEn: string;
}

// Added Chapter interface to fix import errors in constants.ts
export interface Chapter {
  id: string;
  subjectId: string;
  title: string;
  titleEn?: string;
}

export interface ReferenceFile {
  name: string;
  data: string; // base64
  mimeType: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
}

export interface AnalysisResult {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  readingAdvice: string;
}

export type ViewState = 'login' | 'setup' | 'quiz' | 'analysis';

export interface ExamSession {
  userId: string;
  grade: Grade;
  language: Language;
  questionCount: number;
  files: ReferenceFile[];
  questions: Question[];
  currentScore: number;
  weakTopicsFromPrevious?: string[];
}
