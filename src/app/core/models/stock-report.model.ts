export interface StockReportEntry {
  item_id: string;
  code: string;
  name: string;
  category_name: string | null;
  location_name: string | null;
  stock: number;
  borrowed: number;
  reserved: number;
  under_inspection: number;
  available: number;
  status: string;
}