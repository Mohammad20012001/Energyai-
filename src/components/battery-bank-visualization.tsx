interface BatteryBankVisualizationProps {
  batteriesInSeries: number;
  parallelStrings: number;
  batteryVoltage: number;
  batteryCapacity: number;
  systemVoltage: number;
}

export function BatteryBankVisualization({
  batteriesInSeries,
  parallelStrings,
  batteryVoltage,
  batteryCapacity,
  systemVoltage,
}: BatteryBankVisualizationProps) {

  const batteries = Array.from({ length: batteriesInSeries });
  const strings = Array.from({ length: parallelStrings });


  if (batteriesInSeries > 8 || parallelStrings > 8) {
    return (
      <div className="text-center text-muted-foreground p-4 border rounded-md">
        العرض المرئي غير متاح للتكوينات الكبيرة جدًا.
        <div className="text-sm mt-2">
            ({parallelStrings} سلاسل x {batteriesInSeries} بطارية)
        </div>
      </div>
    );
  }

  const stringVoltage = batteriesInSeries * batteryVoltage;
  const totalCapacity = parallelStrings * batteryCapacity;

  return (
    <div className="space-y-8">
        {/* Step 1: Building the Series String */}
        <div>
            <h3 className="text-lg font-semibold text-center mb-4">الخطوة 1: بناء السلسلة (تحقيق الجهد)</h3>
            <div className="bg-muted/30 p-4 rounded-lg border relative">
                <div className="flex justify-center items-center gap-2">
                    {/* Connection line */}
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-accent/80 z-0"></div>

                    {batteries.map((_, batteryIndex) => (
                        <div key={batteryIndex} className="z-10 bg-background p-1 rounded-sm">
                             <div
                                className="w-16 h-10 bg-accent/80 rounded-md flex items-center justify-center text-accent-foreground shadow-sm relative"
                                title={`بطارية ${batteryVoltage}V / ${batteryCapacity}Ah`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M8 18H4V6h4"/><path d="M12 6v12"/><path d="M16 18h4V6h-4"/></svg>
                            </div>
                        </div>
                    ))}
                </div>
                 <p className="text-xs text-muted-foreground mt-4 text-center max-w-sm mx-auto">
                    للوصول إلى جهد النظام <span className="font-bold text-primary">{systemVoltage}V</span>، نقوم بتوصيل <span className="font-bold text-primary">{batteriesInSeries}</span> بطاريات (كل منها {batteryVoltage}V) على <span className="font-bold">التوالي</span>.
                 </p>
                 <div className="text-center mt-2 text-sm font-code bg-background/50 border rounded-md p-2 w-fit mx-auto">
                    نتيجة السلسلة الواحدة: <span className="font-bold text-accent-foreground">{stringVoltage}V / {batteryCapacity}Ah</span>
                 </div>
            </div>
        </div>

        {/* Step 2: Paralleling the Strings */}
        <div>
            <h3 className="text-lg font-semibold text-center mb-4">الخطوة 2: توصيل السلاسل (تحقيق السعة)</h3>
             <div className="bg-muted/30 p-4 rounded-lg border overflow-x-auto">
                 <div className="flex justify-center gap-4 min-w-max relative">
                    <div className="absolute top-2 left-0 w-full h-0.5 bg-red-500 z-0"></div>
                     <div className="absolute bottom-2 left-0 w-full h-0.5 bg-blue-500 z-0"></div>

                    {strings.map((_, stringIndex) => (
                    <div key={stringIndex} className="flex flex-col items-center gap-2 z-10">
                        <div className="font-code text-xs text-muted-foreground bg-background px-1">السلسلة {stringIndex + 1}</div>
                        <div className="relative">
                            <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-0.5 h-2 bg-red-500"></div>
                            <div className="flex flex-col gap-1 p-2 border-2 border-dashed border-accent/50 rounded-md bg-background/50">
                            {batteries.map((_, batteryIndex) => (
                                <div
                                key={batteryIndex}
                                className="w-16 h-10 bg-accent/80 rounded-md flex items-center justify-center text-accent-foreground shadow-sm"
                                >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M8 18H4V6h4"/><path d="M12 6v12"/><path d="M16 18h4V6h-4"/></svg>
                                </div>
                            ))}
                            </div>
                            <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-0.5 h-2 bg-blue-500"></div>
                        </div>
                    </div>
                    ))}
                </div>
                 <p className="text-xs text-muted-foreground mt-4 text-center max-w-md mx-auto">
                    للوصول إلى السعة المطلوبة <span className="font-bold text-primary">~{totalCapacity}Ah</span>، نقوم بتوصيل <span className="font-bold text-primary">{parallelStrings}</span> من هذه السلاسل على <span className="font-bold">التوازي</span>.
                 </p>
                 <div className="text-center mt-2 text-sm font-code bg-background/50 border rounded-md p-2 w-fit mx-auto">
                    النتيجة النهائية لبنك البطاريات: <span className="font-bold text-accent-foreground">{stringVoltage}V / {totalCapacity}Ah</span>
                 </div>
            </div>
        </div>
    </div>
  );
}
