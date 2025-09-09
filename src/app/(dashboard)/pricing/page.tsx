
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

const pricingData = {
  panels: [
    { model: "Trina Solar 550W", price: "90 - 105 دينار", unit: "للوح" },
    { model: "Jinko Solar 545W", price: "88 - 102 دينار", unit: "للوح" },
    { model: "LONGi Solar 540W", price: "85 - 100 دينار", unit: "للوح" },
  ],
  inverters: [
    { model: "Huawei 5KTL", price: "600 - 700 دينار", unit: "للقطعة" },
    { model: "SMA Sunny Boy 5.0", price: "750 - 850 دينار", unit: "للقطعة" },
    { model: "Solis 10K 3-Phase", price: "900 - 1050 دينار", unit: "للقطعة" },
  ],
  batteries: [
    { model: "Pylontech US2000 2.4kWh", price: "450 - 550 دينار", unit: "للبطارية" },
    { model: "LG Chem RESU 10H", price: "2800 - 3200 دينار", unit: "للبطارية" },
    { model: "Narada 12V 200Ah", price: "200 - 240 دينار", unit: "للبطارية" },
  ],
  structures: [
    { model: "هيكل تثبيت ألومنيوم", price: "15 - 25 دينار", unit: "للكيلوواط" },
    { model: "هيكل تثبيت حديد مجلفن", price: "10 - 18 دينار", unit: "للكيلوواط" },
  ],
};

export default function PricingPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">بيانات التسعير في السوق الأردني</h1>
        <p className="text-muted-foreground mt-2">
          أسعار تقديرية لأهم مكونات أنظمة الطاقة الشمسية في الأردن.
        </p>
      </div>
      
      <Card>
        <CardHeader>
           <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>قائمة الأسعار التقديرية</CardTitle>
              <CardDescription>الأسعار قد تختلف بناءً على المورد والكمية وتاريخ الشراء.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">الألواح الشمسية</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الموديل/النوع</TableHead>
                    <TableHead className="text-center">السعر التقديري</TableHead>
                    <TableHead className="text-left">الوحدة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricingData.panels.map((item) => (
                    <TableRow key={item.model}>
                      <TableCell className="font-medium">{item.model}</TableCell>
                      <TableCell className="text-center">{item.price}</TableCell>
                      <TableCell className="text-left">{item.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">العاكسات (Inverters)</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الموديل/النوع</TableHead>
                    <TableHead className="text-center">السعر التقديري</TableHead>
                    <TableHead className="text-left">الوحدة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricingData.inverters.map((item) => (
                    <TableRow key={item.model}>
                      <TableCell className="font-medium">{item.model}</TableCell>
                      <TableCell className="text-center">{item.price}</TableCell>
                      <TableCell className="text-left">{item.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">البطاريات</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الموديل/النوع</TableHead>
                    <TableHead className="text-center">السعر التقديري</TableHead>
                    <TableHead className="text-left">الوحدة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricingData.batteries.map((item) => (
                    <TableRow key={item.model}>
                      <TableCell className="font-medium">{item.model}</TableCell>
                      <TableCell className="text-center">{item.price}</TableCell>
                      <TableCell className="text-left">{item.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">هياكل التثبيت</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الموديل/النوع</TableHead>
                    <TableHead className="text-center">السعر التقديري</TableHead>
                    <TableHead className="text-left">الوحدة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricingData.structures.map((item) => (
                    <TableRow key={item.model}>
                      <TableCell className="font-medium">{item.model}</TableCell>
                      <TableCell className="text-center">{item.price}</TableCell>
                      <TableCell className="text-left">{item.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <p className="text-xs text-muted-foreground text-center">
        * إخلاء مسؤولية: هذه الأسعار هي لأغراض تقديرية فقط وقد لا تعكس الأسعار الحقيقية في السوق.
      </p>
    </div>
  );
}
