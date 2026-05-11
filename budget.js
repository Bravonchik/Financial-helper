// ──────────────────────────────────────────────
// Toast-уведомления
// ──────────────────────────────────────────────
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const icons = { success: 'check-circle', error: 'exclamation-circle', info: 'info-circle' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas fa-${icons[type] || icons.success}"></i><span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast-show'));
    setTimeout(() => {
        toast.classList.remove('toast-show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ──────────────────────────────────────────────
// Форматирование чисел
// ──────────────────────────────────────────────
function formatNumber(num) {
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// ──────────────────────────────────────────────
// Работа с категориями (localStorage)
// ──────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
    { name: 'Продукты',    budget: 40000, color: '#3b82f6' },
    { name: 'Транспорт',   budget: 10000, color: '#f97316' },
    { name: 'Развлечения', budget: 15000, color: '#8b5cf6' },
    { name: 'Коммунальные',budget: 8000,  color: '#14b8a6' },
    { name: 'Здоровье',    budget: 10000, color: '#ec4899' },
];

function loadCategories() {
    if (!localStorage.getItem('budgetInitialized')) {
        localStorage.setItem('budgetCategories', JSON.stringify(DEFAULT_CATEGORIES));
        localStorage.setItem('budgetInitialized', 'true');
    }
    return JSON.parse(localStorage.getItem('budgetCategories') || '[]');
}

function saveCategories(categories) {
    localStorage.setItem('budgetCategories', JSON.stringify(categories));
    localStorage.setItem('budgetInitialized', 'true');
}

// ──────────────────────────────────────────────
// Расчёт расходов из транзакций текущего месяца
// ──────────────────────────────────────────────
function getSpentByCategory() {
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    const now = new Date();
    const spent = {};
    transactions
        .filter(t => {
            const d = new Date(t.date);
            return t.type === 'expense'
                && d.getMonth() === now.getMonth()
                && d.getFullYear() === now.getFullYear();
        })
        .forEach(t => {
            spent[t.category] = (spent[t.category] || 0) + parseFloat(t.amount);
        });
    return spent;
}

// ──────────────────────────────────────────────
// Рендер одной карточки категории
// ──────────────────────────────────────────────
function renderCategoryCard(cat) {
    const percent  = cat.budget > 0 ? Math.round(cat.spent / cat.budget * 100) : 0;
    const isOver   = cat.spent > cat.budget;
    const remaining = cat.budget - cat.spent;
    const fillClass = isOver ? 'red' : percent > 80 ? 'orange' : 'green';
    const amtClass  = isOver ? 'red' : 'green';

    return `
        <div class="category-card${isOver ? ' warning' : ''}">
            <div class="category-header">
                <div class="category-icon" style="background:${cat.color}"></div>
                <h3>${escHtml(cat.name)}</h3>
            </div>
            <div class="category-amount ${amtClass}">${formatNumber(cat.spent)} Р</div>
            <div class="category-budget">из ${formatNumber(cat.budget)} Р</div>
            <div class="category-progress-bar">
                <div class="progress-fill ${fillClass}" style="width:${Math.min(percent,100)}%"></div>
            </div>
            <div class="category-footer">
                <div class="category-status${isOver ? ' warning' : ''}">
                    <i class="fas fa-${isOver ? 'exclamation-triangle' : 'check-circle'}"></i>
                    <span>${isOver
                        ? 'Превышение: ' + formatNumber(Math.abs(remaining)) + ' Р'
                        : 'Осталось: '  + formatNumber(remaining) + ' Р'}</span>
                </div>
                <div class="category-percent${isOver ? ' red' : ''}">${percent}%</div>
            </div>
            <div class="category-actions">
                <a href="#" class="action-link"
                   onclick="openEditCategoryModal('${escHtml(cat.name)}',${cat.budget},'${cat.color}'); return false;">
                    <i class="fas fa-pencil-alt"></i><span>Изменить</span>
                </a>
                <a href="#" class="action-link delete"
                   onclick="deleteCategory('${escHtml(cat.name)}'); return false;">
                    <i class="fas fa-trash"></i><span>Удалить</span>
                </a>
            </div>
        </div>`;
}

function escHtml(str) {
    return String(str)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ──────────────────────────────────────────────
// Полный рендер страницы бюджета
// ──────────────────────────────────────────────
function renderBudget() {
    const categories = loadCategories();
    const spentMap   = getSpentByCategory();

    const cats = categories.map(c => ({ ...c, spent: spentMap[c.name] || 0 }));

    // Сводка
    const totalBudget = cats.reduce((s, c) => s + c.budget, 0);
    const totalSpent  = cats.reduce((s, c) => s + c.spent,  0);
    const remaining   = totalBudget - totalSpent;
    const percent     = totalBudget > 0 ? Math.round(totalSpent / totalBudget * 100) : 0;

    setText('totalBudgetValue', formatNumber(totalBudget) + ' Р');

    const spentEl = document.getElementById('totalSpentValue');
    if (spentEl) {
        spentEl.textContent = formatNumber(totalSpent) + ' Р';
        spentEl.className   = 'summary-value ' + (totalSpent > totalBudget ? 'red' : 'green');
    }

    const remEl = document.getElementById('remainingValue');
    if (remEl) {
        remEl.textContent = (remaining < 0 ? '-' : '') + formatNumber(Math.abs(remaining)) + ' Р';
        remEl.className   = 'summary-value ' + (remaining < 0 ? 'red' : 'green');
    }

    setText('spentPercentText', percent + '% от бюджета');
    setText('spentPercent',     percent + '%');
    setText('progressEndValue', formatNumber(totalBudget) + ' Р');

    const fill = document.getElementById('mainProgressFill');
    if (fill) {
        fill.style.width = Math.min(percent, 100) + '%';
        fill.className   = 'progress-fill ' + (percent > 100 ? 'red' : percent > 80 ? 'orange' : 'green');
    }

    // Предупреждение
    const alert = document.getElementById('budgetAlert');
    if (alert) alert.style.display = cats.some(c => c.spent > c.budget) ? 'flex' : 'none';

    // Карточки категорий
    const container = document.getElementById('categoriesContainer');
    if (!container) return;

    if (cats.length === 0) {
        container.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:3rem;color:#94a3b8;">
                <i class="fas fa-chart-pie" style="font-size:3rem;display:block;margin-bottom:1rem;opacity:.3"></i>
                Категорий ещё нет. Добавьте первую категорию бюджета.
            </div>`;
        return;
    }

    container.innerHTML = cats.map(renderCategoryCard).join('');
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// ──────────────────────────────────────────────
// Модальные окна
// ──────────────────────────────────────────────
let addSelectedColor  = '#3b82f6';
let editSelectedColor = '#3b82f6';

function openAddCategoryModal() {
    addSelectedColor = '#3b82f6';
    resetColorPicker('addColorPicker', addSelectedColor);
    document.getElementById('addCategoryForm').reset();
    openModal('addCategoryModal');
}

function openEditCategoryModal(name, budget, color) {
    editSelectedColor = color;
    document.getElementById('editCategoryOriginalName').value = name;
    document.getElementById('editCategoryName').value   = name;
    document.getElementById('editCategoryAmount').value = budget;
    resetColorPicker('editColorPicker', color);
    openModal('editCategoryModal');
}

function openModal(id) {
    document.getElementById(id)?.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(id) {
    document.getElementById(id)?.classList.remove('active');
    document.body.style.overflow = '';
}

function resetColorPicker(pickerId, activeColor) {
    const picker = document.getElementById(pickerId);
    if (!picker) return;
    picker.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.color === activeColor);
        opt.onclick = function() {
            picker.querySelectorAll('.color-option').forEach(o => o.classList.remove('active'));
            this.classList.add('active');
            if (pickerId === 'addColorPicker')  addSelectedColor  = this.dataset.color;
            if (pickerId === 'editColorPicker') editSelectedColor = this.dataset.color;
        };
    });
}

function deleteCategory(name) {
    if (!confirm(`Удалить категорию "${name}"?`)) return;
    const cats = loadCategories().filter(c => c.name !== name);
    saveCategories(cats);
    renderBudget();
    showToast(`Категория "${name}" удалена`, 'info');
}

// ──────────────────────────────────────────────
// Инициализация
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    renderBudget();

    // Форма добавления
    document.getElementById('addCategoryForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const name   = document.getElementById('addCategoryName').value.trim();
        const budget = parseInt(document.getElementById('addCategoryBudget').value);

        if (!name || !budget || budget < 1) {
            showToast('Заполните все поля', 'error');
            return;
        }

        const cats = loadCategories();
        if (cats.find(c => c.name === name)) {
            showToast('Категория с таким именем уже существует', 'error');
            return;
        }

        cats.push({ name, budget, color: addSelectedColor });
        saveCategories(cats);
        closeModal('addCategoryModal');
        renderBudget();
        showToast(`Категория "${name}" добавлена`, 'success');
    });

    // Форма редактирования
    document.getElementById('editCategoryForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const originalName = document.getElementById('editCategoryOriginalName').value;
        const name   = document.getElementById('editCategoryName').value.trim();
        const budget = parseInt(document.getElementById('editCategoryAmount').value);

        if (!name || !budget || budget < 1) {
            showToast('Заполните все поля', 'error');
            return;
        }

        const cats  = loadCategories();
        const index = cats.findIndex(c => c.name === originalName);
        if (index !== -1) {
            cats[index] = { name, budget, color: editSelectedColor };
            saveCategories(cats);
            closeModal('editCategoryModal');
            renderBudget();
            showToast('Изменения сохранены', 'success');
        }
    });

    // Закрытие по клику вне
    document.addEventListener('click', e => {
        document.querySelectorAll('.modal').forEach(m => {
            if (e.target === m) closeModal(m.id);
        });
    });
});

window.openAddCategoryModal  = openAddCategoryModal;
window.openEditCategoryModal = openEditCategoryModal;
window.closeModal            = closeModal;
window.deleteCategory        = deleteCategory;
