
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { TrendingUp, ArrowRight, Loader2, PlusCircle, BarChart3, FileText, CalendarDays, AreaChart, Activity, ChevronsRight, ChevronsLeft, ChevronsUpDown, Settings } from "lucide-react";
import { useReport } from "@/context/ReportContext";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { calculateFinancialViabilityAction } from "@/app/actions/solar";
import type { FinancialViabilityResult } from "@/services/calculations";

const formSchema = z.object({
  systemSize: z.coerce.number().positive("يجب أن يكون حجم النظام إيجابياً"),
  systemLoss: z.coerce.number().min(0, "لا يمكن أن يكون أقل من 0").max(99, "لا يمكن أن يكون أعلى من 99"),
  tilt: z.coerce.number().min(0).max(90),
  azimuth: z.coerce.number().min(0).max(360),
  location: z.enum(['amman', 'zarqa', 'irbid', 'aqaba'], { required_error: "الرجاء اختيار الموقع" }),
  costPerKw: z.coerce.number().positive("التكلفة يجب أن تكون إيجابية"),
  kwhPrice: z.coerce.number().positive("السعر يجب أن يكون إيجابياً"),
  degradationRate: z.coerce.number().min(0, "لا يمكن أن يكون سالباً").max(5, "النسبة مرتفعة جداً"),
});

type FormValues = z.infer<typeof formSchema>;

const PaybackPeriod = ({ months } : { months: number}) => {
    if (!isFinite(months) || months > 300) {
        return <span className="text-xl font-bold">أكثر من 25 سنة</span>;
    }
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return <span className="text-xl font-bold">{years} سنة و {remainingMonths} أشهر</span>;
};


