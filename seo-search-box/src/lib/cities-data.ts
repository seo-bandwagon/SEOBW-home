// City keyword data for programmatic pages
// Data sourced from DataForSEO keyword research

export interface CityKeyword {
  keyword: string;
  volume: number;
  cpc: number;
  competition: 'LOW' | 'MEDIUM' | 'HIGH';
  competitionIndex: number;
}

export interface CityData {
  name: string;
  slug: string;
  state: string;
  stateCode: string;
  keywords: CityKeyword[];
  totalVolume: number;
  avgCpc: number;
  dataDate: string;
}

// Will be populated from JSON files
import lasVegasData from '@/data/cities/las-vegas.json';
import miamiData from '@/data/cities/miami.json';
import seattleData from '@/data/cities/seattle.json';
import losAngelesData from '@/data/cities/los-angeles.json';
import newYorkData from '@/data/cities/new-york.json';
import chicagoData from '@/data/cities/chicago.json';
import dallasData from '@/data/cities/dallas.json';
import phoenixData from '@/data/cities/phoenix.json';

function parseCity(data: any, name: string, slug: string, state: string, stateCode: string): CityData {
  const keywords = data.tasks?.[0]?.result || [];
  const parsed = keywords
    .filter((k: any) => k.search_volume >= 100)
    .map((k: any) => ({
      keyword: k.keyword,
      volume: k.search_volume,
      cpc: k.cpc || 0,
      competition: k.competition || 'LOW',
      competitionIndex: k.competition_index || 0,
    }))
    .sort((a: CityKeyword, b: CityKeyword) => b.volume - a.volume);

  const cpcs = parsed.filter((k: CityKeyword) => k.cpc > 0).map((k: CityKeyword) => k.cpc);
  
  return {
    name,
    slug,
    state,
    stateCode,
    keywords: parsed,
    totalVolume: parsed.reduce((sum: number, k: CityKeyword) => sum + k.volume, 0),
    avgCpc: cpcs.length > 0 ? cpcs.reduce((a: number, b: number) => a + b, 0) / cpcs.length : 0,
    dataDate: '2026-02-18',
  };
}

export const CITIES: Record<string, CityData> = {
  'las-vegas': parseCity(lasVegasData, 'Las Vegas', 'las-vegas', 'Nevada', 'NV'),
  'miami': parseCity(miamiData, 'Miami', 'miami', 'Florida', 'FL'),
  'seattle': parseCity(seattleData, 'Seattle', 'seattle', 'Washington', 'WA'),
  'los-angeles': parseCity(losAngelesData, 'Los Angeles', 'los-angeles', 'California', 'CA'),
  'new-york': parseCity(newYorkData, 'New York', 'new-york', 'New York', 'NY'),
  'chicago': parseCity(chicagoData, 'Chicago', 'chicago', 'Illinois', 'IL'),
  'dallas': parseCity(dallasData, 'Dallas', 'dallas', 'Texas', 'TX'),
  'phoenix': parseCity(phoenixData, 'Phoenix', 'phoenix', 'Arizona', 'AZ'),
};

export function getCityBySlug(slug: string): CityData | undefined {
  return CITIES[slug];
}

export function getAllCities(): CityData[] {
  return Object.values(CITIES).sort((a, b) => b.totalVolume - a.totalVolume);
}

export function getAllCitySlugs(): string[] {
  return Object.keys(CITIES);
}
