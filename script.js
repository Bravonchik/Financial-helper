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
// Расчёт метрик из транзакций
// ──────────────────────────────────────────────
function calcMetricsFromTransactions() {
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
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

    return { balance, curIncome, curExpense, trend, catMap };
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

    document.getElementById('balanceValue').textContent = formatNumber(balance) + ' Р';
    document.getElementById('incomeValue').textContent  = formatNumber(income)  + ' Р';
    document.getElementById('expenseValue').textContent = formatNumber(expense) + ' Р';
    document.getElementById('savingsValue').textContent = formatNumber(data.savingsGoal) + ' Р';

    const trendEl = document.getElementById('balanceTrend');
    if (trendEl) {
        const sign = trend >= 0 ? '+' : '';
        trendEl.textContent = sign + trend + '% от прошлого месяца';
        const wrapper = trendEl.closest('.metric-trend');
        if (wrapper) {
            wrapper.className = 'metric-trend ' + (trend >= 0 ? 'positive' : 'negative');
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
        labels = ['Продукты', 'Транспорт', 'Развлечения', 'Коммунальные', 'Прочее'];
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

    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');

    let labels, incomeData, expenseData;

    if (transactions.length > 0) {
        // Строим данные по последним 6 месяцам из реальных транзакций
        const now = new Date();
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({ month: d.getMonth(), year: d.getFullYear() });
        }
        const monthNames = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
        labels      = months.map(m => monthNames[m.month]);
        incomeData  = months.map(m => transactions
            .filter(t => { const d = new Date(t.date); return d.getMonth() === m.month && d.getFullYear() === m.year && t.type === 'income'; })
            .reduce((s, t) => s + parseFloat(t.amount), 0));
        expenseData = months.map(m => transactions
            .filter(t => { const d = new Date(t.date); return d.getMonth() === m.month && d.getFullYear() === m.year && t.type === 'expense'; })
            .reduce((s, t) => s + parseFloat(t.amount), 0));
    } else {
        labels      = ['Июн','Июл','Авг','Сен','Окт','Ноя'];
        incomeData  = [150000,155000,150000,152000,150000,150000];
        expenseData = [105000,100000,118000,95000,115000,100000];
    }

    new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Доходы',
                    data: incomeData,
                    borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)',
                    borderWidth: 3, fill: false, tension: 0.4,
                    pointRadius: 6, pointBackgroundColor: '#10b981',
                    pointBorderColor: '#fff', pointBorderWidth: 2, pointHoverRadius: 8
                },
                {
                    label: 'Расходы',
                    data: expenseData,
                    borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)',
                    borderWidth: 3, fill: false, tension: 0.4,
                    pointRadius: 6, pointBackgroundColor: '#ef4444',
                    pointBorderColor: '#fff', pointBorderWidth: 2, pointHoverRadius: 8
                }
            ]
        },
        options: {
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
        balance:  'Изменить текущий баланс',
        income:   'Изменить доходы',
        expense:  'Изменить расходы',
        savings:  'Изменить цель сбережений'
    };

    document.getElementById('editModalTitle').textContent = titles[type] || 'Изменить значение';

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
// Инициализация при загрузке страницы
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    initPieChart();
    initLineChart();
    updateDashboardDisplay();

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
            showToast('Изменения сохранены', 'success');
        });
    }

    // Закрытие модального окна по клику вне
    const modal = document.getElementById('editMetricModal');
    if (modal) {
        modal.addEventListener('click', e => { if (e.target === modal) closeEditModal(); });
    }

    // Кнопка "Добавить транзакцию"
    const addBtn = document.querySelector('.action-buttons .btn-primary');
    if (addBtn) addBtn.addEventListener('click', () => window.location.href = 'transactions.html');

    // Кнопка "Отчёты"
    const reportsBtns = document.querySelectorAll('.action-buttons .btn-secondary');
    if (reportsBtns[0]) reportsBtns[0].addEventListener('click', () => window.location.href = 'reports.html');
    if (reportsBtns[1]) reportsBtns[1].addEventListener('click', () => window.location.href = 'budget.html');
});

window.openEditModal  = openEditModal;
window.closeEditModal = closeEditModal;
