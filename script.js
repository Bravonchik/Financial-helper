// ──────────────────────────────────────────────
// Toast-уведомления (используются на дашборде)
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
// Кэш данных (загружаются из API один раз)
// ──────────────────────────────────────────────
let _transactions     = [];
let _budgetCategories = [];

// ──────────────────────────────────────────────
// Расчёт метрик из транзакций
// ──────────────────────────────────────────────
function calcMetricsFromTransactions() {
    const transactions = _transactions;
    if (transactions.length === 0) return null;

    const now = new Date();
    const curMonth = now.getMonth();
    const curYear  = now.getFullYear();

    const inMonth = t => {
        const d = new Date(t.date);
        return d.getMonth() === curMonth && d.getFullYear() === curYear;
    };
    const prevMonth = t => {
        const d = new Date(t.date);
        const pm = curMonth === 0 ? 11 : curMonth - 1;
        const py = curMonth === 0 ? curYear - 1 : curYear;
        return d.getMonth() === pm && d.getFullYear() === py;
    };

    const sum = (arr, type) => arr
        .filter(t => t.type === type)
        .reduce((s, t) => s + parseFloat(t.amount), 0);

    const curIncome  = sum(transactions.filter(inMonth), 'income');
    const curExpense = sum(transactions.filter(inMonth), 'expense');
    const prevIncome = sum(transactions.filter(prevMonth), 'income');
    const prevExpense= sum(transactions.filter(prevMonth), 'expense');

    const totalIncome  = sum(transactions, 'income');
    const totalExpense = sum(transactions, 'expense');
    const balance      = totalIncome - totalExpense;

    const curNet  = curIncome  - curExpense;
    const prevNet = prevIncome - prevExpense;
    const trend   = prevNet !== 0
        ? Math.round((curNet - prevNet) / Math.abs(prevNet) * 100)
        : 0;

    // Категории расходов для диаграммы (текущий месяц)
    const catMap = {};
    transactions.filter(inMonth).filter(t => t.type === 'expense').forEach(t => {
        catMap[t.category] = (catMap[t.category] || 0) + parseFloat(t.amount);
    });

    const incomeTrend  = prevIncome  > 0 ? Math.round((curIncome  - prevIncome)  / prevIncome  * 100) : null;
    const expenseTrend = prevExpense > 0 ? Math.round((curExpense - prevExpense) / prevExpense * 100) : null;

    return { balance, curIncome, curExpense, trend, catMap, incomeTrend, expenseTrend };
}

// ──────────────────────────────────────────────
// Загрузка/сохранение данных дашборда (ручные настройки)
// ──────────────────────────────────────────────
function loadDashboardData() {
    const data = JSON.parse(localStorage.getItem('dashboardData') || '{}');
    return {
        balance:       data.balance       || 52000,
        balanceTrend:  data.balanceTrend  || 12,
        income:        data.income        || 150000,
        expense:       data.expense       || 98000,
        savingsGoal:   data.savingsGoal   || 320000,
        savingsCurrent:data.savingsCurrent|| 208000
    };
}

function saveDashboardData(data) {
    localStorage.setItem('dashboardData', JSON.stringify(data));
}

// ──────────────────────────────────────────────
// Форматирование
// ──────────────────────────────────────────────
function formatCurrency(value) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency', currency: 'RUB',
        minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(value);
}

