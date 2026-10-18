export type ItemCondition = 'baik' | 'rusak_ringan' | 'rusak_berat';

export interface Item {
  id: string;
  code: string;
  name: string;
  category_id: string | null;
  location_id: string | null;
  stock: number;
  unit: string;
  condition: ItemCondition;
  description: string | null;
  photo_url: string | null;
  purchase_date: string | null;
  price: number | null;
  quantity_under_inspection?: number;
  created_at: string;
  updated_at: string;
}

export interface ItemWithRelations extends Item {
  category_name: string | null;
  location_name: string | null;
}