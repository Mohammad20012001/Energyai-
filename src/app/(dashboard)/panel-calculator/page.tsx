"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Calculator, Sun, Zap, ArrowRight, Loader2, PlusCircle } from "lucide-react";
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
import { calculatePanelsFromConsumption, type PanelCalculationResult } from "@/services/calculations";


const formSchema = z.object({
  monthlyBill: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).positive("يجب أن تكون قيمة الفاتورة إيجابية"),
  kwhPrice: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).positive("يجب أن يكون السعر إيجابياً"),
  sunHours: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).min(1, "يجب أن تكون ساعة واحدة على الأقل").max(24, "لا يمكن أن يتجاوز 24 ساعة"),
  panelWattage: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).positive("يجب أن تكون القوة الكهربائية إيجابية"),
  systemLoss: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).min(0).max(99),
});

type FormValues = z.infer<typeof formSchema>;

export default function PanelCalculatorPage() {
  const [result, setResult] = useState<PanelCalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { addReportCard } = useReport();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      monthlyBill: 240,
      kwhPrice: 0.12,
      sunHours: 5.5,
      panelWattage: 450,
      systemLoss: 15,
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setResult(null);

    await new Promise(resolve => setTimeout(resolve, 500));

    const calculationResult = calculatePanelsFromConsumption(values);
    setResult(calculationResult);

    setIsLoading(false);
  }

  const handleAddToReport = () => {
    if (!result) return;
    addReportCard({
      id: `panel-calc-${Date.now()}`,
      type: "حاسبة الألواح (حسب الاستهلاك)",
      summary: `${result.requiredPanels} لوح شمسي لتغطية استهلاك يومي قدره ${result.dailyKwh.toFixed(2)} ك.و.س.`,
      values: {
        "الاستهلاك الشهري": `${result.totalKwh.toFixed(2)} ك.و.س`,
        "متوسط الاستهلاك اليومي": `${result.dailyKwh.toFixed(2)} ك.و.س`,
        "عدد الألواح المطلوب": `${result.requiredPanels} لوح`,
      }
    });
    toast({
      title: "تمت الإضافة بنجاح",
      description: "تمت إضافة بطاقة حاسبة الألواح إلى تقريرك.",
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">حاسبة الألواح الشمسية (حسب الاستهلاك)</h1>
        <p className="text-muted-foreground mt-2">
          احسب العدد المثالي للألواح الشمسية بناءً على احتياجاتك من الطاقة.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-2 h-fit">
          <CardHeader>
            <CardTitle>أدخل بيانات النظام</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 text-right">
                <fieldset disabled={isLoading} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="monthlyBill"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>قيمة الفاتورة الشهرية (دينار)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 240" {...field} />
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
                        <FormLabel>سعر الكيلوواط/ساعة (دينار)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 0.12" {...field} />
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
                          <Input placeholder="e.g., 450" {...field} />
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
                      ...جاري الحساب
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
                <Calculator className="h-12 w-12 animate-pulse" />
                <p>...نقوم بمعالجة الأرقام</p>
              </div>
            </Card>
          )}

          {result && (
            <div className="space-y-6">
              <Card className="text-center">
                <CardHeader>
                  <CardTitle className="text-2xl">النتيجة المقترحة</CardTitle>
                  <CardDescription>
                    بناءً على مدخلاتك، ستحتاج تقريبًا إلى
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-6xl font-bold text-primary">{result.requiredPanels}</div>
                  <p className="text-muted-foreground mt-2 text-lg">لوح شمسي</p>
                </CardContent>
              </Card>

              <Alert>
                <Zap className="h-4 w-4" />
                <AlertTitle>تفاصيل الاستهلاك</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>إجمالي الاستهلاك الشهري: {result.totalKwh.toFixed(2)} كيلوواط/ساعة</li>
                    <li>متوسط الاستهلاك اليومي: {result.dailyKwh.toFixed(2)} كيلوواط/ساعة</li>
                  </ul>
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
                  <Sun className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="mt-4">هل أنت جاهز لبدء التوفير؟</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground max-w-md">
                  أدخل تفاصيل استهلاكك في النموذج على اليمين لمعرفة عدد الألواح الشمسية التي تحتاجها لتغطية احتياجاتك من الطاقة.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
