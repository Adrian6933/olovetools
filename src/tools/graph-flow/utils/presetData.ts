import type { DataSet } from './dataParser';

export interface PresetDataItem {
  nameKey: string;
  data: DataSet;
}

export const PRESET_DATA: Record<string, PresetDataItem> = {
  sales: {
    nameKey: 'preset_sales',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      series: [
        { name: 'Revenue ($K)', values: [42, 49, 55, 62, 58, 71, 84, 78, 92, 105, 98, 120] },
        { name: 'Expenses ($K)', values: [35, 38, 40, 45, 42, 48, 55, 52, 60, 65, 58, 72] },
      ],
    },
  },
  population: {
    nameKey: 'preset_population',
    data: {
      labels: ['China', 'India', 'USA', 'Indonesia', 'Pakistan', 'Brazil', 'Nigeria', 'Bangladesh'],
      series: [
        { name: 'Population (M)', values: [1412, 1408, 332, 275, 231, 215, 219, 170] },
      ],
    },
  },
  tech_stack: {
    nameKey: 'preset_tech_stack',
    data: {
      labels: ['JavaScript', 'Python', 'TypeScript', 'Java', 'C#', 'Go', 'Rust', 'Kotlin'],
      series: [
        { name: 'Usage (%)', values: [63.6, 49.3, 38.5, 35.4, 29.7, 14.3, 13.1, 9.1] },
      ],
    },
  },
  performance: {
    nameKey: 'preset_performance',
    data: {
      labels: ['Page Load', 'Time to Interactive', 'First Paint', 'Largest Paint', 'CLS Score', 'FID'],
      series: [
        { name: 'Before (ms)', values: [3200, 5100, 1800, 4200, 180, 250] },
        { name: 'After (ms)', values: [1100, 1800, 600, 1500, 45, 70] },
      ],
    },
  },
};
