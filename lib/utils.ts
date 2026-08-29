import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function calculateMatchScore(
  resumeSkills: string[],
  jobSkills: string[]
): number {
  if (jobSkills.length === 0) return 0;
  
  const matchedSkills = resumeSkills.filter(skill =>
    jobSkills.some(jobSkill =>
      jobSkill.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(jobSkill.toLowerCase())
    )
  );
  
  return (matchedSkills.length / jobSkills.length) * 100;
}