function formatNumber(num) {
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// ──────────────────────────────────────────────
// Обновление дашборда
// ──────────────────────────────────────────────
function updateDashboardDisplay() {
    const calc = calcMetricsFromTransactions();
    const data = loadDashboardData();

    let balance, income, expense, trend;

    if (calc) {
        // Данные рассчитаны из реальных транзакций
        balance = calc.balance;
        income  = calc.curIncome;
        expense = calc.curExpense;
        trend   = calc.trend;
    } else {
        // Фолбэк — ручные данные
        balance = data.balance;
        income  = data.income;
        expense = data.expense;
        trend   = data.balanceTrend;
    }

    const cur = I18n.t(' Р');
    document.getElementById('balanceValue').textContent = formatNumber(balance) + cur;
    document.getElementById('incomeValue').textContent  = formatNumber(income)  + cur;
    document.getElementById('expenseValue').textContent = formatNumber(expense) + cur;
    document.getElementById('savingsValue').textContent = formatNumber(data.savingsGoal) + cur;

    const trendEl = document.getElementById('balanceTrend');
    if (trendEl) {
        const sign = trend >= 0 ? '+' : '';
        trendEl.textContent = sign + trend + I18n.t('% от прошлого месяца');
        const wrapper = trendEl.closest('.metric-trend');
        if (wrapper) {
            wrapper.className = 'metric-trend ' + (trend >= 0 ? 'positive' : 'negative');
            wrapper.querySelector('i').className = 'fas fa-arrow-' + (trend >= 0 ? 'up' : 'down');
        }
    }

    // Тренд доходов
    const incomeT = calc ? calc.incomeTrend : null;
    const incomeTrendEl = document.getElementById('incomeTrend');
    if (incomeTrendEl) {
        if (incomeT !== null) {
            const sign = incomeT >= 0 ? '+' : '';
            document.getElementById('incomeTrendText').textContent = sign + incomeT + I18n.t('% от прошлого месяца');
            incomeTrendEl.className = 'metric-trend ' + (incomeT >= 0 ? 'positive' : 'negative');
            incomeTrendEl.querySelector('i').className = 'fas fa-arrow-' + (incomeT >= 0 ? 'up' : 'down');
        } else {
            document.getElementById('incomeTrendText').textContent = I18n.t('За текущий месяц');
            incomeTrendEl.className = 'metric-trend neutral';
            incomeTrendEl.querySelector('i').className = 'fas fa-minus';
        }
    }

    // Тренд расходов (рост расходов — плохо, поэтому цвета инвертированы)
    const expenseT = calc ? calc.expenseTrend : null;
    const expenseTrendEl = document.getElementById('expenseTrend');
    if (expenseTrendEl) {
        if (expenseT !== null) {
            const sign = expenseT >= 0 ? '+' : '';
            document.getElementById('expenseTrendText').textContent = sign + expenseT + I18n.t('% от прошлого месяца');
            expenseTrendEl.className = 'metric-trend ' + (expenseT >= 0 ? 'negative' : 'positive');
            expenseTrendEl.querySelector('i').className = 'fas fa-arrow-' + (expenseT >= 0 ? 'up' : 'down');
        } else {
            document.getElementById('expenseTrendText').textContent = I18n.t('За текущий месяц');
            expenseTrendEl.className = 'metric-trend neutral';
            expenseTrendEl.querySelector('i').className = 'fas fa-minus';
        }
    }

    const savingsPercent = Math.round((data.savingsCurrent / data.savingsGoal) * 100);
    const pct = document.getElementById('savingsPercent');
    const bar = document.getElementById('savingsProgressBar');
    if (pct) pct.textContent = savingsPercent + '%';
    if (bar) bar.style.width = Math.min(savingsPercent, 100) + '%';
}

// ──────────────────────────────────────────────
// Круговая диаграмма расходов по категориям
// ──────────────────────────────────────────────
let pieChartInstance = null;

function initPieChart() {
    const ctx = document.getElementById('pieChart');
    if (!ctx) return;

    const calc = calcMetricsFromTransactions();

    let labels, values, colors;

    if (calc && Object.keys(calc.catMap).length > 0) {
        const entries = Object.entries(calc.catMap).sort((a, b) => b[1] - a[1]);
        labels = entries.map(e => e[0]);
        values = entries.map(e => e[1]);
        const palette = ['#3b82f6','#f97316','#8b5cf6','#14b8a6','#ec4899','#6b7280','#10b981','#ef4444'];
        colors = labels.map((_, i) => palette[i % palette.length]);
        updatePieLegend(labels, colors);
    } else {
        labels = ['Продукты', 'Транспорт', 'Развлечения', 'Коммунальные', 'Прочее'].map(l => I18n.t(l));
        values = [36, 15, 12, 18, 19];
        colors = ['#3b82f6','#f97316','#8b5cf6','#14b8a6','#6b7280'];
    }

    if (pieChartInstance) pieChartInstance.destroy();

    pieChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels,
            datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }]
        },
        options: {
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const val = context.parsed;
                            if (calc && Object.keys(calc.catMap).length > 0) {
                                return context.label + ': ' + formatCurrency(val);
                            }
                            return context.label + ': ' + val + '%';
                        }
                    }
                }
            }
        }
    });
}

function updatePieLegend(labels, colors) {
    const legend = document.querySelector('.chart-card .chart-legend');
    if (!legend) return;
    legend.innerHTML = labels.map((lbl, i) =>
        `<div class="legend-item">
            <span class="legend-dot" style="background:${colors[i]}"></span>
            <span>${lbl}</span>
        </div>`
    ).join('');
}

