export type StockMovementType = 'in' | 'out';

export interface StockMovement {
  id: string;
  item_id: string;
  type: StockMovementType;
  quantity: number;
  transaction_date: string;
  source: string | null;
  destination: string | null;
  notes: string | null;
  recorded_by: string;
  created_at: string;
}

export interface StockMovementWithDetails extends StockMovement {
  item_name: string;
  item_code: string;
  recorder_name: string;
}