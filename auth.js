// ──────────────────────────────────────────────
// Модуль авторизации (JWT + сервер)
// ──────────────────────────────────────────────
const Auth = (() => {
  const TOKEN_KEY = 'authToken';
  const USER_KEY  = 'authUser';

  function getToken()    { return localStorage.getItem(TOKEN_KEY); }
  function setToken(t)   { localStorage.setItem(TOKEN_KEY, t); }
  function removeToken() { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); }

  function getUser()     { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } }
  function setUser(u)    { localStorage.setItem(USER_KEY, JSON.stringify(u)); }

  function isAuthenticated() { return !!getToken(); }

  function requireAuth() {
    if (!isAuthenticated()) {
      const p = location.pathname;
      const isAuth = p.endsWith('login.html') || p.endsWith('/login') ||
                     p.endsWith('register.html') || p.endsWith('/register');
      if (!isAuth) location.replace('login.html');
    }
  }

  async function login(username, password) {
    const data = await API.post('/auth/login', { username, password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(username, password) {
    const data = await API.post('/auth/register', { username, password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    removeToken();
    location.href = 'login.html';
  }

  return { getToken, getUser, isAuthenticated, requireAuth, login, register, logout };
})();

// Авто-защита страниц (кроме login и register)
Auth.requireAuth();
