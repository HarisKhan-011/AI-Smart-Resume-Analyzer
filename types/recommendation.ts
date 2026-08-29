export interface Recommendation {
  id: string;
  userId: string;
  type: 'job' | 'skill' | 'course';
  title: string;
  description: string;
  relevanceScore: number;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}
