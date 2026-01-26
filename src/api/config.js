// ✅ URL CORRECTA: registromono.monognomo.com
export const API_BASE_URL = "https://registromono.monognomo.com"; 

export const API_ENDPOINTS = {
  // 🔐 LOGIN (Imprescindible para entrar)
  LOGIN: `${API_BASE_URL}/api.php?action=login`,

  // 1. CARGA INICIAL
  GET_INITIAL_DATA: `${API_BASE_URL}/api.php?action=get_initial_data`,

  // 2. GESTIÓN DE HORAS
  ADD_ENTRY: `${API_BASE_URL}/api.php?action=add_entry`,
  GET_ENTRIES: `${API_BASE_URL}/api.php?action=get_entries`,

  // 3. LOGÍSTICA
  GET_USER_EVENTS: `${API_BASE_URL}/api.php?action=get_user_events`,
};