
"use client";

import { useState, useRef } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Image from 'next/image';
import { Camera, FileImage, ArrowRight, Loader2, AlertTriangle, Wind, Droplets, Hammer, Sparkles, CheckCircle, HelpCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { inspectPanelArray } from '@/ai/flows/inspect-panel-array';
import { type InspectionResult } from '@/ai/tool-schemas';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';


const formSchema = z.object({
  panelImage: z.string().min(1, "الرجاء رفع صورة."),
});

type FormValues = z.infer<typeof formSchema>;

const IssueIcon = ({ category }: { category: string }) => {
    switch (category) {
        case 'soiling': return <Droplets className="h-5 w-5 text-amber-600" />;
        case 'shading': return <Wind className="h-5 w-5 text-blue-600" />;
        case 'damage': return <Hammer className="h-5 w-5 text-red-600" />;
        case 'installation': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
        default: return <HelpCircle className="h-5 w-5 text-muted-foreground" />;
    }
};

const getIssueSeverityVariant = (severity: 'Low' | 'Medium' | 'High' | 'Critical'): "default" | "secondary" | "destructive" => {
    switch (severity) {
        case 'Low': return 'secondary';
        case 'Medium': return 'default';
        case 'High': return 'destructive';
        case 'Critical': return 'destructive';
        default: return 'secondary';
    }
};

export default function FieldInspectorPage() {
    const [result, setResult] = useState<InspectionResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            panelImage: "",
        },
    });

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 4 * 1024 * 1024) { // 4MB limit
                toast({
                    variant: "destructive",
                    title: "حجم الصورة كبير جدًا",
                    description: "الرجاء رفع صورة بحجم أقل من 4 ميجابايت.",
                });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                setPreview(dataUrl);
                form.setValue('panelImage', dataUrl, { shouldValidate: true });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleTriggerUpload = () => {
        fileInputRef.current?.click();
    };

    async function onSubmit(values: FormValues) {
        setIsLoading(true);
        setResult(null);
        try {
            const response = await inspectPanelArray({ photoDataUri: values.panelImage });
            setResult(response);
            toast({
                title: "اكتمل التحليل",
                description: `تم تحديد ${response.issues.length} مشكلة محتملة.`,
            });
        } catch (error) {
            console.error("Error fetching panel inspection:", error);
            toast({
                variant: "destructive",
                title: "خطأ في التحليل",
                description: "فشل في تحليل الصورة. يرجى المحاولة بصورة مختلفة أو التحقق من اتصالك.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    const overallScore = result?.overallHealthScore ?? 0;
    const scoreColor = overallScore > 80 ? "text-green-500" : overallScore > 50 ? "text-yellow-500" : "text-red-500";


    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">المفتش الميداني الذكي</h1>
                <p className="text-muted-foreground mt-2">
                    ارفع صورة لمصفوفة الألواح الشمسية واحصل على تحليل فوري للمشاكل المحتملة في الموقع.
                </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-5">
                <Card className="lg:col-span-2 h-fit">
                    <CardHeader>
                        <CardTitle>رفع صورة الألواح</CardTitle>
                        <CardDescription>اختر صورة واضحة من الموقع للتحليل.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 text-right">
                                <FormField
                                    control={form.control}
                                    name="panelImage"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <>
                                                    <input
                                                        type="file"
                                                        accept="image/png, image/jpeg, image/webp"
                                                        ref={fileInputRef}
                                                        onChange={handleFileChange}
                                                        className="hidden"
                                                        disabled={isLoading}
                                                    />
                                                    <div 
                                                        className="w-full aspect-video rounded-md border-2 border-dashed border-input flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                                                        onClick={handleTriggerUpload}
                                                    >
                                                        {preview ? (
                                                            <Image src={preview} alt="Preview" width={400} height={225} className="object-contain w-full h-full rounded-md" />
                                                        ) : (
                                                            <div className="text-center text-muted-foreground p-4">
                                                                <FileImage className="h-12 w-12 mx-auto mb-2" />
                                                                <p className="font-semibold">انقر هنا لرفع صورة</p>
                                                                <p className="text-xs mt-1">PNG, JPG, WEBP (بحد أقصى 4 ميجابايت)</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={isLoading || !preview} className="w-full">
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                            ...جاري تحليل الصورة
                                        </>
                                    ) : (
                                        <>
                                            افحص الآن <ArrowRight className="mr-2 h-4 w-4" />
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
                                <Camera className="h-12 w-12 animate-pulse" />
                                <p>...يقوم الذكاء الاصطناعي بفحص كل بكسل في الصورة</p>
                            </div>
                        </Card>
                    )}

                    {result && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>ملخص تقرير الفحص</CardTitle>
                                    <CardDescription>{result.overallAssessment}</CardDescription>
                                </CardHeader>
                                <CardContent className="text-center">
                                    <div className="relative mx-auto h-32 w-32">
                                        <svg className="h-full w-full" viewBox="0 0 36 36">
                                            <path
                                                className="stroke-current text-muted/30"
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                strokeWidth="3"
                                            />
                                            <path
                                                className={`stroke-current ${scoreColor}`}
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                strokeWidth="3"
                                                strokeDasharray={`${overallScore}, 100`}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className={`text-4xl font-bold ${scoreColor}`}>{overallScore}</span>
                                            <span className="text-sm text-muted-foreground">/ 100</span>
                                        </div>
                                    </div>
                                    <p className="mt-2 font-semibold">مؤشر الصحة العامة للنظام</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>المشاكل المكتشفة وتوصيات الصيانة</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {result.issues.length > 0 ? (
                                        <div className="space-y-4">
                                            {result.issues.map((issue, index) => (
                                                <div key={index} className="border p-4 rounded-md">
                                                    <div className="flex items-start gap-4">
                                                        <IssueIcon category={issue.category} />
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <h4 className="font-semibold">{issue.description}</h4>
                                                                <Badge variant={getIssueSeverityVariant(issue.severity)}>{issue.severity}</Badge>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground">{issue.recommendation}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <Alert className="border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            <AlertTitle>لا توجد مشاكل واضحة</AlertTitle>
                                            <AlertDescription>
                                                بناءً على تحليل الصورة، يبدو النظام في حالة ممتازة.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {!isLoading && !result && (
                        <Alert>
                            <Sparkles className="h-4 w-4" />
                            <AlertTitle>جاهز للفحص الذكي</AlertTitle>
                            <AlertDescription>
                                ارفع صورة واضحة للألواح الشمسية ودع مهندسنا الذكي يقوم بالباقي، ليكشف لك عن أي مشاكل خفية في الموقع.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
            </div>
        </div>
    );
}
