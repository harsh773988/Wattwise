"use client";

interface EmptyStateProps {
  onLoadSampleData: () => void;
  onOpenUpload?: () => void;
  spaceId: string;
}

export function EmptyState({
  onLoadSampleData,
  onOpenUpload,
  spaceId,
}: EmptyStateProps) {
  return (
    <div className="neo-card p-8 sm:p-12 text-center bg-white max-w-2xl mx-auto my-8">
      <div className="w-16 h-16 bg-[#ffe17c] border-2 border-black shadow-[4px_4px_0px_0px_#000] flex items-center justify-center text-3xl mx-auto mb-4">
        ⚡
      </div>

      <h2 className="text-2xl font-black text-black mb-2">
        No Electricity Readings Found
      </h2>

      <p className="text-sm text-black/70 font-medium mb-6 max-w-md mx-auto">
        Space <span className="font-bold text-black bg-[#ffe17c] px-1 border border-black">{spaceId}</span> has no recorded readings yet. Load our curated 30-day screening dataset or import your own CSV.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={onLoadSampleData}
          className="neo-btn bg-[#ffe17c] text-black px-6 py-3 text-sm flex items-center gap-2 w-full sm:w-auto"
        >
          <span>⚡</span>
          <span>Load 30-Day Sample Data</span>
        </button>

        {onOpenUpload && (
          <button
            onClick={onOpenUpload}
            className="neo-btn bg-white text-black px-6 py-3 text-sm w-full sm:w-auto"
          >
            Upload Custom CSV
          </button>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-black/10 text-xs text-black/50 font-semibold">
        CSV format required: <code className="text-black font-bold">date,kwh</code> (e.g. 2026-09-18,6.2)
      </div>
    </div>
  );
}
