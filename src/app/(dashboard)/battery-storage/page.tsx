"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { BatteryCharging, Rows, Columns, ArrowRight, Loader2, PlusCircle, AlertTriangle } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { calculateBatteryBank, type BatteryCalculationResult } from "@/services/calculations";

const formSchema = z.object({
  dailyLoadKwh: z.coerce.number().positive("يجب أن يكون الحمل اليومي رقمًا موجبًا"),
  autonomyDays: z.coerce.number().min(1, "يجب أن يكون يومًا واحدًا على الأقل"),
  depthOfDischarge: z.coerce.number().min(1, "يجب أن يكون بين 1 و 100").max(100, "يجب أن يكون بين 1 و 100"),
  batteryVoltage: z.coerce.number().positive("يجب أن يكون جهد البطارية موجبًا"),
  batteryCapacityAh: z.coerce.number().positive("يجب أن تكون سعة البطارية موجبة"),
  systemVoltage: z.coerce.number().positive("يجب أن يكون جهد النظام موجبًا"),
});

type FormValues = z.infer<typeof formSchema>;


export default function BatteryStoragePage() {
  const [result, setResult] = useState<BatteryCalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { addReportCard } = useReport();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dailyLoadKwh: 10,
      autonomyDays: 1,
      depthOfDischarge: 80,
      batteryVoltage: 12,
      batteryCapacityAh: 200,
      systemVoltage: 48,
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setResult(null);

    await new Promise(resolve => setTimeout(resolve, 500));

    try {
        if (values.systemVoltage % values.batteryVoltage !== 0) {
            toast({
                variant: "destructive",
                title: "خطأ في التوافق",
                description: "جهد النظام يجب أن يكون من مضاعفات جهد البطارية الواحدة.",
            });
            setIsLoading(false);
            return;
        }
        const calculationResult = calculateBatteryBank(values);
        setResult(calculationResult);
    } catch (error) {
        toast({
            variant: "destructive",
            title: "حدث خطأ",
            description: "فشل في حساب نظام البطارية. يرجى مراجعة المدخلات.",
        });
    }

    setIsLoading(false);
  }

  const handleAddToReport = () => {
    if (!result) return;
    addReportCard({
      id: `battery-bank-${Date.now()}`,
      type: "حاسبة تخزين الطاقة",
      summary: `بنك بطاريات ${result.requiredBankEnergyKwh} kWh يتكون من ${result.totalBatteries} بطارية.`,
      values: {
        "إجمالي الطاقة المطلوبة": `${result.requiredBankEnergyKwh} kWh`,
        "السعة المطلوبة بالأمبير/ساعة": `${result.requiredBankCapacityAh} Ah @ ${form.getValues("systemVoltage")}V`,
        "إجمالي عدد البطاريات": `${result.totalBatteries} بطارية`,
        "طريقة التوصيل": `${result.batteriesInSeries} بطارية على التوالي، ${result.parallelStrings} سلسلة على التوازي`,
      }
    });
    toast({
      title: "تمت الإضافة بنجاح",
      description: "تمت إضافة بطاقة نظام البطاريات إلى تقريرك.",
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">حاسبة تخزين الطاقة (البطاريات)</h1>
        <p className="text-muted-foreground mt-2">
          صمم بنك البطاريات المثالي لنظامك المنفصل عن الشبكة (Off-Grid) أو الهجين.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-2 h-fit">
          <CardHeader>
            <CardTitle>أدخل متطلبات النظام والبطارية</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 text-right">
                <fieldset disabled={isLoading} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="dailyLoadKwh"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>إجمالي الأحمال اليومية (kWh)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="autonomyDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>أيام الاستقلالية المطلوبة</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="depthOfDischarge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>عمق التفريغ المسموح به (DoD %)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 80" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="batteryVoltage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>جهد البطارية الواحدة (V)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="batteryCapacityAh"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>سعة البطارية الواحدة (Ah)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 200" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="systemVoltage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>جهد النظام المطلوب (V)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 48" {...field} />
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
                      ...جاري حساب البطاريات
                    </>
                  ) : (
                    <>
                      احسب بنك البطاريات <ArrowRight className="mr-2 h-4 w-4" />
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
                <BatteryCharging className="h-12 w-12 animate-pulse" />
                <p>...نقوم بحساب حجم وتوصيلات بنك البطاريات</p>
              </div>
            </Card>
          )}

          {result && (
            <div className="space-y-6">
              <Card className="text-center">
                <CardHeader>
                  <CardTitle className="text-2xl">حجم بنك البطاريات الإجمالي</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                        <div className="text-4xl font-bold text-primary">{result.requiredBankEnergyKwh}</div>
                        <p className="text-muted-foreground mt-1">كيلوواط/ساعة (kWh)</p>
                    </div>
                     <div className="border rounded-lg p-4">
                        <div className="text-4xl font-bold text-primary">{result.requiredBankCapacityAh}</div>
                        <p className="text-muted-foreground mt-1">أمبير/ساعة @ {form.getValues("systemVoltage")}V</p>
                    </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center justify-center gap-2">
                        مواصفات التكوين
                    </CardTitle>
                </CardHeader>
                 <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="border rounded-lg p-4">
                        <dt className="text-sm text-muted-foreground mb-1">إجمالي البطاريات</dt>
                        <dd className="text-3xl font-bold">{result.totalBatteries}</dd>
                    </div>
                     <div className="border rounded-lg p-4">
                        <dt className="text-sm text-muted-foreground mb-1">بطاريات لكل سلسلة (توالي)</dt>
                        <dd className="text-3xl font-bold">{result.batteriesInSeries}</dd>
                    </div>
                     <div className="border rounded-lg p-4">
                        <dt className="text-sm text-muted-foreground mb-1">عدد السلاسل (توازي)</dt>
                        <dd className="text-3xl font-bold">{result.parallelStrings}</dd>
                    </div>
                </CardContent>
              </Card>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>تنبيه مهم</AlertTitle>
                <AlertDescription>
                  هذه الحسابات نظرية. تأكد دائمًا من مراجعة أوراق بيانات البطارية (Datasheet) والتحقق من حدود تيار الشحن والتفريغ القصوى التي يمكن أن يتحملها بنك البطاريات.
                </AlertDescription>
              </Alert>

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
                  <BatteryCharging className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="mt-4">هل تحتاج إلى استقلالية؟</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground max-w-md">
                  أدخل تفاصيل أحمالك ومتطلباتك للحصول على تصميم دقيق لنظام تخزين الطاقة الخاص بك، بما في ذلك عدد البطاريات وطريقة توصيلها المثلى.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
