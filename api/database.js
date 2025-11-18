import { supabase } from '../config/supabase.js';

export const fetchAllUsers = async () => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  return data || [];
};

export const fetchAllOrders = async () => {
  const { data, error } = await supabase.from('orders').select('*');
  if (error) throw error;
  return data || [];
};

export const fetchAllCoupons = async () => {
  const { data, error } = await supabase.from('coupons').select('*');
  if (error) throw error;
  return data || [];
};

export const fetchDatabaseStats = async () => {
  const [usersRes, ordersRes, couponsRes] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('coupons').select('*', { count: 'exact', head: true })
  ]);
  
  return {
    users: usersRes.count || 0,
    orders: ordersRes.count || 0,
    coupons: couponsRes.count || 0
  };
};

export const fetchCustomSegments = async () => {
  const { data, error } = await supabase
    .from('custom_segments')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const saveCustomSegment = async (name, conditions) => {
  const { data, error } = await supabase
    .from('custom_segments')
    .insert([{ name, conditions, created_at: new Date().toISOString() }])
    .select();
  
  if (error) throw error;
  return data;
};

export const deleteCustomSegment = async (name) => {
  const { error } = await supabase
    .from('custom_segments')
    .delete()
    .eq('name', name);
  
  if (error) throw error;
};
