interface BatteryBankVisualizationProps {
  batteriesInSeries: number;
  parallelStrings: number;
}

export function BatteryBankVisualization({
  batteriesInSeries,
  parallelStrings,
}: BatteryBankVisualizationProps) {
  const strings = Array.from({ length: parallelStrings });
  const batteries = Array.from({ length: batteriesInSeries });

  if (batteriesInSeries > 12 || parallelStrings > 12) {
    return (
      <div className="text-center text-muted-foreground p-4 border rounded-md">
        العرض المرئي غير متاح للتكوينات الكبيرة جدًا.
      </div>
    );
  }

  return (
    <div className="bg-muted/30 p-4 rounded-lg border overflow-x-auto">
      <div className="flex justify-center gap-4 min-w-max">
        {strings.map((_, stringIndex) => (
          <div key={stringIndex} className="flex flex-col items-center gap-2">
            <div className="font-code text-xs text-muted-foreground">السلسلة {stringIndex + 1}</div>
            <div className="flex flex-col gap-2 p-2 border-2 border-dashed border-accent/50 rounded-md bg-background/50">
              {batteries.map((_, batteryIndex) => (
                <div
                  key={batteryIndex}
                  className="w-20 h-12 bg-accent/80 rounded-md flex items-center justify-center text-accent-foreground shadow-sm relative"
                  title={`البطارية ${batteryIndex + 1}`}
                >
                  <div className="absolute top-1 left-1 h-2 w-2 rounded-full bg-card/50 border border-card-foreground/20"></div>
                  <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-card/50 border border-card-foreground/20"></div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M8 18H4V6h4"/><path d="M12 6v12"/><path d="M16 18h4V6h-4"/></svg>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="text-center mt-4 text-xs text-muted-foreground font-code">
        يعرض {parallelStrings} {parallelStrings > 2 ? 'سلاسل' : 'سلسلتين'} على التوازي، كل منها تحتوي على {batteriesInSeries} {batteriesInSeries > 2 ? 'بطاريات' : 'بطاريتين'} موصولة على التوالي.
      </div>
    </div>
  );
}
