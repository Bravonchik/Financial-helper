// Функции для проверки авторизации

// Проверка авторизации при загрузке страницы
function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Если пользователь не авторизован и не на странице входа/регистрации
    if (isLoggedIn !== 'true' && currentPage !== 'login.html' && currentPage !== 'register.html') {
        window.location.href = 'login.html';
        return false;
    }
    
    // Если пользователь авторизован и на странице входа, перенаправляем на главную
    // Но только если это не первая загрузка (чтобы избежать конфликтов)
    if (isLoggedIn === 'true' && (currentPage === 'login.html' || currentPage === 'register.html')) {
        // Не перенаправляем автоматически, чтобы пользователь мог выйти
        // return false;
    }
    
    return true;
}

// Выход из аккаунта
function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userData');
        localStorage.removeItem('guestMode');
        window.location.href = 'login.html';
    }
}

// Добавление кнопки выхода в навигацию
function addLogoutButton() {
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu && !document.querySelector('.logout-btn')) {
        const logoutBtn = document.createElement('a');
        logoutBtn.href = '#';
        logoutBtn.className = 'nav-link logout-btn';
        logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i><span>Выйти</span>';
        logoutBtn.onclick = function(e) {
            e.preventDefault();
            logout();
        };
        navMenu.appendChild(logoutBtn);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Не проверяем авторизацию на странице входа
    if (currentPage !== 'login.html' && currentPage !== 'register.html') {
        checkAuth();
        addLogoutButton();
    }
});

