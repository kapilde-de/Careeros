import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://caixavwbujecvffdudkd.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function signUp(email, password, name) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } }
    })
    return { data, error }
  } catch(e) { return { data: null, error: { message: e.message } } }
}

export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  } catch(e) { return { data: null, error: { message: e.message } } }
}

export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    return { data, error }
  } catch(e) { return { data: null, error: { message: e.message } } }
}

export async function signOut() {
  try {
    await supabase.auth.signOut()
  } catch {}
}

export async function getUserProfile(userId) {
  try {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    return data
  } catch { return null }
}

export async function saveResume(userId, content, jobTitle, company, atsScore) {
  try {
    const { error } = await supabase.from('resumes').insert({
      user_id: userId,
      job_title: jobTitle || 'Role',
      company: company || 'Company',
      ats_score: atsScore || 0,
      content,
      created_at: new Date().toISOString()
    })
    if (error) console.error('saveResume error:', error.message)
  } catch(e) { console.error('saveResume exception:', e.message) }
}

export async function getUserResumes(userId) {
  try {
    const { data, error } = await supabase.from('resumes').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20)
    if (error) console.error('getUserResumes error:', error.message)
    return data || []
  } catch(e) { console.error('getUserResumes exception:', e.message); return [] }
}

export async function getMonthlyUsage(userId) {
  try {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const { count, error } = await supabase
      .from('resumes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString())
    if (error) console.error('getMonthlyUsage error:', error.message)
    return count || 0
  } catch(e) { console.error('getMonthlyUsage exception:', e.message); return 0 }
}

export async function saveApplication(userId, app) {
  try {
    const { error } = await supabase.from('applications').insert({
      user_id: userId, ...app, created_at: new Date().toISOString()
    })
    if (error) console.error('saveApplication error:', error.message)
  } catch(e) { console.error('saveApplication exception:', e.message) }
}

export async function getUserApplications(userId) {
  try {
    const { data, error } = await supabase.from('applications').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    if (error) console.error('getUserApplications error:', error.message)
    return data || []
  } catch(e) { console.error('getUserApplications exception:', e.message); return [] }
}

export async function updateApplicationStatus(appId, status) {
  try {
    const { error } = await supabase.from('applications').update({ status, updated_at: new Date().toISOString() }).eq('id', appId)
    if (error) console.error('updateApplicationStatus error:', error.message)
  } catch(e) { console.error('updateApplicationStatus exception:', e.message) }
}
