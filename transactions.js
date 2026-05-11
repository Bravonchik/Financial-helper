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
// Дефолтные транзакции (загружаются при первом запуске)
// ──────────────────────────────────────────────
const DEFAULT_TRANSACTIONS = [
    { id: 1, date: '2025-11-01', category: 'Зарплата',      description: 'Основная работа',         type: 'income',  amount: '150000' },
    { id: 2, date: '2025-11-01', category: 'Продукты',      description: 'Супермаркет Пятёрочка',    type: 'expense', amount: '3200'   },
    { id: 3, date: '2025-10-31', category: 'Транспорт',     description: 'Метро',                    type: 'expense', amount: '500'    },
    { id: 4, date: '2025-10-31', category: 'Развлечения',   description: 'Кинотеатр',               type: 'expense', amount: '1200'   },
    { id: 5, date: '2025-10-30', category: 'Коммунальные',  description: 'Оплата электричества',     type: 'expense', amount: '2800'   },
    { id: 6, date: '2025-10-29', category: 'Фриланс',       description: 'Проект веб-дизайна',       type: 'income',  amount: '35000'  },
    { id: 7, date: '2025-10-28', category: 'Продукты',      description: 'Продуктовый магазин',      type: 'expense', amount: '4500'   },
    { id: 8, date: '2025-10-27', category: 'Транспорт',     description: 'Такси',                    type: 'expense', amount: '850'    },
    { id: 9, date: '2025-10-26', category: 'Развлечения',   description: 'Ресторан',                 type: 'expense', amount: '3200'   },
    { id: 10,date: '2025-10-25', category: 'Здоровье',      description: 'Аптека',                   type: 'expense', amount: '1400'   },
];

// ──────────────────────────────────────────────
// Работа с localStorage
// ──────────────────────────────────────────────
function loadTransactions() {
    if (!localStorage.getItem('transactionsInitialized')) {
        localStorage.setItem('transactions', JSON.stringify(DEFAULT_TRANSACTIONS));
        localStorage.setItem('transactionsInitialized', 'true');
        return [...DEFAULT_TRANSACTIONS];
    }
    return JSON.parse(localStorage.getItem('transactions') || '[]');
}

function saveTransactions(transactions) {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('transactionsInitialized', 'true');
}

// ──────────────────────────────────────────────
// Вспомогательные данные
// ──────────────────────────────────────────────
const CATEGORY_COLORS = {
    'Продукты':    'blue',
    'Транспорт':   'orange',
    'Развлечения': 'purple',
    'Коммунальные':'teal',
    'Здоровье':    'pink',
    'Зарплата':    'green',
    'Фриланс':     'green',
};

const MONTH_NAMES = ['Январь','Февраль','Март','Апрель','Май','Июнь',
                     'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

// ──────────────────────────────────────────────
// Рендер таблицы транзакций
// ──────────────────────────────────────────────
function renderTransactionRow(trans) {
    const date = new Date(trans.date).toLocaleDateString('ru-RU');
    const color = CATEGORY_COLORS[trans.category] || 'blue';
    const isIncome = trans.type === 'income';
    const amountClass = isIncome ? 'positive' : 'negative';
    const amountSign  = isIncome ? '+' : '-';
    const typeBadge   = isIncome ? 'income' : 'expense';
    const typeText    = isIncome ? 'Доход' : 'Расход';

    return `
        <tr>
            <td>${date}</td>
            <td><span class="category-badge ${color}">${trans.category}</span></td>
            <td>${escapeHtml(trans.description)}</td>
            <td><span class="type-badge ${typeBadge}">${typeText}</span></td>
            <td class="amount ${amountClass}">${amountSign}${parseInt(trans.amount).toLocaleString('ru-RU')} Р</td>
            <td><a href="#" class="action-link" onclick="editTransaction(${trans.id}); return false;">Изменить</a></td>
        </tr>`;
}

function renderTransactions(list) {
    const tbody = document.querySelector('.transactions-table tbody');
    if (!tbody) return;
    const transactions = list !== undefined ? list : loadTransactions();

    if (transactions.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-table-row">
                <td colspan="6">
                    <i class="fas fa-receipt"></i>
                    Транзакций не найдено
                </td>
            </tr>`;
        return;
    }
    tbody.innerHTML = transactions.map(renderTransactionRow).join('');
}

// ──────────────────────────────────────────────
// Фильтры
// ──────────────────────────────────────────────
function applyFilters() {
    const transactions = loadTransactions();
    const search   = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
    const category = document.getElementById('categoryFilter')?.value || 'Все категории';
    const type     = document.getElementById('typeFilter')?.value    || 'Все операции';
    const month    = document.getElementById('monthFilter')?.value   || '';

    const filtered = transactions.filter(t => {
        if (search && !t.description.toLowerCase().includes(search) && !t.category.toLowerCase().includes(search)) return false;
        if (category !== 'Все категории' && t.category !== category) return false;
        if (type === 'Доход'   && t.type !== 'income')  return false;
        if (type === 'Расход'  && t.type !== 'expense') return false;
        if (month) {
            const [mIdx, yr] = month.split('|');
            const d = new Date(t.date);
            if (d.getMonth() !== parseInt(mIdx) || d.getFullYear() !== parseInt(yr)) return false;
        }
        return true;
    });

    renderTransactions(filtered);
}

function populateMonthFilter() {
    const select = document.getElementById('monthFilter');
    if (!select) return;

    const transactions = loadTransactions();
    const seen = new Set();
    const options = [{ value: '', label: 'Все месяцы' }];

    transactions.forEach(t => {
        const d = new Date(t.date);
        const key = `${d.getMonth()}|${d.getFullYear()}`;
        if (!seen.has(key)) {
            seen.add(key);
            options.push({ value: key, label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` });
        }
    });

    select.innerHTML = options.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
}

