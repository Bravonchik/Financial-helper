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
    setTimeout(() => { toast.classList.remove('toast-show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

// ──────────────────────────────────────────────
// Состояние
// ──────────────────────────────────────────────
let _transactions = [];

const CATEGORY_COLORS = {
    'Продукты':'blue','Транспорт':'orange','Развлечения':'purple',
    'Связь':'teal','Одежда':'pink','Стипендия':'green','Подработка':'green',
    'Прочее':'blue',
};
const MONTH_NAMES = ['Январь','Февраль','Март','Апрель','Май','Июнь',
                     'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

// ──────────────────────────────────────────────
// Загрузка с сервера
// ──────────────────────────────────────────────
async function loadTransactions() {
    _transactions = await API.get('/transactions');
    return _transactions;
}

// ──────────────────────────────────────────────
// Рендер
// ──────────────────────────────────────────────
function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderTransactionRow(t) {
    const date      = new Date(t.date).toLocaleDateString('ru-RU');
    const color     = CATEGORY_COLORS[t.category] || 'blue';
    const isIncome  = t.type === 'income';
    return `<tr>
        <td>${date}</td>
        <td><span class="category-badge ${color}">${t.category}</span></td>
        <td>${escapeHtml(t.description)}</td>
        <td><span class="type-badge ${isIncome ? 'income' : 'expense'}">${isIncome ? 'Доход' : 'Расход'}</span></td>
        <td class="amount ${isIncome ? 'positive' : 'negative'}">${isIncome ? '+' : '-'}${parseInt(t.amount).toLocaleString('ru-RU')} Р</td>
        <td><a href="#" class="action-link" onclick="editTransaction(${t.id}); return false;">Изменить</a></td>
    </tr>`;
}

function renderTransactions(list) {
    const tbody      = document.querySelector('.transactions-table tbody');
    if (!tbody) return;
    const isFiltered = list !== undefined;
    const data       = isFiltered ? list : _transactions;

    if (data.length === 0) {
        tbody.innerHTML = `<tr class="empty-table-row"><td colspan="6">
            <div class="empty-state">
                <i class="fas fa-${isFiltered ? 'search' : 'receipt'}"></i>
                <p>${isFiltered ? 'Ничего не найдено' : 'Транзакций пока нет'}</p>
                <span>${isFiltered ? 'Попробуйте изменить фильтры или сбросьте их' : 'Добавьте первую транзакцию'}</span>
                <button class="btn ${isFiltered ? 'btn-secondary' : 'btn-primary'} empty-state-btn"
                    onclick="${isFiltered ? 'resetFilters()' : 'openAddTransactionModal()'}">
                    <i class="fas fa-${isFiltered ? 'times' : 'plus'}"></i>
                    ${isFiltered ? 'Сбросить фильтры' : 'Добавить транзакцию'}
                </button>
            </div></td></tr>`;
        return;
    }
    tbody.innerHTML = data.map(renderTransactionRow).join('');
}

// ──────────────────────────────────────────────
// Фильтры
// ──────────────────────────────────────────────
function applyFilters() {
    const search   = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
    const category = document.getElementById('categoryFilter')?.value || 'Все категории';
    const type     = document.getElementById('typeFilter')?.value    || 'Все операции';
    const month    = document.getElementById('monthFilter')?.value   || '';
    const sort     = document.getElementById('sortSelect')?.value    || 'date-desc';

    const filtered = _transactions.filter(t => {
        if (search && !t.description.toLowerCase().includes(search) && !t.category.toLowerCase().includes(search)) return false;
        if (category !== 'Все категории' && t.category !== category) return false;
        if (type === 'Доход'  && t.type !== 'income')  return false;
        if (type === 'Расход' && t.type !== 'expense') return false;
        if (month) {
            const [mIdx, yr] = month.split('|');
            const d = new Date(t.date);
            if (d.getMonth() !== parseInt(mIdx) || d.getFullYear() !== parseInt(yr)) return false;
        }
        return true;
    });

    filtered.sort((a, b) => {
        if (sort === 'date-desc')   return new Date(b.date) - new Date(a.date);
        if (sort === 'date-asc')    return new Date(a.date) - new Date(b.date);
        if (sort === 'amount-desc') return parseFloat(b.amount) - parseFloat(a.amount);
        if (sort === 'amount-asc')  return parseFloat(a.amount) - parseFloat(b.amount);
        return 0;
    });

    renderTransactions(filtered);
}

function populateMonthFilter() {
    const select = document.getElementById('monthFilter');
    if (!select) return;
    const seen = new Set();
    const options = [{ value: '', label: 'Все месяцы' }];
    _transactions.forEach(t => {
        const d = new Date(t.date);
        const key = `${d.getMonth()}|${d.getFullYear()}`;
        if (!seen.has(key)) { seen.add(key); options.push({ value: key, label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` }); }
    });
    select.innerHTML = options.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
}

function resetFilters() {
    ['searchInput','categoryFilter','typeFilter','monthFilter','sortSelect'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = el.options ? el.options[0].value : '';
    });
    renderTransactions();
}

function initFilters() {
    populateMonthFilter();
    ['searchInput','categoryFilter','typeFilter','monthFilter','sortSelect'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', applyFilters);
    });
}

// ──────────────────────────────────────────────
// Модальное окно
// ──────────────────────────────────────────────
function today() { return new Date().toISOString().split('T')[0]; }

function openAddTransactionModal() {
    resetTransactionForm();
    document.getElementById('transactionDate').value = today();
    document.getElementById('transactionModal')?.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(id) {
    document.getElementById(id)?.classList.remove('active');
    document.body.style.overflow = '';
}

function editTransaction(id) {
    const t = _transactions.find(x => x.id === id);
    if (!t) { showToast('Транзакция не найдена', 'error'); return; }
    resetTransactionForm();
    document.getElementById('transactionModalTitle').textContent = 'Изменить транзакцию';
    document.getElementById('transactionId').value = t.id;
    document.getElementById('transactionSubmitBtn').textContent = 'Сохранить';
    document.getElementById('deleteTransactionBtn').style.display = 'inline-flex';
    document.getElementById(t.type === 'income' ? 'typeIncome' : 'typeExpense').checked = true;
    document.getElementById('transactionCategory').value    = t.category;
    document.getElementById('transactionDescription').value = t.description;
    document.getElementById('transactionAmount').value      = t.amount;
    document.getElementById('transactionDate').value        = t.date;
    const rec = document.getElementById('transactionRecurring');
    if (rec) rec.checked = !!t.recurring;
    document.getElementById('transactionModal')?.classList.add('active');
    document.body.style.overflow = 'hidden';
}

async function deleteCurrentTransaction() {
    const id = document.getElementById('transactionId').value;
    if (!id || !confirm('Удалить эту транзакцию?')) return;
    try {
        await API.delete('/transactions/' + id);
        _transactions = _transactions.filter(t => t.id !== parseInt(id));
        populateMonthFilter();
        renderTransactions();
        closeModal('transactionModal');
        showToast('Транзакция удалена', 'info');
    } catch (err) { showToast(err.message, 'error'); }
}

function resetTransactionForm() {
    const form = document.getElementById('transactionForm');
    if (form) form.reset();
    document.getElementById('transactionId').value = '';
    document.getElementById('transactionModalTitle').textContent = 'Добавить транзакцию';
    document.getElementById('transactionSubmitBtn').textContent  = 'Добавить';
    document.getElementById('deleteTransactionBtn').style.display = 'none';
    const ti = document.getElementById('typeIncome');
    if (ti) ti.checked = true;
}

// ──────────────────────────────────────────────
// CSV
// ──────────────────────────────────────────────
async function handleCSVImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = '';
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) { showToast('Файл пуст', 'error'); return; }

    let imported = 0, errors = 0;
    for (const line of lines.slice(1)) {
        const sep   = line.includes(';') ? ';' : ',';
        const parts = parseCSVLine(line, sep);
        if (parts.length < 5) { errors++; continue; }
        const [dateStr, category, description, rawType, rawAmount] = parts;
        const date = parseDate(dateStr.trim());
        if (!date) { errors++; continue; }
        const typeMap = { income:'income', доход:'income', expense:'expense', расход:'expense' };
        const type = typeMap[rawType.trim().toLowerCase()];
        if (!type) { errors++; continue; }
        const amount = parseFloat(rawAmount.replace(/[^\d.,]/g,'').replace(',','.'));
        if (isNaN(amount) || amount <= 0) { errors++; continue; }
        try {
            const row = await API.post('/transactions', { date, category: category.trim(), description: description.trim(), type, amount });
            _transactions.unshift(row);
            imported++;
        } catch { errors++; }
    }

    populateMonthFilter();
    renderTransactions();
    if (imported > 0) showToast(`Импортировано ${imported} транзакций${errors ? `, пропущено ${errors}` : ''}`, 'success');
    else showToast(`Не удалось импортировать (${errors} ошибок)`, 'error');
}

function parseCSVLine(line, sep) {
    const result = []; let current = '', inQ = false;
    for (const ch of line) {
        if (ch === '"') inQ = !inQ;
        else if (ch === sep && !inQ) { result.push(current); current = ''; }
        else current += ch;
    }
    result.push(current);
    return result;
}

function parseDate(str) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(str)) { const [d,m,y]=str.split('.'); return `${y}-${m}-${d}`; }
    return null;
}

function exportCSV() {
    if (_transactions.length === 0) { showToast('Нет транзакций', 'info'); return; }
    const header = 'дата,категория,описание,тип,сумма';
    const rows = _transactions.map(t => `${t.date},${t.category},"${t.description}",${t.type},${t.amount}`);
    const blob = new Blob(['﻿' + [header,...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `transactions_${today()}.csv` });
    a.click(); URL.revokeObjectURL(a.href);
    showToast(`Экспортировано ${_transactions.length} транзакций`, 'success');
}

function downloadSampleCSV() {
    const content = ['дата,категория,описание,тип,сумма','2025-11-01,Зарплата,Основная работа,income,150000',
        '2025-11-01,Продукты,Супермаркет,expense,3200','2025-10-29,Фриланс,Проект дизайна,income,35000'].join('\n');
    const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'sample_transactions.csv' });
    a.click(); URL.revokeObjectURL(a.href);
    showToast('Пример CSV загружен', 'info');
}

// ──────────────────────────────────────────────
// Nav toggle
// ──────────────────────────────────────────────
function initNavToggle() {
    const toggle = document.getElementById('navToggle');
    const menu   = document.querySelector('.nav-menu');
    if (!toggle || !menu) return;
    toggle.addEventListener('click', e => {
        e.stopPropagation();
        const open = menu.classList.toggle('nav-open');
        toggle.querySelector('i').className = open ? 'fas fa-times' : 'fas fa-bars';
    });
    document.addEventListener('click', e => {
        if (!menu.contains(e.target) && !toggle.contains(e.target)) {
            menu.classList.remove('nav-open');
            const ic = toggle.querySelector('i');
            if (ic) ic.className = 'fas fa-bars';
        }
    });
}

// ──────────────────────────────────────────────
// Init
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function() {
    initNavToggle();

    await loadTransactions();
    renderTransactions();
    initFilters();

    // Форма
    document.getElementById('transactionForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const id          = document.getElementById('transactionId').value;
        const type        = document.querySelector('input[name="type"]:checked').value;
        const category    = document.getElementById('transactionCategory').value;
        const description = document.getElementById('transactionDescription').value.trim();
        const amount      = document.getElementById('transactionAmount').value;
        const date        = document.getElementById('transactionDate').value;
        const recurring   = document.getElementById('transactionRecurring')?.checked || false;

        if (!category || !description || !amount || !date) { showToast('Заполните все поля', 'error'); return; }

        const btn = document.getElementById('transactionSubmitBtn');
        btn.disabled = true;

        try {
            if (id) {
                const updated = await API.put('/transactions/' + id, { type, category, description, amount, date, recurring });
                const idx = _transactions.findIndex(t => t.id === parseInt(id));
                if (idx !== -1) _transactions[idx] = updated;
                showToast('Транзакция изменена', 'success');
            } else {
                const row = await API.post('/transactions', { type, category, description, amount, date, recurring });
                _transactions.unshift(row);
                showToast(recurring ? 'Транзакция добавлена и будет повторяться ежемесячно' : 'Транзакция добавлена', 'success');
            }
            populateMonthFilter();
            renderTransactions();
            closeModal('transactionModal');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            btn.disabled = false;
        }
    });

    document.addEventListener('click', e => {
        document.querySelectorAll('.modal').forEach(m => { if (e.target === m) closeModal(m.id); });
    });

    document.getElementById('csvFileInput')?.addEventListener('change', handleCSVImport);
});

window.openAddTransactionModal  = openAddTransactionModal;
window.closeModal               = closeModal;
window.editTransaction          = editTransaction;
window.deleteCurrentTransaction = deleteCurrentTransaction;
window.exportCSV                = exportCSV;
window.downloadSampleCSV        = downloadSampleCSV;
window.resetFilters             = resetFilters;
