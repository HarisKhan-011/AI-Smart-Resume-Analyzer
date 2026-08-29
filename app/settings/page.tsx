import { FeaturePlaceholder } from "@/components/shared/feature-placeholder"
import { Settings } from "lucide-react"

export default function SettingsPage() {
  return (
    <FeaturePlaceholder
      title="Settings"
      description="Account and application settings will be available in a future phase."
      icon={Settings}
      actionLabel="Go to Profile"
      actionHref="/profile"
    />
  )
}
