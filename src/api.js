const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export async function fetchForecast(symbol, { historyDays = 90, predLen = 10 } = {}) {
  const url = `${API_BASE}/api/predict?symbol=${encodeURIComponent(symbol)}&history_days=${historyDays}&pred_len=${predLen}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  return res.json();
}
