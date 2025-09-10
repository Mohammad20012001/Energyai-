"use client";

import { useState, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Wind, ArrowRight, Loader2, Zap, Sun, Cloudy, BarChart, Thermometer, BrainCircuit, ShieldCheck, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
import type { SimulationDataPoint, SimulatePerformanceInput } from "@/ai/types";
import { cn } from "@/lib/utils";


const formSchema = z.object({
  systemSize: z.coerce.number({invalid_type_error: "يجب أن يكون حجم النظام رقمًا موجبًا"}).positive("يجب أن يكون حجم النظام إيجابياً"),
  location: z.string({ required_error: "يجب اختيار الموقع" }),
  panelTilt: z.coerce.number().min(0, "زاوية الميل لا يمكن أن تكون سالبة").max(90, "زاوية الميل لا يمكن أن تتجاوز 90"),
  panelAzimuth: z.coerce.number().min(0, "زاوية الاتجاه يجب ان تكون بين 0 و 360").max(360, "زاوية الاتجاه يجب ان تكون بين 0 و 360"),
});


type FormValues = z.infer<typeof formSchema>;

export default function LiveSimulationPage() {
  const [simulationData, setSimulationData] = useState<SimulationDataPoint[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentDataPoint, setCurrentDataPoint] = useState<SimulationDataPoint | null>(null);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
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
        setCurrentDataPoint(result.data);
        setSimulationData(prevData => {
          const newData = [...prevData, result.data!];
          // Keep only the last 15 minutes (assuming 1 data point per minute)
          return newData.slice(-15);
        });
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
    setCurrentDataPoint(null);

    // Run first step immediately
    runSimulationStep(values);

    // Then run every 1 minute
    simulationIntervalRef.current = setInterval(() => {
      runSimulationStep(values);
    }, 60000 * 5); // 5 minutes for demo purposes to not exhaust API limits
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
      live: parseFloat(d.liveOutputPower.toFixed(0)),
      forecast: parseFloat(d.forecastOutputPower.toFixed(0)),
      ideal: parseFloat(d.clearSkyOutputPower.toFixed(0)),
  }));

  const performancePercentage = currentDataPoint && currentDataPoint.clearSkyOutputPower > 0 
    ? (currentDataPoint.liveOutputPower / currentDataPoint.clearSkyOutputPower) * 100 
    : 0;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">المحاكاة الحية والتحليل المقارن</h1>
        <p className="text-muted-foreground mt-2">
          قارن أداء نظامك الفعلي مع الأداء المتوقع والمثالي بناءً على بيانات الطقس الحية والمتوقعة.
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
                      بدء المحاكاة والتحليل <ArrowRight className="mr-2 h-4 w-4" />
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
                  <BrainCircuit className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="mt-4">احصل على رؤى أعمق</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground max-w-md">
                  أدخل مواصفات نظامك لبدء محاكاة مقارنة متقدمة تكشف عن الأداء الحقيقي مقابل الإمكانات الكاملة.
                </p>
              </CardContent>
            </Card>
          )}

          {(isSimulating || simulationData.length > 0) && (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2"><Zap className="text-primary"/> الإنتاج اللحظي الفعلي</span>
                            {currentDataPoint && <span className="text-sm font-normal text-muted-foreground">{currentDataPoint.time}</span>}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        {currentDataPoint ? (
                             <div className="text-6xl font-bold text-primary">{currentDataPoint.liveOutputPower.toFixed(0)}</div>
                        ) : (
                            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto"/>
                        )}
                        <p className="text-muted-foreground mt-2 text-lg">واط</p>
                    </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp className="text-primary" /> مؤشرات الأداء الرئيسية</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                      <div className="border p-3 rounded-lg flex flex-col justify-center">
                          <div className="text-sm text-muted-foreground mb-1">كفاءة الأداء الحالية</div>
                          {currentDataPoint ? (
                            <div className={cn("text-3xl font-bold", performancePercentage > 80 ? 'text-green-500' : performancePercentage > 50 ? 'text-yellow-500' : 'text-red-500')}>
                                {isFinite(performancePercentage) ? performancePercentage.toFixed(1) : 0}%
                            </div>
                          ) : <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mx-auto"/>}
                          <div className="text-xs text-muted-foreground">(مقارنة بالسماء الصافية)</div>
                      </div>
                      <div className="border p-3 rounded-lg flex flex-col justify-center">
                          <div className="text-sm text-muted-foreground mb-1">الإنتاج المتوقع</div>
                          {currentDataPoint ? (
                            <div className="text-3xl font-bold text-blue-500">{currentDataPoint.forecastOutputPower.toFixed(0)}</div>
                          ) : <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mx-auto"/> }
                          <div className="text-xs text-muted-foreground">(واط)</div>
                      </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Wind className="text-primary"/> بيانات الطقس الحية</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                      <div className="flex items-center gap-2 border p-3 rounded-lg">
                        <Sun className="h-6 w-6 text-yellow-500"/>
                        <div>
                          <div className="font-bold">{currentDataPoint?.liveSolarIrradiance ?? '...'}</div>
                          <div className="text-xs text-muted-foreground">W/m²</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 border p-3 rounded-lg">
                        <Thermometer className="h-6 w-6 text-red-500"/>
                         <div>
                          <div className="font-bold">{currentDataPoint?.liveTemperature ?? '...'}</div>
                          <div className="text-xs text-muted-foreground">°C</div>
                        </div>
                      </div>
                       <div className="flex items-center gap-2 border p-3 rounded-lg">
                        <Cloudy className="h-6 w-6 text-gray-500"/>
                         <div>
                          <div className="font-bold">{currentDataPoint?.liveCloudCover ?? '...'}</div>
                          <div className="text-xs text-muted-foreground">%</div>
                        </div>
                      </div>
                  </CardContent>
                </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><BarChart className="text-primary"/> التحليل المقارن للأداء (آخر 15 دقيقة)</CardTitle>
                </CardHeader>
                <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" />
                            <YAxis label={{ value: 'واط', angle: -90, position: 'insideLeft' }}/>
                            <Tooltip contentStyle={{ background: "hsl(var(--background))", direction: 'rtl' }}/>
                            <Legend verticalAlign="top" wrapperStyle={{top: -4, right: 20, direction: 'rtl' }}/>
                            <Line name="الفعلي" type="monotone" dataKey="live" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} />
                            <Line name="المتوقع" type="monotone" dataKey="forecast" stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                            <Line name="المثالي" type="monotone" dataKey="ideal" stroke="#8f8f8f" strokeWidth={2} dot={false} strokeDasharray="3 3" />
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

    