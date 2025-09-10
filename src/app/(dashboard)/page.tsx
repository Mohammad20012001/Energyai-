"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Settings, Calculator, Zap, Maximize, TrendingUp, DollarSign, FileText, BatteryCharging, Wind } from "lucide-react";

export default function DashboardOverviewPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">أهلاً بك في مهندس الطاقة الشمسية الأردني</h1>
        <p className="text-muted-foreground mt-2">الأداة الشاملة لتصميم أنظمة الطاقة الشمسية في الأردن.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wind className="text-primary" />
              المحاكاة الحية للأداء
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              أنشئ توأمًا رقميًا لنظامك وشاهد أداءه لحظة بلحظة.
            </p>
            <Button asChild>
              <Link href="/live-simulation">
                ابدأ المحاكاة <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="text-primary" />
              تهيئة السلاسل بالذكاء الاصطناعي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              استخدم الذكاء الاصطناعي لتحديد أفضل تهيئة لسلاسل الألواح وتجنب الأخطاء الشائعة.
            </p>
            <Button asChild>
              <Link href="/string-configuration">
                ابدأ الحساب <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="text-primary" />
              حاسبة الألواح (حسب الاستهلاك)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              احسب عدد الألواح المثالي بناءً على فاتورة الكهرباء واحتياجاتك من الطاقة.
            </p>
            <Button asChild>
              <Link href="/panel-calculator">
                اذهب للحاسبة <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Maximize className="text-primary" />
              حاسبة المساحة والإنتاج
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              قدّر عدد الألواح التي يمكن وضعها في أرضك وكمية الطاقة التي يمكن إنتاجها.
            </p>
            <Button asChild>
              <Link href="/area-calculator">
                اذهب للحاسبة <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="text-primary" />
              حاسبة الجدوى الاقتصادية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              حلل العائد على الاستثمار في الطاقة الشمسية وفترة استرداد رأس المال.
            </p>
            <Button asChild>
              <Link href="/financial-viability">
                حلل الآن <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="text-primary" />
              حاسبة مقطع السلك
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              حدد مقاطع الأسلاك المناسبة لتحقيق أقصى كفاءة وأمان.
            </p>
            <Button asChild>
              <Link href="/wire-sizing">
                اذهب للحاسبة <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BatteryCharging className="text-primary" />
              أداة تحديد حجم العاكس
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              اختر العاكس الأنسب لمصفوفة الطاقة الشمسية لديك لضمان أقصى أداء وأمان.
            </p>
            <Button asChild>
              <Link href="/inverter-sizing">
                اختر الآن <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="text-primary" />
              بيانات التسعير
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              اطلع على أسعار تقديرية لمكونات أنظمة الطاقة الشمسية في السوق الأردني.
            </p>
            <Button asChild>
              <Link href="/pricing">
                عرض الأسعار <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="text-primary" />
              التقرير الشامل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              جمع نتائجك من جميع الحاسبات في تقرير واحد متكامل.
            </p>
            <Button asChild>
              <Link href="/report">
                عرض التقرير <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
