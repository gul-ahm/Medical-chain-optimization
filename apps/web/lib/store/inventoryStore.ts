import { create } from 'zustand';

interface InventoryItem {
  sku: string;
  warehouse_id: string;
  quantity_on_hand: number;
}

interface InventoryState {
  items: InventoryItem[];
  updateStock: (sku: string, warehouse_id: string, delta: number) => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  items: [],
  updateStock: (sku, warehouse_id, delta) => set((state) => ({
    items: state.items.map(item => 
      (item.sku === sku && item.warehouse_id === warehouse_id) 
        ? { ...item, quantity_on_hand: item.quantity_on_hand + delta }
        : item
    )
  })),
}));
