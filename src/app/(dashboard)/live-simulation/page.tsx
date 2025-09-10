"use client";

import { useState, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Wind, ArrowRight, Loader2, Zap, Sun, Cloudy, Clock, BarChart, PlusCircle, Thermometer } from "lucide-react";
import { useReport } from "@/context/ReportContext";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { startSimulationAction } from "@/app/actions/simulation";
import type { SimulationDataPoint } from "@/ai/types";
import { SimulatePerformanceInputSchema } from "@/ai/types";


const formSchema = SimulatePerformanceInputSchema;

type FormValues = z.infer<typeof formSchema>;

export default function LiveSimulationPage() {
  const [simulationData, setSimulationData] = useState<SimulationDataPoint[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentWeather, setCurrentWeather] = useState<SimulationDataPoint | null>(null);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { addReportCard } = useReport();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      systemSize: 5,
      location: "amman",
      panelTilt: 30,
      panelAzimuth: 180,
    },
  });

  const runSimulationStep = async (values: FormValues) => {
    try {
      const result = await startSimulationAction(values);
      if (result.success && result.data) {
        setSimulationData(prevData => {
          const newData = [...prevData, result.data!];
          // Keep only the last 15 minutes (assuming 1 data point per minute)
          return newData.slice(-15);
        });
        setCurrentWeather(result.data);
      } else {
        toast({
          variant: "destructive",
          title: "خطأ في المحاكاة",
          description: result.error || "فشل في الحصول على بيانات المحاكاة.",
        });
        stopSimulation();
      }
    } catch (error) {
      console.error("Simulation error:", error);
      toast({
        variant: "destructive",
        title: "خطأ فادح",
        description: "حدث خطأ غير متوقع أثناء تشغيل المحاكاة.",
      });
      stopSimulation();
    }
  };

  const startSimulation = (values: FormValues) => {
    setIsSimulating(true);
    setSimulationData([]);
    setCurrentWeather(null);

    // Run first step immediately
    runSimulationStep(values);

    // Then run every 1 minute
    simulationIntervalRef.current = setInterval(() => {
      runSimulationStep(values);
    }, 60000); // 60 seconds
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
  };
  
  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, []);

  function onSubmit(values: FormValues) {
    if (isSimulating) {
      stopSimulation();
    } else {
      startSimulation(values);
    }
  }
  
  const chartData = simulationData.map(d => ({
      time: d.time,
      output: parseFloat(d.outputPower.toFixed(2)),
  }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">المحاكاة الحية للأداء (التوأم الرقمي)</h1>
        <p className="text-muted-foreground mt-2">
          شاهد الأداء المتوقع لنظامك الشمسي لحظة بلحظة بناءً على ظروف الطقس المحاكاة.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-2 h-fit">
          <CardHeader>
            <CardTitle>إعدادات نظام المحاكاة</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 text-right">
                <fieldset disabled={isSimulating} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="systemSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>حجم النظام (kWp)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الموقع</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر مدينة..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="amman">عمان</SelectItem>
                            <SelectItem value="zarqa">الزرقاء</SelectItem>
                            <SelectItem value="irbid">إربد</SelectItem>
                            <SelectItem value="aqaba">العقبة</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="panelTilt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>زاوية ميل الألواح (°)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 30" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="panelAzimuth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>زاوية اتجاه الألواح (°)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="180 (للجنوب)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </fieldset>
                <Button type="submit" className="w-full" variant={isSimulating ? "destructive" : "default"}>
                  {isSimulating ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      إيقاف المحاكاة
                    </>
                  ) : (
                    <>
                      بدء المحاكاة <ArrowRight className="mr-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          {!isSimulating && simulationData.length === 0 && (
            <Card className="flex flex-col items-center justify-center text-center p-8 lg:min-h-[400px] bg-muted/20">
              <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Wind className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="mt-4">أنشئ نسختك الرقمية الخاصة</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground max-w-md">
                  أدخل مواصفات نظامك الشمسي لبدء محاكاة حية لأدائه وتوليده للطاقة.
                </p>
              </CardContent>
            </Card>
          )}

          {(isSimulating || simulationData.length > 0) && (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>الإنتاج اللحظي</span>
                            {currentWeather && <span className="text-sm font-normal text-muted-foreground">{currentWeather.time}</span>}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        {currentWeather ? (
                             <div className="text-6xl font-bold text-primary">{currentWeather.outputPower.toFixed(2)}</div>
                        ) : (
                            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto"/>
                        )}
                        <p className="text-muted-foreground mt-2 text-lg">واط</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>ظروف الطقس المحاكاة</CardTitle>
                    </CardHeader>
                     <CardContent>
                        {currentWeather ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                                <div className="border p-3 rounded-lg">
                                    <Sun className="mx-auto h-6 w-6 text-yellow-500 mb-1"/>
                                    <div className="font-bold">{currentWeather.solarIrradiance}</div>
                                    <div className="text-xs text-muted-foreground">W/m²</div>
                                </div>
                                <div className="border p-3 rounded-lg">
                                    <Thermometer className="mx-auto h-6 w-6 text-red-500 mb-1"/>
                                    <div className="font-bold">{currentWeather.temperature.toFixed(1)}</div>
                                    <div className="text-xs text-muted-foreground">°C</div>
                                </div>
                                <div className="border p-3 rounded-lg col-span-2 sm:col-span-1">
                                    <Cloudy className="mx-auto h-6 w-6 text-blue-400 mb-1"/>
                                    <div className="font-bold">{currentWeather.cloudCover.toFixed(1)}</div>
                                    <div className="text-xs text-muted-foreground">%</div>
                                </div>
                            </div>
                        ) : (
                             <div className="flex justify-center items-center p-8">
                                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin"/>
                             </div>
                        )}
                    </CardContent>
                </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><BarChart className="text-primary"/> مخطط الأداء (آخر 15 دقيقة)</CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" />
                            <YAxis label={{ value: 'واط', angle: -90, position: 'insideLeft' }}/>
                            <Tooltip contentStyle={{ background: "hsl(var(--background))" }}/>
                            <Line type="monotone" dataKey="output" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
