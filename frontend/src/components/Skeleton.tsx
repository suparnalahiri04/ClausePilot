import React from 'react';

export const PageSkeleton: React.FC<{ title?: string }> = ({ title = 'Loading Intelligence Workspace...' }) => {
  return (
    <div className="p-6 lg:p-8 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-36 bg-[#E6E1D6] rounded" />
          <div className="h-7 w-72 bg-[#E6E1D6] rounded-md" />
        </div>
        <div className="h-9 w-40 bg-[#E6E1D6] rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="bg-white border border-[#E6E1D6] rounded-xl p-5 space-y-3 shadow-editorial"
          >
            <div className="h-3 w-24 bg-[#F3EFE6] rounded" />
            <div className="h-8 w-32 bg-[#E6E1D6] rounded" />
            <div className="h-3 w-40 bg-[#F3EFE6] rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white border border-[#E6E1D6] rounded-xl p-6 space-y-4 shadow-editorial">
        <div className="text-xs font-medium text-[#575B75]">{title}</div>
        <div className="h-44 bg-[#FAF8F3] rounded-lg border border-[#E6E1D6]" />
      </div>
    </div>
  );
};

