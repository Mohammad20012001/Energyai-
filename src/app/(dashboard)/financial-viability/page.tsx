"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { TrendingUp, ArrowRight, Loader2, BarChart, DollarSign, Calendar, Zap, Sun } from "lucide-react";

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

const formSchema = z.object({
  investmentAmount: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).positive("يجب أن يكون مبلغ الاستثمار إيجابياً"),
  costPerWatt: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).positive("يجب أن تكون التكلفة إيجابية"),
  kwhPrice: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).positive("يجب أن يكون السعر إيجابياً"),
  sunHours: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).min(1, "يجب أن تكون ساعة واحدة على الأقل").max(24, "لا يمكن أن يتجاوز 24 ساعة"),
  panelWattage: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).positive("يجب أن تكون القوة الكهربائية إيجابية"),
  systemLoss: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).min(0).max(99),
});

type FormValues = z.infer<typeof formSchema>;

interface CalculationResult {
  systemSizeKw: number;
  annualProductionKwh: number;
  annualRevenue: number;
  paybackPeriodYears: number;
  netProfit25Years: number;
}

export default function FinancialViabilityPage() {
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      investmentAmount: 10000,
      costPerWatt: 0.7,
      kwhPrice: 0.1,
      sunHours: 5.5,
      panelWattage: 550,
      systemLoss: 15,
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setResult(null);

    await new Promise(resolve => setTimeout(resolve, 500));

    const systemSizeWatts = values.investmentAmount / values.costPerWatt;
    const systemSizeKw = systemSizeWatts / 1000;
    
    const dailyProductionKwh = systemSizeKw * values.sunHours * (1 - values.systemLoss / 100);
    const annualProductionKwh = dailyProductionKwh * 365;
    const annualRevenue = annualProductionKwh * values.kwhPrice;
    
    const paybackPeriodYears = annualRevenue > 0 ? values.investmentAmount / annualRevenue : Infinity;
    const netProfit25Years = (annualRevenue * 25) - values.investmentAmount;

    setResult({
      systemSizeKw,
      annualProductionKwh,
      annualRevenue,
      paybackPeriodYears,
      netProfit25Years,
    });
    setIsLoading(false);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">حاسبة الجدوى الاقتصادية للاستثمار</h1>
        <p className="text-muted-foreground mt-2">
          حلل العائد على الاستثمار في الطاقة الشمسية بناءً على ميزانيتك.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-2 h-fit">
          <CardHeader>
            <CardTitle>أدخل معطيات الاستثمار</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 text-right">
                <fieldset disabled={isLoading} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="investmentAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>مبلغ الاستثمار (دينار)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 10000" {...field} />
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
                          <Input placeholder="e.g., 0.7" {...field} />
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
                        <FormLabel>سعر بيع الكيلوواط/ساعة (دينار)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 0.1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="sunHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>متوسط ساعات الشمس اليومية</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 5.5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="panelWattage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>قوة اللوح (واط)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 550" {...field} />
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
                          <Input placeholder="e.g., 15" {...field} />
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
                      ...جاري التحليل
                    </>
                  ) : (
                    <>
                      تحليل الجدوى <ArrowRight className="mr-2 h-4 w-4" />
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
                <p>...نقوم بتحليل الأرقام الاستثمارية</p>
              </div>
            </Card>
          )}

          {result && (
            <div className="space-y-6">
               <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Zap className="text-primary"/> حجم النظام الممكن</CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="text-4xl font-bold text-center">{result.systemSizeKw.toFixed(2)} <span className="text-2xl text-muted-foreground">كيلوواط</span></div>
                   <p className="text-xs text-muted-foreground mt-2 text-center">
                    بناءً على مبلغ استثمارك وتكلفة الواط.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><TrendingUp className="text-primary"/> المؤشرات المالية الرئيسية</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <li className="border rounded-lg p-4 text-center">
                      <div className="text-sm text-muted-foreground mb-1">الإيرادات السنوية</div>
                      <div className="text-2xl font-bold">{result.annualRevenue.toFixed(0)}</div>
                      <div className="text-muted-foreground">دينار</div>
                    </li>
                    <li className="border rounded-lg p-4 text-center">
                       <div className="text-sm text-muted-foreground mb-1">فترة الاسترداد</div>
                      <div className="text-2xl font-bold">{isFinite(result.paybackPeriodYears) ? result.paybackPeriodYears.toFixed(1) : "∞"}</div>
                      <div className="text-muted-foreground">سنوات</div>
                    </li>
                     <li className="border rounded-lg p-4 text-center col-span-1 sm:col-span-2">
                       <div className="text-sm text-muted-foreground mb-1">صافي الربح (25 سنة)</div>
                      <div className="text-3xl font-bold text-green-600">{result.netProfit25Years.toFixed(0)}</div>
                      <div className="text-muted-foreground">دينار</div>
                    </li>
                  </ul>
                </CardContent>
              </Card>

               <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Sun className="text-primary"/> تفاصيل الإنتاج</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="grid grid-cols-1 gap-4">
                     <li className="border rounded-lg p-4 flex justify-between items-center">
                      <div>
                        <div className="font-bold">إجمالي الإنتاج السنوي</div>
                        <div className="text-sm text-muted-foreground">الطاقة المولدة خلال عام كامل</div>
                      </div>
                      <div className="text-xl font-bold text-right">{result.annualProductionKwh.toFixed(0)} <span className="text-sm text-muted-foreground">ك.و.س</span></div>
                    </li>
                  </ul>
                   <p className="text-xs text-muted-foreground mt-4 text-center">
                    * الحسابات تقديرية وتعتمد على المدخلات. قد تختلف النتائج الفعلية.
                  </p>
                </CardContent>
              </Card>

            </div>
          )}

          {!isLoading && !result && (
            <Card className="flex flex-col items-center justify-center text-center p-8 lg:min-h-[400px] bg-muted/20">
              <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <DollarSign className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="mt-4">حوّل أموالك إلى طاقة</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground max-w-md">
                  أدخل تفاصيل استثمارك المحتمل لتعرف مدى جدواه الاقتصادية، والعائد المتوقع، ومتى ستسترد أموالك.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
