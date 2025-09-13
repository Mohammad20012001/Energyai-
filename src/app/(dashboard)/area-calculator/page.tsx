"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Calculator, Maximize, Zap, ArrowRight, Loader2, Sun, PlusCircle, Square, Rows, Columns, Map } from "lucide-react";
import { useReport } from "@/context/ReportContext";
import dynamic from 'next/dynamic';

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
import { useToast } from "@/hooks/use-toast";
import { calculateProductionFromArea, type AreaCalculationResult } from "@/services/calculations";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const DrawingManager = dynamic(() => import('@/components/leaflet-map'), { ssr: false });

const formSchema = z.object({
  landWidth: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).positive("يجب أن تكون قيمة العرض إيجابية"),
  landLength: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).positive("يجب أن تكون قيمة الطول إيجابية"),
  panelWidth: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).positive("يجب أن تكون قيمة العرض إيجابية"),
  panelLength: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).positive("يجب أن تكون قيمة الطول إيجابية"),
  panelWattage: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).positive("يجب أن تكون القوة الكهربائية إيجابية"),
  sunHours: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).min(1, "يجب أن تكون ساعة واحدة على الأقل").max(24, "لا يمكن أن يتجاوز 24 ساعة"),
});

type FormValues = z.infer<typeof formSchema>;

interface ResultState {
  calculation: AreaCalculationResult;
  totalArea: number;
}


