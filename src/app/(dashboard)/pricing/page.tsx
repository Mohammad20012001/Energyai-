import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Pricing Data</h1>
        <p className="text-muted-foreground mt-2">
          Access current pricing for solar components in Jordan.
        </p>
      </div>
      <Card className="flex flex-col items-center justify-center text-center p-8 lg:min-h-[400px]">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <DollarSign className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="mt-4">Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground max-w-md">
            We are integrating with local suppliers to provide you with up-to-date pricing information for panels, inverters, and more.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