function initFilters() {
    populateMonthFilter();

    const ids = ['searchInput', 'categoryFilter', 'typeFilter', 'monthFilter'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', applyFilters);
    });
}

// ──────────────────────────────────────────────
// CSV-импорт
// ──────────────────────────────────────────────
function handleCSVImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = '';

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).filter(l => l.trim());

        if (lines.length < 2) {
            showToast('Файл пуст или содержит только заголовок', 'error');
            return;
        }

        const transactions = loadTransactions();
        let imported = 0, errors = 0;

        lines.slice(1).forEach(line => {
            // Поддержка запятой и точки с запятой как разделителя
            const sep = line.includes(';') ? ';' : ',';
            // Разбор с учётом кавычек
            const parts = parseCSVLine(line, sep);
            if (parts.length < 5) { errors++; return; }

            const [dateStr, category, description, rawType, rawAmount] = parts;

            const date = parseDate(dateStr.trim());
            if (!date) { errors++; return; }

            const typeMap = { 'income': 'income', 'доход': 'income', 'expense': 'expense', 'расход': 'expense' };
            const type = typeMap[rawType.trim().toLowerCase()];
            if (!type) { errors++; return; }

            const amount = parseFloat(rawAmount.replace(/[^\d.,]/g, '').replace(',', '.'));
            if (isNaN(amount) || amount <= 0) { errors++; return; }

            transactions.unshift({
                id: Date.now() + imported,
                date,
                category: category.trim(),
                description: description.trim(),
                type,
                amount: Math.round(amount).toString()
            });
            imported++;
        });

        if (imported > 0) {
            saveTransactions(transactions);
            populateMonthFilter();
            renderTransactions();
            showToast(`Импортировано ${imported} транзакций${errors ? `, пропущено ${errors}` : ''}`, 'success');
        } else {
            showToast(`Не удалось импортировать данные (${errors} ошибок). Проверьте формат файла.`, 'error');
        }
    };
    reader.readAsText(file, 'UTF-8');
}

function parseCSVLine(line, sep) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === sep && !inQuotes) { result.push(current); current = ''; }
        else { current += ch; }
    }
    result.push(current);
    return result;
}

function parseDate(str) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(str)) {
        const [d, m, y] = str.split('.');
        return `${y}-${m}-${d}`;
    }
    return null;
}

// ──────────────────────────────────────────────
// CSV-экспорт
// ──────────────────────────────────────────────
function exportCSV() {
    const transactions = loadTransactions();
    if (transactions.length === 0) {
        showToast('Нет транзакций для экспорта', 'info');
        return;
    }

    const header = 'дата,категория,описание,тип,сумма';
    const rows = transactions.map(t =>
        `${t.date},${t.category},"${t.description}",${t.type},${t.amount}`
    );

    downloadCSV([header, ...rows].join('\n'), `transactions_${today()}.csv`);
    showToast(`Экспортировано ${transactions.length} транзакций`, 'success');
}

function downloadSampleCSV() {
    const content = [
        'дата,категория,описание,тип,сумма',
        '2025-11-01,Зарплата,Основная работа,income,150000',
        '2025-11-01,Продукты,Супермаркет,expense,3200',
        '2025-10-31,Транспорт,Метро,expense,500',
        '2025-10-29,Фриланс,Проект дизайна,income,35000',
        '2025-10-28,Развлечения,Кинотеатр,expense,1200',
    ].join('\n');
    downloadCSV(content, 'sample_transactions.csv');
    showToast('Пример CSV загружен', 'info');
}

