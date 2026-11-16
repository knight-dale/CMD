const SUPABASE_URL = 'https://zjgfjzxvtosclwjfbafg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_sdiVwLUkWBB0PqUjKEm1YA_d50-DQjQ';
const GOOGLE_SCRIPT_BACKEND_URL = 'https://script.google.com/macros/s/AKfycbxy8Up4A5UHCEdPXsj2GHYdCYA-QQ-O2Se9HBkHsQlWhaID8stZJe8vEeY62ii5_GTGTg/exec';

let supabaseClientInstance = null;
let cachedUser = null;
let cachedIsAdmin = null;

function initSupabase() {
  if (typeof window !== 'undefined' && window.supabase) {
    if (!supabaseClientInstance && SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
      supabaseClientInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      supabaseClientInstance.auth.onAuthStateChange((event, session) => {
        cachedUser = session ? session.user : null;
        if (!cachedUser) cachedIsAdmin = null;
      });
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
  if (cachedUser) return cachedUser;
  const client = getClient();
  if (!client) return null;
  try {
    const { data: { session } } = await client.auth.getSession();
    if (session && session.user) {
      cachedUser = session.user;
      return cachedUser;
    }
    const { data: { user }, error } = await client.auth.getUser();
    if (error) return null;
    cachedUser = user;
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
  cachedUser = null;
  cachedIsAdmin = null;
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
  if (!client) return null;
  const { data, error } = await client
    .from('leaderboard')
    .select('id, display_name, points, badges, submission_count')
    .order('points', { ascending: false })
    .limit(50);
  if (error) {
    console.error('Leaderboard fetch failed:', error);
    return null;
  }
  return data || [];
}

async function fetchSuggestions() {
  const client = getClient();
  let remoteData = [];
  if (client) {
    try {
      const { data, error } = await client
        .from('suggestions')
        .select('*')
        .order('votes', { ascending: false });
      if (!error && data) {
        remoteData = data;
      }
    } catch {
    }
  }

  let localData = [];
  try {
    localData = JSON.parse(localStorage.getItem('cmd_local_suggestions') || '[]');
  } catch {
  }

  const combined = [...remoteData];
  localData.forEach(loc => {
    if (!combined.some(r => r.id === loc.id || r.text === loc.text)) {
      combined.push(loc);
    }
  });

  return combined;
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

function getPublicUrl(bucketName, filePath) {
  const client = getClient();
  if (!client) return '#';
  const { data } = client.storage.from(bucketName).getPublicUrl(filePath);
  return data ? data.publicUrl : '#';
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

async function fetchMembers() {
  const client = getClient();
  let members = [];

  if (client) {
    try {
      const { data, error } = await client.rpc('get_admin_members');
      if (!error && Array.isArray(data) && data.length > 0) {
        members = data;
      }
    } catch {}

    if (members.length === 0) {
      try {
        const { data, error } = await client.from('members').select('*');
        if (!error && Array.isArray(data) && data.length > 0) {
          members = data;
        }
      } catch {}
    }

    if (members.length === 0) {
      try {
        const [lbRes, subRes] = await Promise.allSettled([
          client.from('leaderboard').select('*'),
          client.from('challenge_submissions').select('member_name, member_email, created_at')
        ]);

        const map = {};
        if (lbRes.status === 'fulfilled' && lbRes.value.data) {
          lbRes.value.data.forEach(lb => {
            const email = (lb.member_email || '').toLowerCase().trim();
            if (email) {
              map[email] = {
                id: lb.id,
                email: email,
                display_name: lb.display_name || email.split('@')[0],
                points: lb.points || 0,
                submission_count: lb.submission_count || 0,
                created_at: lb.updated_at || new Date().toISOString()
              };
            }
          });
        }

        if (subRes.status === 'fulfilled' && subRes.value.data) {
          subRes.value.data.forEach(s => {
            const email = (s.member_email || '').toLowerCase().trim();
            if (!email) return;
            if (!map[email]) {
              map[email] = {
                id: 'sub_m_' + Math.random().toString(36).slice(2, 9),
                email: email,
                display_name: s.member_name || email.split('@')[0],
                points: 0,
                submission_count: 1,
                created_at: s.created_at || new Date().toISOString()
              };
            } else {
              if (s.created_at && new Date(s.created_at) < new Date(map[email].created_at)) {
                map[email].created_at = s.created_at;
              }
            }
          });
        }

        members = Object.values(map);
      } catch {}
    }
  }

  if (members.length === 0) {
    try {
      const gsMembers = await sendToBackend('get_members');
      if (Array.isArray(gsMembers) && gsMembers.length > 0) {
        members = gsMembers;
      }
    } catch {}
  }

  if (client && members.length > 0) {
    try {
      const { data: lbData } = await client.from('leaderboard').select('member_email, points, submission_count');
      if (lbData) {
        const lbMap = {};
        lbData.forEach(l => {
          if (l.member_email) lbMap[l.member_email.toLowerCase().trim()] = l;
        });
        members.forEach(m => {
          const l = lbMap[(m.email || '').toLowerCase().trim()];
          if (l) {
            m.points = l.points !== undefined ? l.points : m.points;
            m.submission_count = l.submission_count !== undefined ? l.submission_count : m.submission_count;
          }
        });
      }
    } catch {}
  }

  members.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  return members;
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
  const client = getClient();
  const user = await getCurrentUser();
  const userName = user ? (user.user_metadata?.display_name || user.email.split('@')[0]) : 'Student Member';
  let created = null;

  if (client && user) {
    try {
      const { data, error } = await client.from('suggestions').insert([{
        user_id: user.id,
        display_name: userName,
        text: text.trim(),
        votes: 0,
        is_selected: false
      }]).select();
      if (!error && data && data.length > 0) {
        created = data[0];
      }
    } catch {
    }
  }

  const localItem = created || {
    id: 'sug_' + Date.now(),
    display_name: userName,
    text: text.trim(),
    votes: 0,
    is_selected: false,
    created_at: new Date().toISOString()
  };

  try {
    const list = JSON.parse(localStorage.getItem('cmd_local_suggestions') || '[]');
    list.unshift(localItem);
    localStorage.setItem('cmd_local_suggestions', JSON.stringify(list));
  } catch {
  }

  try {
    await sendToBackend('submit_suggestion', { text });
  } catch {
  }

  return localItem;
}

async function voteOnSuggestion(suggestionId) {
  const client = getClient();
  const user = await getCurrentUser();
  if (client && user) {
    try {
      await client.from('suggestion_votes').insert([{
        user_id: user.id,
        suggestion_id: suggestionId
      }]);
    } catch {
    }
  }
  return await sendToBackend('vote_suggestion', { suggestionId });
}

async function submitChallengeEntry(entryData) {
  return await sendToBackend('submit_challenge_entry', { entry: entryData });
}

async function submitChallengeEntryWithScoring(entryData) {
  const backendResult = await sendToBackend('submit_challenge_entry', { entry: entryData });

  if (!backendResult) {
    throw new Error('Submission could not be processed. Please try again.');
  }

  const massTier = backendResult.massTier || 'OFF';
  const cogTier = backendResult.cogTier || 'OFF';
  const massPoints = backendResult.massPoints !== undefined
    ? backendResult.massPoints
    : (massTier === 'EXACT' ? 30 : (massTier === 'TOLERANCE' ? 15 : 0));
  const cogPoints = backendResult.cogPoints !== undefined
    ? backendResult.cogPoints
    : (cogTier === 'EXACT' ? 15 : (cogTier === 'TOLERANCE' ? 7 : 0));
  const promptBonus = !!backendResult.promptBonus;
  const pointsAwarded = backendResult.pointsAwarded !== undefined
    ? backendResult.pointsAwarded
    : (massPoints + cogPoints + (promptBonus ? 10 : 0));
  const totalPoints = backendResult.totalPoints !== undefined ? backendResult.totalPoints : pointsAwarded;

  return {
    massCorrect: massTier !== 'OFF',
    cogCorrect: cogTier !== 'OFF',
    massTier, cogTier, massPoints, cogPoints,
    promptBonus, pointsAwarded, totalPoints
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
  if (cachedIsAdmin !== null) return cachedIsAdmin;
  const client = getClient();
  try {
    const user = await getCurrentUser();
    if (!user) {
      cachedIsAdmin = false;
      return false;
    }
    const userEmail = (user.email || '').toLowerCase().trim();
    if (EXECUTIVE_ADMIN_EMAILS.includes(userEmail)) {
      cachedIsAdmin = true;
      return true;
    }
    if (client) {
      const { data } = await client.from('admin_users').select('id').eq('user_id', user.id).maybeSingle();
      if (data) {
        cachedIsAdmin = true;
        return true;
      }
    }
    const result = await sendToBackend('verify_admin');
    cachedIsAdmin = !!result;
    return cachedIsAdmin;
  } catch {
    return false;
  }
}

async function submitProblemSubmission(problemId, approachTitle, approachDescription, pdfFile, imageFiles) {
  const client = getClient();
  if (!client) throw new Error('Supabase client unconfigured.');

  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated.');

  const name = user.user_metadata?.display_name || user.email.split('@')[0];
  const email = user.email;

  // Upload PDF if provided
  let pdfUrl = null;
  if (pdfFile) {
    const path = `problem_approaches/${problemId}/${Date.now()}_${pdfFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    pdfUrl = await uploadFile('problem-approaches', path, pdfFile);
  }

  // Upload images if provided
  let imageUrls = [];
  if (imageFiles && imageFiles.length > 0) {
    for (let i = 0; i < Math.min(imageFiles.length, 5); i++) {
      const imageFile = imageFiles[i];
      const path = `problem_approaches/${problemId}/${Date.now()}_${i}_${imageFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const imageUrl = await uploadFile('problem-approaches', path, imageFile);
      imageUrls.push(imageUrl);
    }
  }

  // Insert the problem submission
  const { data, error } = await client.from('problem_submissions').insert({
    problem_id: problemId,
    member_name: name,
    member_email: email,
    approach_title: approachTitle,
    approach_description: approachDescription,
    pdf_url: pdfUrl,
    images: imageUrls,
    status: 'pending',
    votes: 0,
    is_approved: false
  }).select();

  if (error) throw error;
  return data;
}

async function fetchProblemSubmissions(problemId) {
  const client = getClient();
  if (!client) return [];

  try {
    let query = client.from('problem_submissions').select('*').order('created_at', { ascending: false });
    if (problemId) query = query.eq('problem_id', problemId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching problem submissions:', err);
    return [];
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
  getPublicUrl,
  submitChallengeEntry,
  submitChallengeEntryWithScoring,
  fetchSubmissions,
  fetchMembers,
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
  isAdmin,
  submitProblemSubmission,
  fetchProblemSubmissions
};
