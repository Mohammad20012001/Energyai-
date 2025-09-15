
"use client";

import { useState, useRef } from 'react';
import { z } from "zod";
import Image from 'next/image';
import { Camera, FileImage, ArrowRight, Loader2, AlertTriangle, Wind, Droplets, Hammer, Sparkles, CheckCircle, HelpCircle, X, PlusCircle, Wrench, MessageCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { type InspectionResult } from '@/ai/tool-schemas';
import { Badge } from '@/components/ui/badge';


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
    const [previews, setPreviews] = useState<string[]>([]);
    const [lastError, setLastError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // Feature is disabled temporarily
    const featureEnabled = false;


    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">المفتش الميداني الذكي</h1>
                <p className="text-muted-foreground mt-2">
                    ارفع صورة أو أكثر لمصفوفة الألواح الشمسية واحصل على تحليل فوري للمشاكل المحتملة في الموقع.
                </p>
            </div>

            {!featureEnabled ? (
                 <Alert variant="destructive" className="border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
                    <Wrench className="h-4 w-4 text-yellow-500" />
                    <AlertTitle className="font-bold">الميزة قيد الصيانة المؤقتة</AlertTitle>
                    <AlertDescription className="mt-2">
                        <p>نواجه حاليًا ضغطًا شديدًا وغير متوقع على نماذج الذكاء الاصطناعي لتحليل الصور، مما يجعل هذه الميزة غير متاحة بشكل موثوق.</p>
                        <p className="mt-2">نحن نعتذر عن هذا الإزعاج ونعمل على إيجاد حل دائم. في هذه الأثناء، يمكنك استخدام "المساعد الذكي" لوصف المشاكل التي تراها والحصول على استشارة.</p>
                    </AlertDescription>
                    <div className="mt-4">
                        <Button asChild variant="outline" className="border-yellow-500/50 hover:bg-yellow-500/20">
                            <Link href="/chat">
                                <MessageCircle className="ml-2 h-4 w-4" />
                                اذهب إلى المساعد الذكي
                            </Link>
                        </Button>
                    </div>
                </Alert>
            ) : (
                <div className="grid gap-8 lg:grid-cols-5">
                    <Card className="lg:col-span-2 h-fit">
                        <CardHeader>
                            <CardTitle>رفع صور الألواح</CardTitle>
                            <CardDescription>اختر صورًا واضحة من زوايا مختلفة للموقع.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           {/* Form is disabled */}
                        </CardContent>
                    </Card>

                    <div className="lg:col-span-3">
                         {/* Results section is hidden */}
                    </div>
                </div>
            )}
        </div>
    );
}
