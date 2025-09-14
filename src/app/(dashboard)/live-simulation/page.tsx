
'use client';

import {useState, useEffect, useRef, useMemo} from 'react';
import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';
import type {z} from 'zod';
import {
  Wind,
  ArrowRight,
  Loader2,
  Zap,
  Sun,
  Cloudy,
  BarChart,
  Thermometer,
  BrainCircuit,
  ShieldCheck,
  TrendingUp,
  SunDim,
  Lightbulb,
  DollarSign,
  CalendarClock,
} from 'lucide-react';
import {useToast} from '@/hooks/use-toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import {Button} from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {Alert, AlertTitle, AlertDescription} from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {startSimulationAction} from '@/app/actions/simulation';
import {cn} from '@/lib/utils';
import {
  SimulatePerformanceInputSchema,
  type SimulatePerformanceOutput,
  type SimulatePerformanceInput,
} from '@/ai/tool-schemas';
import { type WeatherPoint } from '@/services/weather-service';


const formSchema = SimulatePerformanceInputSchema;
type FormValues = z.infer<typeof formSchema>;

// This type now represents the full data point, including the time added on the client-side.
interface SimulationDataPoint extends SimulatePerformanceOutput {
    time: string;
}

interface ForecastChartDataPoint {
    time: string;
    power: number;
}


// Helper functions for calculation, kept on client for responsiveness
function estimateIrradiance(uvIndex: number, cloudCover: number): number {
    const uvBasedIrradiance = uvIndex * 100;
    const cloudFactor = 1 - (cloudCover * 0.75 / 100);
    return uvBasedIrradiance * cloudFactor;
}

function calculatePower(systemSizeKw: number, irradiance: number, temperature: number): number {
    const systemSizeWatts = systemSizeKw * 1000;
    const temperatureCoefficient = 0.0035;
    const systemLosses = 0.85;
    const tempDerating = 1 - ((temperature - 25) * temperatureCoefficient);
    const irradianceFactor = irradiance / 1000;
    const powerOutputWatts = systemSizeWatts * irradianceFactor * tempDerating * systemLosses;
    return powerOutputWatts > 0 ? powerOutputWatts : 0;
}


