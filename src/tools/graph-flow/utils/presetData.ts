import type { ChartType, DataSet } from '../types';
import { cloneDataSet } from './dataParser';

export interface PresetDataItem {
  nameKey: string;
  /** The chart type this data actually reads well as. */
  suggested: ChartType;
  data: DataSet;
}

/**
 * Demo datasets. `loadPreset` hands out a deep copy — the objects below are
 * module-level singletons, and the editor mutates whatever it is given, so
 * sharing the reference would let a user's edits corrupt the preset for the
 * rest of the session.
 */
const PRESETS: Record<string, PresetDataItem> = {
  sales: {
    nameKey: 'preset_sales',
    suggested: 'bar',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      series: [
        { name: 'Revenue', values: [42, 49, 55, 62, 58, 71, 84, 78, 92, 105, 98, 120] },
        { name: 'Expenses', values: [35, 38, 40, 45, 42, 48, 55, 52, 60, 65, 58, 72] },
      ],
    },
  },
  profit: {
    nameKey: 'preset_profit',
    suggested: 'bar',
    data: {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      series: [
        // Deliberately includes losses: the old renderer drew these upward,
        // off the top of the plot area.
        { name: 'Net result', values: [-18, -4, 12, 31] },
      ],
    },
  },
  population: {
    nameKey: 'preset_population',
    suggested: 'horizontal-bar',
    data: {
      labels: ['China', 'India', 'USA', 'Indonesia', 'Pakistan', 'Brazil', 'Nigeria', 'Bangladesh'],
      series: [{ name: 'Population (M)', values: [1412, 1408, 332, 275, 231, 215, 219, 170] }],
    },
  },
  tech_stack: {
    nameKey: 'preset_tech_stack',
    suggested: 'pie',
    data: {
      labels: ['JavaScript', 'Python', 'TypeScript', 'Java', 'C#', 'Go', 'Rust', 'Kotlin'],
      series: [{ name: 'Usage (%)', values: [63.6, 49.3, 38.5, 35.4, 29.7, 14.3, 13.1, 9.1] }],
    },
  },
  performance: {
    nameKey: 'preset_performance',
    suggested: 'radar',
    data: {
      labels: ['Performance', 'Accessibility', 'Best practices', 'SEO', 'PWA', 'Security'],
      series: [
        { name: 'Before', values: [42, 68, 71, 55, 30, 60] },
        { name: 'After', values: [96, 100, 92, 98, 85, 90] },
      ],
    },
  },
  correlation: {
    nameKey: 'preset_correlation',
    suggested: 'scatter',
    data: {
      // Numeric labels, so the scatter gets a genuine numeric X axis.
      labels: ['1', '2', '3', '5', '8', '12', '15', '19', '24', '30'],
      series: [{ name: 'Conversion (%)', values: [1.2, 1.9, 2.4, 3.1, 4.4, 5.2, 5.6, 6.9, 7.1, 8.4] }],
    },
  },
};

export const PRESET_KEYS = Object.keys(PRESETS);

export function getPreset(key: string): PresetDataItem | null {
  const p = PRESETS[key];
  return p ? { ...p, data: cloneDataSet(p.data) } : null;
}

export function listPresets(): { key: string; nameKey: string }[] {
  return Object.entries(PRESETS).map(([key, p]) => ({ key, nameKey: p.nameKey }));
}
