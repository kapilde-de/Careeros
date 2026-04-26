// frontend/src/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Auth helpers ──────────────────────────────────────────────────────────────

export async function signUp(email, password, name) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
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

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ── User profile helpers ──────────────────────────────────────────────────────

export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

export async function upsertProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
  return { data, error }
}

// ── Resume history helpers ────────────────────────────────────────────────────

export async function saveResume(userId, resumeData, jobTitle, company, atsScore) {
  const { data, error } = await supabase
    .from('resumes')
    .insert({
      user_id: userId,
      job_title: jobTitle,
      company,
      ats_score: atsScore,
      content: resumeData,
      created_at: new Date().toISOString()
    })
  return { data, error }
}

export async function getUserResumes(userId) {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)
  return { data, error }
}

// ── Application tracking helpers ──────────────────────────────────────────────

export async function saveApplication(userId, application) {
  const { data, error } = await supabase
    .from('applications')
    .upsert({
      user_id: userId,
      ...application,
      updated_at: new Date().toISOString()
    })
  return { data, error }
}

export async function getUserApplications(userId) {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function updateApplicationStatus(appId, status) {
  const { data, error } = await supabase
    .from('applications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', appId)
  return { data, error }
}
