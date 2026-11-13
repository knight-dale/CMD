const SUPABASE_URL = 'https://zjgfjzxvtosclwjfbafg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_sdiVwLUkWBB0PqUjKEm1YA_d50-DQjQ';
const GOOGLE_SCRIPT_BACKEND_URL = 'https://script.google.com/macros/s/AKfycbxy8Up4A5UHCEdPXsj2GHYdCYA-QQ-O2Se9HBkHsQlWhaID8stZJe8vEeY62ii5_GTGTg/exec';

let supabaseClientInstance = null;

function initSupabase() {
  if (typeof window !== 'undefined' && window.supabase) {
    if (!supabaseClientInstance && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
      supabaseClientInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return supabaseClientInstance;
  }
  return null;
}

function getClient() {
  if (!supabaseClientInstance) {
    initSupabase();
  }
  return supabaseClientInstance;
}

async function getCurrentUser() {
  const client = getClient();
  if (!client) return null;
  try {
    const { data: { user }, error } = await client.auth.getUser();
    if (error) return null;
    return user;
  } catch {
    return null;
  }
}

async function signIn(email, password) {
  const client = getClient();
  if (!client) throw new Error('Supabase client unconfigured.');
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signUp(email, password, displayName) {
  const client = getClient();
  if (!client) throw new Error('Supabase client unconfigured.');
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } }
  });
  if (error) throw error;
  return data;
}

async function signInWithGoogle() {
  const client = getClient();
  if (!client) throw new Error('Supabase client unconfigured.');
  const redirectTo = new URL('index.html', window.location.href).href;
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo }
  });
  if (error) throw error;
  return data;
}

function getDisplayName(user) {
  const m = (user && user.user_metadata) || {};
  return m.display_name || m.full_name || m.name || (user && user.email) || null;
}

