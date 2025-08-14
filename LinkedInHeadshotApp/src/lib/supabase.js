import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Config from 'react-native-config';

const supabaseUrl = Config.SUPABASE_URL;
const supabaseAnonKey = Config.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper functions for authentication
export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

// Helper functions for storage
export const uploadImage = async (userId, file, bucket = 'user-uploads') => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file);
    
  if (error) return { error };
  
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);
    
  return { data: { path: data.path, publicUrl } };
};

// Helper functions for database operations
export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
    
  return { data, error };
};

export const updateUserProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
    
  return { data, error };
};

export const getStyleTemplates = async () => {
  const { data, error } = await supabase
    .from('style_templates')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
    
  return { data, error };
};

export const getUserPhotos = async (userId) => {
  const { data, error } = await supabase
    .from('generated_photos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  return { data, error };
};

export const createPhotoGeneration = async (userId, imageUrl, styleTemplateId) => {
  const { data, error } = await supabase
    .from('generated_photos')
    .insert({
      user_id: userId,
      original_image_url: imageUrl,
      style_template: styleTemplateId,
      processing_status: 'pending'
    })
    .select()
    .single();
    
  return { data, error };
};

export const trackAnalyticsEvent = async (userId, eventName, properties = {}) => {
  const { data, error } = await supabase
    .from('analytics_events')
    .insert({
      user_id: userId,
      event_name: eventName,
      properties,
      platform: 'mobile',
      app_version: '1.0.0' // Update with actual version
    });
    
  return { data, error };
};