import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BatteryCharging } from "lucide-react";

export default function InverterSizingPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Inverter Sizing Tool</h1>
        <p className="text-muted-foreground mt-2">
          Select the best inverter model for your solar array.
        </p>
      </div>
      <Card className="flex flex-col items-center justify-center text-center p-8 lg:min-h-[400px]">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <BatteryCharging className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="mt-4">Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground max-w-md">
            Our inverter selection tool, based on array power, voltage, and grid requirements, is being built. Check back soon!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
