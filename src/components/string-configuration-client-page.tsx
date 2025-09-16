

'use client';

import {useState, useEffect} from 'react';
import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import { useSearchParams } from 'next/navigation';
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
  LayoutGrid,
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
import { SystemVisualization } from '@/components/system-visualization';


const formSchema = z.object({
  // Panel Specs
  vmp: z.coerce.number().positive("قيمة موجبة"),
  voc: z.coerce.number().positive("قيمة موجبة"),
  imp: z.coerce.number().positive("قيمة موجبة"),
  isc: z.coerce.number().positive("قيمة موجبة"),
  tempCoefficient: z.coerce.number().negative("يجب أن تكون القيمة سالبة (e.g., -0.32)"),
  panelWattage: z.coerce.number().positive("قيمة موجبة"),
  
  // Inverter Specs
  mpptMin: z.coerce.number().positive("قيمة موجبة"),
  mpptMax: z.coerce.number().positive("قيمة موجبة"),
  inverterMaxVolt: z.coerce.number().positive("قيمة موجبة"),
  inverterMaxCurrent: z.coerce.number().positive("قيمة موجبة"),
  
  // Environmental & System Specs
  minTemp: z.coerce.number().int(),
  maxTemp: z.coerce.number().int(),
  targetSystemSize: z.coerce.number().positive("قيمة موجبة"),
});

