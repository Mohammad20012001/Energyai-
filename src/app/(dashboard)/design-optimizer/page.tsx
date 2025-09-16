
"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { BrainCircuit, ArrowRight, Loader2, Ruler, PlusCircle, Settings, Sun, Maximize, Scale, TrendingUp, BarChart3, CalendarDays, AreaChart, Activity, ChevronsRight, ChevronsLeft, ChevronsUpDown } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { optimizeDesign } from "@/ai/flows/optimize-design";
import { OptimizeDesignInputSchema, type OptimizeDesignOutput } from '@/ai/tool-schemas';
import type { z } from 'zod';
import { useReport } from "@/context/ReportContext";
import { cn } from "@/lib/utils";
import { useSearchParams } from 'next/navigation';


type FormValues = z.infer<typeof OptimizeDesignInputSchema>;

const PaybackPeriod = ({ months } : { months: number}) => {
    if (!isFinite(months) || months >= 300) {
        return <span className="text-xl font-bold">أكثر من 25 سنة</span>;
    }
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return <span className="text-xl font-bold">{years} سنة و {remainingMonths} أشهر</span>;
};


export default function DesignOptimizerPage() {
  const [result, setResult] = useState<OptimizeDesignOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { addReportCard } = useReport();
  const searchParams = useSearchParams();

  const form = useForm<FormValues>({
    resolver: zodResolver(OptimizeDesignInputSchema),
    defaultValues: {
      calculationMode: 'consumption',
      surfaceArea: 80,
      monthlyConsumption: 700,
      monthlyBill: 85,
      location: "amman",
      // Advanced defaults
      systemLoss: 15,
      panelWattage: 550,
      costPerWatt: 0.6,
      kwhPrice: 0.12,
      degradationRate: 0.5,
    },
  });

  // Effect to read query parameters and populate the form
  useEffect(() => {
    const surfaceArea = searchParams.get('surfaceArea');
    const panelWattage = searchParams.get('panelWattage');
    const monthlyConsumption = searchParams.get('monthlyConsumption');
    
    let shouldSubmit = false;

    if (surfaceArea) {
      form.setValue('surfaceArea', parseFloat(surfaceArea), { shouldValidate: true });
      shouldSubmit = true;
    }
    if (panelWattage) {
      form.setValue('panelWattage', parseFloat(panelWattage), { shouldValidate: true });
      shouldSubmit = true;
    }
     if (monthlyConsumption) {
      form.setValue('calculationMode', 'consumption');
      form.setValue('monthlyConsumption', parseFloat(monthlyConsumption), { shouldValidate: true });
      shouldSubmit = true;
    }
    // If params exist, automatically trigger calculation
    if (shouldSubmit) {
        form.handleSubmit(onSubmit)();
    }
  }, [searchParams, form]);


  const calculationMode = useWatch({ control: form.control, name: 'calculationMode' });

  useEffect(() => {
    // When switching tabs, clear the validation error of the other tab
    form.clearErrors('monthlyConsumption');
    form.clearErrors('monthlyBill');
  }, [calculationMode, form]);

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await optimizeDesign(values);
      setResult(response);
    } catch (error) {
      console.error("Error fetching design optimization:", error);
      toast({
        variant: "destructive",
        title: "خطأ في الاتصال",
        description: "فشل في الحصول على اقتراح من الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  const handleAddToReport = () => {
    if (!result || !result.financialAnalysis) return;
    addReportCard({
      id: `design-optimizer-${Date.now()}`,
      type: "حاسبة حجم النظام الفني والمالي",
      summary: `نظام ${result.panelConfig.totalDcPower}kWp بتكلفة ${result.financialAnalysis.totalInvestment.toFixed(0)} دينار`,
      values: {
        "حجم النظام الأمثل": `${result.panelConfig.totalDcPower} kWp`,
        "عدد الألواح": `${result.panelConfig.panelCount} لوح`,
        "التكلفة الإجمالية": `${result.financialAnalysis.totalInvestment.toFixed(0)} دينار`,
        "فترة الاسترداد": `${result.financialAnalysis.paybackPeriodYears.toFixed(1)} سنوات`,
      }
    });
    toast({
      title: "تمت الإضافة بنجاح",
      description: "تمت إضافة بطاقة الحاسبة إلى تقريرك.",
    });
  };

  const LimitingFactorIcon = result?.limitingFactor === 'area' ? Ruler : Scale;
  const limitingFactorText = result?.limitingFactor === 'area' ? 'المساحة هي العامل المحدد' : 'الاستهلاك هو العامل المحدد';

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">حاسبة حجم النظام الفني والمالي</h1>
        <p className="text-muted-foreground mt-2">
          أدخل قيودك (الاستهلاك والمساحة) وسيقوم الذكاء الاصطناعي بتصميم النظام الأمثل وتقديم تحليل مالي متكامل.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-2 h-fit">
          <CardHeader>
            <CardTitle>أدخل قيود ومعلمات التصميم</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 text-right">
                
                <Tabs defaultValue="consumption" className="w-full" onValueChange={(value) => form.setValue('calculationMode', value as 'consumption' | 'bill')}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="consumption">حسب الاستهلاك</TabsTrigger>
                        <TabsTrigger value="bill">حسب الفاتورة</TabsTrigger>
                    </TabsList>
                    <TabsContent value="consumption" className="pt-4">
                        <FormField
                            control={form.control}
                            name="monthlyConsumption"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>متوسط الاستهلاك الشهري (kWh)</FormLabel>
                                <FormControl>
                                <Input type="number" placeholder="e.g., 700" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </TabsContent>
                    <TabsContent value="bill" className="pt-4 space-y-4">
                         <FormField
                            control={form.control}
                            name="monthlyBill"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>قيمة الفاتورة الشهرية (دينار)</FormLabel>
                                <FormControl>
                                <Input type="number" placeholder="e.g., 85" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                          control={form.control}
                          name="kwhPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>سعر الكيلوواط/ساعة في فاتورتك (دينار)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </TabsContent>
                </Tabs>
                
                <fieldset disabled={isLoading} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="surfaceArea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المساحة المتاحة (م²)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 60" {...field} />
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

                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>
                        <span className="flex items-center gap-2">
                            <Settings className="h-4 w-4"/>
                            إعدادات فنية ومالية (اختياري)
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-4">
                        <FormField
                          control={form.control}
                          name="panelWattage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>قدرة اللوح المستخدم (واط)</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="systemLoss"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>نسبة الفقد في النظام (%)</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={form.control}
                          name="costPerWatt"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>تكلفة الواط الشمسي (دينار)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="degradationRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>نسبة التهالك السنوي للألواح (%)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.1" placeholder="e.g., 0.5" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>


                </fieldset>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      ...جاري التصميم والتحليل
                    </>
                  ) : (
                    <>
                      تصميم وتحليل الآن <ArrowRight className="mr-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          {isLoading && (
            <Card className="flex items-center justify-center p-8 lg:min-h-[400px]">
              <div className="flex flex-col items-center gap-4 text-muted-foreground">
                <BrainCircuit className="h-12 w-12 animate-pulse" />
                <p>...الذكاء الاصطناعي يصمم النظام ويحلل جدواه المالية</p>
              </div>
            </Card>
          )}

          {result && (
            <div className="space-y-6">
                <Card className={cn("transition-colors", result.limitingFactor === 'area' ? 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800' : 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800' )}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                           <LimitingFactorIcon className={cn("h-6 w-6", result.limitingFactor === 'area' ? 'text-orange-500' : 'text-blue-500')} />
                           ملخص النظام الفني الأمثل
                        </CardTitle>
                        <CardDescription className={cn(result.limitingFactor === 'area' ? 'text-orange-700 dark:text-orange-300' : 'text-blue-700 dark:text-blue-300')}>
                          {limitingFactorText}
                        </CardDescription>
                    </CardHeader>
                     <CardContent className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-center">
                        <div className="border rounded-lg p-3 bg-background/50">
                            <div className="text-2xl font-bold text-primary">{result.panelConfig.totalDcPower}</div>
                            <div className="text-sm text-muted-foreground">kWp (حجم النظام)</div>
                        </div>
                         <div className="border rounded-lg p-3 bg-background/50">
                            <div className="text-2xl font-bold">{result.panelConfig.panelCount}</div>
                            <div className="text-sm text-muted-foreground">لوح شمسي</div>
                        </div>
                         <div className="border rounded-lg p-3 col-span-2 lg:col-span-1 bg-background/50">
                            <div className="text-2xl font-bold">{result.panelConfig.requiredArea.toFixed(1)}</div>
                            <div className="text-sm text-muted-foreground">م² (المساحة المطلوبة)</div>
                        </div>
                    </CardContent>
                </Card>

              {result.financialAnalysis && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><TrendingUp className="text-primary"/> التحليل المالي للجدوى</CardTitle>
                       <CardDescription>
                        ملخص وتحليل مالي شامل للنظام المقترح
                       </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                      <div className="border rounded-lg p-3">
                        <div className="text-sm text-muted-foreground">التكلفة الإجمالية</div>
                        <div className="text-2xl font-bold text-primary">{result.financialAnalysis.totalInvestment.toFixed(0)}</div>
                        <div className="text-xs text-muted-foreground">دينار</div>
                      </div>
                      <div className="border rounded-lg p-3">
                        <div className="text-sm text-muted-foreground">الإيرادات (السنة الأولى)</div>
                        <div className="text-2xl font-bold text-green-600">{result.financialAnalysis.annualRevenue.toFixed(0)}</div>
                        <div className="text-xs text-muted-foreground">دينار</div>
                      </div>
                      <div className="border rounded-lg p-3">
                        <div className="text-sm text-muted-foreground">فترة الاسترداد</div>
                        <PaybackPeriod months={result.financialAnalysis.paybackPeriodMonths} />
                      </div>
                       <div className="border rounded-lg p-3 col-span-2 md:col-span-3">
                        <div className="text-sm text-muted-foreground">صافي الربح (25 سنة, مع التهالك)</div>
                        <div className="text-3xl font-bold text-green-700">{result.financialAnalysis.netProfit25Years.toFixed(0)}</div>
                         <div className="text-xs text-muted-foreground">دينار</div>
                      </div>
                    </CardContent>
                  </Card>

                  {result.financialAnalysis.cashFlowAnalysis && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AreaChart className="text-primary" />
                          محاكاة التدفق النقدي التراكمي على مدار 25 عامًا
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={result.financialAnalysis.cashFlowAnalysis}
                            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="year" name="السنة" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis
                              fontSize={12}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(value) => `${value.toLocaleString()}`}
                              label={{ value: 'دينار', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip
                              contentStyle={{ background: 'hsl(var(--background))', direction: 'rtl' }}
                              formatter={(value, name, props) => [`${(value as number).toLocaleString()} دينار`, `في السنة ${props.payload.year}`]}
                              labelFormatter={() => "التدفق النقدي التراكمي"}
                            />
                            <Legend verticalAlign="top" wrapperStyle={{top: -4, direction: 'rtl'}} formatter={() => 'التدفق النقدي التراكمي'} />
                            <Line type="monotone" dataKey="cashFlow" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}

                  {result.financialAnalysis.sensitivityAnalysis && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="text-primary" />
                                تحليل الحساسية
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="border rounded-lg p-4">
                                <h4 className="font-semibold text-center mb-3">تأثير تكلفة النظام (±10%) على فترة الاسترداد</h4>
                                <div className="flex justify-between items-center text-center">
                                    <div className="text-green-600">
                                        <div className="text-xs">تكلفة أقل</div>
                                        <div className="font-bold text-lg"><PaybackPeriod months={result.financialAnalysis.sensitivityAnalysis.cost.lower.paybackPeriodMonths} /></div>
                                        <ChevronsLeft className="mx-auto h-5 w-5"/>
                                    </div>
                                    <div className="text-muted-foreground">
                                        <div className="text-xs">التكلفة الحالية</div>
                                        <div className="font-bold text-lg"><PaybackPeriod months={result.financialAnalysis.paybackPeriodMonths} /></div>
                                        <ChevronsUpDown className="mx-auto h-5 w-5"/>
                                    </div>
                                    <div className="text-red-600">
                                         <div className="text-xs">تكلفة أعلى</div>
                                        <div className="font-bold text-lg"><PaybackPeriod months={result.financialAnalysis.sensitivityAnalysis.cost.higher.paybackPeriodMonths} /></div>
                                        <ChevronsRight className="mx-auto h-5 w-5"/>
                                    </div>
                                </div>
                            </div>
                            <div className="border rounded-lg p-4">
                                 <h4 className="font-semibold text-center mb-3">تأثير سعر الكهرباء (±10%) على صافي الربح</h4>
                                 <div className="flex justify-between items-center text-center">
                                    <div className="text-red-600">
                                        <div className="text-xs">سعر أقل</div>
                                        <div className="font-bold text-lg">{result.financialAnalysis.sensitivityAnalysis.price.lower.netProfit25Years.toFixed(0)}</div>
                                        <div className="text-xs text-muted-foreground">دينار</div>
                                    </div>
                                    <div className="text-muted-foreground">
                                        <div className="text-xs">السعر الحالي</div>
                                        <div className="font-bold text-lg">{result.financialAnalysis.netProfit25Years.toFixed(0)}</div>
                                        <div className="text-xs text-muted-foreground">دينار</div>
                                    </div>
                                    <div className="text-green-600">
                                         <div className="text-xs">سعر أعلى</div>
                                        <div className="font-bold text-lg">{result.financialAnalysis.sensitivityAnalysis.price.higher.netProfit25Years.toFixed(0)}</div>
                                        <div className="text-xs text-muted-foreground">دينار</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                 )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="text-primary"/>
                         الإنتاج الشهري المتوقع (kWh) - السنة الأولى
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-72">
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={result.financialAnalysis.monthlyBreakdown} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis fontSize={12} tickLine={false} axisLine={false} label={{ value: 'kWh', angle: -90, position: 'insideLeft' }}/>
                            <Tooltip
                              contentStyle={{ background: 'hsl(var(--background))', direction: 'rtl' }}
                              formatter={(value) => [`${(value as number).toFixed(0)} kWh`, 'الإنتاج']}
                            />
                            <Legend verticalAlign="top" wrapperStyle={{top: -4, direction: 'rtl'}} formatter={() => 'الإنتاج الشهري'}/>
                            <Bar dataKey="production" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CalendarDays className="text-primary"/>
                        جدول بيانات السنة الأولى
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>الشهر</TableHead>
                            <TableHead className="text-center">متوسط الإشعاع (kWh/m²/day)</TableHead>
                            <TableHead className="text-center">الإنتاج (kWh)</TableHead>
                            <TableHead className="text-right">الإيرادات (دينار)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.financialAnalysis.monthlyBreakdown.map((monthData) => (
                            <TableRow key={monthData.month}>
                              <TableCell className="font-medium">{monthData.month}</TableCell>
                              <TableCell className="text-center">{monthData.sunHours.toFixed(2)}</TableCell>
                              <TableCell className="text-center">{monthData.production.toFixed(1)}</TableCell>
                              <TableCell className="text-right">{monthData.revenue.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                           <TableRow className="font-bold bg-muted/50">
                              <TableCell>الإجمالي السنوي</TableCell>
                              <TableCell className="text-center">-</TableCell>
                              <TableCell className="text-center">{result.financialAnalysis.totalAnnualProduction.toFixed(1)}</TableCell>
                              <TableCell className="text-right">{result.financialAnalysis.annualRevenue.toFixed(2)}</TableCell>
                            </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              )}
                <Card>
                  <CardHeader>
                    <CardTitle>منطق التصميم (لماذا هذا النظام؟)</CardTitle>
                  </CardHeader>
                  <CardContent className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
                    <p>{result.reasoning}</p>
                  </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>مواصفات المكونات المقترحة</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-base flex items-center gap-2"><Sun className="text-primary"/>الألواح الشمسية</h4>
                                <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
                                    <li><span className="font-semibold">العدد:</span> {result.panelConfig.panelCount} لوح</li>
                                    <li><span className="font-semibold">قدرة اللوح:</span> {result.panelConfig.panelWattage} واط</li>
                                    <li><span className="font-semibold">إجمالي القدرة (DC):</span> {result.panelConfig.totalDcPower} kWp</li>
                                     <li><span className="font-semibold">المساحة المطلوبة:</span> {result.panelConfig.requiredArea.toFixed(1)} متر مربع</li>
                                    <li><span className="font-semibold">زاوية الميل والاتجاه:</span> {result.panelConfig.tilt}° ميل | {result.panelConfig.azimuth}° اتجاه (جنوب)</li>
                                </ul>
                            </div>
                            <div className="border-t pt-4">
                                <h4 className="font-semibold text-base">العاكس (Inverter)</h4>
                                 <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
                                    <li><span className="font-semibold">الحجم الموصى به:</span> {result.inverterConfig.recommendedSize}</li>
                                    <li><span className="font-semibold">نوع الطور:</span> {result.inverterConfig.phase}</li>
                                    <li><span className="font-semibold">نطاق جهد MPPT:</span> {result.inverterConfig.mpptVoltage}</li>
                                </ul>
                            </div>
                             <div className="border-t pt-4">
                                <h4 className="font-semibold text-base">الأسلاك</h4>
                                 <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
                                     <li><span className="font-semibold">عدد الألواح لكل سلسلة:</span> {result.wiringConfig.panelsPerString}</li>
                                     <li><span className="font-semibold">عدد السلاسل المتوازية:</span> {result.wiringConfig.parallelStrings}</li>
                                     <li><span className="font-semibold">مقطع السلك الرئيسي:</span> {result.wiringConfig.wireSize} مم²</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Button onClick={handleAddToReport} className="w-full">
                    <PlusCircle className="ml-2 h-4 w-4" />
                    أضف إلى التقرير
                </Button>
            </div>
          )}

          {!isLoading && !result && (
            <Card className="flex flex-col items-center justify-center text-center p-8 lg:min-h-[400px] bg-muted/20">
              <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <BrainCircuit className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="mt-4">نظامك المثالي بانتظارك</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground max-w-md">
                  أدخل استهلاكك ومساحتك المتاحة، وسيقوم مهندسنا الذكي بتصميم النظام الأمثل الذي يناسب احتياجك الفعلي ويحلل جدواه المالية.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

  
