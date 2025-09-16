
'use client';

import {useState} from 'react';
import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {
  Loader2,
  AlertTriangle,
  ArrowRight,
  Sun,
  PlusCircle,
  Lightbulb,
  ThermometerSnowflake,
  ThermometerSun,
  CheckCircle,
  XCircle,
  SlidersHorizontal,
} from 'lucide-react';

import {Button} from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {useToast} from '@/hooks/use-toast';
import {suggestStringConfigurationAction} from '@/app/actions/solar';
import {useReport} from '@/context/ReportContext';
import type {SuggestStringConfigurationOutput} from '@/ai/tool-schemas';


const formSchema = z.object({
  // Panel Specs
  vmp: z.coerce.number().positive("قيمة موجبة"),
  voc: z.coerce.number().positive("قيمة موجبة"),
  tempCoefficient: z.coerce.number().negative("يجب أن تكون القيمة سالبة (e.g., -0.32)"),
  
  // Inverter Specs
  mpptMin: z.coerce.number().positive("قيمة موجبة"),
  mpptMax: z.coerce.number().positive("قيمة موجبة"),
  inverterMaxVolt: z.coerce.number().positive("قيمة موجبة"),
  
  // Environmental Specs
  minTemp: z.coerce.number().int(),
  maxTemp: z.coerce.number().int(),
});