export function StringConfigurationClientPage() {
  const [result, setResult] =
    useState<SuggestStringConfigurationOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const {toast} = useToast();
  const {addReportCard} = useReport();
  const searchParams = useSearchParams();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // Panel
      vmp: 42.5,
      voc: 50.5,
      imp: 12.9,
      isc: 13.5,
      tempCoefficient: -0.32,
      panelWattage: 550,
      // Inverter
      mpptMin: 200,
      mpptMax: 800,
      inverterMaxVolt: 1000,
      inverterMaxCurrent: 30,
      // System
      minTemp: -5,
      maxTemp: 65,
      targetSystemSize: 10,
    },
  });

  useEffect(() => {
    const targetSystemSize = searchParams.get('targetSystemSize');
    const panelWattage = searchParams.get('panelWattage');
    
    if (targetSystemSize) {
      form.setValue('targetSystemSize', parseFloat(targetSystemSize), { shouldValidate: true });
    }
    if (panelWattage) {
      form.setValue('panelWattage', parseFloat(panelWattage), { shouldValidate: true });
    }
  }, [searchParams, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await suggestStringConfigurationAction(values);
      if (response.success && response.data) {
        if(response.data.optimalPanels === 0) {
            toast({
              variant: 'destructive',
              title: 'فشل في الحساب',
              description: 'لا يوجد تكوين آمن ممكن. الحد الأدنى للألواح أكبر من الحد الأقصى. يرجى التحقق من توافق الألواح مع العاكس.',
            });
            setResult(response.data); // still set result to show the incompatibility
        } else {
            setResult(response.data);
        }
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
      type: 'حاسبة تصميم المصفوفة الكاملة',
      summary: `نظام ${form.getValues('targetSystemSize')}kWp: ${result.arrayConfig.parallelStrings} سلاسل، كل منها ${result.optimalPanels} لوح.`,
      values: {
        'المدى الآمن (لكل سلسلة)': `${result.minPanels} إلى ${result.maxPanels} لوح`,
        'العدد الموصى به (لكل سلسلة)': `${result.optimalPanels} لوح`,
        'عدد السلاسل المتوازية': `${result.arrayConfig.parallelStrings} سلاسل`,
        'العدد الإجمالي للألواح': `${result.arrayConfig.totalPanels} لوح`,
        'التيار الإجمالي للمصفوفة': `${result.arrayConfig.totalCurrent} A`,
        'سلامة التيار': result.arrayConfig.isCurrentSafe ? 'آمن' : 'غير آمن - يتجاوز حد العاكس!',
      },
    });
    toast({
      title: 'تمت الإضافة بنجاح',
      description: 'تمت إضافة بطاقة تهيئة السلاسل إلى تقريرك.',
    });
  };

  return (
    <>
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
                      <FormField control={form.control} name="panelWattage" render={({field}) => (<FormItem><FormLabel>قدرة اللوح (Wp)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <div className="grid grid-cols-2 gap-2">
                        <FormField control={form.control} name="voc" render={({field}) => (<FormItem><FormLabel>Voc</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="vmp" render={({field}) => (<FormItem><FormLabel>Vmp</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="isc" render={({field}) => (<FormItem><FormLabel>Isc</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="imp" render={({field}) => (<FormItem><FormLabel>Imp</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      </div>
                      <FormField control={form.control} name="tempCoefficient" render={({field}) => (<FormItem><FormLabel>معامل الحرارة للجهد (%/°C)</FormLabel><FormControl><Input placeholder="e.g., -0.32" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  </div>

                  <div className="space-y-2">
                      <h4 className="font-semibold text-muted-foreground">مواصفات العاكس (Inverter)</h4>
                      <div className="grid grid-cols-2 gap-2">
                          <FormField control={form.control} name="mpptMin" render={({field}) => (<FormItem><FormLabel>أدنى جهد MPPT</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                          <FormField control={form.control} name="mpptMax" render={({field}) => (<FormItem><FormLabel>أقصى جهد MPPT</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      </div>
                      <FormField control={form.control} name="inverterMaxVolt" render={({field}) => (<FormItem><FormLabel>أقصى جهد دخل (Max Input Voltage)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={form.control} name="inverterMaxCurrent" render={({field}) => (<FormItem><FormLabel>أقصى تيار دخل (Max Input Current)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  </div>

                  <div className="space-y-2">
                      <h4 className="font-semibold text-muted-foreground">الظروف وحجم النظام</h4>
                       <div className="grid grid-cols-2 gap-2">
                          <FormField control={form.control} name="minTemp" render={({field}) => (<FormItem><FormLabel>أدنى حرارة (°C)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                          <FormField control={form.control} name="maxTemp" render={({field}) => (<FormItem><FormLabel>أقصى حرارة (°C)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      </div>
                      <FormField control={form.control} name="targetSystemSize" render={({field}) => (<FormItem><FormLabel>حجم النظام المستهدف (kWp)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
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
                      تحليل طول السلسلة (الجهد)
                  </CardTitle>
                  <CardDescription>
                      هذه هي النتائج المحسوبة فيزيائياً لضمان سلامة وأداء جهد النظام.
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
                     <div className="flex items-start gap-4 border p-3 rounded-lg">
                          <ThermometerSnowflake className="h-8 w-8 text-blue-500 flex-shrink-0 mt-1" />
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
                     <div className="flex items-start gap-4 border p-3 rounded-lg">
                          <ThermometerSun className="h-8 w-8 text-orange-500 flex-shrink-0 mt-1" />
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
                    <AlertTitle>تحليل وتوصيات الخبير (AI) - تحليل الجهد</AlertTitle>
                    <AlertDescription className="mt-2 prose prose-sm max-w-none text-foreground/90">
                    {result.reasoning}
                    </AlertDescription>
                </Alert>

              {result.optimalPanels > 0 && (
                <>
                <Card>
                    <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <LayoutGrid />
                        تصميم المصفوفة الكاملة (التيار)
                    </CardTitle>
                    <CardDescription>
                        بناءً على حجم النظام المستهدف ({form.getValues('targetSystemSize')} kWp) والتكوين الأمثل للسلسلة ({result.optimalPanels} ألواح).
                    </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-3 text-center">
                             <div className="border p-3 rounded-lg"><div className="text-sm text-muted-foreground">إجمالي الألواح</div><div className="text-2xl font-bold">{result.arrayConfig.totalPanels}</div></div>
                             <div className="border p-3 rounded-lg"><div className="text-sm text-muted-foreground">سلاسل متوازية</div><div className="text-2xl font-bold">{result.arrayConfig.parallelStrings}</div></div>
                             <div className="border p-3 rounded-lg"><div className="text-sm text-muted-foreground">التيار الإجمالي</div><div className="text-2xl font-bold">{result.arrayConfig.totalCurrent} A</div></div>
                        </div>

                        {result.arrayConfig.isCurrentSafe ? (
                             <Alert variant="default" className="border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <AlertTitle className="font-bold">فحص سلامة التيار: آمن</AlertTitle>
                                <AlertDescription>
                                    التيار الإجمالي للمصفوفة ({result.arrayConfig.totalCurrent}A) أقل من الحد الأقصى لتيار العاكس ({form.getValues('inverterMaxCurrent')}A).
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle className="font-bold">فحص سلامة التيار: غير آمن!</AlertTitle>
                                <AlertDescription>
                                    التيار الإجمالي للمصفوفة ({result.arrayConfig.totalCurrent}A) **يتجاوز** الحد الأقصى لتيار العاكس ({form.getValues('inverterMaxCurrent')}A). قد يؤدي هذا إلى تلف العاكس. يوصى باستخدام عاكس بقدرة تيار أعلى أو تقليل عدد السلاسل المتوازية.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                       <CardTitle className="flex items-center gap-2">
                          <Sun className="text-primary"/>
                          عرض مرئي للمصفوفة
                       </CardTitle>
                    </CardHeader>
                    <CardContent>
                       <SystemVisualization 
                          panelsPerString={result.optimalPanels}
                          parallelStrings={result.arrayConfig.parallelStrings}
                          panelVoltage={form.getValues('vmp')}
                          panelCurrent={form.getValues('imp')}
                       />
                    </CardContent>
                </Card>


                <Button onClick={handleAddToReport} className="w-full">
                    <PlusCircle className="ml-2 h-4 w-4" />
                    أضف إلى التقرير
                </Button>
                </>
              )}
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
    </>
  );
}
