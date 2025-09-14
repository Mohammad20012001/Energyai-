"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, PlusCircle } from 'lucide-react';
import { FormControl, FormField } from '@/components/ui/form';
import type { Control, FieldArrayWithId, UseFieldArrayAppend, UseFieldArrayRemove } from 'react-hook-form';

interface ApplianceLoadCalculatorProps {
    onTotalLoadChange: (totalKwh: number) => void;
    control: Control<any>;
    fields: FieldArrayWithId<any, "appliances", "id">[];
    append: UseFieldArrayAppend<any, "appliances">;
    remove: UseFieldArrayRemove;
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

export function ApplianceLoadCalculator({ onTotalLoadChange, control, fields, append, remove }: ApplianceLoadCalculatorProps) {
    const [selectedAppliance, setSelectedAppliance] = useState('');

    const totalDailyLoadKwh = useMemo(() => {
        return fields.reduce((total: number, field: any, index: number) => {
             // We can't use watch here, so we have to access the form's internal values
             // This is not ideal, but it's a workaround for the infinite loop issue.
             // A better solution might involve passing the entire form object.
             // For now, this calculation is for display only.
            const power = field.power || 0;
            const quantity = field.quantity || 0;
            const hours = field.hours || 0;
            
            if (power > 0 && quantity > 0 && hours > 0) {
                return total + (power * quantity * hours) / 1000;
            }
            return total;
        }, 0);
    }, [fields]);


    const handleAddAppliance = () => {
        const applianceData = commonAppliances.find(app => app.name === selectedAppliance);
        append({
            name: applianceData?.name || 'جهاز جديد',
            power: applianceData?.power || 100,
            quantity: 1,
            hours: 1,
        });
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
            
            <div className="max-h-60 overflow-y-auto pr-2">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-1/3">الجهاز</TableHead>
                            <TableHead>القدرة</TableHead>
                            <TableHead>الكمية</TableHead>
                            <TableHead>الساعات</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fields.map((field, index) => (
                            <TableRow key={field.id}>
                                <TableCell>
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
                                 <TableCell>
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
                                <TableCell>
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
                                <TableCell>
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
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => remove(index)} className="h-8 w-8" type="button">
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            
             <div className="flex justify-between items-center bg-background p-3 rounded-md">
                <div className="text-sm font-bold">إجمالي الحمل اليومي المقدر (للعرض فقط):</div>
                <div className="text-lg font-bold text-primary">{totalDailyLoadKwh.toFixed(2)} kWh</div>
            </div>
             <p className="text-xs text-muted-foreground p-2">
                ملاحظة: هذا الإجمالي للعرض فقط. يجب إدخال القيمة النهائية في حقل "إجمالي الأحمال اليومية" أعلاه ليتم استخدامها في الحساب الرئيسي.
            </p>
        </div>
    );
}
