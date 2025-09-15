
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { TrendingUp, ArrowRight, Loader2, PlusCircle, BarChart, FileText } from "lucide-react";
import { useReport } from "@/context/ReportContext";

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
});

type FormValues = z.infer<typeof formSchema>;

export default function FinancialViabilityPage() {
  const [result, setResult] = useState<FinancialViabilityResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { addReportCard } = useReport();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      systemSize: 5,
      systemLoss: 15,
      tilt: 30,
      azimuth: 180,
      location: 'amman',
      costPerKw: 700,
      kwhPrice: 0.12,
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
        "الإنتاج السنوي": `${result.totalAnnualProduction.toFixed(0)} kWh`,
        "الإيرادات السنوية": `${result.annualRevenue.toFixed(0)} دينار`,
        "فترة الاسترداد": `${paybackYears} سنوات و ${paybackMonths} أشهر`,
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
                          <Input type="number" placeholder="e.g., 0.12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                <BarChart className="h-12 w-12 animate-pulse" />
                <p>...نقوم بمحاكاة الأداء على مدار العام</p>
              </div>
            </Card>
          )}

          {result && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">ملخص الجدوى المالية</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                  <div className="border rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">التكلفة الإجمالية</div>
                    <div className="text-2xl font-bold text-primary">{result.totalInvestment.toFixed(0)}</div>
                    <div className="text-xs text-muted-foreground">دينار</div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">الإيرادات السنوية</div>
                    <div className="text-2xl font-bold text-green-600">{result.annualRevenue.toFixed(0)}</div>
                    <div className="text-xs text-muted-foreground">دينار</div>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">فترة الاسترداد</div>
                    <div className="text-xl font-bold">{isFinite(result.paybackPeriodMonths) ? `${Math.floor(result.paybackPeriodMonths / 12)} سنة و ${result.paybackPeriodMonths % 12} أشهر` : "أكثر من 25 سنة"}</div>
                  </div>
                   <div className="border rounded-lg p-3 col-span-2 md:col-span-3">
                    <div className="text-sm text-muted-foreground">صافي الربح (25 سنة)</div>
                    <div className="text-3xl font-bold text-green-700">{result.netProfit25Years.toFixed(0)}</div>
                     <div className="text-xs text-muted-foreground">دينار</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">تفاصيل الإنتاج الشهري</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الشهر</TableHead>
                        <TableHead className="text-center">الإشعاع الشمسي (kWh/m²/day)</TableHead>
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
                          <TableCell>الإجمالي السنوي</TableCell>
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