// ──────────────────────────────────────────────
// Линейный график динамики за 6 месяцев
// ──────────────────────────────────────────────
function initLineChart() {
    const ctx = document.getElementById('lineChart');
    if (!ctx) return;

    const transactions = _transactions;

    let labels, incomeData, expenseData;

    if (transactions.length > 0) {
        // Строим данные по последним 6 месяцам из реальных транзакций
        const now = new Date();
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({ month: d.getMonth(), year: d.getFullYear() });
        }
        const monthNames = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'].map(m => I18n.t(m));
        labels      = months.map(m => monthNames[m.month]);
        incomeData  = months.map(m => transactions
            .filter(t => { const d = new Date(t.date); return d.getMonth() === m.month && d.getFullYear() === m.year && t.type === 'income'; })
            .reduce((s, t) => s + parseFloat(t.amount), 0));
        expenseData = months.map(m => transactions
            .filter(t => { const d = new Date(t.date); return d.getMonth() === m.month && d.getFullYear() === m.year && t.type === 'expense'; })
            .reduce((s, t) => s + parseFloat(t.amount), 0));
    } else {
        labels      = ['Июн','Июл','Авг','Сен','Окт','Ноя'].map(m => I18n.t(m));
        incomeData  = [150000,155000,150000,152000,150000,150000];
        expenseData = [105000,100000,118000,95000,115000,100000];
    }

    new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: I18n.t('Доходы'),
                    data: incomeData,
                    borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)',
                    borderWidth: 3, fill: false, tension: 0.4,
                    pointRadius: 6, pointBackgroundColor: '#10b981',
                    pointBorderColor: '#fff', pointBorderWidth: 2, pointHoverRadius: 8
                },
                {
                    label: I18n.t('Расходы'),
                    data: expenseData,
                    borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)',
                    borderWidth: 3, fill: false, tension: 0.4,
                    pointRadius: 6, pointBackgroundColor: '#ef4444',
                    pointBorderColor: '#fff', pointBorderWidth: 2, pointHoverRadius: 8
                }
            ]
        },
        options: {
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index', intersect: false,
                    callbacks: {
                        label: ctx => ctx.dataset.label + ': ' + formatCurrency(ctx.parsed.y || 0)
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: v => v.toLocaleString('ru-RU') },
                    grid: { color: '#e5e7eb' }
                },
                x: { grid: { display: false } }
            },
            interaction: { mode: 'nearest', axis: 'x', intersect: false }
        }
    });
}

// ──────────────────────────────────────────────
// Модальное окно редактирования метрик (только сбережения)
// ──────────────────────────────────────────────
let currentEditType = '';

