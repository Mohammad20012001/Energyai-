"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { BatteryCharging, Zap, ArrowRight, Loader2, Lightbulb, ShieldCheck, PlusCircle } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";


const formSchema = z.object({
  totalDcPower: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).positive("يجب أن تكون القوة إيجابية"),
  maxVoc: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).positive("يجب أن يكون الجهد إيجابياً"),
  maxIsc: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).positive("يجب أن يكون التيار إيجابياً"),
  gridPhase: z.enum(["single", "three"], {required_error: "يجب اختيار نوع الشبكة"}),
});

type FormValues = z.infer<typeof formSchema>;

interface CalculationResult {
  minInverterSize: number;
  maxInverterSize: number;
  recommendedVoc: number;
  recommendedIsc: number;
  gridPhase: string;
}

export default function InverterSizingPage() {
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { addReportCard } = useReport();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      totalDcPower: 8.5,
      maxVoc: 450,
      maxIsc: 12,
      gridPhase: "single",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setResult(null);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Inverter AC size is typically 90-110% of the array's DC size
    const minInverterSize = values.totalDcPower * 0.9;
    const maxInverterSize = values.totalDcPower * 1.1;

    // Safety margins for voltage and current
    const recommendedVoc = values.maxVoc * 1.15;
    const recommendedIsc = values.maxIsc * 1.25;

    setResult({
      minInverterSize,
      maxInverterSize,
      recommendedVoc,
      recommendedIsc,
      gridPhase: values.gridPhase === 'single' ? 'أحادي الطور' : 'ثلاثي الطور',
    });
    setIsLoading(false);
  }

  const handleAddToReport = () => {
    if (!result) return;
    addReportCard({
      id: `inverter-${Date.now()}`,
      type: "أداة تحديد حجم العاكس",
      summary: `عاكس بين ${result.minInverterSize.toFixed(2)}-${result.maxInverterSize.toFixed(2)} kW لنظام ${form.getValues().totalDcPower} kWp.`,
      values: {
        "حجم العاكس الموصى به": `بين ${result.minInverterSize.toFixed(2)} و ${result.maxInverterSize.toFixed(2)} kW`,
        "الحد الأدنى لجهد العاكس": `${result.recommendedVoc.toFixed(0)} V`,
        "الحد الأدنى لتيار العاكس": `${result.recommendedIsc.toFixed(2)} A`,
        "نوع الشبكة": result.gridPhase,
      }
    });
    toast({
      title: "تمت الإضافة بنجاح",
      description: "تمت إضافة بطاقة تحديد حجم العاكس إلى تقريرك.",
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">أداة تحديد حجم العاكس</h1>
        <p className="text-muted-foreground mt-2">
          اختر العاكس الأنسب لمصفوفة الطاقة الشمسية لديك لضمان أقصى أداء وأمان.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-2 h-fit">
          <CardHeader>
            <CardTitle>أدخل بيانات مصفوفة الألواح</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 text-right">
                <fieldset disabled={isLoading} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="totalDcPower"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>إجمالي قوة الألواح (kWp)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 8.5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxVoc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>أقصى جهد للدائرة المفتوحة (Voc)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 450" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="maxIsc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>أقصى تيار للدائرة القصيرة (Isc)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gridPhase"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>نوع الشبكة</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-row gap-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-x-reverse">
                              <FormControl>
                                <RadioGroupItem value="single" id="single" />
                              </FormControl>
                              <FormLabel htmlFor="single">أحادي الطور</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-x-reverse">
                              <FormControl>
                                <RadioGroupItem value="three" id="three" />
                              </FormControl>
                              <FormLabel htmlFor="three">ثلاثي الطور</FormLabel>
                            </FormItem>
                          </RadioGroup>
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
                      تحديد الحجم <ArrowRight className="mr-2 h-4 w-4" />
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
                <p>...نبحث عن العاكس المثالي لك</p>
              </div>
            </Card>
          )}

          {result && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Zap className="text-primary"/> حجم العاكس الموصى به (AC)</CardTitle>
                  <CardDescription>يجب أن يكون حجم العاكس قريبًا من حجم مصفوفة الألواح لديك.</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-3xl font-bold">
                    بين <span className="text-primary">{result.minInverterSize.toFixed(2)}</span> و <span className="text-primary">{result.maxInverterSize.toFixed(2)}</span>
                  </div>
                  <div className="text-muted-foreground mt-1">كيلوواط (kW)</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ShieldCheck className="text-primary"/> متطلبات الجهد والتيار (DC)</CardTitle>
                   <CardDescription>يجب أن يتحمل العاكس أقصى جهد وتيار من الألواح مع معامل أمان.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                    <li className="border rounded-lg p-4">
                      <div className="text-sm text-muted-foreground mb-1">الحد الأدنى لجهد العاكس</div>
                      <div className="text-2xl font-bold">{result.recommendedVoc.toFixed(0)} <span className="text-lg">V</span></div>
                    </li>
                     <li className="border rounded-lg p-4">
                      <div className="text-sm text-muted-foreground mb-1">الحد الأدنى لتيار العاكس</div>
                      <div className="text-2xl font-bold">{result.recommendedIsc.toFixed(2)} <span className="text-lg">A</span></div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
               <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>نصائح إضافية</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>نوع الشبكة المحدد: **{result.gridPhase}**. تأكد من أن العاكس متوافق.</li>
                    <li>تحقق دائمًا من ورقة بيانات العاكس (Datasheet) للتأكد من توافق نطاق جهد MPPT.</li>
                    <li>بعض الشركات المصنعة تسمح بـ (DC/AC ratio) أعلى، راجع دليل العاكس.</li>
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
                  <BatteryCharging className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="mt-4">اختر العقل المدبر لنظامك الشمسي</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground max-w-md">
                  أدخل بيانات مصفوفة الألواح لديك للحصول على توصية دقيقة حول حجم العاكس المناسب لضمان الأمان والكفاءة.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
