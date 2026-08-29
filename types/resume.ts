export interface Resume {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
  parsedData?: ParsedResumeData;
}

export interface ParsedResumeData {
  skills: string[];
  experience: WorkExperience[];
  education: Education[];
  summary?: string;
}

export interface WorkExperience {
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  graduationYear: string;
}
