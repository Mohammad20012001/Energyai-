import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Settings, Calculator, Zap } from "lucide-react";

export default function DashboardOverviewPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Welcome to Jordan Solar Architect</h1>
        <p className="text-muted-foreground mt-2">Your all-in-one tool for designing solar energy systems in Jordan.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="text-primary" />
              AI String Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Use AI to determine the optimal panel string configuration for your system, including common errors to avoid.
            </p>
            <Button asChild>
              <Link href="/string-configuration">
                Start Calculation <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="text-primary" />
              Panel Calculator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Calculate the ideal number of solar panels based on your energy needs and panel specifications.
            </p>
            <Button asChild variant="secondary">
              <Link href="/panel-calculator">
                Go to Calculator <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="text-primary" />
              Wire & Inverter Sizing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Determine the correct wire gauges and select the best inverter for maximum efficiency and safety.
            </p>
            <Button asChild variant="secondary">
              <Link href="/wire-sizing">
                Go to Sizing Tools <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
