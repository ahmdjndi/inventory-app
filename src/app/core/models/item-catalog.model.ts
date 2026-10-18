export interface ItemCatalogEntry {
  id: string;
  code: string;
  name: string;
  category_name: string | null;
  location_name: string | null;
  unit: string;
  condition: 'baik' | 'rusak_ringan' | 'rusak_berat';
  description: string | null;
  photo_url: string | null;
  stock: number;
  available_stock: number;
}