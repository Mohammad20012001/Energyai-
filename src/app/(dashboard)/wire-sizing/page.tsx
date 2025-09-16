"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Zap, ArrowRight, Lightbulb, AlertTriangle, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { suggestWireSize } from "@/ai/flows/suggest-wire-size";
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
import type { SuggestWireSizeOutput } from "@/ai/tool-schemas";

const formSchema = z.object({
  current: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).positive("يجب أن يكون التيار إيجابياً"),
  voltage: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).positive("يجب أن يكون الجهد إيجابياً"),
  distance: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).positive("يجب أن تكون المسافة إيجابية"),
  voltageDropPercentage: z.coerce.number({invalid_type_error: "يجب أن يكون رقماً"}).min(0.1, "يجب أن تكون النسبة أكبر من 0").max(10, "النسبة مرتفعة جداً"),
});

type FormValues = z.infer<typeof formSchema>;

export default function WireSizingPage() {
  const [result, setResult] = useState<SuggestWireSizeOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { addReportCard } = useReport();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      current: 25,
      voltage: 600,
      distance: 30,
      voltageDropPercentage: 2,
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await suggestWireSize(values);
      setResult(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "فشل في الحصول على اقتراح من الذكاء الاصطناعي.";
      console.error("Error fetching wire size suggestion:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleAddToReport = () => {
    if (!result) return;
    const formValues = form.getValues();
    addReportCard({
      id: `wire-${Date.now()}`,
      type: "حاسبة مقطع السلك",
      summary: `مقطع سلك ${result.recommendedWireSizeMM2} مم² لتيار ${formValues.current} أمبير ومسافة ${formValues.distance} م.`,
      values: {
        "مقطع السلك الموصى به": `${result.recommendedWireSizeMM2} mm²`,
        "هبوط الجهد الفعلي": `${result.voltageDrop.toFixed(2)} V`,
        "الطاقة المفقودة": `${result.powerLoss.toFixed(2)} W`,
      }
    });
    toast({
      title: "تمت الإضافة بنجاح",
      description: "تمت إضافة بطاقة مقطع السلك إلى تقريرك.",
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">حاسبة مقطع السلك (نموذج هجين: فيزياء + AI)</h1>
        <p className="text-muted-foreground mt-2">
          احسب حجم السلك (الكابل) الأمثل لتركيبات الطاقة الشمسية لضمان الأمان وتقليل فاقد الطاقة.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-2 h-fit">
          <CardHeader>
            <CardTitle>أدخل بيانات الدارة</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 text-right">
                <fieldset disabled={isLoading} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="current"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تيار النظام (أمبير)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 25" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="voltage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>جهد النظام (فولت)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 600" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="distance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>مسافة السلك (متر - اتجاه واحد)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 30" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="voltageDropPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>هبوط الجهد المسموح به (%)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 2" {...field} />
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
                <Zap className="h-12 w-12 animate-pulse" />
                <p>...النموذج الهجين يعمل: حسابات دقيقة مع تحليل ذكي</p>
              </div>
            </Card>
          )}

          {result && (
            <div className="space-y-6">
              <Card className="text-center">
                <CardHeader>
                  <CardTitle className="text-2xl">مقطع السلك الموصى به (فيزيائيًا)</CardTitle>
                  <CardDescription>
                    أقرب حجم قياسي يفي بالمتطلبات
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-6xl font-bold text-primary">{result.recommendedWireSizeMM2}</div>
                  <p className="text-muted-foreground mt-2 text-lg">mm²</p>
                </CardContent>
              </Card>

              <Card>
                 <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Lightbulb className="text-primary"/> تفاصيل الأداء (فيزيائيًا)</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                    <div className="border rounded-lg p-4">
                      <dt className="text-sm text-muted-foreground mb-1">هبوط الجهد الفعلي</dt>
                      <dd className="text-2xl font-bold">{result.voltageDrop.toFixed(2)} <span className="text-lg">V</span></dd>
                    </div>
                     <div className="border rounded-lg p-4">
                      <dt className="text-sm text-muted-foreground mb-1">الطاقة المفقودة</dt>
                      <dd className="text-2xl font-bold">{result.powerLoss.toFixed(2)} <span className="text-lg">W</span></dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
              
               <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>تحليل وتوصيات الخبير (AI)</AlertTitle>
                <AlertDescription className="mt-2 prose prose-sm max-w-none text-destructive-foreground/90">
                  {result.reasoning}
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
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="mt-4">تأكد من سلامة وكفاءة نظامك</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground max-w-md">
                  أدخل تفاصيل دارة التيار المستمر لديك للحصول على توصية دقيقة حول حجم السلك المناسب، وتجنب مخاطر ارتفاع درجة الحرارة وفقدان الطاقة.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
