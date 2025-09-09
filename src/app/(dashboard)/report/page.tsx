"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Copy, Trash2 } from "lucide-react";
import { useReport } from "@/context/ReportContext";
import { useToast } from "@/hooks/use-toast";


export default function ReportPage() {
  const { reportCards, removeReportCard } = useReport();
  const { toast } = useToast();

  const handleExport = () => {
    if (reportCards.length === 0) {
        toast({
            variant: "destructive",
            title: "التقرير فارغ",
            description: "لا يوجد شيء لتصديره. أضف بعض البطاقات أولاً.",
        });
        return;
    }

    const reportTitle = "ملخص تقرير نظام الطاقة الشمسية";
    const separator = "=".repeat(reportTitle.length);

    const reportString = reportCards.map(card => {
        const values = Object.entries(card.values)
            .map(([key, value]) => `- ${key}: ${value}`)
            .join("\n");
        return `## ${card.type} ##\n${card.summary}\n${values}`;
    }).join("\n\n" + "-".repeat(30) + "\n\n");
    
    const fullReport = `${reportTitle}\n${separator}\n\n${reportString}`;

    navigator.clipboard.writeText(fullReport).then(() => {
        toast({
            title: "تم النسخ بنجاح",
            description: "تم نسخ التقرير إلى الحافظة الخاصة بك.",
        });
    }, (err) => {
        console.error('Could not copy text: ', err);
        toast({
            variant: "destructive",
            title: "فشل النسخ",
            description: "لم نتمكن من نسخ التقرير. يرجى المحاولة مرة أخرى.",
        });
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">تقرير النظام الشامل</h1>
        <p className="text-muted-foreground mt-2">
          هنا يمكنك تجميع كل الحسابات والنصائح في تقرير واحد متكامل.
        </p>
      </div>

        {reportCards.length === 0 ? (
            <Card className="flex flex-col items-center justify-center text-center p-8 lg:min-h-[400px] border-dashed">
                <CardHeader>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <FileText className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="mt-4">تقريرك فارغ حالياً</CardTitle>
                </CardHeader>
                <CardContent>
                <p className="text-muted-foreground max-w-md">
                    اذهب إلى أي من الحاسبات، و بعد إجراء الحساب، اضغط على زر "أضف إلى التقرير" لتجميع النتائج هنا.
                </p>
                </CardContent>
            </Card>
        ) : (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-semibold">بطاقات المعلومات المحفوظة</h2>
                    <Button variant="outline" onClick={handleExport} disabled={reportCards.length === 0}>
                        <Copy className="ml-2 h-4 w-4" />
                        نسخ التقرير إلى الحافظة
                    </Button>
                </div>
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {reportCards.map(report => (
                        <Card key={report.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="text-lg">{report.type}</CardTitle>
                                <CardDescription>{report.summary}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <dl className="space-y-2 text-sm">
                                    {Object.entries(report.values).map(([key, value]) => (
                                        <div key={key} className="flex justify-between">
                                            <dt className="text-muted-foreground">{key}:</dt>
                                            <dd className="font-medium text-right">{value}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </CardContent>
                             <div className="p-4 pt-0 mt-auto">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => removeReportCard(report.id)}
                                >
                                    <Trash2 className="ml-2 h-4 w-4" />
                                    إزالة
                                </Button>
                            </div>
                        </Card>
                    ))}
                 </div>
            </div>
        )}
    </div>
  );
}
