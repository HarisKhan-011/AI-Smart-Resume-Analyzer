export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  skills: string[];
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  postedAt: Date;
  expiresAt?: Date;
}
