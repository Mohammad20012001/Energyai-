"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowRight, Loader2, ListChecks, BrainCircuit } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { useToast } from "@/hooks/use-toast";
import { auditCalculations, type AuditOutput } from "@/ai/flows/audit-calculations";

const formSchema = z.object({
  calculationsText: z.string().min(50, "الرجاء إدخال نص يحتوي على حسابات كافية للمراجعة."),
});

type FormValues = z.infer<typeof formSchema>;

const exampleText = `
الاستهلاك الشهري = 120 ÷ 0.12 = 1000 kWh
الاستهلاك اليومي = 1000 ÷ 30 = 33.33 kWh/day
حجم النظام المطلوب = 33.33 ÷ (5.5 × 0.8) = 7.575 kW
عدد الألواح = 7.575 ÷ 0.55 = 13.77 ≈ 14 لوح
المساحة المطلوبة = 14 × 2.59 = 36.3 m²
تكلفة الألواح = 7,700 × 0.85 = 6,545 دينار
التكلفة الكاملة = 6,545 ÷ 0.30 = 21,817 دينار
مدة الاسترداد = 21,817 ÷ 1,440 ≈ 15.2 سنة
`;

export default function CalculationAuditorPage() {
  const [result, setResult] = useState<AuditOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      calculationsText: exampleText,
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await auditCalculations({text: values.calculationsText});
      setResult(response);
    } catch (error) {
      console.error("Error auditing calculations:", error);
      toast({
        variant: "destructive",
        title: "خطأ في الاتصال",
        description: "فشل في الحصول على تدقيق من الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">المدقق الحسابي (AI)</h1>
        <p className="text-muted-foreground mt-2">
          ألصق أي نص يحتوي على حسابات تصميم نظام شمسي، وسيقوم الذكاء الاصطناعي بمراجعته وتصحيحه لك.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-2 h-fit">
          <CardHeader>
            <CardTitle>أدخل النص للمراجعة</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 text-right">
                <fieldset disabled={isLoading}>
                  <FormField
                    control={form.control}
                    name="calculationsText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>النص الذي يحتوي على الحسابات</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="ألصق النص هنا..."
                            className="min-h-[300px] text-left font-code"
                            {...field}
                          />
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
                      ...جاري التدقيق
                    </>
                  ) : (
                    <>
                      تدقيق الحسابات <ArrowRight className="mr-2 h-4 w-4" />
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
                <p>...المدقق الذكي يراجع كل رقم</p>
              </div>
            </Card>
          )}

          {result && (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>ملخص تدقيق الحسابات</CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
                        <p>{result.overallAssessment}</p>
                    </CardContent>
                </Card>

                {result.corrections.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>التصحيحات والتوضيحات</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {result.corrections.map((correction, index) => (
                                <Alert key={index} variant="destructive">
                                    <ListChecks className="h-4 w-4" />
                                    <AlertTitle>خطأ في حساب: {correction.item}</AlertTitle>
                                    <AlertDescription className="mt-2 space-y-1">
                                        <p><b>الحساب الخاطئ:</b> <span className="font-code">{correction.incorrectCalculation}</span></p>
                                        <p><b>الحساب الصحيح:</b> <span className="font-code">{correction.correctCalculation}</span></p>
                                        <p><b>التوضيح:</b> {correction.explanation}</p>
                                    </AlertDescription>
                                </Alert>
                            ))}
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>الجدول النهائي بالنتائج الصحيحة</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>المؤشر</TableHead>
                                    <TableHead className="text-left">القيمة الصحيحة</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {result.finalCorrectValues.map((item) => (
                                <TableRow key={item.parameter}>
                                    <TableCell className="font-medium">{item.parameter}</TableCell>
                                    <TableCell className="text-left font-code">{item.value}</TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
          )}

          {!isLoading && !result && (
            <Card className="flex flex-col items-center justify-center text-center p-8 lg:min-h-[400px] bg-muted/20">
              <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <ListChecks className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="mt-4">هل أنت واثق من حساباتك؟</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground max-w-md">
                  ألصق أي نص يحتوي على حسابات تصميم نظام شمسي، ودع الذكاء الاصطناعي يقوم بمراجعتها لك خطوة بخطوة، يكتشف الأخطاء، ويقدم لك النتائج الصحيحة.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