export default function AreaCalculatorPage() {
  const [result, setResult] = useState<ResultState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { addReportCard } = useReport();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      landWidth: 20,
      landLength: 30,
      panelWidth: 1.13,
      panelLength: 2.28,
      panelWattage: 550,
      sunHours: 5.5,
    },
  });

  const landArea = (useWatch({ control: form.control, name: "landWidth" }) || 0) * (useWatch({ control: form.control, name: "landLength" }) || 0);

  const onAreaCalculated = (area: number) => {
    // This is a simplified approach: we take the square root to get an approximation of length/width
    const side = Math.sqrt(area);
    form.setValue('landWidth', parseFloat(side.toFixed(2)));
    form.setValue('landLength', parseFloat(side.toFixed(2)));
    toast({
        title: "تم حساب المساحة",
        description: `تم تحديث أبعاد الأرض إلى ${side.toFixed(2)} م x ${side.toFixed(2)} م.`,
    });
  };


  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setResult(null);

    await new Promise(resolve => setTimeout(resolve, 500));

    const calculationResult = calculateProductionFromArea(values);
    setResult({
        calculation: calculationResult,
        totalArea: values.landWidth * values.landLength,
    });

    setIsLoading(false);
  }

  const handleAddToReport = () => {
    if (!result) return;
    addReportCard({
      id: `area-${Date.now()}`,
      type: "حاسبة المساحة والإنتاج",
      summary: `إنتاج سنوي يبلغ ${result.calculation.yearlyEnergyKwh.toFixed(0)} ك.و.س من ${result.calculation.maxPanels} لوحًا.`,
      values: {
        "إجمالي المساحة": `${result.totalArea.toFixed(1)} م²`,
        "العدد الأقصى للألواح": `${result.calculation.maxPanels} لوح`,
        "إجمالي قوة النظام": `${result.calculation.totalPowerKw.toFixed(2)} كيلوواط`,
        "الإنتاج السنوي المقدر": `${result.calculation.yearlyEnergyKwh.toFixed(0)} ك.و.س`,
      }
    });
    toast({
      title: "تمت الإضافة بنجاح",
      description: "تمت إضافة بطاقة حاسبة المساحة إلى تقريرك.",
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">حاسبة المساحة والإنتاج</h1>
        <p className="text-muted-foreground mt-2">
          ارسم أرضك على الخريطة أو أدخل الأبعاد يدويًا لتقدير عدد الألواح التي يمكن تركيبها وكمية الطاقة التي يمكن إنتاجها.
        </p>
      </div>

       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Map className="text-primary"/> تحديد المساحة من الخريطة</CardTitle>
          <CardDescription>
            استخدم أدوات الرسم (المضلع) على اليسار لتحديد قطعة الأرض. سيتم حساب المساحة وتعبئة الحقول أدناه تلقائيًا.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="h-[400px] w-full rounded-md border overflow-hidden">
              <DrawingManager onAreaCalculated={onAreaCalculated} />
            </div>
        </CardContent>
      </Card>


      <div className="grid gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-2 h-fit">
          <CardHeader>
            <CardTitle>أدخل الأبعاد والبيانات يدويًا</CardTitle>
            <CardDescription>
              المساحة الحالية المحسوبة: {landArea.toFixed(2)} م²
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 text-right">
                <fieldset disabled={isLoading} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="landWidth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>عرض الأرض (متر)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 20" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="landLength"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>طول الأرض (متر)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 30" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="panelWidth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>عرض اللوح (متر)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 1.13" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="panelLength"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>طول اللوح (متر)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 2.28" {...field} />
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
                <p>...نقوم بتقدير الإمكانات</p>
              </div>
            </Card>
          )}

          {result && (
            <div className="space-y-6">
                <Card className="text-center">
                    <CardHeader>
                        <CardTitle className="text-2xl flex items-center justify-center gap-2">
                            <Square className="text-primary"/>
                            المساحة الإجمالية
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-6xl font-bold text-primary">{result.totalArea.toFixed(1)}</div>
                        <p className="text-muted-foreground mt-2 text-lg">متر مربع</p>
                    </CardContent>
                </Card>

              <Card className="text-center">
                <CardHeader>
                  <CardTitle className="text-2xl">العدد الأقصى للألواح</CardTitle>
                  <CardDescription>
                    بناءً على المساحة المتاحة والأبعاد المدخلة
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-6xl font-bold text-primary">{result.calculation.maxPanels}</div>
                  <p className="text-muted-foreground mt-2 text-lg">لوح شمسي</p>
                   <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                    <div className="flex items-center justify-center gap-2 rounded-lg border p-2">
                      <Rows className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-bold">{result.calculation.portrait.rows} صفوف</div>
                        <div className="text-muted-foreground">{result.calculation.portrait.panelsPerRow} لوح/صف</div>
                      </div>
                    </div>
                     <div className="flex items-center justify-center gap-2 rounded-lg border p-2">
                      <Columns className="h-5 w-5 text-muted-foreground" />
                       <div>
                        <div className="font-bold">{result.calculation.landscape.rows} صفوف</div>
                        <div className="text-muted-foreground">{result.calculation.landscape.panelsPerRow} لوح/صف</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Zap className="text-primary"/> إجمالي إنتاج الطاقة المقدر</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                    <li className="border rounded-lg p-4">
                      <div className="text-2xl font-bold">{result.calculation.totalPowerKw.toFixed(2)}</div>
                      <div className="text-muted-foreground">كيلوواط</div>
                      <div className="text-sm">إجمالي قوة النظام</div>
                    </li>
                    <li className="border rounded-lg p-4">
                      <div className="text-2xl font-bold">{result.calculation.dailyEnergyKwh.toFixed(2)}</div>
                      <div className="text-muted-foreground">كيلوواط/ساعة</div>
                       <div className="text-sm">الإنتاج اليومي</div>
                    </li>
                    <li className="border rounded-lg p-4">
                      <div className="text-2xl font-bold">{result.calculation.monthlyEnergyKwh.toFixed(2)}</div>
                      <div className="text-muted-foreground">كيلوواط/ساعة</div>
                       <div className="text-sm">الإنتاج الشهري</div>
                    </li>
                    <li className="border rounded-lg p-4">
                      <div className="text-2xl font-bold">{result.calculation.yearlyEnergyKwh.toFixed(2)}</div>
                      <div className="text-muted-foreground">كيلوواط/ساعة</div>
                       <div className="text-sm">الإنتاج السنوي</div>
                    </li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    * الحسابات تقديرية وتعتمد على معامل تباعد 1.5 لضمان عدم التظليل وسهولة الصيانة.
                  </p>
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
                <Maximize className="h-4 w-4" />
                <AlertTitle>استغل مساحتك بأفضل شكل</AlertTitle>
                <AlertDescription>
                  املأ النموذج أعلاه لحساب أقصى عدد من الألواح يمكنك وضعه في أرضك والإنتاج المتوقع.
                </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
