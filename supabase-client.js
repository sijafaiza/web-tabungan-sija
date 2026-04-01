// supabase-client.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// GANTI DENGAN DATA DARI SUPABASE ANDA
const SUPABASE_URL = 'https://yjseswgbuumkhvxywvnc.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlqc2Vzd2didXVta2h2eHl3dm5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMDYxOTMsImV4cCI6MjA4ODY4MjE5M30.jd4tkvZe_tGSgMWtqBIxLSXg97ncoGCDaoALSp-gedo...'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)