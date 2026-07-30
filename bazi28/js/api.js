import { supabase } from "./config.js";

function failure(error, fallback = "服務暫時無法使用") {
  const message = error?.message || fallback;
  throw new Error(message);
}

async function functionFailure(error, fallback = "守護天使暫時無法回應，請稍後再試") {
  let message = "";
  const response = error?.context;
  if (response && typeof response.clone === "function") {
    try {
      const payload = await response.clone().json();
      if (typeof payload?.error === "string") message = payload.error;
    } catch {
      // The response may not contain JSON. Use a safe localized fallback below.
    }
  }
  if (!message) {
    const raw = String(error?.message || "");
    message = /non-2xx|failed to send|fetch/i.test(raw) ? fallback : raw;
  }
  throw new Error(message || fallback);
}

export async function invoke(functionName, body) {
  const { data, error } = await supabase.functions.invoke(functionName, { body });
  if (error) await functionFailure(error);
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) failure(error, "無法取得登入狀態");
  return data.session;
}

export async function loadUserState(userId, today) {
  const [profile, answers, reviews, goal, model, guardian, daily, chat, admin, metaphysics] = await Promise.all([
    supabase.from("destiny_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("destiny_journey_answers").select("*").eq("user_id", userId).order("day_index"),
    supabase.from("destiny_weekly_reviews").select("*").eq("user_id", userId).order("week_index"),
    supabase.from("destiny_goals").select("*").eq("user_id", userId).eq("status", "active").maybeSingle(),
    supabase.from("destiny_self_models").select("*").eq("user_id", userId).eq("status", "active").maybeSingle(),
    supabase.from("destiny_guardians").select("id,status,character_spec,is_active").eq("user_id", userId).eq("is_active", true).maybeSingle(),
    supabase.from("destiny_daily_actions").select("*").eq("user_id", userId).eq("action_date", today).maybeSingle(),
    supabase.from("destiny_ai_chats").select("*").eq("user_id", userId).eq("chat_date", today).maybeSingle(),
    supabase.from("destiny_admins").select("user_id").eq("user_id", userId).maybeSingle(),
    supabase.from("destiny_metaphysics_submissions").select("*").eq("user_id", userId)
      .order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const firstError = [profile, answers, reviews, goal, model, guardian, daily, chat, admin, metaphysics].find((item) => item.error)?.error;
  if (firstError) failure(firstError, "無法讀取個人資料");
  return {
    profile: profile.data,
    answers: answers.data ?? [],
    reviews: reviews.data ?? [],
    goal: goal.data,
    model: model.data,
    guardian: guardian.data,
    daily: daily.data,
    chat: chat.data,
    isAdmin: Boolean(admin.data),
    metaphysicsLatest: metaphysics.data,
  };
}

export async function saveJourneyAnswer(payload) {
  const { data, error } = await supabase.from("destiny_journey_answers").insert(payload).select().single();
  if (error) failure(error, "今天的回答尚未儲存");
  return data;
}

export async function updateJourneyProgress(userId, count) {
  const { error } = await supabase.from("destiny_profiles").update({
    journey_completed_count: count,
    model_confidence: Math.min(.9, .1 + count / 30 * .8),
  }).eq("user_id", userId);
  if (error) failure(error, "探索進度尚未更新");
}

export async function saveGoal(payload) {
  const { data, error } = await supabase.from("destiny_goals").insert(payload).select().single();
  if (error) failure(error, "目標尚未儲存");
  return data;
}

export async function updateGoalProgress(goalId, userId, currentValue) {
  const { data, error } = await supabase.from("destiny_goals").update({
    current_value: currentValue,
    updated_at: new Date().toISOString(),
  }).eq("id", goalId).eq("user_id", userId).select().single();
  if (error) failure(error, "目標進度尚未儲存");
  return data;
}

export async function saveWeeklyReview(payload) {
  const { data, error } = await supabase.from("destiny_weekly_reviews").upsert(payload, {
    onConflict: "user_id,week_index",
  }).select().single();
  if (error) failure(error, "每週回顧尚未儲存");
  return data;
}

export async function signInWithGoogle() {
  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  if (error) failure(error, "Google 登入失敗");
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) failure(error, "登出失敗");
}
