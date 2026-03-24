import { createClient } from '@supabase/supabase-js';

// ✅ SEGURO: Las keys se leen desde variables de entorno (.env)
// Crea un archivo .env en la raíz del proyecto con:
//   VITE_SUPABASE_URL=https://svjerqqwqernlnpcgugx.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2amVycXF3cWVybmxucGNndWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMTc1OTUsImV4cCI6MjA4OTc5MzU5NX0.blbMbte7RYjDsAFt9J3CjlJ-4qdAfCSr79cANGZvlvs
// ⚠️ Asegúrate de que .env esté en tu .gitignore (nunca lo subas a GitHub)

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '❌ Faltan variables de entorno de Supabase.\n' +
    'Crea un archivo .env con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

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
