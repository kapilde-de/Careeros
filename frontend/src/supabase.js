import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://caixavwbujecvffdudkd.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function signUp(email, password, name) {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { full_name: name } }
  })
  return { data, error }
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  } catch { return { data: null, error: null } }
}

export async function saveResume(userId, resumeData, jobTitle, company, atsScore) {
  try {
    const { data, error } = await supabase
      .from('resumes')
      .insert({
        user_id: userId,
        job_title: jobTitle || 'Unknown Role',
        company: company || 'Unknown Company',
        ats_score: atsScore || 0,
        content: resumeData,
        created_at: new Date().toISOString()
      })
    return { data, error }
  } catch { return { data: null, error: null } }
}

export async function getUserResumes(userId) {
  try {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    return { data, error }
  } catch { return { data: [], error: null } }
}

export async function saveApplication(userId, application) {
  try {
    const { data, error } = await supabase
      .from('applications')
      .insert({ user_id: userId, ...application, created_at: new Date().toISOString() })
    return { data, error }
  } catch { return { data: null, error: null } }
}

export async function getUserApplications(userId) {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  } catch { return { data: [], error: null } }
}

export async function updateApplicationStatus(appId, status) {
  try {
    const { data, error } = await supabase
      .from('applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', appId)
    return { data, error }
  } catch { return { data: null, error: null } }
}
