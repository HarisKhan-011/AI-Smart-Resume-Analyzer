"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckMatchForm, type MatchJobOption, type MatchResumeOption } from "@/components/matching/check-match-form"
import { JobAnalyzeForm } from "@/components/jobs/job-analyze-form"

export function JobMatchWorkspace({
  resumes,
  jobs,
  initialJobId,
}: {
  resumes: MatchResumeOption[]
  jobs: MatchJobOption[]
  initialJobId?: string
}) {
  return (
    <Tabs defaultValue="match" className="space-y-6">
      <TabsList>
        <TabsTrigger value="match">Check Match</TabsTrigger>
        <TabsTrigger value="analyze">Analyze Job</TabsTrigger>
      </TabsList>
      <TabsContent value="match">
        <CheckMatchForm resumes={resumes} jobs={jobs} initialJobId={initialJobId} />
      </TabsContent>
      <TabsContent value="analyze">
        <JobAnalyzeForm />
      </TabsContent>
    </Tabs>
  )
}
