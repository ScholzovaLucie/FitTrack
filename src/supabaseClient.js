// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://finjkkugziqswucypggg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpbmpra3Vnemlxc3d1Y3lwZ2dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY2NTU0MDUsImV4cCI6MjA0MjIzMTQwNX0.RE-dz6fwhfnepCbsX1Z-EFebZQM_qn4_LYUfe4PE9sE';
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