export function StringConfigurationClientPage() {
  const [result, setResult] =
    useState<SuggestStringConfigurationOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const {toast} = useToast();
  const {addReportCard} = useReport();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vmp: 42.5,
      voc: 50.5,
      tempCoefficient: -0.32,
      mpptMin: 200,
      mpptMax: 800,
      inverterMaxVolt: 1000,
      minTemp: -5,
      maxTemp: 65,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await suggestStringConfigurationAction(values);
      if (response.success && response.data) {
        setResult(response.data);
      } else {
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: response.error,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'حدث خطأ غير متوقع',
        description: 'يرجى المحاولة مرة أخرى في وقت لاحق.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleAddToReport = () => {
    if (!result) return;
    addReportCard({
      id: `string-config-${Date.now()}`,
      type: 'حاسبة توافق السلاسل مع العاكس',
      summary: `المدى الآمن: ${result.minPanels} إلى ${result.maxPanels} لوح. الموصى به: ${result.optimalPanels} ألواح.`,
      values: {
        'الحد الأدنى للألواح': `${result.minPanels} لوح`,
        'الحد الأقصى للألواح': `${result.maxPanels} لوح`,
        'العدد الموصى به': `${result.optimalPanels} لوح`,
        'الجهد في أبرد يوم': `${result.maxStringVocAtMinTemp.toFixed(1)}V (عند ${result.maxPanels} ألواح)`,
        'الجهد في أحر يوم': `${result.minStringVmpAtMaxTemp.toFixed(1)}V (عند ${result.minPanels} ألواح)`,
      },
    });
    toast({
      title: 'تمت الإضافة بنجاح',
      description: 'تمت إضافة بطاقة تهيئة السلاسل إلى تقريرك.',
    });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <Card className="lg:col-span-2 h-fit">
        <CardHeader>
          <CardTitle>أدخل المواصفات الفنية</CardTitle>
          <CardDescription>أدخل البيانات من أوراق مواصفات الألواح والعاكس.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 text-right"
            >
              <fieldset disabled={isLoading} className="space-y-4">
                <div className="space-y-2">
                    <h4 className="font-semibold text-muted-foreground">مواصفات اللوح الشمسي</h4>
                    <FormField control={form.control} name="voc" render={({field}) => (<FormItem><FormLabel>جهد الدائرة المفتوحة (Voc)</FormLabel><FormControl><Input placeholder="e.g., 50.5" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="vmp" render={({field}) => (<FormItem><FormLabel>الجهد عند أقصى قدرة (Vmp)</FormLabel><FormControl><Input placeholder="e.g., 42.5" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="tempCoefficient" render={({field}) => (<FormItem><FormLabel>معامل الحرارة للجهد (%/°C)</FormLabel><FormControl><Input placeholder="e.g., -0.32" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                </div>

                <div className="space-y-2">
                    <h4 className="font-semibold text-muted-foreground">مواصفات العاكس (Inverter)</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <FormField control={form.control} name="mpptMin" render={({field}) => (<FormItem><FormLabel>أدنى جهد MPPT</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="mpptMax" render={({field}) => (<FormItem><FormLabel>أقصى جهد MPPT</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    </div>
                    <FormField control={form.control} name="inverterMaxVolt" render={({field}) => (<FormItem><FormLabel>أقصى جهد دخل للعاكس (Max Input Voltage)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                </div>

                <div className="space-y-2">
                    <h4 className="font-semibold text-muted-foreground">الظروف البيئية للموقع</h4>
                     <div className="grid grid-cols-2 gap-2">
                        <FormField control={form.control} name="minTemp" render={({field}) => (<FormItem><FormLabel>أدنى حرارة شتاءً (°C)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="maxTemp" render={({field}) => (<FormItem><FormLabel>أقصى حرارة صيفًا (°C)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormMessage /></FormItem>)}/>
                    </div>
                </div>

              </fieldset>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    ...جاري تحليل التوافق
                  </>
                ) : (
                  <>
                    احسب مدى السلاسل الآمن <ArrowRight className="mr-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="lg:col-span-3">
        {isLoading && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-muted-foreground">
                <Sun className="h-6 w-6 animate-spin" /> ...النموذج الهجين يعمل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-24 w-full animate-pulse rounded-md bg-muted"></div>
              <div className="h-40 w-full animate-pulse rounded-md bg-muted"></div>
            </CardContent>
          </Card>
        )}

        {result && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                    <SlidersHorizontal />
                    المدى الآمن والمثالي لعدد الألواح في السلسلة
                </CardTitle>
                <CardDescription>
                    هذه هي النتائج المحسوبة فيزيائياً لضمان سلامة وأداء نظامك.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-3 text-center">
                <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-4">
                  <span className="text-4xl font-bold">
                    {result.minPanels}
                  </span>
                  <p className="text-muted-foreground mt-1">
                    الحد الأدنى للألواح
                  </p>
                </div>
                 <div className="flex flex-col items-center justify-center rounded-lg border-2 border-primary bg-primary/5 p-4">
                  <span className="text-5xl font-bold text-primary">
                    {result.optimalPanels}
                  </span>
                  <p className="font-semibold text-primary mt-1">
                    العدد الموصى به
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-4">
                  <span className="text-4xl font-bold">
                    {result.maxPanels}
                  </span>
                  <p className="text-muted-foreground mt-1">
                    الحد الأقصى للألواح
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                  <CardTitle>التحقق من حدود الجهد الحرجة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="flex items-center gap-4 border p-3 rounded-lg">
                        <ThermometerSnowflake className="h-8 w-8 text-blue-500 flex-shrink-0" />
                        <div>
                            <h4 className="font-semibold">فحص السلامة (أبرد يوم)</h4>
                            <p className="text-sm text-muted-foreground">
                                جهد السلسلة الأقصى ({result.maxPanels} ألواح) عند {form.getValues('minTemp')}°م هو <span className="font-bold">{result.maxStringVocAtMinTemp.toFixed(1)} فولت</span>.
                            </p>
                            {result.maxStringVocAtMinTemp < form.getValues('inverterMaxVolt') ? (
                                <div className="flex items-center gap-1 text-sm text-green-600 mt-1 font-semibold"><CheckCircle className="h-4 w-4"/> آمن (أقل من {form.getValues('inverterMaxVolt')} فولت)</div>
                            ) : (
                                <div className="flex items-center gap-1 text-sm text-red-600 mt-1 font-semibold"><XCircle className="h-4 w-4"/> خطير (أعلى من {form.getValues('inverterMaxVolt')} فولت)</div>
                            )}
                        </div>
                   </div>
                   <div className="flex items-center gap-4 border p-3 rounded-lg">
                        <ThermometerSun className="h-8 w-8 text-orange-500 flex-shrink-0" />
                        <div>
                            <h4 className="font-semibold">فحص الأداء (أحر يوم)</h4>
                            <p className="text-sm text-muted-foreground">
                                جهد السلسلة الأدنى ({result.minPanels} ألواح) عند {form.getValues('maxTemp')}°م هو <span className="font-bold">{result.minStringVmpAtMaxTemp.toFixed(1)} فولت</span>.
                            </p>
                             {result.minStringVmpAtMaxTemp > form.getValues('mpptMin') ? (
                                <div className="flex items-center gap-1 text-sm text-green-600 mt-1 font-semibold"><CheckCircle className="h-4 w-4"/> فعال (أعلى من {form.getValues('mpptMin')} فولت)</div>
                            ) : (
                                <div className="flex items-center gap-1 text-sm text-red-600 mt-1 font-semibold"><XCircle className="h-4 w-4"/> غير فعال (أقل من {form.getValues('mpptMin')} فولت)</div>
                            )}
                        </div>
                   </div>
                </CardContent>
            </Card>

            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>تحليل وتوصيات الخبير (AI)</AlertTitle>
              <AlertDescription className="mt-2 prose prose-sm max-w-none text-foreground/90">
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
          <Card className="flex flex-col items-center justify-center text-center p-8 lg:min-h-[400px]">
            <CardHeader>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Sun className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="mt-4">صمم السلاسل بأمان وكفاءة</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground max-w-md">
                أدخل مواصفات نظامك ليقوم مهندسنا الذكي بحساب المدى الآمن والمثالي لعدد الألواح في كل سلسلة، مع الأخذ بعين الاعتبار تأثيرات درجة الحرارة.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
