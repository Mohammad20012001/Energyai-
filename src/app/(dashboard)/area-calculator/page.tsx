
"use client";

import { useState, useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Calculator, Maximize, Zap, ArrowRight, Loader2, Sun, PlusCircle, Square, Rows, Columns, Map, Pencil, Redo2, Scissors, BrainCircuit } from "lucide-react";
import { useReport } from "@/context/ReportContext";
import dynamic from 'next/dynamic';
import Link from "next/link";


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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { calculateProductionFromArea, type AreaCalculationResult } from "@/services/calculations";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  landWidth: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).positive("يجب أن تكون قيمة العرض إيجابية"),
  landLength: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).positive("يجب أن تكون قيمة الطول إيجابية"),
  panelWidth: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).positive("يجب أن تكون قيمة العرض إيجابية"),
  panelLength: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).positive("يجب أن تكون قيمة الطول إيجابية"),
  panelWattage: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).positive("يجب أن تكون القوة الكهربائية إيجابية"),
  sunHours: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).min(1, "يجب أن تكون ساعة واحدة على الأقل").max(24, "لا يمكن أن يتجاوز 24 ساعة"),
  orientation: z.enum(['auto', 'portrait', 'landscape'], {
    required_error: "الرجاء اختيار اتجاه التركيب"
  }),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ResultState {
  calculation: AreaCalculationResult;
  formValues: FormValues;
}

