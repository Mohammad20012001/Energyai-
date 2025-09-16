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
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {useToast} from '@/hooks/use-toast';
import {suggestStringConfigurationAction} from '@/app/actions/solar';
import {SystemVisualization} from '@/components/system-visualization';
import {Separator} from './ui/separator';
import {useReport} from '@/context/ReportContext';
import type {SuggestStringConfigurationOutput} from '@/ai/tool-schemas';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


const formSchema = z.object({
  panelVoltage: z.coerce
    .number({invalid_type_error: 'يجب أن يكون رقماً'})
    .positive('يجب أن تكون قيمة الجهد إيجابية'),
  panelCurrent: z.coerce
    .number({invalid_type_error: 'يجب أن يكون رقماً'})
    .positive('يجب أن تكون قيمة التيار إيجابية'),
  desiredVoltage: z.coerce
    .number({invalid_type_error: 'يجب أن يكون رقماً'})
    .positive('يجب أن تكون قيمة الجهد إيجابية'),
  desiredCurrent: z.coerce
    .number({invalid_type_error: 'يجب أن يكون رقماً'})
    .positive('يجب أن تكون قيمة التيار إيجابية'),
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
      panelVoltage: 24,
      panelCurrent: 9.5,
      desiredVoltage: 600,
      desiredCurrent: 38,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await suggestStringConfigurationAction(values);
      if (response.success) {
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
      type: 'تهيئة السلاسل',
      summary: `${result.panelsPerString} ألواح/سلسلة، ${result.parallelStrings} سلاسل متوازية.`,
      values: {
        'الألواح لكل سلسلة': `${result.panelsPerString} لوح`,
        'عدد السلاسل المتوازية': `${result.parallelStrings} سلاسل`,
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
          <CardTitle>معلمات النظام</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 text-right"
            >
              <fieldset disabled={isLoading} className="space-y-4">
                <FormField
                  control={form.control}
                  name="panelVoltage"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>جهد اللوح (فولت)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 24" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="panelCurrent"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>تيار اللوح (أمبير)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 9.5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="desiredVoltage"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>الجهد المطلوب للنظام (فولت)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 600" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="desiredCurrent"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel>التيار المطلوب للنظام (أمبير)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 38" {...field} />
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
                    اقترح التهيئة <ArrowRight className="mr-2 h-4 w-4" />
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
                <CardTitle>التهيئة المحسوبة (فيزيائياً)</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-2">
                <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-6">
                  <span className="text-4xl font-bold text-primary">
                    {result.panelsPerString}
                  </span>
                  <p className="text-muted-foreground mt-2 text-center">
                    لوح لكل سلسلة
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-6">
                  <span className="text-4xl font-bold text-primary">
                    {result.parallelStrings}
                  </span>
                  <p className="text-muted-foreground mt-2 text-center">
                    سلسلة متوازية
                  </p>
                </div>
              </CardContent>
            </Card>

            <Accordion type="single" collapsible defaultValue="item-1">
              <AccordionItem value="item-1">
                <AccordionTrigger className='font-semibold text-base flex items-center gap-2'>
                    <Lightbulb className="text-primary"/>
                    شرح الخبير (AI)
                </AccordionTrigger>
                <AccordionContent className="prose prose-sm max-w-none text-muted-foreground pt-2">
                  <p>{result.reasoning}</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className='font-semibold text-base flex items-center gap-2'>
                    <AlertTriangle className="text-destructive"/>
                     أخطاء شائعة يجب تجنبها
                </AccordionTrigger>
                <AccordionContent className="text-sm pt-2">
                   <p className="whitespace-pre-wrap font-code">{result.commonWiringErrors}</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>


            <Button onClick={handleAddToReport} className="w-full">
              <PlusCircle className="ml-2 h-4 w-4" />
              أضف إلى التقرير
            </Button>

            <Separator />

            <Card>
              <CardHeader>
                <CardTitle>عرض مرئي للنظام</CardTitle>
              </CardHeader>
              <CardContent>
                <SystemVisualization
                  panelsPerString={result.panelsPerString}
                  parallelStrings={result.parallelStrings}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {!isLoading && !result && (
          <Card className="flex flex-col items-center justify-center text-center p-8 lg:min-h-[400px]">
            <CardHeader>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Sun className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="mt-4">جاهز لخطتك الشمسية؟</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground max-w-md">
                أدخل معلمات نظامك على اليمين ودع مهندسنا الذكي يصمم لك التهيئة
                المثلى.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
