import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function ReportPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Comprehensive Report Generation</h1>
        <p className="text-muted-foreground mt-2">
          Generate detailed reports for your solar system design.
        </p>
      </div>
      <Card className="flex flex-col items-center justify-center text-center p-8 lg:min-h-[400px]">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="mt-4">Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground max-w-md">
            The ability to generate comprehensive PDF reports summarizing all calculations and components is on its way.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
