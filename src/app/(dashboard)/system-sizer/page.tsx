"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Combine, Sun, Zap, ArrowRight, Loader2, PlusCircle, BatteryCharging, Lightbulb } from "lucide-react";
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
import { calculateInverterSize, type InverterSizingResult } from "@/services/calculations";

const formSchema = z.object({
  monthlyBill: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).positive("يجب أن تكون قيمة الفاتورة إيجابية"),
  kwhPrice: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).positive("يجب أن يكون السعر إيجابياً"),
  sunHours: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).min(1, "يجب أن تكون ساعة واحدة على الأقل").max(24, "لا يمكن أن يتجاوز 24 ساعة"),
  panelWattage: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).positive("يجب أن تكون القوة الكهربائية إيجابية"),
  systemLoss: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).min(0).max(99),
});

type FormValues = z.infer<typeof formSchema>;

interface CombinedResult {
    panelResult: PanelCalculationResult;
    inverterResult: InverterSizingResult;
    totalDcPower: number;
}

export default function SystemSizerPage() {
  const [result, setResult] = useState<CombinedResult | null>(null);
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

    // 1. Calculate panel requirements
    const panelResult = calculatePanelsFromConsumption(values);
    
    // 2. Calculate total DC power
    const totalDcPower = (panelResult.requiredPanels * values.panelWattage) / 1000;

    // 3. Calculate inverter size based on total DC power
    const inverterResult = calculateInverterSize({
        totalDcPower: totalDcPower,
        // These are dummy values for now as they are not part of the primary calculation here
        // but required by the function. In a future step, we could ask the user for them.
        maxVoc: 500,
        maxIsc: 15,
        gridPhase: totalDcPower > 6 ? 'three' : 'single',
    });

    setResult({
        panelResult,
        inverterResult,
        totalDcPower
    });

    setIsLoading(false);
  }

  const handleAddToReport = () => {
    if (!result) return;
    addReportCard({
      id: `system-size-${Date.now()}`,
      type: "حاسبة النظام المتكامل",
      summary: `${result.panelResult.requiredPanels} لوح, نظام ${result.totalDcPower.toFixed(2)} kWp, وعاكس ~${result.inverterResult.minInverterSize.toFixed(1)} kW`,
      values: {
        "عدد الألواح المطلوب": `${result.panelResult.requiredPanels} لوح`,
        "إجمالي قوة النظام (DC)": `${result.totalDcPower.toFixed(2)} kWp`,
        "حجم العاكس الموصى به (AC)": `${result.inverterResult.minInverterSize.toFixed(2)} - ${result.inverterResult.maxInverterSize.toFixed(2)} kW`,
        "الاستهلاك اليومي": `${result.panelResult.dailyKwh.toFixed(2)} ك.و.س`,
      }
    });
    toast({
      title: "تمت الإضافة بنجاح",
      description: "تمت إضافة بطاقة النظام المتكامل إلى تقريرك.",
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">حاسبة النظام المتكامل (الألواح + العاكس)</h1>
        <p className="text-muted-foreground mt-2">
          أدخل استهلاكك لتحديد حجم نظام الألواح وحجم العاكس المناسب له في خطوة واحدة.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-2 h-fit">
          <CardHeader>
            <CardTitle>أدخل بيانات الاستهلاك والنظام</CardTitle>
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
                      ...جاري الحساب المتكامل
                    </>
                  ) : (
                    <>
                      احسب النظام الآن <ArrowRight className="mr-2 h-4 w-4" />
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
                <Combine className="h-12 w-12 animate-pulse" />
                <p>...نقوم بحساب الألواح وتحديد حجم العاكس</p>
              </div>
            </Card>
          )}

          {result && (
            <div className="space-y-6">
              <Card className="text-center">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center justify-center gap-2">
                    <Sun className="text-primary"/> 
                    نظام الألواح المطلوب
                  </CardTitle>
                   <CardDescription>
                    لتغطية استهلاك يومي يبلغ {result.panelResult.dailyKwh.toFixed(2)} ك.و.س
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                        <div className="text-4xl font-bold text-primary">{result.panelResult.requiredPanels}</div>
                        <p className="text-muted-foreground mt-1">لوح شمسي</p>
                    </div>
                     <div className="border rounded-lg p-4">
                        <div className="text-4xl font-bold text-primary">{result.totalDcPower.toFixed(2)}</div>
                        <p className="text-muted-foreground mt-1">kWp</p>
                    </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center justify-center gap-2">
                        <BatteryCharging className="text-primary"/>
                        حجم العاكس الموصى به
                    </CardTitle>
                    <CardDescription>
                        بناءً على حجم نظام الألواح المحسوب أعلاه
                    </CardDescription>
                </CardHeader>
                 <CardContent className="text-center">
                  <div className="text-4xl font-bold">
                    بين <span className="text-primary">{result.inverterResult.minInverterSize.toFixed(2)}</span> و <span className="text-primary">{result.inverterResult.maxInverterSize.toFixed(2)}</span>
                  </div>
                  <div className="text-muted-foreground mt-1">كيلوواط (kW)</div>
                   <Alert variant="default" className="text-right mt-4">
                    <Lightbulb className="h-4 w-4" />
                    <AlertTitle>معلومة</AlertTitle>
                    <AlertDescription>
                     تم افتراض أن نوع الشبكة هو **{result.inverterResult.gridPhase}** بناءً على حجم النظام.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Button onClick={handleAddToReport} className="w-full">
                <PlusCircle className="ml-2 h-4 w-4" />
                أضف النظام المتكامل إلى التقرير
              </Button>
            </div>
          )}

          {!isLoading && !result && (
            <Card className="flex flex-col items-center justify-center text-center p-8 lg:min-h-[400px] bg-muted/20">
              <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Combine className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="mt-4">تصميم أسرع، نتائج أفضل</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground max-w-md">
                  أدخل تفاصيل استهلاكك في النموذج للحصول على توصية متكاملة تشمل عدد الألواح وحجم العاكس المناسب في خطوة واحدة.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
