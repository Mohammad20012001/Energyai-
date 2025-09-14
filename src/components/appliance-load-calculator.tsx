"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, PlusCircle } from 'lucide-react';
import { Form, FormControl, FormField } from '@/components/ui/form';

interface ApplianceLoadCalculatorProps {
    onTotalLoadChange: (totalKwh: number) => void;
}

const applianceSchema = z.object({
    name: z.string().min(1, "اسم الجهاز مطلوب"),
    power: z.coerce.number().positive("القدرة يجب أن تكون موجبة"),
    quantity: z.coerce.number().int().min(1, "الكمية يجب أن تكون 1 على الأقل"),
    hours: z.coerce.number().min(0.1, "ساعات التشغيل يجب أن تكون موجبة").max(24, "لا يمكن أن تتجاوز 24 ساعة"),
});

type Appliance = z.infer<typeof applianceSchema>;

const formSchema = z.object({
    appliances: z.array(applianceSchema),
});

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

export function ApplianceLoadCalculator({ onTotalLoadChange }: ApplianceLoadCalculatorProps) {
    const [selectedAppliance, setSelectedAppliance] = useState('');

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            appliances: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "appliances",
    });

    const watchedAppliances = form.watch('appliances');

    const totalDailyLoadKwh = useMemo(() => {
        return watchedAppliances.reduce((total, appliance) => {
            if (appliance.power > 0 && appliance.quantity > 0 && appliance.hours > 0) {
                return total + (appliance.power * appliance.quantity * appliance.hours) / 1000;
            }
            return total;
        }, 0);
    }, [watchedAppliances]);

    useEffect(() => {
        onTotalLoadChange(totalDailyLoadKwh);
    }, [totalDailyLoadKwh, onTotalLoadChange]);

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
                <Button size="sm" onClick={handleAddAppliance} disabled={!selectedAppliance}>
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
                                        control={form.control}
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
                                        control={form.control}
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
                                        control={form.control}
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
                                        control={form.control}
                                        name={`appliances.${index}.hours`}
                                        render={({ field }) => (
                                          <FormControl>
                                            <Input type="number" {...field} className="h-8 w-16"/>
                                          </FormControl>
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" onClick={() => remove(index)} className="h-8 w-8">
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            
            <div className="flex justify-between items-center bg-background p-3 rounded-md">
                <div className="text-sm font-bold">إجمالي الحمل اليومي المقدر:</div>
                <div className="text-lg font-bold text-primary">{totalDailyLoadKwh.toFixed(2)} kWh</div>
            </div>
        </div>
    );
}