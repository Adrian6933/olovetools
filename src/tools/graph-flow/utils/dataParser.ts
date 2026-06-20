export interface DataSet {
  labels: string[];
  series: { name: string; values: number[] }[];
}

/**
 * Parse a CSV string into a DataSet object.
 * First row is headers, first column is labels.
 */
export function parseCSV(csvText: string): DataSet {
  const lines = csvText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row');
  }

  // Detect delimiter
  const delimiter = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const seriesNames = headers.slice(1);
  const labels: string[] = [];
  const seriesArrays: number[][] = seriesNames.map(() => []);

  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    if (cols.length < 2) continue;

    labels.push(cols[0]);
    for (let j = 0; j < seriesNames.length; j++) {
      const raw = cols[j + 1] || '0';
      const num = parseFloat(raw.replace(/[^0-9.\-]/g, ''));
      seriesArrays[j].push(isNaN(num) ? 0 : num);
    }
  }

  return {
    labels,
    series: seriesNames.map((name, i) => ({ name, values: seriesArrays[i] })),
  };
}

/**
 * Convert a DataSet back to CSV string.
 */
export function datasetToCSV(data: DataSet): string {
  const header = ['Label', ...data.series.map(s => s.name)].join(',');
  const rows = data.labels.map((label, i) =>
    [label, ...data.series.map(s => s.values[i]?.toString() ?? '0')].join(',')
  );
  return [header, ...rows].join('\n');
}