async function signOut() {
  const client = getClient();
  if (!client) return;
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

async function resetPassword(email) {
  const client = getClient();
  if (!client) throw new Error('Supabase client unconfigured.');
  const redirectTo = window.location.origin + window.location.pathname;
  const { data, error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
  return data;
}

async function updatePassword(newPassword) {
  const client = getClient();
  if (!client) throw new Error('Supabase client unconfigured.');
  const { data, error } = await client.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return data;
}

async function sendToBackend(action, payload = {}) {
  const user = await getCurrentUser();
  const requestBody = JSON.stringify({
    action,
    userId: user ? user.id : null,
    userEmail: user ? user.email : null,
    userName: getDisplayName(user),
    ...payload
  });

  const response = await fetch(GOOGLE_SCRIPT_BACKEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: requestBody
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Server validation rejected request');
  }
  return result.data;
}

async function fetchProjects(filters = {}) {
  const client = getClient();
  if (!client) return [];
  try {
    let query = client.from('projects').select('*').order('created_at', { ascending: false });
    if (filters.category && filters.category !== 'All') query = query.eq('category', filters.category);
    if (filters.stage && filters.stage !== 'All') query = query.eq('stage', filters.stage);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

async function fetchCurrentChallenge() {
  const client = getClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('challenges')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  } catch {
    return null;
  }
}

async function fetchLeaderboard() {
  const client = getClient();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('leaderboard')
      .select('*')
      .order('points', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

async function fetchSuggestions() {
  const client = getClient();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('suggestions')
      .select('*')
      .order('votes', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

async function uploadFile(bucketName, filePath, fileObj) {
  const client = getClient();
  if (!client) throw new Error('Storage client unconfigured.');
  const { data, error } = await client.storage.from(bucketName).upload(filePath, fileObj, {
    cacheControl: '3600',
    upsert: true
  });
  if (error) throw error;
  const { data: publicUrlData } = client.storage.from(bucketName).getPublicUrl(data.path);
  return publicUrlData.publicUrl;
}

async function fetchSubmissions(challengeId) {
  const client = getClient();
  if (!client) return [];
  try {
    let query = client.from('challenge_submissions').select('*').order('created_at', { ascending: false });
    if (challengeId) query = query.eq('challenge_id', challengeId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

async function fetchAllChallenges() {
  const client = getClient();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('challenges')
      .select('*')
      .order('week_number', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

async function submitSuggestion(text) {
  return await sendToBackend('submit_suggestion', { text });
}

async function voteOnSuggestion(suggestionId) {
  return await sendToBackend('vote_suggestion', { suggestionId });
}

async function submitChallengeEntry(entryData) {
  return await sendToBackend('submit_challenge_entry', { entry: entryData });
}

async function upsertLeaderboardByEmail(email, name, pointsToAdd) {
  const client = getClient();
  if (!client || !email) return;
  const normalizedEmail = email.toLowerCase().trim();
  const pts = Number.isFinite(pointsToAdd) ? pointsToAdd : 0;
  const { data: existing } = await client
    .from('leaderboard')
    .select('id, points, submission_count')
    .eq('member_email', normalizedEmail)
    .maybeSingle();
  if (existing) {
    await client.from('leaderboard').update({
      points: (existing.points || 0) + pts,
      submission_count: (existing.submission_count || 0) + 1
    }).eq('id', existing.id);
  } else {
    await client.from('leaderboard').insert([{
      member_email: normalizedEmail,
      display_name: name || normalizedEmail.split('@')[0],
      points: pts,
      submission_count: 1,
      badges: []
    }]);
  }
}

async function submitChallengeEntryWithScoring(entryData) {
  let backendResult = null;
  try {
    backendResult = await sendToBackend('submit_challenge_entry', { entry: entryData });
  } catch (err) {
  }

  let massCorrect = backendResult ? !!backendResult.massCorrect : false;
  let cogCorrect = backendResult ? !!backendResult.cogCorrect : false;
  let pointsAwarded = backendResult && backendResult.pointsAwarded !== undefined ? backendResult.pointsAwarded : 0;

  if (!backendResult) {
    const challenge = await fetchCurrentChallenge();
    if (challenge) {
      if (challenge.answer_mass != null && entryData.submitted_mass != null) {
        const tol = challenge.answer_mass_tolerance != null ? parseFloat(challenge.answer_mass_tolerance) : 0.05;
        const diff = Math.abs(entryData.submitted_mass - challenge.answer_mass);
        massCorrect = diff <= tol;
        if (massCorrect) pointsAwarded += 30;
      }
      if (challenge.answer_cog != null && entryData.submitted_cog != null) {
        const tol = challenge.answer_cog_tolerance != null ? parseFloat(challenge.answer_cog_tolerance) : 2.0;
        const diff = Math.abs(entryData.submitted_cog - challenge.answer_cog);
        cogCorrect = diff <= tol;
        if (cogCorrect) pointsAwarded += 15;
      }
    }
  }

  const client = getClient();
  if (client) {
    const submissionPayload = {
      member_name: entryData.member_name,
      member_email: (entryData.member_email || '').toLowerCase().trim(),
      model_title: entryData.model_title,
      pdf_url: entryData.pdf_url,
      notes: entryData.notes || '',
      submitted_mass: entryData.submitted_mass != null ? entryData.submitted_mass : null,
      submitted_cog: entryData.submitted_cog != null ? entryData.submitted_cog : null,
      mass_correct: massCorrect,
      cog_correct: cogCorrect,
      points_awarded: pointsAwarded
    };
    try {
      await client.from('challenge_submissions').insert([submissionPayload]);
    } catch {
    }
    try {
      await upsertLeaderboardByEmail(entryData.member_email, entryData.member_name, pointsAwarded);
    } catch {
    }
  }

  return {
    massCorrect,
    cogCorrect,
    pointsAwarded
  };
}

async function addProject(projectData) {
  const client = getClient();
  if (client) {
    const { data, error } = await client.from('projects').insert([projectData]).select();
    if (error) throw error;
    return data;
  }
  return await sendToBackend('add_project', { project: projectData });
}

async function updateProject(id, projectData) {
  const client = getClient();
  if (client) {
    const { data, error } = await client.from('projects').update(projectData).eq('id', id).select();
    if (error) throw error;
    return data;
  }
  return await sendToBackend('update_project', { id, project: projectData });
}

async function deleteProject(id) {
  const client = getClient();
  if (client) {
    const { data, error } = await client.from('projects').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
  return await sendToBackend('delete_project', { id });
}

async function addChallenge(challengeData) {
  const client = getClient();
  if (client) {
    const { data, error } = await client.from('challenges').insert([challengeData]).select();
    if (error) throw error;
    return data;
  }
  return await sendToBackend('add_challenge', { challenge: challengeData });
}

async function updateChallenge(id, challengeData) {
  const client = getClient();
  if (client) {
    const { data, error } = await client.from('challenges').update(challengeData).eq('id', id).select();
    if (error) throw error;
    return data;
  }
  return await sendToBackend('update_challenge', { id, challenge: challengeData });
}

async function deleteChallenge(id) {
  const client = getClient();
  if (client) {
    const { data, error } = await client.from('challenges').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
  return await sendToBackend('delete_challenge', { id });
}

async function addLeaderboardEntry(entryData) {
  const client = getClient();
  if (client) {
    const { data, error } = await client.from('leaderboard').insert([entryData]).select();
    if (error) throw error;
    return data;
  }
  return await sendToBackend('add_leaderboard_entry', { entry: entryData });
}

async function updateLeaderboardEntry(id, entryData) {
  const client = getClient();
  if (client) {
    const { data, error } = await client.from('leaderboard').update(entryData).eq('id', id).select();
    if (error) throw error;
    return data;
  }
  return await sendToBackend('update_leaderboard_entry', { id, entry: entryData });
}

async function deleteLeaderboardEntry(id) {
  const client = getClient();
  if (client) {
    const { data, error } = await client.from('leaderboard').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
  return await sendToBackend('delete_leaderboard_entry', { id });
}

async function deleteSuggestion(id) {
  const client = getClient();
  if (client) {
    const { data, error } = await client.from('suggestions').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
  return await sendToBackend('delete_suggestion', { id });
}

async function markSuggestionSelected(id) {
  const client = getClient();
  if (client) {
    const { data, error } = await client.from('suggestions').update({ is_selected: true }).eq('id', id).select();
    if (error) throw error;
    return data;
  }
  return await sendToBackend('select_suggestion', { id });
}

async function fetchSiteMedia() {
  const client = getClient();
  const media = {};
  if (client) {
    try {
      const { data, error } = await client.from('site_settings').select('*');
      if (!error && data) {
        data.forEach(item => {
          media[item.key] = item.value;
        });
      }
    } catch {
    }
  }
  try {
    const cached = JSON.parse(localStorage.getItem('cmd_site_media') || '{}');
    return Object.assign({}, cached, media);
  } catch {
    return media;
  }
}

async function saveSiteMediaSlot(key, url) {
  const client = getClient();
  if (client) {
    const { error } = await client.from('site_settings').upsert({
      key,
      value: url,
      updated_at: new Date().toISOString()
    });
    if (error) throw error;
  }
  try {
    const cached = JSON.parse(localStorage.getItem('cmd_site_media') || '{}');
    cached[key] = url;
    localStorage.setItem('cmd_site_media', JSON.stringify(cached));
  } catch {
  }
}

async function resetSiteMediaSlot(key) {
  const client = getClient();
  if (client) {
    const { error } = await client.from('site_settings').delete().eq('key', key);
    if (error) throw error;
  }
  try {
    const cached = JSON.parse(localStorage.getItem('cmd_site_media') || '{}');
    delete cached[key];
    localStorage.setItem('cmd_site_media', JSON.stringify(cached));
  } catch {
  }
}

const EXECUTIVE_ADMIN_EMAILS = [
  'jonathan.edwards22@students.dkut.ac.ke',
  'ouma.solomon22@students.dkut.ac.ke'
];

async function isAdmin() {
  const client = getClient();
  try {
    const user = await getCurrentUser();
    if (!user) return false;
    const userEmail = (user.email || '').toLowerCase().trim();
    if (EXECUTIVE_ADMIN_EMAILS.includes(userEmail)) return true;
    if (client) {
      const { data } = await client.from('admin_users').select('id').eq('user_id', user.id).maybeSingle();
      if (data) return true;
    }
    const result = await sendToBackend('verify_admin');
    return !!result;
  } catch {
    return false;
  }
}

window.cmdSupabase = {
  initSupabase,
  getCurrentUser,
  signIn,
  signUp,
  signInWithGoogle,
  getDisplayName,
  signOut,
  resetPassword,
  updatePassword,
  fetchProjects,
  fetchCurrentChallenge,
  fetchLeaderboard,
  fetchSuggestions,
  submitSuggestion,
  voteOnSuggestion,
  uploadFile,
  submitChallengeEntry,
  submitChallengeEntryWithScoring,
  upsertLeaderboardByEmail,
  fetchSubmissions,
  fetchAllChallenges,
  addProject,
  updateProject,
  deleteProject,
  addChallenge,
  updateChallenge,
  deleteChallenge,
  addLeaderboardEntry,
  updateLeaderboardEntry,
  deleteLeaderboardEntry,
  deleteSuggestion,
  markSuggestionSelected,
  fetchSiteMedia,
  saveSiteMediaSlot,
  resetSiteMediaSlot,
  isAdmin
};
