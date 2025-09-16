interface SystemVisualizationProps {
  panelsPerString: number;
  parallelStrings: number;
  panelVoltage: number;
  panelCurrent: number;
}

export function SystemVisualization({
  panelsPerString,
  parallelStrings,
  panelVoltage,
  panelCurrent,
}: SystemVisualizationProps) {
  const strings = Array.from({ length: parallelStrings });
  const panels = Array.from({ length: panelsPerString });

  const stringVoltage = (panelsPerString * panelVoltage).toFixed(1);
  const stringCurrent = panelCurrent.toFixed(1);
  const totalSystemVoltage = stringVoltage; // Voltage is the same in parallel
  const totalSystemCurrent = (parallelStrings * panelCurrent).toFixed(1);

  return (
    <div className="bg-muted/30 p-4 rounded-lg border overflow-x-auto">
      <div className="flex justify-center gap-4 min-w-max">
        {strings.map((_, stringIndex) => (
          <div key={stringIndex} className="flex flex-col items-center gap-2">
            <div className="font-code text-xs text-muted-foreground">
              السلسلة {stringIndex + 1}
            </div>
            <div className="flex flex-col gap-1 p-2 border-2 border-dashed border-accent/50 rounded-md bg-background/30">
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
            <div className="text-xs font-code text-center mt-1 text-muted-foreground">
                <div>{stringVoltage}V</div>
                <div>{stringCurrent}A</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-dashed text-center">
        <div className="text-sm font-semibold mb-2">الإجمالي الخارج من النظام</div>
        <div className="flex justify-center gap-6 font-code text-lg">
            <div className="font-bold text-primary">{totalSystemVoltage} V</div>
            <div className="font-bold text-primary">{totalSystemCurrent} A</div>
        </div>
      </div>
    </div>
  );
}
