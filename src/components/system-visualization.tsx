interface SystemVisualizationProps {
  panelsPerString: number;
  parallelStrings: number;
}

export function SystemVisualization({
  panelsPerString,
  parallelStrings,
}: SystemVisualizationProps) {
  const strings = Array.from({ length: parallelStrings });
  const panels = Array.from({ length: panelsPerString });

  if (panelsPerString > 20 || parallelStrings > 20) {
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
          <div key={stringIndex} className="flex flex-col items-center gap-1">
            <div className="font-code text-xs text-muted-foreground">السلسلة {stringIndex + 1}</div>
            <div className="flex flex-col gap-1 p-2 border-2 border-dashed border-accent/50 rounded-md">
              {panels.map((_, panelIndex) => (
                <div
                  key={panelIndex}
                  className="w-16 h-10 bg-accent/80 rounded flex items-center justify-center text-accent-foreground shadow-sm"
                  title={`اللوح ${panelIndex + 1}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 4h16v16H4z" />
                    <path d="M4 10h16" />
                    <path d="M10 4v16" />
                  </svg>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="text-center mt-4 text-xs text-muted-foreground font-code">
        يعرض {parallelStrings} سلاسل متوازية، كل منها يحتوي على {panelsPerString} ألواح موصولة على التوالي.
      </div>
    </div>
  );
}