export default function FinancialViabilityPage() {
  const [result, setResult] = useState<FinancialViabilityResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { addReportCard } = useReport();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      systemSize: 5,
      location: 'amman',
      costPerKw: 700,
      kwhPrice: 0.12,
      // Advanced defaults
      systemLoss: 15,
      tilt: 30,
      azimuth: 180,
      degradationRate: 0.5,
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await calculateFinancialViabilityAction(values);
      if (response.success && response.data) {
        setResult(response.data);
      } else {
         throw new Error(response.error || "فشل في إجراء الحسابات.");
      }
    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : "فشل في إجراء الحسابات. يرجى مراجعة المدخلات.";
       console.error("Error in financial viability calculation:", error);
       toast({
        variant: "destructive",
        title: "خطأ في الحساب",
        description: errorMessage,
       });
    } finally {
        setIsLoading(false);
    }
  }

  const handleAddToReport = () => {
    if (!result) return;
    const paybackYears = Math.floor(result.paybackPeriodMonths / 12);
    const paybackMonths = result.paybackPeriodMonths % 12;

    addReportCard({
      id: `financial-${Date.now()}`,
      type: "حاسبة الجدوى المالية",
      summary: `إنتاج سنوي ${result.totalAnnualProduction.toFixed(0)} kWh, فترة استرداد ${paybackYears} سنوات و ${paybackMonths} أشهر.`,
      values: {
        "حجم النظام": `${form.getValues("systemSize")} kWp`,
        "التكلفة التقديرية": `${result.totalInvestment.toFixed(0)} دينار`,
        "الإنتاج السنوي (السنة الأولى)": `${result.totalAnnualProduction.toFixed(0)} kWh`,
        "الإيرادات السنوية (السنة الأولى)": `${result.annualRevenue.toFixed(0)} دينار`,
        "فترة الاسترداد": isFinite(result.paybackPeriodMonths) ? `${paybackYears} سنوات و ${paybackMonths} أشهر` : 'أكثر من 25 سنة',
        "صافي الربح (25 سنة)": `${result.netProfit25Years.toFixed(0)} دينار`,
      }
    });
    toast({
      title: "تمت الإضافة بنجاح",
      description: "تمت إضافة بطاقة الجدوى المالية إلى تقريرك.",
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">حاسبة الإنتاج السنوي والجدوى المالية (بديل PVWatts)</h1>
        <p className="text-muted-foreground mt-2">
          أداة متقدمة لمحاكاة أداء النظام على مدار العام باستخدام بيانات مناخية تاريخية، مع تحليل مالي شامل.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-2 h-fit">
          <CardHeader>
            <CardTitle>أدخل معلمات النظام والموقع</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 text-right">
                <fieldset disabled={isLoading} className="space-y-4">
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
                        <FormLabel>الموقع (لتحديد البيانات المناخية)</FormLabel>
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
                    name="costPerKw"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تكلفة الكيلوواط (دينار/kWp)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 700" {...field} />
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
                        <FormLabel>سعر بيع الكهرباء (دينار/kWh)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="e.g., 0.12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>
                        <span className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          إعدادات متقدمة (اختياري)
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-4">
                        <FormField
                          control={form.control}
                          name="systemLoss"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>إجمالي الفقد في النظام (%)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="e.g., 15" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="tilt"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>زاوية الميل (°)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="e.g., 30" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                            control={form.control}
                            name="azimuth"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>زاوية الاتجاه (°)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g., 180" {...field} />
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
                      ...جاري المحاكاة والتحليل المالي
                    </>
                  ) : (
                    <>
                      احسب الآن <ArrowRight className="mr-2 h-4 w-4" />
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
                <BarChart3 className="h-12 w-12 animate-pulse" />
                <p>...نقوم بمحاكاة الأداء على مدار العام</p>
              </div>
            </Card>
          )}

          {result && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="text-primary"/>
                    ملخص الجدوى المالية
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                  <div className="border rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">التكلفة الإجمالية</div>
                    <div className="text-2xl font-bold text-primary">{result.totalInvestment.toFixed(0)}</div>
                    <div className="text-xs text-muted-foreground">دينار</div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">الإيرادات (السنة الأولى)</div>
                    <div className="text-2xl font-bold text-green-600">{result.annualRevenue.toFixed(0)}</div>
                    <div className="text-xs text-muted-foreground">دينار</div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">فترة الاسترداد</div>
                    <PaybackPeriod months={result.paybackPeriodMonths} />
                  </div>
                   <div className="border rounded-lg p-3 col-span-2 md:col-span-3">
                    <div className="text-sm text-muted-foreground">صافي الربح (25 سنة, مع التهالك)</div>
                    <div className="text-3xl font-bold text-green-700">{result.netProfit25Years.toFixed(0)}</div>
                     <div className="text-xs text-muted-foreground">دينار</div>
                  </div>
                </CardContent>
              </Card>
              
              {result.cashFlowAnalysis && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AreaChart className="text-primary" />
                      محاكاة التدفق النقدي التراكمي على مدار 25 عامًا
                    </CardTitle>
                    <CardDescription>
                      يوضح الرسم البياني رحلة استرداد رأس المال ونمو الأرباح مع مرور الوقت.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={result.cashFlowAnalysis}
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
                          contentStyle={{
                            background: 'hsl(var(--background))',
                            direction: 'rtl',
                          }}
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

             {result.sensitivityAnalysis && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="text-primary" />
                            تحليل الحساسية: تأثير تغير العوامل الرئيسية
                        </CardTitle>
                        <CardDescription>
                            كيف تتغير الجدوى المالية لمشروعك مع تغير ظروف السوق.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4">
                            <h4 className="font-semibold text-center mb-3">تأثير تكلفة النظام (±10%) على فترة الاسترداد</h4>
                            <div className="flex justify-between items-center text-center">
                                <div className="text-green-600">
                                    <div className="text-xs">تكلفة أقل</div>
                                    <div className="font-bold text-lg"><PaybackPeriod months={result.sensitivityAnalysis.cost.lower.paybackPeriodMonths} /></div>
                                    <ChevronsLeft className="mx-auto h-5 w-5"/>
                                </div>
                                <div className="text-muted-foreground">
                                    <div className="text-xs">التكلفة الحالية</div>
                                    <div className="font-bold text-lg"><PaybackPeriod months={result.paybackPeriodMonths} /></div>
                                    <ChevronsUpDown className="mx-auto h-5 w-5"/>
                                </div>
                                <div className="text-red-600">
                                     <div className="text-xs">تكلفة أعلى</div>
                                    <div className="font-bold text-lg"><PaybackPeriod months={result.sensitivityAnalysis.cost.higher.paybackPeriodMonths} /></div>
                                    <ChevronsRight className="mx-auto h-5 w-5"/>
                                </div>
                            </div>
                        </div>
                        <div className="border rounded-lg p-4">
                             <h4 className="font-semibold text-center mb-3">تأثير سعر الكهرباء (±10%) على صافي الربح</h4>
                             <div className="flex justify-between items-center text-center">
                                <div className="text-red-600">
                                    <div className="text-xs">سعر أقل</div>
                                    <div className="font-bold text-lg">{result.sensitivityAnalysis.price.lower.netProfit25Years.toFixed(0)}</div>
                                    <div className="text-xs text-muted-foreground">دينار</div>
                                </div>
                                <div className="text-muted-foreground">
                                    <div className="text-xs">السعر الحالي</div>
                                    <div className="font-bold text-lg">{result.netProfit25Years.toFixed(0)}</div>
                                    <div className="text-xs text-muted-foreground">دينار</div>
                                </div>
                                <div className="text-green-600">
                                     <div className="text-xs">سعر أعلى</div>
                                    <div className="font-bold text-lg">{result.sensitivityAnalysis.price.higher.netProfit25Years.toFixed(0)}</div>
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
                      <BarChart data={result.monthlyBreakdown} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} label={{ value: 'kWh', angle: -90, position: 'insideLeft' }}/>
                        <Tooltip
                          contentStyle={{
                            background: 'hsl(var(--background))',
                            direction: 'rtl',
                          }}
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
                      {result.monthlyBreakdown.map((monthData) => (
                        <TableRow key={monthData.month}>
                          <TableCell className="font-medium">{monthData.month}</TableCell>
                          <TableCell className="text-center">{monthData.sunHours.toFixed(2)}</TableCell>
                          <TableCell className="text-center">{monthData.production.toFixed(1)}</TableCell>
                          <TableCell className="text-right">{monthData.revenue.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                       <TableRow className="font-bold bg-muted/50">
                          <TableCell>الإجمالي السنوي (السنة الأولى)</TableCell>
                          <TableCell className="text-center">-</TableCell>
                          <TableCell className="text-center">{result.totalAnnualProduction.toFixed(1)}</TableCell>
                          <TableCell className="text-right">{result.annualRevenue.toFixed(2)}</TableCell>
                        </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Button onClick={handleAddToReport} className="w-full">
                <PlusCircle className="ml-2 h-4 w-4" />
                أضف إلى التقرير
              </Button>
            </div>
          )}

          {!isLoading && !result && (
             <Alert>
                <FileText className="h-4 w-4" />
                <AlertTitle>احصل على تقرير الجدوى الكامل</AlertTitle>
                <AlertDescription>
                  املأ النموذج للحصول على محاكاة دقيقة للإنتاج السنوي وتحليل مالي شامل لاستثمارك في الطاقة الشمسية.
                </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