export default function LiveSimulationPage() {
  const [simulationData, setSimulationData] = useState<SimulationDataPoint[]>(
    []
  );
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentDataPoint, setCurrentDataPoint] =
    useState<SimulationDataPoint | null>(null);
  const [dailyExpected, setDailyExpected] = useState<{ productionKwh: number, revenue: number } | null>(null);
  const [forecastChartData, setForecastChartData] = useState<ForecastChartDataPoint[]>([]);

  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const {toast} = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      systemSize: 5,
      location: 'amman',
      panelTilt: 30,
      panelAzimuth: 180,
      kwhPrice: 0.12,
    },
  });

  const prepareForecastChartData = (forecast: WeatherPoint[], systemSize: number) => {
    const chartData = forecast.map(hourlyData => {
        const irradiance = estimateIrradiance(hourlyData.uvIndex, hourlyData.cloudCover);
        const power = calculatePower(systemSize, irradiance, hourlyData.temperature);
        return {
            time: new Date(hourlyData.time!).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '00' }),
            power: parseFloat(power.toFixed(0)),
        };
    });
    setForecastChartData(chartData);
  }

  // Calculate daily expected production and revenue
  const calculateDailyExpected = (forecast: WeatherPoint[], systemSize: number, kwhPrice: number) => {
    if (!forecast || forecast.length === 0) {
      setDailyExpected(null);
      return;
    }

    const totalDailyProductionKwh = forecast.reduce((total, hourlyData) => {
      const irradiance = estimateIrradiance(hourlyData.uvIndex, hourlyData.cloudCover);
      // Assuming calculatePower returns power in Watts for one hour
      const hourlyPowerWatts = calculatePower(systemSize, irradiance, hourlyData.temperature);
      const hourlyProductionKwh = hourlyPowerWatts / 1000; // Convert Watt-hour to kWh
      return total + hourlyProductionKwh;
    }, 0);

    setDailyExpected({
      productionKwh: totalDailyProductionKwh,
      revenue: totalDailyProductionKwh * kwhPrice,
    });
  };

  const runSimulationStep = async (values: FormValues) => {
    try {
      const result = await startSimulationAction(values);
      
      if (result.success && result.data) {
          const now = new Date();
          const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          
          const dataPoint: SimulationDataPoint = {
              ...result.data,
              time: time,
          };

          setCurrentDataPoint(dataPoint);
          setSimulationData(prevData => {
            const newData = [...prevData, dataPoint];
            return newData.slice(-15);
          });
          
          // Calculate daily expected production and chart data only on the first run
          if (simulationData.length === 0) {
             calculateDailyExpected(result.data.weather.forecast, values.systemSize, values.kwhPrice);
             prepareForecastChartData(result.data.weather.forecast, values.systemSize);
          }
      } else {
        toast({
          variant: 'destructive',
          title: 'خطأ في المحاكاة',
          description: result.error || 'فشل في الحصول على بيانات المحاكاة.',
        });
        stopSimulation();
      }
    } catch (error) {
      console.error('Simulation error:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ فادح',
        description: 'حدث خطأ غير متوقع أثناء تشغيل المحاكاة.',
      });
      stopSimulation();
    }
  };

  const startSimulation = (values: FormValues) => {
    setIsSimulating(true);
    setSimulationData([]);
    setCurrentDataPoint(null);
    setDailyExpected(null);
    setForecastChartData([]);

    runSimulationStep(values);

    simulationIntervalRef.current = setInterval(() => {
      runSimulationStep(values);
    }, 60000); // 1 minute
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
  };

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

  const performancePercentage = useMemo(() => {
    if (!currentDataPoint || currentDataPoint.clearSkyOutputPower <= 0) return 0;
    return (currentDataPoint.liveOutputPower / currentDataPoint.clearSkyOutputPower) * 100;
  }, [currentDataPoint]);

  const instantaneousSavings = useMemo(() => {
    if (!currentDataPoint) return 0;
    const kwhPrice = form.getValues('kwhPrice');
    const powerKw = currentDataPoint.liveOutputPower / 1000;
    return powerKw * kwhPrice;
  }, [currentDataPoint, form]);


  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          المحاكاة الحية والتحليل المقارن
        </h1>
        <p className="text-muted-foreground mt-2">
          قارن أداء نظامك الفعلي مع الأداء المتوقع والمثالي بناءً على بيانات
          الطقس الحية والمتوقعة.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-2 h-fit">
          <CardHeader>
            <CardTitle>إعدادات نظام المحاكاة</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6 text-right"
              >
                <fieldset disabled={isSimulating} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="systemSize"
                    render={({field}) => (
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
                    name="kwhPrice"
                    render={({field}) => (
                      <FormItem>
                        <FormLabel>سعر الكيلوواط/ساعة (دينار)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 0.12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({field}) => (
                      <FormItem>
                        <FormLabel>الموقع</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          dir="rtl"
                        >
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
                    render={({field}) => (
                      <FormItem>
                        <FormLabel>زاوية ميل الألواح (°)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 30"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="panelAzimuth"
                    render={({field}) => (
                      <FormItem>
                        <FormLabel>زاوية اتجاه الألواح (°)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="180 (للجنوب)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </fieldset>
                <Button
                  type="submit"
                  className="w-full"
                  variant={isSimulating ? 'destructive' : 'default'}
                >
                  {isSimulating ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      إيقاف المحاكاة
                    </>
                  ) : (
                    <>
                      بدء المحاكاة والتحليل{' '}
                      <ArrowRight className="mr-2 h-4 w-4" />
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
                  أدخل مواصفات نظامك لبدء محاكاة مقارنة متقدمة تكشف عن الأداء
                  الحقيقي مقابل الإمكانات الكاملة.
                </p>
              </CardContent>
            </Card>
          )}

          {(isSimulating || simulationData.length > 0) && (
            <div className="space-y-6">
              {dailyExpected && (
                  <Card className="bg-primary/5 border-primary/20">
                      <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                              <CalendarClock className="text-primary"/>
                              ملخص الإنتاج اليومي المتوقع
                          </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-4 text-center">
                          <div className="border bg-background/50 rounded-lg p-3">
                              <div className="text-2xl font-bold">{dailyExpected.productionKwh.toFixed(2)}</div>
                              <div className="text-sm text-muted-foreground">كيلوواط/ساعة</div>
                          </div>
                          <div className="border bg-background/50 rounded-lg p-3">
                              <div className="text-2xl font-bold text-green-600">{dailyExpected.revenue.toFixed(2)}</div>
                              <div className="text-sm text-muted-foreground">دينار أردني</div>
                          </div>
                      </CardContent>
                  </Card>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                      <span className="flex items-center gap-2">
                        <Zap className="text-primary" /> الإنتاج الفعلي
                      </span>
                      {currentDataPoint && (
                        <span className="text-sm font-normal text-muted-foreground">
                          {currentDataPoint.time}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    {currentDataPoint ? (
                      <div className="text-4xl font-bold text-primary">
                        {currentDataPoint.liveOutputPower.toFixed(0)}
                      </div>
                    ) : (
                      <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                    )}
                    <p className="text-muted-foreground mt-1 text-base">واط</p>
                  </CardContent>
                </Card>
                 <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <DollarSign className="text-green-500" /> معدل التوفير اللحظي
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    {currentDataPoint ? (
                      <div className="text-4xl font-bold text-green-500">
                        {instantaneousSavings.toFixed(3)}
                      </div>
                    ) : (
                      <Loader2 className="h-10 w-10 text-green-500 animate-spin mx-auto" />
                    )}
                    <p className="text-muted-foreground mt-1 text-base">دينار/ساعة</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="text-primary" /> مؤشرات الأداء
                    الرئيسية
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
                  <div className="border p-3 rounded-lg flex flex-col justify-center">
                    <div className="text-sm text-muted-foreground mb-1">
                      كفاءة الأداء الحالية
                    </div>
                    {currentDataPoint ? (
                      <div
                        className={cn(
                          'text-3xl font-bold',
                          performancePercentage > 80
                            ? 'text-green-500'
                            : performancePercentage > 50
                              ? 'text-yellow-500'
                              : 'text-red-500'
                        )}
                      >
                        {isFinite(performancePercentage)
                          ? performancePercentage.toFixed(1)
                          : 0}
                        %
                      </div>
                    ) : (
                      <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mx-auto" />
                    )}
                    <div className="text-xs text-muted-foreground">
                      (مقارنة بالسماء الصافية)
                    </div>
                  </div>
                  <div className="border p-3 rounded-lg flex flex-col justify-center">
                    <div className="text-sm text-muted-foreground mb-1">
                      الإنتاج المتوقع
                    </div>
                    {currentDataPoint ? (
                      <div className="text-3xl font-bold text-blue-500">
                        {currentDataPoint.forecastOutputPower.toFixed(0)}
                      </div>
                    ) : (
                      <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mx-auto" />
                    )}
                    <div className="text-xs text-muted-foreground">(واط)</div>
                  </div>
                </CardContent>
              </Card>

              {currentDataPoint?.performanceAnalysis && (
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertTitle>تحليل وتوصيات الخبير</AlertTitle>
                  <AlertDescription>
                    {currentDataPoint.performanceAnalysis}
                  </AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wind className="text-primary" /> بيانات الطقس الحية
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="flex items-center justify-center gap-2 border p-3 rounded-lg">
                    <SunDim className="h-6 w-6 text-yellow-500" />
                    <div>
                      <div className="font-bold">
                        {currentDataPoint?.weather.current.uvIndex ?? '...'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        مؤشر UV
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 border p-3 rounded-lg">
                    <Thermometer className="h-6 w-6 text-red-500" />
                    <div>
                      <div className="font-bold">
                        {currentDataPoint?.weather.current.temperature ?? '...'}
                      </div>
                      <div className="text-xs text-muted-foreground">°C</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 border p-3 rounded-lg">
                    <Cloudy className="h-6 w-6 text-gray-500" />
                    <div>
                      <div className="font-bold">
                        {currentDataPoint?.weather.current.cloudCover ?? '...'}
                      </div>
                      <div className="text-xs text-muted-foreground">% غيوم</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

                {forecastChartData.length > 0 && (
                    <Card>
                        <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart className="text-primary" /> منحنى الإنتاج المتوقع على مدار اليوم
                        </CardTitle>
                        </CardHeader>
                        <CardContent className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                            data={forecastChartData}
                            margin={{top: 5, right: 20, left: -10, bottom: 5}}
                            >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" />
                            <YAxis
                                label={{
                                value: 'واط',
                                angle: -90,
                                position: 'insideLeft',
                                }}
                            />
                            <Tooltip
                                contentStyle={{
                                background: 'hsl(var(--background))',
                                direction: 'rtl',
                                }}
                                formatter={(value) => [`${value} واط`, 'الإنتاج المتوقع']}
                            />
                            <Legend verticalAlign="top" align="right" wrapperStyle={{top: -4, direction: 'rtl'}}/>
                            <Line
                                name="الإنتاج المتوقع"
                                type="monotone"
                                dataKey="power"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                dot={false}
                            />
                            </LineChart>
                        </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}


              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="text-primary" /> التحليل المقارن للأداء
                    (آخر 15 دقيقة)
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{top: 5, right: 20, left: -10, bottom: 20}}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="time"
                        type="category"
                        domain={['dataMin', 'dataMax']}
                      />
                      <YAxis
                        label={{
                          value: 'واط',
                          angle: -90,
                          position: 'insideLeft',
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--background))',
                          direction: 'rtl',
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        wrapperStyle={{top: -4, right: 20, direction: 'rtl'}}
                      />
                      <Line
                        name="الفعلي"
                        type="monotone"
                        dataKey="live"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={false}
                      />
                      <Line
                        name="المتوقع"
                        type="monotone"
                        dataKey="forecast"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        strokeDasharray="5 5"
                      />
                      <Line
                        name="المثالي"
                        type="monotone"
                        dataKey="ideal"
                        stroke="#8f8f8f"
                        strokeWidth={2}
                        dot={false}
                        strokeDasharray="3 3"
                      />
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
