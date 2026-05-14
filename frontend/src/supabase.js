import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://caixavwbujecvffdudkd.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Auth ──────────────────────────────────────────────────────────────────────
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
  try { await supabase.auth.signOut() } catch(e) { console.error('signOut error:', e.message) }
}

export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (error && error.code !== 'PGRST116') console.error('getUserProfile error:', error.message)
    return data
  } catch(e) { console.error('getUserProfile exception:', e.message); return null }
}

// ── Resumes ───────────────────────────────────────────────────────────────────
export async function saveResume(userId, content, jobTitle, company, atsScore) {
  try {
    const { data, error } = await supabase.from('resumes').insert({
      user_id: userId,
      job_title: jobTitle || 'Role',
      company: company || 'Company',
      ats_score: atsScore || 0,
      rejection_risk: content?.rejectionRisk?.score || 0,
      human_appeal: content?.hiringManagerScore || 0,
      salary_min: content?.salaryIntelligence?.marketMin || null,
      salary_max: content?.salaryIntelligence?.marketMax || null,
      content,
      created_at: new Date().toISOString()
    }).select('id').single()
    if (error) console.error('saveResume error:', error.message)
    // Also track in user_usage (new table — gracefully ignores if not created yet)
    try {
      const month = new Date().toISOString().slice(0, 7) // "YYYY-MM"
      await supabase.rpc('increment_usage', { p_user_id: userId, p_month: month })
    } catch { /* user_usage table may not exist yet */ }
    return data
  } catch(e) { console.error('saveResume exception:', e.message); return null }
}

export async function getUserResumes(userId) {
  try {
    const { data, error } = await supabase
      .from('resumes')
      .select('id, job_title, company, ats_score, rejection_risk, human_appeal, salary_min, salary_max, created_at, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    if (error) console.error('getUserResumes error:', error.message)
    return data || []
  } catch(e) { console.error('getUserResumes exception:', e.message); return [] }
}

// ── Usage tracking ────────────────────────────────────────────────────────────
export async function getMonthlyUsage(userId) {
  // Try user_usage table first (more efficient), fall back to counting resumes
  try {
    const month = new Date().toISOString().slice(0, 7)
    const { data, error } = await supabase
      .from('user_usage')
      .select('count')
      .eq('user_id', userId)
      .eq('month', month)
      .single()
    if (!error && data) return data.count || 0
  } catch { /* table may not exist — fall through */ }

  // Fallback: count from resumes table
  try {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const { count, error } = await supabase
      .from('resumes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString())
    if (error) console.error('getMonthlyUsage fallback error:', error.message)
    return count || 0
  } catch(e) { console.error('getMonthlyUsage exception:', e.message); return 0 }
}

// ── Resume versions ───────────────────────────────────────────────────────────
export async function saveResumeVersion(resumeId, userId, versionLabel, content, atsScore) {
  try {
    const { error } = await supabase.from('resume_versions').insert({
      resume_id: resumeId,
      user_id: userId,
      version_label: versionLabel || 'v1',
      ats_score: atsScore || 0,
      content,
      created_at: new Date().toISOString()
    })
    if (error) console.error('saveResumeVersion error:', error.message)
  } catch(e) { console.error('saveResumeVersion exception:', e.message) }
}

export async function getResumeVersions(resumeId) {
  try {
    const { data, error } = await supabase
      .from('resume_versions')
      .select('*')
      .eq('resume_id', resumeId)
      .order('created_at', { ascending: false })
    if (error) console.error('getResumeVersions error:', error.message)
    return data || []
  } catch(e) { console.error('getResumeVersions exception:', e.message); return [] }
}

// ── Applications ──────────────────────────────────────────────────────────────
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
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) console.error('getUserApplications error:', error.message)
    return data || []
  } catch(e) { console.error('getUserApplications exception:', e.message); return [] }
}

export async function updateApplicationStatus(appId, status) {
  try {
    const { error } = await supabase
      .from('applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', appId)
    if (error) console.error('updateApplicationStatus error:', error.message)
  } catch(e) { console.error('updateApplicationStatus exception:', e.message) }
}
