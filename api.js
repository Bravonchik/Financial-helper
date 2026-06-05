// ──────────────────────────────────────────────
// API-клиент — единая точка для всех запросов к серверу
// ──────────────────────────────────────────────
const API = (() => {
  const BASE = '/api';

  function getToken() {
    return localStorage.getItem('authToken');
  }

  async function request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;

    let res;
    try {
      res = await fetch(BASE + path, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new Error('Нет соединения с сервером');
    }

    const data = await res.json().catch(() => ({}));

    if (res.status === 401) {
      localStorage.removeItem('authToken');
      const p = location.pathname;
      const isAuth = p.endsWith('login.html') || p.endsWith('/login') ||
                     p.endsWith('register.html') || p.endsWith('/register');
      if (!isAuth) {
        location.replace('login.html');
        return;
      }
      // На страницах входа/регистрации — бросаем ошибку с текстом от сервера
      throw new Error(data.error || 'Неверное имя пользователя или пароль');
    }

    if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
    return data;
  }

  return {
    get:    (path)        => request('GET',    path),
    post:   (path, body)  => request('POST',   path, body),
    put:    (path, body)  => request('PUT',    path, body),
    delete: (path)        => request('DELETE', path),
    getToken,
  };
})();
