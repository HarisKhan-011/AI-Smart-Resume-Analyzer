export const APP_NAME = 'AI-Powered Smart Resume Analyzer & Job Matcher';

export const USER_ROLES = {
  CANDIDATE: 'candidate',
  RECRUITER: 'recruiter',
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

export const MATCH_THRESHOLD = 60; // Minimum match score to consider a job relevant