function openEditModal(type) {
    currentEditType = type;
    const modal = document.getElementById('editMetricModal');
    const data  = loadDashboardData();

    const titles = {
        balance:  I18n.t('Изменить текущий баланс'),
        income:   I18n.t('Изменить доходы'),
        expense:  I18n.t('Изменить расходы'),
        savings:  I18n.t('Изменить цель сбережений')
    };

    document.getElementById('editModalTitle').textContent = titles[type] || I18n.t('Изменить значение');

    const trendGroup = document.getElementById('trendGroup');
    const savingsCurrentGroup = document.getElementById('savingsCurrentGroup');

    if (type === 'balance') {
        trendGroup.style.display = 'block';
        savingsCurrentGroup.style.display = 'none';
        document.getElementById('editMetricInput').value = data.balance;
        document.getElementById('editTrendInput').value  = data.balanceTrend;
    } else if (type === 'savings') {
        trendGroup.style.display = 'none';
        savingsCurrentGroup.style.display = 'block';
        document.getElementById('editMetricInput').value = data.savingsGoal;
        document.getElementById('editSavingsCurrentInput').value = data.savingsCurrent;
    } else {
        trendGroup.style.display = 'none';
        savingsCurrentGroup.style.display = 'none';
        document.getElementById('editMetricInput').value = data[type] || 0;
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeEditModal() {
    document.getElementById('editMetricModal').classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('editMetricForm').reset();
}

// ──────────────────────────────────────────────
// Виджет "Остаток до конца месяца"
// ──────────────────────────────────────────────
function updateMonthWidget() {
    const widget = document.getElementById('monthWidget');
    if (!widget) return;

    const categories   = _budgetCategories;
    const transactions = _transactions;

    if (categories.length === 0) { widget.style.display = 'none'; return; }

    const now      = new Date();
    const curMonth = now.getMonth();
    const curYear  = now.getFullYear();
    const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
    const daysLeft    = daysInMonth - now.getDate();

    const totalBudget = categories.reduce((s, c) => s + (c.budget || 0), 0);

    const spent = transactions
        .filter(t => {
            const d = new Date(t.date);
            return t.type === 'expense' && d.getMonth() === curMonth && d.getFullYear() === curYear;
        })
        .reduce((s, t) => s + parseFloat(t.amount), 0);

    // Реальный баланс — все доходы минус все расходы за всё время
    const realBalance = transactions.reduce((s, t) => {
        const amt = parseFloat(t.amount);
        return t.type === 'income' ? s + amt : s - amt;
    }, 0);

    const remaining = totalBudget - spent;
    // Дневной лимит — от меньшего из двух: остаток бюджета или реальный баланс
    const spendable  = Math.min(Math.max(remaining, 0), Math.max(realBalance, 0));
    const dailyLimit = daysLeft > 0 ? Math.round(spendable / daysLeft) : spendable;

    document.getElementById('daysLeftValue').textContent    = daysLeft + I18n.t(' дн.');
    document.getElementById('budgetLeftValue').textContent  = formatNumber(Math.max(remaining, 0)) + I18n.t(' Р');
    document.getElementById('dailyLimitValue').textContent  = (dailyLimit > 0 ? formatNumber(dailyLimit) : '0') + I18n.t(' Р/день');

    // Подсказка: что ограничивает лимит
    const noteEl = document.getElementById('dailyLimitNote');
    if (noteEl) {
        if (realBalance <= 0) {
            noteEl.textContent = I18n.t('Баланс исчерпан');
        } else if (realBalance < remaining) {
            noteEl.textContent = I18n.t('Ограничено балансом');
        } else if (remaining <= 0) {
            noteEl.textContent = I18n.t('Бюджет исчерпан');
        } else {
            noteEl.textContent = I18n.t('По остатку бюджета');
        }
    }

    widget.style.display = '';
    if (remaining < 0) {
        widget.style.background = 'linear-gradient(135deg,#ef4444 0%,#b91c1c 100%)';
    } else {
        widget.style.background = 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)';
    }

    // Предупреждение: сумма лимитов > месячный доход
    const curMonthIncome = transactions
        .filter(t => {
            const d = new Date(t.date);
            return t.type === 'income' && d.getMonth() === curMonth && d.getFullYear() === curYear;
        })
        .reduce((s, t) => s + parseFloat(t.amount), 0);

    const budgetWarnEl = document.getElementById('budgetOverIncomeWarn');
    if (budgetWarnEl) {
        if (curMonthIncome > 0 && totalBudget > curMonthIncome) {
            const over = totalBudget - curMonthIncome;
            budgetWarnEl.style.display = '';
            budgetWarnEl.querySelector('.budget-warn-text').textContent =
                `Сумма лимитов бюджета (${formatNumber(totalBudget)} Р) превышает доход за месяц (${formatNumber(curMonthIncome)} Р) на ${formatNumber(over)} Р`;
        } else {
            budgetWarnEl.style.display = 'none';
        }
    }
}

// ──────────────────────────────────────────────
// Быстрое добавление транзакции
// ──────────────────────────────────────────────
function openQuickAddModal() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('qaDate').value = today;
    document.getElementById('quickAddForm').reset();
    document.getElementById('qaDate').value = today;
    document.getElementById('qaTypeIncome').checked = true;
    document.getElementById('quickAddModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeQuickAddModal() {
    document.getElementById('quickAddModal').classList.remove('active');
    document.body.style.overflow = '';
}

// ──────────────────────────────────────────────
// Уведомления о превышении бюджета
// ──────────────────────────────────────────────
function checkBudgetAlerts() {
    const container = document.getElementById('budgetAlerts');
    if (!container) return;

    const categories = _budgetCategories;
    if (categories.length === 0) { container.innerHTML = ''; return; }

    const transactions = _transactions;
    const now = new Date();
    const curMonth = now.getMonth();
    const curYear  = now.getFullYear();

    const catSpend = {};
    transactions
        .filter(t => {
            const d = new Date(t.date);
            return t.type === 'expense' && d.getMonth() === curMonth && d.getFullYear() === curYear;
        })
        .forEach(t => { catSpend[t.category] = (catSpend[t.category] || 0) + parseFloat(t.amount); });

    const alerts = categories
        .filter(cat => cat.budget > 0 && (catSpend[cat.name] || 0) / cat.budget >= 0.8)
        .map(cat => {
            const spent = catSpend[cat.name] || 0;
            const pct   = Math.round((spent / cat.budget) * 100);
            return { name: cat.name, spent, budget: cat.budget, pct, over: pct >= 100 };
        });

    if (alerts.length === 0) { container.innerHTML = ''; return; }

    const items = alerts.map(a => {
        const cls  = a.over ? 'alert-item danger' : 'alert-item warning';
        const icon = a.over ? 'fa-times-circle'   : 'fa-exclamation-triangle';
        const text = a.over
            ? `${I18n.t('превышен на')} ${formatNumber(a.spent - a.budget)} ₽`
            : `${I18n.t('использовано')} ${a.pct}%`;
        return `<span class="${cls}"><i class="fas ${icon}"></i>${a.name}: ${text}</span>`;
    }).join('');

    container.innerHTML = `
        <div class="budget-alert-banner">
            <i class="fas fa-bell"></i>
            <div class="budget-alert-content">
                <strong>${I18n.t('Внимание по бюджету')}</strong>
                <div class="budget-alert-items">${items}</div>
            </div>
            <button class="budget-alert-close" onclick="this.closest('.budget-alert-banner').remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>`;
}

// ──────────────────────────────────────────────
// Инициализация при загрузке страницы
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function() {
    initNavToggle();

    // Загружаем данные из API параллельно
    [_transactions, _budgetCategories] = await Promise.all([
        API.get('/transactions'),
        API.get('/budgets'),
    ]);

    initPieChart();
    initLineChart();
    updateDashboardDisplay();
    checkBudgetAlerts();
    updateMonthWidget();

    // Форма редактирования метрик
    const editForm = document.getElementById('editMetricForm');
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const data  = loadDashboardData();
            const value = parseInt(document.getElementById('editMetricInput').value);

            if (currentEditType === 'balance') {
                data.balance = value;
                data.balanceTrend = parseFloat(document.getElementById('editTrendInput').value) || 0;
            } else if (currentEditType === 'income') {
                data.income = value;
            } else if (currentEditType === 'expense') {
                data.expense = value;
            } else if (currentEditType === 'savings') {
                data.savingsGoal    = value;
                data.savingsCurrent = parseInt(document.getElementById('editSavingsCurrentInput').value) || 0;
            }

            saveDashboardData(data);
            updateDashboardDisplay();
            closeEditModal();
            showToast(I18n.t('Изменения сохранены'), 'success');
        });
    }

    // Закрытие модального окна по клику вне
    const modal = document.getElementById('editMetricModal');
    if (modal) {
        modal.addEventListener('click', e => { if (e.target === modal) closeEditModal(); });
    }

    // Форма быстрого добавления транзакции
    const quickForm = document.getElementById('quickAddForm');
    if (quickForm) {
        quickForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const type        = document.querySelector('input[name="qaType"]:checked').value;
            const category    = document.getElementById('qaCategory').value;
            const description = document.getElementById('qaDescription').value.trim();
            const amount      = document.getElementById('qaAmount').value;
            const date        = document.getElementById('qaDate').value;

            if (!category || !description || !amount || !date) {
                showToast(I18n.t('Заполните все поля'), 'error');
                return;
            }

            try {
                const row = await API.post('/transactions', { type, category, description, amount, date });
                _transactions.unshift(row);
                closeQuickAddModal();
                initPieChart();
                updateDashboardDisplay();
                checkBudgetAlerts();
                updateMonthWidget();
                showToast(I18n.t('Транзакция добавлена'), 'success');
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    // Закрытие модалов по клику вне
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', e => {
            if (e.target === modal) {
                if (modal.id === 'quickAddModal') closeQuickAddModal();
                else if (modal.id === 'editMetricModal') closeEditModal();
            }
        });
    });

    // Кнопка "Отчёты"
    const reportsBtns = document.querySelectorAll('.action-buttons .btn-secondary');
    if (reportsBtns[0]) reportsBtns[0].addEventListener('click', () => window.location.href = 'reports.html');
    if (reportsBtns[1]) reportsBtns[1].addEventListener('click', () => window.location.href = 'budget.html');
});

window.openEditModal      = openEditModal;
window.closeEditModal     = closeEditModal;
window.openQuickAddModal  = openQuickAddModal;
window.closeQuickAddModal = closeQuickAddModal;

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
