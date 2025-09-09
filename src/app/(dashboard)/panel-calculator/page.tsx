import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator } from "lucide-react";

export default function PanelCalculatorPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Panel Calculator</h1>
        <p className="text-muted-foreground mt-2">
          Calculate the ideal number of solar panels for your energy needs.
        </p>
      </div>
      <Card className="flex flex-col items-center justify-center text-center p-8 lg:min-h-[400px]">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Calculator className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="mt-4">Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground max-w-md">
            We are working hard to bring you this feature. Soon, you'll be able to accurately calculate your panel requirements right here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
