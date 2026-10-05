import React from 'react';
import { AdSlot } from './AdSlot';

interface AdBannerProps {
  id: string;
  className?: string;
}

/** First manual placement, below each tool heading and above its workspace. */
export const AdBanner: React.FC<AdBannerProps> = ({ id, className = '' }) => (
  <div id={id} className={`w-full max-w-5xl mx-auto my-8 ${className}`}>
    <AdSlot position="top" />
  </div>
);
