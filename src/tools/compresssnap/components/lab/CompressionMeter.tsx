import React from 'react';
import { motion } from 'framer-motion';
import { ToolTheme } from '../../../../lib/themes';

interface CompressionMeterProps {
  theme: ToolTheme;
  value: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export const CompressionMeter: React.FC<CompressionMeterProps> = ({
  theme,
  value,
  size = 56,
  strokeWidth = 5,
  showLabel = true,
}) => {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={theme.border}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={theme.primaryHex}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{
            filter: `drop-shadow(0 0 6px ${theme.primaryHex}80)`,
          }}
        />
      </svg>
      {showLabel && (
        <span
          className="absolute font-black tabular-nums"
          style={{
            color: theme.text,
            fontSize: size * 0.26,
            lineHeight: 1,
          }}
        >
          {clamped}
        </span>
      )}
    </div>
  );
};
