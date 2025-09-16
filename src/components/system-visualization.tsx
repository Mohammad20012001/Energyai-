
interface SystemVisualizationProps {
  panelsPerString: number;
  parallelStrings: number;
  panelVoltage: number;
  panelCurrent: number;
}

// A smart component to render a row of panels.
// It will either render all panels if the count is low, or an abbreviated view if it's high.
function PanelString({ count, voltage, current }: { count: number; voltage: number; current: number; }) {
  const MAX_PANELS_TO_DRAW = 8;

  if (count <= MAX_PANELS_TO_DRAW) {
    // Render all panels if count is small
    return (
      <>
        {Array.from({ length: count }).map((_, panelIndex) => (
          <div key={panelIndex} className="z-10 bg-background p-1 rounded-sm">
            <div
              className="w-16 h-10 bg-accent/80 rounded flex items-center justify-center text-accent-foreground shadow-sm relative"
              title={`لوح ${voltage}V / ${current}A`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z" /><path d="M4 10h16" /><path d="M10 4v16" /></svg>
            </div>
          </div>
        ))}
      </>
    );
  } else {
    // Render an abbreviated view for large counts
    return (
      <>
        {/* First Panel */}
        <div className="z-10 bg-background p-1 rounded-sm">
            <div className="w-16 h-10 bg-accent/80 rounded flex items-center justify-center text-accent-foreground shadow-sm" title={`لوح ${voltage}V / ${current}A`}>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z" /><path d="M4 10h16" /><path d="M10 4v16" /></svg>
            </div>
        </div>
        
        {/* Ellipsis */}
        <div className="z-10 flex items-center justify-center h-10 text-muted-foreground font-bold text-2xl px-2">...</div>

        {/* Last Panel */}
        <div className="z-10 bg-background p-1 rounded-sm relative">
             <div className="absolute -top-5 right-0 text-xs text-muted-foreground font-code"># {count}</div>
            <div className="w-16 h-10 bg-accent/80 rounded flex items-center justify-center text-accent-foreground shadow-sm" title={`لوح ${voltage}V / ${current}A`}>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z" /><path d="M4 10h16" /><path d="M10 4v16" /></svg>
            </div>
        </div>
      </>
    );
  }
}


export function SystemVisualization({
  panelsPerString,
  parallelStrings,
  panelVoltage,
  panelCurrent,
}: SystemVisualizationProps) {

  const strings = Array.from({ length: parallelStrings });

  const stringVoltage = (panelsPerString * panelVoltage);
  const totalSystemCurrent = (parallelStrings * panelCurrent);

  return (
    <div className="space-y-8">
        {/* Step 1: Building the Series String */}
        <div>
            <h3 className="text-lg font-semibold text-center mb-4">الخطوة 1: بناء السلسلة (توصيل التوالي لرفع الجهد)</h3>
            <div className="bg-muted/30 p-4 rounded-lg border overflow-x-auto">
                <div className="flex justify-center items-center gap-2 min-w-max relative">
                    {/* Connection line */}
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-accent/80 z-0"></div>
                    <PanelString count={panelsPerString} voltage={panelVoltage} current={panelCurrent} />
                </div>
                 <p className="text-xs text-muted-foreground mt-4 text-center">
                    للوصول إلى الجهد المطلوب، نقوم بتوصيل <span className="font-bold text-primary">{panelsPerString}</span> ألواح على <span className="font-bold">التوالي</span>. هذا يجمع الجهد (V) ويبقي التيار (A) ثابتًا.
                 </p>
                 <div className="text-center mt-2 text-sm font-code bg-background/50 border rounded-md p-2 w-fit mx-auto">
                    نتيجة السلسلة الواحدة: <span className="font-bold text-accent-foreground">{stringVoltage.toFixed(1)}V / {panelCurrent.toFixed(1)}A</span>
                 </div>
            </div>
        </div>

        {/* Step 2: Paralleling the Strings */}
        <div>
            <h3 className="text-lg font-semibold text-center mb-4">الخطوة 2: بناء المصفوفة (توصيل التوازي لرفع التيار)</h3>
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
                                <PanelString count={panelsPerString} voltage={panelVoltage} current={panelCurrent} />
                            </div>
                            <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-0.5 h-2 bg-blue-500"></div>
                        </div>
                    </div>
                    ))}
                </div>
                 <p className="text-xs text-muted-foreground mt-4 text-center">
                    للوصول إلى التيار المطلوب، نقوم بتوصيل <span className="font-bold text-primary">{parallelStrings}</span> سلاسل على <span className="font-bold">التوازي</span>. هذا يجمع التيار (A) ويبقي الجهد (V) ثابتًا.
                 </p>
                 <div className="text-center mt-2 text-sm font-code bg-background/50 border rounded-md p-2 w-fit mx-auto">
                    النتيجة النهائية للمصفوفة: <span className="font-bold text-accent-foreground">{stringVoltage.toFixed(1)}V / {totalSystemCurrent.toFixed(1)}A</span>
                 </div>
            </div>
        </div>
    </div>
  );
}
