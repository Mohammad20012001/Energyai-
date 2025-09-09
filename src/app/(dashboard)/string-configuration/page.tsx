import { StringConfigurationClientPage } from "@/components/string-configuration-client-page";

export default function StringConfigurationPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">AI-Powered String Configuration</h1>
        <p className="text-muted-foreground mt-2">
          Determine the optimal number of panels per string and parallel strings to meet your voltage and current requirements.
        </p>
      </div>
      <StringConfigurationClientPage />
    </div>
  );
}
