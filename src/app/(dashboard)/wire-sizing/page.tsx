import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";

export default function WireSizingPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Wire Sizing Calculator</h1>
        <p className="text-muted-foreground mt-2">
          Dynamically determine optimal wire gauges for your installation.
        </p>
      </div>
      <Card className="flex flex-col items-center justify-center text-center p-8 lg:min-h-[400px]">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="mt-4">Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground max-w-md">
            This tool for calculating wire gauges based on current, voltage drop, and safety standards is under development.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
