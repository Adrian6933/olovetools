import React from 'react';
import { Loader2 } from 'lucide-react';

const ClipSkeleton: React.FC = () => {
  return (
    <div className="bg-[#111114]/50 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-6 md:p-10 flex flex-col md:flex-row gap-8 md:gap-12 items-stretch animate-pulse">
      <div className="md:w-[38%] shrink-0">
        <div className="w-full aspect-video bg-white/5 rounded-[2rem]"></div>
      </div>
      <div className="flex-1 flex flex-col justify-between py-2">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/5"></div>
            <div className="space-y-2">
              <div className="h-5 w-32 bg-white/5 rounded-lg"></div>
              <div className="h-4 w-24 bg-white/5 rounded-lg"></div>
            </div>
          </div>
          <div className="h-8 w-3/4 bg-white/5 rounded-xl"></div>
          <div className="flex flex-wrap gap-3">
            <div className="h-8 w-24 bg-white/5 rounded-lg"></div>
            <div className="h-8 w-24 bg-white/5 rounded-lg"></div>
            <div className="h-8 w-24 bg-white/5 rounded-lg"></div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-white/5">
          <div className="h-16 w-full bg-white/5 rounded-2xl"></div>
        </div>
      </div>
    </div>
  );
};

export default ClipSkeleton;