function downloadCSV(content, filename) {
    const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function today() {
    return new Date().toISOString().split('T')[0];
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ──────────────────────────────────────────────
// Модальное окно транзакции
// ──────────────────────────────────────────────
function openAddTransactionModal() {
    const modal = document.getElementById('transactionModal');
    if (!modal) return;
    resetTransactionForm();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    // Устанавливаем сегодняшнюю дату по умолчанию
    document.getElementById('transactionDate').value = today();
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function editTransaction(id) {
    const transactions = loadTransactions();
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) { showToast('Транзакция не найдена', 'error'); return; }

    resetTransactionForm();
    document.getElementById('transactionModalTitle').textContent = 'Изменить транзакцию';
    document.getElementById('transactionId').value = transaction.id;
    document.getElementById('transactionSubmitBtn').textContent = 'Сохранить';
    document.getElementById('deleteTransactionBtn').style.display = 'inline-flex';

    document.getElementById(transaction.type === 'income' ? 'typeIncome' : 'typeExpense').checked = true;
    document.getElementById('transactionCategory').value   = transaction.category;
    document.getElementById('transactionDescription').value = transaction.description;
    document.getElementById('transactionAmount').value     = transaction.amount;
    document.getElementById('transactionDate').value       = transaction.date;

    const modal = document.getElementById('transactionModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function deleteCurrentTransaction() {
    const transactionId = document.getElementById('transactionId').value;
    if (!transactionId) return;

    if (confirm('Вы уверены, что хотите удалить эту транзакцию?')) {
        const transactions = loadTransactions().filter(t => t.id !== parseInt(transactionId));
        saveTransactions(transactions);
        populateMonthFilter();
        renderTransactions();
        closeModal('transactionModal');
        showToast('Транзакция удалена', 'info');
    }
}

function resetTransactionForm() {
    const form = document.getElementById('transactionForm');
    if (!form) return;
    form.reset();
    document.getElementById('transactionId').value = '';
    document.getElementById('transactionModalTitle').textContent = 'Добавить транзакцию';
    document.getElementById('transactionSubmitBtn').textContent = 'Добавить';
    document.getElementById('deleteTransactionBtn').style.display = 'none';
    const typeIncome = document.getElementById('typeIncome');
    if (typeIncome) typeIncome.checked = true;
}

// ──────────────────────────────────────────────
// Инициализация при загрузке страницы
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    renderTransactions();
    initFilters();

    // Форма добавления / редактирования
    const form = document.getElementById('transactionForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const transactionId = document.getElementById('transactionId').value;
            const type        = document.querySelector('input[name="type"]:checked').value;
            const category    = document.getElementById('transactionCategory').value;
            const description = document.getElementById('transactionDescription').value.trim();
            const amount      = document.getElementById('transactionAmount').value;
            const date        = document.getElementById('transactionDate').value;

            if (!category || !description || !amount || !date) {
                showToast('Пожалуйста, заполните все поля', 'error');
                return;
            }

            const transactions = loadTransactions();

            if (transactionId) {
                const index = transactions.findIndex(t => t.id === parseInt(transactionId));
                if (index !== -1) {
                    transactions[index] = { id: parseInt(transactionId), type, category, description, amount, date };
                    saveTransactions(transactions);
                    showToast('Транзакция изменена', 'success');
                }
            } else {
                transactions.unshift({ id: Date.now(), type, category, description, amount, date });
                saveTransactions(transactions);
                showToast('Транзакция добавлена', 'success');
            }

            populateMonthFilter();
            renderTransactions();
            closeModal('transactionModal');
            resetTransactionForm();
        });
    }

    // Закрытие модального окна при клике вне
    document.addEventListener('click', function(event) {
        document.querySelectorAll('.modal').forEach(modal => {
            if (event.target === modal) closeModal(modal.id);
        });
    });

    // CSV файл input
    const csvInput = document.getElementById('csvFileInput');
    if (csvInput) csvInput.addEventListener('change', handleCSVImport);
});

// Глобальный экспорт функций для использования в onclick
window.openAddTransactionModal = openAddTransactionModal;
window.closeModal              = closeModal;
window.editTransaction         = editTransaction;
window.deleteCurrentTransaction = deleteCurrentTransaction;
window.exportCSV               = exportCSV;
window.downloadSampleCSV       = downloadSampleCSV;
