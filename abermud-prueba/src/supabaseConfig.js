import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://zzlzqeyslzrbgswjqtxh.supabase.co';
// ⚠️ IMPORTANTE: Reemplaza esto con tu API key "anon" de Supabase
// Ve a: Supabase Dashboard → Settings → API → Project API keys → "anon" key
// La key debe empezar con "eyJ..." y es muy larga (200+ caracteres)
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6bHpxZXlzbHpyYmdzd2pxdHhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NDI3NzYsImV4cCI6MjA4NjQxODc3Nn0.e29Vnb2x51QPcIP2ccHB-DxuKhNjPAbABKRRiNOFWd4';

// Crear cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Función helper para obtener fecha/hora de Perú
export const getPeruDateTime = () => {
  const now = new Date();
  const peruTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
  
  const year = peruTime.getFullYear();
  const month = String(peruTime.getMonth() + 1).padStart(2, '0');
  const day = String(peruTime.getDate()).padStart(2, '0');
  const hours = String(peruTime.getHours()).padStart(2, '0');
  const minutes = String(peruTime.getMinutes()).padStart(2, '0');
  const seconds = String(peruTime.getSeconds()).padStart(2, '0');
  
  return {
    fecha: `${year}-${month}-${day}`,
    hora: `${hours}:${minutes}:${seconds}`,
    timestamp: peruTime
  };
};

