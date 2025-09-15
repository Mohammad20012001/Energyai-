"use client";

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, PlusCircle } from 'lucide-react';
import { FormControl, FormField } from '@/components/ui/form';
import type { Control, FieldArrayWithId, UseFieldArrayAppend, UseFieldArrayRemove } from 'react-hook-form';

interface Appliance {
  name: string;
  power: number;
  quantity: number;
  hours: number;
}

interface ApplianceLoadCalculatorProps {
    control: Control<any>;
    fields: FieldArrayWithId<any, "appliances", "id">[];
    append: UseFieldArrayAppend<any, "appliances">;
    remove: UseFieldArrayRemove;
    appliances: Appliance[] | undefined;
}

const commonAppliances = [
    { name: 'ثلاجة', power: 150 },
    { name: 'تلفزيون', power: 100 },
    { name: 'مكيف هواء (1 طن)', power: 1200 },
    { name: 'غسالة', power: 500 },
    { name: 'إضاءة LED', power: 10 },
    { name: 'مروحة سقف', power: 75 },
    { name: 'شاحن لابتوب', power: 65 },
    { name: 'شاحن هاتف', power: 10 },
    { name: 'ميكروويف', power: 1000 },
    { name: 'مضخة مياه', power: 750 },
];

export function ApplianceLoadCalculator({ control, fields, append, remove, appliances }: ApplianceLoadCalculatorProps) {
    const [selectedAppliance, setSelectedAppliance] = React.useState('');

    const totalDailyLoadKwh = useMemo(() => {
        if (!appliances) return 0;
        return appliances.reduce((total, appliance) => {
            const { power = 0, quantity = 0, hours = 0 } = appliance;
            if (power > 0 && quantity > 0 && hours > 0) {
                return total + (power * quantity * hours) / 1000;
            }
            return total;
        }, 0);
    }, [appliances]);


    const handleAddAppliance = () => {
        const applianceData = commonAppliances.find(app => app.name === selectedAppliance);
        append({
            name: applianceData?.name || 'جهاز جديد',
            power: applianceData?.power || 100,
            quantity: 1,
            hours: 1,
        });
        setSelectedAppliance(''); // Reset select
    };

    return (
        <div className="space-y-4 p-4 border rounded-md bg-muted/30">
            <div className="flex items-center gap-2">
                <Select onValueChange={setSelectedAppliance} value={selectedAppliance}>
                    <SelectTrigger>
                        <SelectValue placeholder="اختر جهازًا شائعًا..." />
                    </SelectTrigger>
                    <SelectContent>
                        {commonAppliances.map(app => (
                            <SelectItem key={app.name} value={app.name}>{app.name} ({app.power} واط)</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button type="button" size="sm" onClick={handleAddAppliance} disabled={!selectedAppliance}>
                    <PlusCircle className="ml-1 h-4 w-4" />
                    إضافة
                </Button>
            </div>
            
            <div className="max-h-60 overflow-y-auto pr-2 border-t border-b py-2">
                {fields.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-1/3 pr-1">الجهاز</TableHead>
                                <TableHead className="px-1">القدرة</TableHead>
                                <TableHead className="px-1">الكمية</TableHead>
                                <TableHead className="px-1">الساعات</TableHead>
                                <TableHead className="pl-1"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fields.map((field, index) => (
                                <TableRow key={field.id}>
                                    <TableCell className="pr-1 py-1">
                                        <FormField
                                            control={control}
                                            name={`appliances.${index}.name`}
                                            render={({ field }) => (
                                            <FormControl>
                                                <Input {...field} className="h-8"/>
                                            </FormControl>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell className="px-1 py-1">
                                        <FormField
                                            control={control}
                                            name={`appliances.${index}.power`}
                                            render={({ field }) => (
                                            <FormControl>
                                                <Input type="number" {...field} className="h-8 w-20"/>
                                            </FormControl>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell className="px-1 py-1">
                                        <FormField
                                            control={control}
                                            name={`appliances.${index}.quantity`}
                                            render={({ field }) => (
                                            <FormControl>
                                                <Input type="number" {...field} className="h-8 w-16"/>
                                            </FormControl>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell className="px-1 py-1">
                                        <FormField
                                            control={control}
                                            name={`appliances.${index}.hours`}
                                            render={({ field }) => (
                                            <FormControl>
                                                <Input type="number" {...field} className="h-8 w-16"/>
                                            </FormControl>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell className="pl-1 py-1">
                                        <Button variant="ghost" size="icon" onClick={() => remove(index)} className="h-8 w-8" type="button">
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <p className="text-center text-sm text-muted-foreground py-4">لم تتم إضافة أي أجهزة بعد.</p>
                )}
            </div>
            
             <div className="flex justify-between items-center bg-background p-3 rounded-md">
                <div className="text-sm font-bold">إجمالي الحمل اليومي المحسوب:</div>
                <div className="text-lg font-bold text-primary">{totalDailyLoadKwh.toFixed(2)} kWh</div>
            </div>
             <p className="text-xs text-muted-foreground text-center">
                ملاحظة: لحساب بنك البطاريات، سيتم استخدام إجمالي الحمل من هذه القائمة (إذا لم تكن فارغة)، أو القيمة المدخلة يدويًا في حقل "إجمالي الأحمال اليومية".
            </p>
        </div>
    );
}
