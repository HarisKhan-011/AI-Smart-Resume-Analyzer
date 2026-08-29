export interface User {
  id: string;
  email: string;
  name: string;
  role: 'candidate' | 'recruiter';
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  profile?: {
    title?: string;
    location?: string;
    bio?: string;
  };
}
