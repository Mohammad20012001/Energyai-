"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { BrainCircuit, ArrowRight, Loader2, DollarSign, Ruler, BarChart3, PlusCircle } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { optimizeDesign } from "@/ai/flows/optimize-design";
import { OptimizeDesignInputSchema, type OptimizeDesignOutput } from '@/ai/tool-schemas';
import type { z } from 'zod';
import { useReport } from "@/context/ReportContext";


type FormValues = z.infer<typeof OptimizeDesignInputSchema>;

export default function DesignOptimizerPage() {
  const [result, setResult] = useState<OptimizeDesignOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { addReportCard } = useReport();

  const form = useForm<FormValues>({
    resolver: zodResolver(OptimizeDesignInputSchema),
    defaultValues: {
      budget: 10000,
      surfaceArea: 80,
      monthlyBill: 120,
      location: "amman",
    },
  });

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
    if (!result) return;
    addReportCard({
      id: `design-optimizer-${Date.now()}`,
      type: "محسن التصميم بالذكاء الاصطناعي",
      summary: `نظام ${result.summary.optimizedSystemSize}kWp بتكلفة ${result.summary.totalCost} دينار`,
      values: {
        "حجم النظام الأمثل": `${result.summary.optimizedSystemSize} kWp`,
        "التكلفة الإجمالية": `${result.summary.totalCost} دينار`,
        "فترة الاسترداد": `${result.summary.paybackPeriod.toFixed(1)} سنوات`,
        "ربح 25 سنة": `${result.summary.twentyFiveYearProfit.toFixed(0)} دينار`,
        "عدد الألواح": `${result.panelConfig.panelCount} لوح`,
        "حجم العاكس": `${result.inverterConfig.recommendedSize}`
      }
    });
    toast({
      title: "تمت الإضافة بنجاح",
      description: "تمت إضافة بطاقة محسن التصميم إلى تقريرك.",
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">محسن التصميم بالذكاء الاصطناعي</h1>
        <p className="text-muted-foreground mt-2">
          أدخل قيودك (الميزانية، المساحة، الاستهلاك) ودع الذكاء الاصطناعي يصمم لك النظام الأمثل.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-2 h-fit">
          <CardHeader>
            <CardTitle>أدخل قيود التصميم</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 text-right">
                <fieldset disabled={isLoading} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الميزانية الإجمالية (دينار)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 7000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                    name="monthlyBill"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>متوسط الفاتورة الشهرية (دينار)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 80" {...field} />
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
                </fieldset>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      ...جاري التصميم الأمثل
                    </>
                  ) : (
                    <>
                      تصميم النظام الآن <ArrowRight className="mr-2 h-4 w-4" />
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
                <p>...الذكاء الاصطناعي يوازن بين جميع المتغيرات</p>
              </div>
            </Card>
          )}

          {result && (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>ملخص النظام الأمثل</CardTitle>
                    </CardHeader>
                     <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                        <div className="border rounded-lg p-3">
                            <div className="text-2xl font-bold text-primary">{result.summary.optimizedSystemSize}</div>
                            <div className="text-sm text-muted-foreground">kWp</div>
                        </div>
                         <div className="border rounded-lg p-3">
                            <div className="text-2xl font-bold">{result.summary.totalCost.toFixed(0)}</div>
                            <div className="text-sm text-muted-foreground">دينار</div>
                        </div>
                         <div className="border rounded-lg p-3">
                            <div className="text-2xl font-bold">{result.summary.paybackPeriod.toFixed(1)}</div>
                            <div className="text-sm text-muted-foreground">سنوات</div>
                        </div>
                         <div className="border rounded-lg p-3">
                            <div className="text-2xl font-bold text-green-600">{result.summary.twentyFiveYearProfit.toFixed(0)}</div>
                            <div className="text-sm text-muted-foreground">أرباح 25 سنة</div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>منطق التصميم (لماذا هذا النظام؟)</CardTitle>
                  </CardHeader>
                  <CardContent className="prose prose-sm max-w-none text-muted-foreground">
                    <p>{result.reasoning}</p>
                  </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>مواصفات المكونات</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold">الألواح الشمسية</h4>
                                <ul className="text-sm text-muted-foreground list-disc pl-5 mt-1">
                                    <li>العدد: {result.panelConfig.panelCount}</li>
                                    <li>قدرة اللوح: {result.panelConfig.panelWattage} واط</li>
                                    <li>إجمالي القدرة (DC): {result.panelConfig.totalDcPower} kWp</li>
                                    <li>زاوية الميل: {result.panelConfig.tilt}° | زاوية الاتجاه: {result.panelConfig.azimuth}°</li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold">العاكس (Inverter)</h4>
                                 <ul className="text-sm text-muted-foreground list-disc pl-5 mt-1">
                                    <li>الحجم الموصى به: {result.inverterConfig.recommendedSize}</li>
                                    <li>نوع الطور: {result.inverterConfig.phase}</li>
                                    <li>نطاق جهد MPPT: {result.inverterConfig.mpptVoltage}</li>
                                </ul>
                            </div>
                             <div>
                                <h4 className="font-semibold">الأسلاك</h4>
                                 <ul className="text-sm text-muted-foreground list-disc pl-5 mt-1">
                                     <li>عدد الألواح لكل سلسلة: {result.wiringConfig.panelsPerString}</li>
                                     <li>عدد السلاسل المتوازية: {result.wiringConfig.parallelStrings}</li>
                                     <li>مقطع السلك الرئيسي: {result.wiringConfig.wireSize} مم²</li>
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
                  أدخل معطيات مشروعك في النموذج، وسيقوم مهندسنا الذكي بتحليل آلاف الاحتمالات ليقدم لك التصميم الأمثل الذي يحقق أفضل عائد على استثمارك.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
