"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Bot, Sparkles, ArrowRight, Loader2, Sun, DollarSign, Maximize, FileText, CheckCircle, Settings, Zap, BatteryCharging } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


const formSchema = z.object({
  budget: z.coerce.number().positive("يجب أن تكون الميزانية إيجابية"),
  surfaceArea: z.coerce.number().positive("يجب أن تكون المساحة إيجابية"),
  monthlyBill: z.coerce.number().positive("يجب أن تكون الفاتورة إيجابية"),
  location: z.string({ required_error: "يجب اختيار الموقع" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function DesignOptimizerPage() {
  const [result, setResult] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { addReportCard } = useReport();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      budget: 7000,
      surfaceArea: 60,
      monthlyBill: 80,
      location: "amman",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setResult(null);

    // Placeholder for AI call
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Dummy result for now
    const dummyResult = {
      summary: {
        optimizedSystemSize: 8.2,
        totalCost: 6890,
        paybackPeriod: 5.8,
        twentyFiveYearProfit: 21500,
      },
      panelConfig: {
        panelCount: 15,
        panelWattage: 550,
        totalDcPower: 8.25,
        tilt: 30,
        azimuth: 180,
      },
      inverterConfig: {
        recommendedSize: "8 kW",
        phase: "Three-Phase",
        mpptVoltage: "300-800 V"
      },
      wiringConfig: {
        panelsPerString: 15,
        parallelStrings: 1,
        wireSize: 6
      },
      reasoning: "This design maximizes energy output for your surface area while staying within budget. The chosen inverter is a perfect match for the panel array, ensuring high efficiency. The payback period is excellent, leading to significant long-term profit."
    }

    setResult(dummyResult);
    setIsLoading(false);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">محسن التصميم الشمسي (AI Optimizer)</h1>
        <p className="text-muted-foreground mt-2">
          أدخل أهدافك وقيودك، ودع الذكاء الاصطناعي يصمم لك النظام الأمثل من الألف إلى الياء.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-2 h-fit">
          <CardHeader>
            <CardTitle>أخبرنا عن مشروعك</CardTitle>
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
                        <FormLabel className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-muted-foreground"/> الميزانية التقريبية (دينار)</FormLabel>
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
                        <FormLabel className="flex items-center gap-2"><Maximize className="w-4 h-4 text-muted-foreground"/> مساحة السطح المتاحة (م²)</FormLabel>
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
                        <FormLabel className="flex items-center gap-2"><FileText className="w-4 h-4 text-muted-foreground"/> متوسط الفاتورة الشهرية (دينار)</FormLabel>
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
                        <FormLabel className="flex items-center gap-2"><Sun className="w-4 h-4 text-muted-foreground"/> الموقع</FormLabel>
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
                <Button type="submit" disabled={isLoading} className="w-full !mt-8">
                  {isLoading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      ...الذكاء الاصطناعي يبحث عن أفضل حل
                    </>
                  ) : (
                    <>
                      أوجد التصميم الأمثل <Sparkles className="mr-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          {isLoading && (
            <Card className="flex flex-col items-center justify-center p-8 lg:min-h-[600px]">
              <div className="flex flex-col items-center gap-4 text-muted-foreground text-center">
                <Bot className="h-16 w-16 animate-pulse text-primary" />
                <p className="text-lg font-semibold mt-4">يقوم المهندس الذكي بتحليل طلبك...</p>
                <p>يدرس النموذج آلاف التكوينات الممكنة ليجد لك التصميم الذي يحقق أفضل توازن بين التكلفة والأداء والعائد على الاستثمار.</p>
                <p className="text-xs mt-4">قد تستغرق هذه العملية دقيقة...</p>
              </div>
            </Card>
          )}

          {result && (
            <div className="space-y-6">
              <Card className="bg-primary/5 border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-primary">
                    <CheckCircle />
                    الخلاصة: التصميم الأمثل لك
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="border rounded-lg p-3">
                      <div className="text-2xl font-bold">{result.summary.optimizedSystemSize}</div>
                      <div className="text-sm text-muted-foreground">كيلوواط</div>
                    </div>
                     <div className="border rounded-lg p-3">
                      <div className="text-2xl font-bold">{result.summary.totalCost}</div>
                      <div className="text-sm text-muted-foreground">دينار</div>
                    </div>
                     <div className="border rounded-lg p-3">
                      <div className="text-2xl font-bold">{result.summary.paybackPeriod}</div>
                      <div className="text-sm text-muted-foreground">سنوات</div>
                    </div>
                     <div className="border rounded-lg p-3">
                      <div className="text-2xl font-bold">{result.summary.twentyFiveYearProfit}</div>
                      <div className="text-sm text-muted-foreground">أرباح 25 سنة</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Sun/> تكوين الألواح</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                   <div className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50"><span>عدد الألواح:</span> <span className="font-bold">{result.panelConfig.panelCount}</span></div>
                   <div className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50"><span>قوة اللوح:</span> <span className="font-bold">{result.panelConfig.panelWattage} واط</span></div>
                   <div className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50"><span>إجمالي قوة DC:</span> <span className="font-bold">{result.panelConfig.totalDcPower} kWp</span></div>
                   <div className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50"><span>زاوية الميل:</span> <span className="font-bold">{result.panelConfig.tilt}°</span></div>
                   <div className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50"><span>الاتجاه:</span> <span className="font-bold">{result.panelConfig.azimuth}° (جنوب)</span></div>
                </CardContent>
              </Card>
              
               <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><BatteryCharging/> تكوين العاكس</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                   <div className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50"><span>الحجم الموصى به:</span> <span className="font-bold">{result.inverterConfig.recommendedSize}</span></div>
                   <div className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50"><span>نوع الشبكة:</span> <span className="font-bold">{result.inverterConfig.phase}</span></div>
                   <div className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50"><span>نطاق جهد MPPT:</span> <span className="font-bold">{result.inverterConfig.mpptVoltage}</span></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Zap/> تكوين التوصيلات</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                   <div className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50"><span>الألواح لكل سلسلة:</span> <span className="font-bold">{result.wiringConfig.panelsPerString}</span></div>
                   <div className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50"><span>عدد السلاسل المتوازية:</span> <span className="font-bold">{result.wiringConfig.parallelStrings}</span></div>
                   <div className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50"><span>حجم سلك DC الرئيسي:</span> <span className="font-bold">{result.wiringConfig.wireSize} mm²</span></div>
                </CardContent>
              </Card>
              
               <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Bot/> منطق المهندس الذكي</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{result.reasoning}</p>
                </CardContent>
              </Card>

            </div>
          )}

          {!isLoading && !result && (
            <Card className="flex flex-col items-center justify-center text-center p-8 lg:min-h-[600px] bg-muted/20">
              <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-9 w-9 text-primary" />
                </div>
                <CardTitle className="mt-4">شريكك في التصميم الذكي</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground max-w-md">
                  هل أنت مستعد لتصميم نظام الطاقة الشمسية المثالي؟ أدخل معطيات مشروعك على اليمين، وسيقوم مهندسنا الذكي بتحليل متطلباتك، وموازنة جميع العوامل، وتقديم تصميم متكامل ومُحسَّن خصيصًا لك.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
