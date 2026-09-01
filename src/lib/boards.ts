import { supabase } from '@/lib/supabase';

export type BoardStyleKey =
  | 'punjab'
  | 'sindh'
  | 'kpk'
  | 'balochistan'
  | 'fbise'
  | 'akueb'
  | 'cambridge'
  | 'ib'
  | 'custom';

export interface Board {
  code: string;
  name: string;
  region: string;
  style: BoardStyleKey;
}

/** Offline fallback so the selector always works, even before the boards load. */
export const FALLBACK_BOARDS: Board[] = [
  { code: 'bise-lahore', name: 'BISE Lahore', region: 'Punjab', style: 'punjab' },
  { code: 'bise-gujranwala', name: 'BISE Gujranwala', region: 'Punjab', style: 'punjab' },
  { code: 'bise-rawalpindi', name: 'BISE Rawalpindi', region: 'Punjab', style: 'punjab' },
  { code: 'bise-multan', name: 'BISE Multan', region: 'Punjab', style: 'punjab' },
  { code: 'bise-faisalabad', name: 'BISE Faisalabad', region: 'Punjab', style: 'punjab' },
  { code: 'bise-sargodha', name: 'BISE Sargodha', region: 'Punjab', style: 'punjab' },
  { code: 'bise-bahawalpur', name: 'BISE Bahawalpur', region: 'Punjab', style: 'punjab' },
  { code: 'bise-dgkhan', name: 'BISE Dera Ghazi Khan', region: 'Punjab', style: 'punjab' },
  { code: 'bise-sahiwal', name: 'BISE Sahiwal', region: 'Punjab', style: 'punjab' },
  { code: 'bise-karachi', name: 'BSEK / BIEK Karachi', region: 'Sindh', style: 'sindh' },
  { code: 'bise-hyderabad', name: 'BISE Hyderabad', region: 'Sindh', style: 'sindh' },
  { code: 'bise-sukkur', name: 'BISE Sukkur', region: 'Sindh', style: 'sindh' },
  { code: 'bise-larkana', name: 'BISE Larkana', region: 'Sindh', style: 'sindh' },
  { code: 'bise-mirpurkhas', name: 'BISE Mirpurkhas', region: 'Sindh', style: 'sindh' },
  { code: 'bise-benazirabad', name: 'BISE Shaheed Benazirabad', region: 'Sindh', style: 'sindh' },
  { code: 'aku-eb', name: 'Aga Khan Board (AKU-EB)', region: 'Sindh', style: 'akueb' },
  { code: 'bise-peshawar', name: 'BISE Peshawar', region: 'Khyber Pakhtunkhwa', style: 'kpk' },
  { code: 'bise-mardan', name: 'BISE Mardan', region: 'Khyber Pakhtunkhwa', style: 'kpk' },
  { code: 'bise-abbottabad', name: 'BISE Abbottabad', region: 'Khyber Pakhtunkhwa', style: 'kpk' },
  { code: 'bise-swat', name: 'BISE Swat', region: 'Khyber Pakhtunkhwa', style: 'kpk' },
  { code: 'bise-kohat', name: 'BISE Kohat', region: 'Khyber Pakhtunkhwa', style: 'kpk' },
  { code: 'bise-dikhan', name: 'BISE Dera Ismail Khan', region: 'Khyber Pakhtunkhwa', style: 'kpk' },
  { code: 'bise-bannu', name: 'BISE Bannu', region: 'Khyber Pakhtunkhwa', style: 'kpk' },
  { code: 'bise-malakand', name: 'BISE Malakand', region: 'Khyber Pakhtunkhwa', style: 'kpk' },
  { code: 'bise-quetta', name: 'BISE Quetta', region: 'Balochistan', style: 'balochistan' },
  { code: 'fbise', name: 'FBISE (Federal Board)', region: 'Federal', style: 'fbise' },
  { code: 'bise-ajk', name: 'BISE Mirpur (AJK)', region: 'Azad Jammu & Kashmir', style: 'punjab' },
  { code: 'bise-gb', name: 'BISE Gilgit-Baltistan', region: 'Gilgit-Baltistan', style: 'punjab' },
  { code: 'cambridge-o', name: 'Cambridge O Level', region: 'International', style: 'cambridge' },
  { code: 'cambridge-a', name: 'Cambridge A Level', region: 'International', style: 'cambridge' },
  { code: 'cambridge-igcse', name: 'Cambridge IGCSE', region: 'International', style: 'cambridge' },
  { code: 'ib', name: 'International Baccalaureate (IB)', region: 'International', style: 'ib' },
  { code: 'custom', name: 'Custom / Other board', region: 'Other', style: 'custom' },
];

export const CLASS_LEVELS = [
  '9th',
  '10th',
  '11th (1st Year)',
  '12th (2nd Year)',
  'O Level',
  'AS Level',
  'A Level',
  'Other',
];

export async function fetchBoards(): Promise<Board[]> {
  const { data, error } = await supabase
    .from('boards')
    .select('code, name, region, style')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error || !data?.length) return FALLBACK_BOARDS;
  return data.map((b) => ({
    code: b.code,
    name: b.name,
    region: b.region,
    style: (b.style as BoardStyleKey) ?? 'custom',
  }));
}

export function findBoard(boards: Board[], code: string | null | undefined): Board | null {
  if (!code) return null;
  return boards.find((b) => b.code === code) ?? FALLBACK_BOARDS.find((b) => b.code === code) ?? null;
}

export function groupByRegion(boards: Board[]): { region: string; boards: Board[] }[] {
  const map = new Map<string, Board[]>();
  for (const b of boards) {
    const list = map.get(b.region) ?? [];
    list.push(b);
    map.set(b.region, list);
  }
  return Array.from(map, ([region, list]) => ({ region, boards: list }));
}
