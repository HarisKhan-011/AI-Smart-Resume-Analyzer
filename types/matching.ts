export interface MatchResult {
  resumeId: string;
  jobId: string;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  skillGapAnalysis: SkillGap[];
  createdAt: Date;
}

export interface SkillGap {
  skill: string;
  required: boolean;
  proficiency?: 'beginner' | 'intermediate' | 'advanced';
}
