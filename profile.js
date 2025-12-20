// Функции для страницы профиля

document.addEventListener('DOMContentLoaded', function() {
    // Обработка загрузки фото
    const photoEditBtn = document.querySelector('.photo-edit-btn');
    const uploadBtn = document.querySelector('.btn-outline');
    
    if (photoEditBtn) {
        photoEditBtn.addEventListener('click', function() {
            triggerFileUpload();
        });
    }
    
    if (uploadBtn) {
        uploadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            triggerFileUpload();
        });
    }

    // Обработка формы профиля
    const profileForm = document.querySelector('.profile-form');
    if (profileForm) {
        // Загружаем сохраненные данные
        loadProfileData();
        
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                firstName: profileForm.querySelectorAll('.form-input')[0].value,
                lastName: profileForm.querySelectorAll('.form-input')[1].value,
                email: profileForm.querySelectorAll('.form-input')[2].value,
                phone: profileForm.querySelectorAll('.form-input')[3].value
            };
            
            localStorage.setItem('profileData', JSON.stringify(formData));
            alert('Изменения успешно сохранены!');
        });
    }

    // Загрузка финансовых настроек
    const financialSettings = document.querySelectorAll('.profile-section')[1]?.querySelector('.profile-form');
    if (financialSettings) {
        loadFinancialSettings();
        
        financialSettings.addEventListener('change', function() {
            const settings = {
                currency: financialSettings.querySelectorAll('.form-input')[0].value,
                monthStart: financialSettings.querySelectorAll('.form-input')[1].value
            };
            localStorage.setItem('financialSettings', JSON.stringify(settings));
        });
    }
});

function loadProfileData() {
    const saved = localStorage.getItem('profileData');
    if (saved) {
        const data = JSON.parse(saved);
        const inputs = document.querySelectorAll('.profile-form .form-input');
        if (inputs.length >= 4) {
            inputs[0].value = data.firstName || 'Алексей';
            inputs[1].value = data.lastName || 'Иванов';
            inputs[2].value = data.email || 'alexey.ivanov@example.com';
            inputs[3].value = data.phone || '+7 (999) 123-45-67';
        }
    }
}

function loadFinancialSettings() {
    const saved = localStorage.getItem('financialSettings');
    if (saved) {
        const data = JSON.parse(saved);
        const financialForm = document.querySelectorAll('.profile-section')[1]?.querySelector('.profile-form');
        if (financialForm) {
            const inputs = financialForm.querySelectorAll('.form-input');
            if (inputs.length >= 2) {
                inputs[0].value = data.currency || 'Р Российский рубль';
                inputs[1].value = data.monthStart || '1-е число';
            }
        }
    }
}

// Переключение вкладок профиля
function switchProfileTab(tabName) {
    // Убираем активный класс со всех вкладок и контента
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.profile-tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Добавляем активный класс к выбранной вкладке
    event.target.closest('.profile-tab').classList.add('active');
    
    // Показываем соответствующий контент
    const tabContent = document.getElementById(tabName + 'Tab');
    if (tabContent) {
        tabContent.classList.add('active');
    }
}

// Сохранение настроек
function saveSettings() {
    const settings = {
        notifTransactions: document.getElementById('notifTransactions').checked,
        notifBudget: document.getElementById('notifBudget').checked,
        notifReports: document.getElementById('notifReports').checked,
        notifGoals: document.getElementById('notifGoals').checked
    };
    localStorage.setItem('userSettings', JSON.stringify(settings));
    alert('Настройки сохранены!');
}

// Загрузка настроек
function loadSettings() {
    const saved = localStorage.getItem('userSettings');
    if (saved) {
        const settings = JSON.parse(saved);
        if (document.getElementById('notifTransactions')) {
            document.getElementById('notifTransactions').checked = settings.notifTransactions !== false;
        }
        if (document.getElementById('notifBudget')) {
            document.getElementById('notifBudget').checked = settings.notifBudget !== false;
        }
        if (document.getElementById('notifReports')) {
            document.getElementById('notifReports').checked = settings.notifReports === true;
        }
        if (document.getElementById('notifGoals')) {
            document.getElementById('notifGoals').checked = settings.notifGoals !== false;
        }
    }
}

// Обработка формы смены пароля
document.addEventListener('DOMContentLoaded', function() {
    loadSettings();
    
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Пароль успешно изменен!');
            changePasswordForm.reset();
        });
    }
});

// Делаем функции глобальными для использования в onclick
window.switchProfileTab = switchProfileTab;
window.saveSettings = saveSettings;

function triggerFileUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Размер файла не должен превышать 5 МБ');
                return;
            }
            const reader = new FileReader();
            reader.onload = function(e) {
                const profilePhoto = document.querySelector('.profile-photo');
                if (profilePhoto) {
                    profilePhoto.style.backgroundImage = `url(${e.target.result})`;
                    profilePhoto.style.backgroundSize = 'cover';
                    profilePhoto.style.backgroundPosition = 'center';
                    profilePhoto.innerHTML = '';
                }
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

