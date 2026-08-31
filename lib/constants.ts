export const APP_NAME = 'AI-Powered Smart Resume Analyzer & Job Matcher';

export const USER_ROLES = {
  CANDIDATE: "candidate",
  RECRUITER: "recruiter",
  ADMIN: "admin",
} as const;

export const RECOMMENDATION_TYPES = {
  JOB: 'job',
  SKILL: 'skill',
  COURSE: 'course',
} as const;

export const SKILL_CATEGORIES = {
  PROGRAMMING: 'programming',
  FRAMEWORKS: 'frameworks',
  DATABASES: 'databases',
  CLOUD: 'cloud',
  TOOLS: 'tools',
  SOFT_SKILLS: 'soft_skills',
} as const;

export const ANALYSIS_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export const EMPLOYMENT_TYPES = {
  FULL_TIME: 'full-time',
  PART_TIME: 'part-time',
  CONTRACT: 'contract',
  INTERNSHIP: 'internship',
  FREELANCE: 'freelance',
  TEMPORARY: 'temporary',
} as const;

export const JOB_SOURCES = {
  MANUAL: 'manual',
  API: 'api',
  SCRAPE: 'scrape',
} as const;

export const APPLICATION_STATUS = {
  SAVED: 'saved',
  APPLIED: 'applied',
  INTERVIEW: 'interview',
  REJECTED: 'rejected',
  OFFERED: 'offered',
} as const;

export const RESUME_FILE_TYPES = {
  PDF: 'pdf',
  DOCX: 'docx',
} as const;

export const MATCH_THRESHOLD = 60; // Minimum match score to consider a job relevant