const LeafletMap = dynamic(() => import('@/components/leaflet-map'), { 
    loading: () => <p className="text-center text-muted-foreground">...تحميل الخريطة</p>,
    ssr: false 
});


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
      orientation: 'auto',
      notes: "",
    },
  });

  const landArea = (useWatch({ control: form.control, name: "landWidth" }) || 0) * (useWatch({ control: form.control, name: "landLength" }) || 0);

  const onAreaCalculated = useCallback((area: number) => {
    // Avoid updating for tiny areas which are likely mistakes
    if (area < 1) return;
    const sideLength = Math.sqrt(area);
    form.setValue('landWidth', parseFloat(sideLength.toFixed(2)), { shouldValidate: true });
    form.setValue('landLength', parseFloat(sideLength.toFixed(2)), { shouldValidate: true });
    
    toast({
        title: "تم تحديث الأبعاد",
        description: `تم تحديث العرض والطول بناءً على المساحة المرسومة: ${area.toFixed(2)} م².`,
    });
  }, [form, toast]);


  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setResult(null);

    await new Promise(resolve => setTimeout(resolve, 500));

    const calculationResult = calculateProductionFromArea(values);
    setResult({
        calculation: calculationResult,
        formValues: values,
    });

    setIsLoading(false);
  }

  const handleAddToReport = () => {
    if (!result) return;
    const notes = form.getValues("notes");
    const orientationText = {
      portrait: 'طولي',
      landscape: 'عرضي',
      auto: 'تلقائي'
    };
    const reportValues: Record<string, string> = {
        "إجمالي المساحة": `${result.formValues.landWidth * result.formValues.landLength} م²`,
        "العدد الأقصى للألواح": `${result.calculation.maxPanels} لوح`,
        "اتجاه التركيب": orientationText[result.calculation.finalOrientation],
        "إجمالي قوة النظام": `${result.calculation.totalPowerKw.toFixed(2)} كيلوواط`,
        "الإنتاج السنوي المقدر": `${result.calculation.yearlyEnergyKwh.toFixed(0)} ك.و.س`,
    };

    if (notes) {
        reportValues["ملاحظات"] = notes;
    }

    addReportCard({
      id: `area-${Date.now()}`,
      type: "حاسبة المساحة والإنتاج",
      summary: `إنتاج سنوي يبلغ ${result.calculation.yearlyEnergyKwh.toFixed(0)} ك.و.س من ${result.calculation.maxPanels} لوحًا.`,
      values: reportValues,
    });
    toast({
      title: "تمت الإضافة بنجاح",
      description: "تمت إضافة بطاقة حاسبة المساحة إلى تقريرك.",
    });
  };
  
  const orientationText = {
    portrait: 'طولي',
    landscape: 'عرضي',
  };


  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">حاسبة المساحة والإنتاج</h1>
        <p className="text-muted-foreground mt-2">
          ارسم أرضك على الخريطة، واقتطع العوائق، ثم أدخل الأبعاد لتقدير عدد الألواح التي يمكن تركيبها وكمية الطاقة.
        </p>
      </div>

       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Map className="text-primary"/> تحديد المساحة من الخريطة</CardTitle>
          <CardDescription>
            استخدم أدوات الرسم (المضلع أو المستطيل) لتحديد قطعة الأرض. ثم استخدم أداة المقص (<Scissors className="inline h-4 w-4" />) لرسم العوائق واقتطاعها من المساحة.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="h-[400px] w-full rounded-md border overflow-hidden relative z-10">
             <LeafletMap onAreaCalculated={onAreaCalculated} />
            </div>
        </CardContent>
      </Card>


      <div className="grid gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-2 h-fit">
          <CardHeader>
            <CardTitle>أدخل الأبعاد والبيانات يدويًا</CardTitle>
            <CardDescription>
              بالمتر المربع: {landArea.toFixed(2)} م²
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

                  <FormField
                    control={form.control}
                    name="orientation"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>اتجاه تركيب الألواح</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-2 space-x-reverse">
                              <FormControl>
                                <RadioGroupItem value="auto" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                تلقائي (الأفضل)
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-x-reverse">
                              <FormControl>
                                <RadioGroupItem value="portrait" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                طولي (Portrait)
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-x-reverse">
                              <FormControl>
                                <RadioGroupItem value="landscape" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                عرضي (Landscape)
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                          ملاحظات (اختياري)
                        </FormLabel>
                        <FormControl>
                          <Textarea placeholder="e.g., تجنب خزان المياه في الزاوية الشمالية." {...field} />
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
                        <div className="text-6xl font-bold text-primary">{(result.formValues.landWidth * result.formValues.landLength).toFixed(1)}</div>
                        <p className="text-muted-foreground mt-2 text-lg">متر مربع</p>
                    </CardContent>
                </Card>

              <Card className="text-center">
                <CardHeader>
                  <CardTitle className="text-2xl">العدد الأقصى للألواح</CardTitle>
                  <CardDescription>
                    أفضل نتيجة ممكنة بناءً على المساحة والاتجاه المحدد
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-6xl font-bold text-primary">{result.calculation.maxPanels}</div>
                  <p className="text-muted-foreground mt-2 text-lg">لوح شمسي</p>
                   <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                     <div className="flex items-center justify-center gap-2 rounded-lg border p-3">
                        <Redo2 className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <div className="font-bold">{orientationText[result.calculation.finalOrientation]}</div>
                            <div className="text-muted-foreground">الاتجاه النهائي</div>
                        </div>
                     </div>
                     <div className="flex items-center justify-center gap-2 rounded-lg border p-3">
                        <Rows className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <div className="font-bold">{result.calculation.rowCount} صفوف</div>
                            <div className="text-muted-foreground">{result.calculation.panelsPerString} لوح/صف</div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <Button onClick={handleAddToReport} variant="secondary">
                    <PlusCircle className="ml-2 h-4 w-4" />
                    أضف إلى التقرير
                 </Button>
                <Button asChild>
                    <Link href={`/design-optimizer?surfaceArea=${(result.formValues.landWidth * result.formValues.landLength).toFixed(1)}&panelWattage=${result.formValues.panelWattage}`}>
                        <BrainCircuit className="ml-2 h-4 w-4"/>
                        تحليل الجدوى المالية لهذا التصميم
                    </Link>
                </Button>
              </div>
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

  