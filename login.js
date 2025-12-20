// Функции для страницы входа

// Делаем функцию глобальной
window.togglePassword = function() {
    const passwordInput = document.getElementById('loginPassword');
    const passwordIcon = document.getElementById('passwordIcon');
    
    if (!passwordInput || !passwordIcon) return;
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        passwordIcon.classList.remove('fa-eye');
        passwordIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        passwordIcon.classList.remove('fa-eye-slash');
        passwordIcon.classList.add('fa-eye');
    }
}

// Продолжить без регистрации
window.continueWithoutRegistration = function(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    console.log('Продолжить без регистрации - начало');
    
    try {
        // Устанавливаем флаг гостевого доступа
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('guestMode', 'true');
        localStorage.setItem('userData', JSON.stringify({
            email: 'guest@example.com',
            guest: true,
            loginTime: new Date().toISOString()
        }));
        
        console.log('Данные сохранены, перенаправление...');
        
        // Перенаправление на главную страницу
        setTimeout(function() {
            window.location.href = 'index.html';
        }, 100);
    } catch (error) {
        console.error('Ошибка при продолжении без регистрации:', error);
        alert('Произошла ошибка. Попробуйте обновить страницу.');
    }
    return false;
}

// Показать сообщение о регистрации
window.showRegisterMessage = function() {
    alert('Функция регистрации будет доступна в ближайшее время. Вы можете продолжить без регистрации, нажав кнопку "Продолжить без регистрации".');
}

// Показать сообщение о восстановлении пароля
window.showForgotPasswordMessage = function() {
    alert('Функция восстановления пароля будет доступна в ближайшее время. Вы можете продолжить без регистрации, нажав кнопку "Продолжить без регистрации".');
}

// Функция входа
window.handleLogin = function(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    console.log('Обработка входа - начало');
    
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const rememberMeInput = document.getElementById('rememberMe');
    
    if (!emailInput || !passwordInput) {
        console.error('Не найдены поля ввода');
        alert('Ошибка: поля формы не найдены');
        return false;
    }
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const rememberMe = rememberMeInput ? rememberMeInput.checked : false;
    
    // Проверка данных
    if (!email || !password) {
        alert('Пожалуйста, заполните все поля');
        return false;
    }
    
    try {
        // Сохранение данных пользователя
        const userData = {
            email: email,
            rememberMe: rememberMe,
            loginTime: new Date().toISOString(),
            guest: false
        };
        
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.removeItem('guestMode'); // Убираем гостевой режим при обычном входе
        
        console.log('Данные сохранены, перенаправление...');
        
        // Перенаправление на главную страницу
        setTimeout(function() {
            window.location.href = 'index.html';
        }, 100);
    } catch (error) {
        console.error('Ошибка при входе:', error);
        alert('Произошла ошибка при входе. Попробуйте еще раз.');
        return false;
    }
    
    return false;
}

// Обработка формы входа
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            handleLogin(e);
        });
    }
    
    // Обработчик для кнопки "Продолжить без регистрации"
    const continueBtn = document.getElementById('continueWithoutRegBtn');
    if (continueBtn) {
        continueBtn.addEventListener('click', function(e) {
            continueWithoutRegistration(e);
        });
    }
    
    // Проверка, не залогинен ли уже пользователь (опционально, можно убрать)
    // const isLoggedIn = localStorage.getItem('isLoggedIn');
    // if (isLoggedIn === 'true') {
    //     const currentPage = window.location.pathname.split('/').pop();
    //     if (currentPage === 'login.html') {
    //         // Не перенаправляем автоматически, чтобы пользователь мог выйти
    //     }
    // }
});

