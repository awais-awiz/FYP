import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const INITIAL_STAFF = [
{
  id: 'ST-001',
  name: 'Sarah Jenkins',
  role: 'Manager',
  email: 'sarah.j@restaurant.com',
  phone: '+1 (555) 123-4567',
  status: 'Active',
  joinedAt: new Date('2023-01-15')
},
{
  id: 'ST-002',
  name: 'Michael Chen',
  role: 'Chef',
  email: 'mike.c@restaurant.com',
  phone: '+1 (555) 987-6543',
  status: 'Active',
  joinedAt: new Date('2023-03-10')
},
{
  id: 'ST-003',
  name: 'Emily Davis',
  role: 'Waitstaff',
  email: 'emily.d@restaurant.com',
  phone: '+1 (555) 456-7890',
  status: 'On Leave',
  joinedAt: new Date('2023-06-20')
},
{
  id: 'ST-004',
  name: 'David Wilson',
  role: 'Chef',
  email: 'david.w@restaurant.com',
  phone: '+1 (555) 789-0123',
  status: 'Active',
  joinedAt: new Date('2023-08-05')
}];


export const useStaff = create()(
  persist(
    (set, get) => ({
      staff: INITIAL_STAFF, // Start with some realistic data

      addStaff: (newStaff) => {
        set((state) => ({
          staff: [
          ...state.staff,
          {
            ...newStaff,
            id: `ST-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
            joinedAt: new Date()
          }]

        }));
      },

      updateStaff: (id, updates) => {
        set((state) => ({
          staff: state.staff.map((member) =>
          member.id === id ? { ...member, ...updates } : member
          )
        }));
      },

      removeStaff: (id) => {
        set((state) => ({
          staff: state.staff.filter((member) => member.id !== id)
        }));
      },

      getStaff: () => get().staff
    }),
    {
      name: 'restaurant-staff'
    }
  )
);

/**
 * Staff — backend-backed thin wrapper over /api/staff.
 *
 * Most pages now use useAuth.{approvedUsers, refreshStaff, …} directly. This
 * hook stays for the few legacy spots that did `const { staff } = useStaff()`
 * — it returns the same array under that name.
 */
import { create } from "zustand";
import { staffApi } from "@/lib/api";

export const useStaff = create((set) => ({
  staff: [],
  loading: false,
  error: null,

  refresh: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const r = await staffApi.list(params);
      set({ staff: r.staff || [], loading: false });
    } catch (err) {
      set({ loading: false, error: err.message });
    }
  },

  addStaff: async (newStaff) => {
    const created = await staffApi.create({
      username:  newStaff.username,
      password:  newStaff.password || newStaff.pin,
      full_name: newStaff.name || newStaff.full_name,
      role:      newStaff.role,
      email:     newStaff.email || null,
      phone:     newStaff.phone || null,
    });
    set((s) => ({ staff: [...s.staff, created] }));
    return created;
  },

  updateStaff: async (username, updates) => {
    const updated = await staffApi.update(username, updates);
    set((s) => ({
      staff: s.staff.map((m) => (m.username === username ? updated : m)),
    }));
    return updated;
  },

  removeStaff: async (username) => {
    await staffApi.remove(username);
    set((s) => ({ staff: s.staff.filter((m) => m.username !== username) }));
  },

  getStaff: () => useStaff.getState().staff,
}));

export default useStaff;
