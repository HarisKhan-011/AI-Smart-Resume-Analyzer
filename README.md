# AI-Powered Smart Resume Analyzer & Job Matcher

## Project

An intelligent system that analyzes resumes, extracts skills and experience, compares resumes with job descriptions, calculates job compatibility, identifies skill gaps, and recommends relevant jobs using AI and NLP technologies.

## Purpose

This system aims to help job seekers optimize their resumes and find the best matching job opportunities, while assisting recruiters in identifying the most suitable candidates for their positions through data-driven analysis.

## Planned AI Features

The system will implement the following AI-powered features:

- **Resume Parsing**: Extract structured data from unstructured resume documents
- **NLP Preprocessing**: Clean and normalize text data for analysis
- **Skill Extraction**: Identify and categorize skills from resumes and job descriptions
- **TF-IDF**: Term frequency-inverse document frequency for text analysis
- **Cosine Similarity**: Calculate similarity between resumes and job descriptions
- **Semantic Similarity**: Advanced understanding of related skills and concepts
- **Skill Gap Analysis**: Identify missing skills and provide recommendations
- **Job Recommendation**: AI-powered job matching based on profile analysis
- **Candidate Ranking**: Rank candidates based on job fit metrics

## Planned Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **React 18**: UI library

### Backend & Database
- **Next.js API Routes**: Server-side API endpoints
- **MongoDB**: NoSQL database for data persistence
- **Mongoose**: MongoDB object modeling

### AI & NLP Services
- **Natural Language Processing**: Text analysis and processing
- **Machine Learning**: Similarity calculations and recommendations
- **Job APIs**: Integration with job posting platforms

### Development Tools
- **ESLint**: Code linting and quality
- **TypeScript**: Static type checking
- **Git**: Version control

## Project Structure

```
AI-Smart-Resume-Analyzer/
├── app/                      # Next.js App Router pages and layouts
│   ├── (auth)/              # Authentication routes
│   ├── dashboard/          # User dashboard
│   ├── resume/              # Resume upload and analysis
│   ├── jobs/                # Job listings and details
│   ├── job-match/           # Job matching results
│   ├── skill-gap/           # Skill gap analysis
│   ├── recommendations/     # AI recommendations
│   ├── applications/        # Job applications tracking
│   ├── profile/             # User profile management
│   ├── recruiter/           # Recruiter-specific features
│   └── api/                 # API route handlers
├── components/              # Reusable React components
│   ├── ui/                  # UI components
│   ├── layout/              # Layout components
│   ├── resume/              # Resume-related components
│   ├── jobs/                # Job-related components
│   ├── matching/            # Matching-related components
│   ├── dashboard/           # Dashboard components
│   └── recruiter/           # Recruiter components
├── lib/                     # Shared utilities and configuration
│   ├── utils.ts             # Utility functions
│   ├── constants.ts         # Application constants
│   ├── validations.ts       # Validation functions
│   └── config.ts            # Configuration settings
├── services/                # Business logic services
│   ├── resume/              # Resume processing services
│   ├── jobs/                # Job data services
│   ├── matching/            # Matching algorithm services
│   ├── recommendations/     # Recommendation services
│   └── ai/                  # AI/NLP services
├── models/                  # Database models (MongoDB/Mongoose)
├── types/                   # TypeScript type definitions
│   ├── resume.ts            # Resume types
│   ├── job.ts               # Job types
│   ├── user.ts              # User types
│   ├── matching.ts          # Matching result types
│   └── recommendation.ts    # Recommendation types
├── data/                    # Static data
│   └── skills.json          # Skills database
├── hooks/                   # Custom React hooks
├── public/                  # Static assets
│   ├── images/              # Image assets
│   └── icons/               # Icon assets
├── config/                  # Configuration files
├── tests/                   # Test files
│   ├── unit/                # Unit tests
│   └── integration/         # Integration tests
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
├── package.json             # Project dependencies
├── tsconfig.json            # TypeScript configuration
├── next.config.ts           # Next.js configuration
├── eslint.config.mjs        # ESLint configuration
└── README.md                # Project documentation
```

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager
- MongoDB (for local development)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
4. Configure your environment variables in `.env`

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Build for production:
```bash
npm run build
```

### Production

Start the production server:
```bash
npm start
```

## Status

This project is currently in the initial setup phase. The foundation has been created with:

- ✅ Next.js project structure with TypeScript
- ✅ App Router configuration
- ✅ Tailwind CSS setup
- ✅ ESLint configuration
- ✅ Basic routing structure
- ✅ TypeScript type definitions
- ✅ Utility functions and constants
- ✅ Placeholder API routes
- ✅ Skills database

The following features are **not yet implemented** and will be developed in future phases:

- ❌ Resume parsing and analysis
- ❌ AI/NLP integration
- ❌ Job matching algorithms
- ❌ MongoDB integration
- ❌ Authentication system
- ❌ Dashboard UI
- ❌ Job APIs integration
- ❌ Web scraping
- ❌ Recommendation system

## License

This project is part of a Final Year Project (FYP).

## Contributing

This is a student project. Contributions are not currently being accepted.

## Contact

For questions about this project, please contact the project team.
# AI-Smart-Resume-Analyzer
