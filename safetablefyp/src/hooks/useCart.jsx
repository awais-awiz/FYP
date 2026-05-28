import { create } from 'zustand';


















export const useCart = create((set, get) => ({
  items: [],

  addItem: (item) => {
    set((state) => {
      const existingItem = state.items.find((i) => i.id === item.id);
      if (existingItem) {
        return {
          items: state.items.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          )
        };
      }
      return {
        items: [...state.items, { ...item, quantity: 1 }]
      };
    });
  },

  removeItem: (id) => {
    set((state) => ({
      items: state.items.filter((i) => i.id !== id)
    }));
  },

  updateQuantity: (id, quantity) => {
    set((state) => ({
      items: state.items.map((i) =>
      i.id === id ? { ...i, quantity: Math.max(0, quantity) } : i
      ).filter((i) => i.quantity > 0)
    }));
  },

  clearCart: () => set({ items: [] }),

  getTotalPrice: () => {
    const { items } = get();
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  },

  getTotalItems: () => {
    const { items } = get();
    return items.reduce((total, item) => total + item.quantity, 0);
  }
}));