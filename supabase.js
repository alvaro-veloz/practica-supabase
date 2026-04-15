// ============================================
// CONFIGURACIÓN DE SUPABASE
// Aquí viven tus credenciales del proyecto
// ============================================

const SUPABASE_URL = 'https://cfepdmaclbiopsshxwgf.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmZXBkbWFjbGJpb3Bzc2h4d2dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyODQ4ODQsImV4cCI6MjA5MTg2MDg4NH0._g4ZU3vXWfmZGbTC2OyWjfywTUPx06BAJ-oSAg1jado'

// Creamos el cliente de Supabase — esto es lo que usamos en todos los demás archivos
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
