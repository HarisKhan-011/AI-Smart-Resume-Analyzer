export const config = {
  // Application configuration
  appName: 'AI-Powered Smart Resume Analyzer & Job Matcher',
  version: '0.1.0',
  
  // API configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
    timeout: 30000,
  },
  
  // Resume processing configuration
  resume: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    minExtractedLength: 30,
    allowedExtensions: [".pdf", ".docx"] as const,
    allowedTypes: [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ] as const,
  },
  
  // Matching algorithm configuration
  matching: {
    threshold: 60, // Minimum match score percentage
    weight: {
      skills: 0.6,
      experience: 0.3,
      education: 0.1,
    },
  },

  recommendations: {
    limit: 10,
    minRequiredCoverage: 25,
    minMatchedRequiredSkills: 1,
    minOverallScore: 40,
    jobPoolLimit: 120,
    weight: {
      requiredSkills: 0.6,
      preferredSkills: 0.15,
      experience: 0.15,
      relevance: 0.1,
    },
  },
  
  // Pagination configuration
  pagination: {
    defaultPageSize: 10,
    maxPageSize: 50,
  },
} as const;
