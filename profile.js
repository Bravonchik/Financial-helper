// Функции для страницы профиля

// ──────────────────────────────────────────────
// Toast-уведомления
// ──────────────────────────────────────────────
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) { container = document.createElement('div'); container.id = 'toast-container'; document.body.appendChild(container); }
    const icons = { success: 'check-circle', error: 'exclamation-circle', info: 'info-circle' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas fa-${icons[type] || icons.success}"></i><span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast-show'));
    setTimeout(() => { toast.classList.remove('toast-show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

// ──────────────────────────────────────────────
// Тема оформления
// ──────────────────────────────────────────────
function applyTheme(theme) {
    if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', theme === 'dark' ? 'dark' : 'light');
}

function initThemeSelect() {
    const el = document.getElementById('themeSelect');
    if (!el) return;

    // Устанавливаем текущую тему по value-атрибуту (не зависит от языка интерфейса)
    const saved = localStorage.getItem('theme') || 'light';
    el.value = saved === 'dark' ? 'dark' : saved === 'auto' ? 'auto' : 'light';

    el.addEventListener('change', function () {
        if (this.value === 'dark') {
            applyTheme('dark');
        } else if (this.value === 'light') {
            applyTheme('light');
        } else {
            applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        }
        showToast(I18n.t('Тема изменена'), 'success');
    });
}

// ──────────────────────────────────────────────
// Навигация
// ──────────────────────────────────────────────
function initNavToggle() {
    const toggle = document.getElementById('navToggle');
    const menu   = document.querySelector('.nav-menu');
    if (!toggle || !menu) return;
    toggle.addEventListener('click', e => { e.stopPropagation(); const open = menu.classList.toggle('nav-open'); toggle.querySelector('i').className = open ? 'fas fa-times' : 'fas fa-bars'; });
    document.addEventListener('click', e => { if (!menu.contains(e.target) && !toggle.contains(e.target)) { menu.classList.remove('nav-open'); const ic = toggle.querySelector('i'); if (ic) ic.className = 'fas fa-bars'; } });
}

// ──────────────────────────────────────────────
// Переключение вкладок профиля
// ──────────────────────────────────────────────
function switchProfileTab(tabName, clickedEl) {
    document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.profile-tab-content').forEach(c => c.classList.remove('active'));
    const tab = clickedEl ? clickedEl.closest('.profile-tab') : document.querySelector(`.profile-tab[onclick*="${tabName}"]`);
    if (tab) tab.classList.add('active');
    const content = document.getElementById(tabName + 'Tab');
    if (content) content.classList.add('active');
}

// ──────────────────────────────────────────────
// Применить аватар к элементу .profile-photo
// ──────────────────────────────────────────────
function applyAvatar(dataUrl) {
    const el = document.querySelector('.profile-photo');
    if (!el) return;
    if (dataUrl) {
        el.style.backgroundImage    = `url(${dataUrl})`;
        el.style.backgroundSize     = 'cover';
        el.style.backgroundPosition = 'center';
        el.innerHTML = '';
    } else {
        el.style.backgroundImage = '';
        el.innerHTML = '<i class="fas fa-user"></i>';
    }
}

// ──────────────────────────────────────────────
// Загрузка данных профиля через API
// ──────────────────────────────────────────────
async function loadProfileData() {
    try {
        const data = await API.get('/profile');
        const user  = Auth.getUser();

        // Имя пользователя в шапке
        const usernameEl = document.getElementById('profileUsername');
        if (usernameEl) usernameEl.textContent = user?.username || data.username || '';

        // Форма: Имя, Фамилия, Email, Телефон
        const inputs = document.querySelectorAll('#profileTab .profile-form .form-input');
        if (inputs.length >= 4) {
            inputs[0].value = data.first_name || '';
            inputs[1].value = data.last_name  || '';
            inputs[2].value = data.email      || '';
            inputs[3].value = data.phone      || '';
        }

        // Аватар
        if (data.avatar) applyAvatar(data.avatar);

    } catch (err) {
        console.error('Ошибка загрузки профиля:', err);
    }
}

// ──────────────────────────────────────────────
// Настройки уведомлений
// ──────────────────────────────────────────────
function saveSettings() {
    const settings = {
        notifTransactions: document.getElementById('notifTransactions')?.checked,
        notifBudget:       document.getElementById('notifBudget')?.checked,
        notifReports:      document.getElementById('notifReports')?.checked,
        notifGoals:        document.getElementById('notifGoals')?.checked,
    };
    localStorage.setItem('userSettings', JSON.stringify(settings));
    showToast('Настройки сохранены', 'success');
}

function loadSettings() {
    const saved = localStorage.getItem('userSettings');
    if (!saved) return;
    const s = JSON.parse(saved);
    if (document.getElementById('notifTransactions')) document.getElementById('notifTransactions').checked = s.notifTransactions !== false;
    if (document.getElementById('notifBudget'))       document.getElementById('notifBudget').checked       = s.notifBudget       !== false;
    if (document.getElementById('notifReports'))      document.getElementById('notifReports').checked      = s.notifReports      === true;
    if (document.getElementById('notifGoals'))        document.getElementById('notifGoals').checked        = s.notifGoals        !== false;
}

// ──────────────────────────────────────────────
// Выход
// ──────────────────────────────────────────────
function logoutUser() {
    Auth.logout();
}

// ──────────────────────────────────────────────
// Сжатие изображения через Canvas → JPEG base64
// ──────────────────────────────────────────────
function compressImage(file, maxSize = 400, quality = 0.75) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(ev) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let w = img.width, h = img.height;
                // Уменьшаем если больше maxSize
                if (w > maxSize || h > maxSize) {
                    if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
                    else       { w = Math.round(w * maxSize / h); h = maxSize; }
                }
                canvas.width  = w;
                canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = reject;
            img.src = ev.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ──────────────────────────────────────────────
// Загрузка фото — сжимаем и сохраняем через API
// ──────────────────────────────────────────────
function triggerFileUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { showToast('Размер файла не должен превышать 10 МБ', 'error'); return; }

        try {
            // Сжимаем до 400×400 JPEG 75% — base64 будет ~50-100 KB
            const compressed = await compressImage(file, 400, 0.75);

            // Показываем сразу
            applyAvatar(compressed);

            // Сохраняем на сервер
            await API.put('/profile/avatar', { avatar: compressed });
            showToast('Фото сохранено', 'success');
        } catch (err) {
            showToast('Не удалось сохранить фото: ' + (err.message || err), 'error');
        }
    };
    input.click();
}

// ──────────────────────────────────────────────
// Инициализация
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function() {
    initNavToggle();
    initThemeSelect();
    loadSettings();
    await loadProfileData();

    // Кнопки загрузки фото
    document.querySelector('.photo-edit-btn')?.addEventListener('click', triggerFileUpload);
    document.querySelector('.btn-outline')   ?.addEventListener('click', e => { e.preventDefault(); triggerFileUpload(); });

    // Форма личных данных (Имя, Фамилия, Email, Телефон)
    const profileForm = document.querySelector('#profileTab .profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const inputs = profileForm.querySelectorAll('.form-input');
            try {
                await API.put('/profile', {
                    first_name: inputs[0]?.value || '',
                    last_name:  inputs[1]?.value || '',
                    email:      inputs[2]?.value || '',
                    phone:      inputs[3]?.value || '',
                });
                showToast('Изменения сохранены', 'success');
            } catch (err) { showToast(err.message, 'error'); }
        });
    }

    // Смена пароля
    document.getElementById('changePasswordForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const inputs = this.querySelectorAll('input[type="password"]');
        const current_password = inputs[0]?.value;
        const new_password     = inputs[1]?.value;
        const confirm_password = inputs[2]?.value;

        if (new_password !== confirm_password) { showToast('Пароли не совпадают', 'error'); return; }
        try {
            await API.put('/profile/password', { current_password, new_password });
            showToast('Пароль изменён', 'success');
            this.reset();
        } catch (err) { showToast(err.message, 'error'); }
    });
});

window.switchProfileTab = switchProfileTab;
window.saveSettings     = saveSettings;
window.logoutUser       = logoutUser;
