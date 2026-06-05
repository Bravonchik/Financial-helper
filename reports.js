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
// Форматирование
// ──────────────────────────────────────────────
function formatCurrency(value) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency', currency: 'RUB',
        minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(value);
}

const MONTH_NAMES_SHORT = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
const MONTH_NAMES_FULL  = ['Январь','Февраль','Март','Апрель','Май','Июнь',
                            'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

// ──────────────────────────────────────────────
// Расчёт данных из транзакций за период (N месяцев)
// ──────────────────────────────────────────────
let _transactions = [];

function buildPeriodData(monthsCount) {
    const transactions = _transactions;
    const now = new Date();

    // Строим список месяцев
    const months = [];
    for (let i = monthsCount - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ month: d.getMonth(), year: d.getFullYear() });
    }

    const labels      = months.map(m => MONTH_NAMES_SHORT[m.month]);
    const incomeData  = [];
    const expenseData = [];

    months.forEach(m => {
        const inMonth = transactions.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === m.month && d.getFullYear() === m.year;
        });
        incomeData .push(inMonth.filter(t => t.type === 'income' ).reduce((s,t) => s + parseFloat(t.amount), 0));
        expenseData.push(inMonth.filter(t => t.type === 'expense').reduce((s,t) => s + parseFloat(t.amount), 0));
    });

    // Расходы по категориям за весь период
    const catMap = {};
    months.forEach(m => {
        transactions
            .filter(t => {
                const d = new Date(t.date);
                return t.type === 'expense' && d.getMonth() === m.month && d.getFullYear() === m.year;
            })
            .forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + parseFloat(t.amount); });
    });

    // Метрики
    const totalIncome  = incomeData .reduce((s,v) => s+v, 0);
    const totalExpense = expenseData.reduce((s,v) => s+v, 0);
    const avgExpense   = monthsCount > 0 ? totalExpense / monthsCount : 0;
    const savings      = totalIncome - totalExpense;

    return { labels, incomeData, expenseData, catMap, totalIncome, totalExpense, avgExpense, savings, monthsCount };
}

// ──────────────────────────────────────────────
// Обновление метрик на странице
// ──────────────────────────────────────────────
function updateMetrics(data) {
    const periodLabel = data.monthsCount === 1 ? 'За текущий месяц'
                      : data.monthsCount === 12 ? 'За последний год'
                      : `За ${data.monthsCount} месяца`;

    setText('totalIncomeValue',  formatCurrency(data.totalIncome));
    setText('totalExpenseValue', formatCurrency(data.totalExpense));
    setText('avgExpenseValue',   formatCurrency(data.avgExpense));
    setText('savingsValue',      formatCurrency(data.savings));

    const savingsEl = document.getElementById('savingsValue');
    if (savingsEl) savingsEl.className = 'metric-value ' + (data.savings >= 0 ? 'purple' : 'red');

    ['totalIncomePeriod','totalExpensePeriod','savingsPeriod'].forEach(id => setText(id, periodLabel));
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// ──────────────────────────────────────────────
// Хранилище экземпляров графиков
// ──────────────────────────────────────────────
const charts = {};

function destroyChart(id) {
    if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

// ──────────────────────────────────────────────
// Данные по дням текущего месяца
// ──────────────────────────────────────────────
function buildMonthDailyData() {
    const now   = new Date();
    const year  = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();

    const labels         = [];
    const dailyExpense   = [];
    const runningBalance = [];

    // Суммарный доход за месяц — «стартовый остаток»
    const monthIncome = _transactions
        .filter(t => {
            const d = new Date(t.date);
            return t.type === 'income' && d.getMonth() === month && d.getFullYear() === year;
        })
        .reduce((s, t) => s + parseFloat(t.amount), 0);

    let cumExpense = 0;

    for (let day = 1; day <= today; day++) {
        const pad = n => String(n).padStart(2, '0');
        const dayStr = `${year}-${pad(month + 1)}-${pad(day)}`;

        const dayTx = _transactions.filter(t => t.date && t.date.startsWith(dayStr));

        const dayExp = dayTx
            .filter(t => t.type === 'expense')
            .reduce((s, t) => s + parseFloat(t.amount), 0);

        cumExpense += dayExp;

        labels.push(String(day));
        dailyExpense.push(dayExp);
        runningBalance.push(Math.max(0, monthIncome - cumExpense));
    }

    return { labels, dailyExpense, runningBalance, monthIncome, today };
}

// ──────────────────────────────────────────────
// Подневной график (Текущий месяц)
// ──────────────────────────────────────────────
function initDailyChart() {
    const ctx = document.getElementById('reportsLineChart');
    if (!ctx) return;

    // Меняем заголовок карточки
    const titleEl = ctx.closest('.chart-card-large')?.querySelector('.chart-title');
    if (titleEl) titleEl.textContent = 'Ежедневная динамика за текущий месяц';

    const { labels, dailyExpense, runningBalance } = buildMonthDailyData();

    // Определяем, есть ли хоть один ненулевой расход
    const hasData = dailyExpense.some(v => v > 0) || runningBalance.some(v => v > 0);

    charts['reportsLineChart'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: I18n.t('Расходы за день'),
                    data: dailyExpense,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239,68,68,0.08)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.35,
                    pointRadius: dailyExpense.map(v => v > 0 ? 5 : 3),
                    pointBackgroundColor: '#ef4444',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 7,
                    yAxisID: 'yExpense'
                },
                {
                    label: I18n.t('Остаток'),
                    data: runningBalance,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139,92,246,0.06)',
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.35,
                    pointRadius: 4,
                    pointBackgroundColor: '#8b5cf6',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 7,
                    yAxisID: 'yBalance'
                }
            ]
        },
        options: {
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: { usePointStyle: true, padding: 20, font: { size: 13 } }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        title: items => `${items[0].label}-е число`,
                        label: ctx => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`
                    }
                }
            },
            scales: {
                yExpense: {
                    type: 'linear',
                    position: 'left',
                    beginAtZero: true,
                    ticks: { callback: v => v.toLocaleString('ru-RU') },
                    grid: { color: '#e5e7eb' },
                    title: { display: true, text: 'Расходы, ₽', font: { size: 11 }, color: '#ef4444' }
                },
                yBalance: {
                    type: 'linear',
                    position: 'right',
                    beginAtZero: true,
                    ticks: { callback: v => v.toLocaleString('ru-RU') },
                    grid: { drawOnChartArea: false },
                    title: { display: true, text: 'Остаток, ₽', font: { size: 11 }, color: '#8b5cf6' }
                },
                x: {
                    grid: { display: false },
                    title: { display: true, text: 'День месяца', font: { size: 11 }, color: '#64748b' }
                }
            },
            interaction: { mode: 'nearest', axis: 'x', intersect: false }
        }
    });
}

// ──────────────────────────────────────────────
// Линейный график (Динамика)
// ──────────────────────────────────────────────
function initLineChart(data) {
    destroyChart('reportsLineChart');
    const ctx = document.getElementById('reportsLineChart');
    if (!ctx) return;

    // При выборе «Текущий месяц» — показываем подневную разбивку
    if (data.monthsCount === 1) {
        const titleEl = ctx.closest('.chart-card-large')?.querySelector('.chart-title');
        if (titleEl) titleEl.textContent = 'Ежедневная динамика за текущий месяц';
        initDailyChart();
        return;
    }

    // Для остальных периодов — стандартный помесячный график
    const titleEl = ctx.closest('.chart-card-large')?.querySelector('.chart-title');
    if (titleEl) titleEl.textContent = 'Доходы и расходы по месяцам';

    charts['reportsLineChart'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: I18n.t('Доходы'),
                    data: data.incomeData,
                    borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)',
                    borderWidth: 3, fill: false, tension: 0.4,
                    pointRadius: 6, pointBackgroundColor: '#10b981',
                    pointBorderColor: '#fff', pointBorderWidth: 2, pointHoverRadius: 8
                },
                {
                    label: I18n.t('Расходы'),
                    data: data.expenseData,
                    borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)',
                    borderWidth: 3, fill: false, tension: 0.4,
                    pointRadius: 6, pointBackgroundColor: '#ef4444',
                    pointBorderColor: '#fff', pointBorderWidth: 2, pointHoverRadius: 8
                }
            ]
        },
        options: chartOptions('line')
    });
}

// ──────────────────────────────────────────────
// Диаграмма расходов по категориям
// ──────────────────────────────────────────────
function initCategoriesChart(data) {
    destroyChart('categoriesChart');
    const ctx = document.getElementById('categoriesChart');
    if (!ctx) return;

    const entries = Object.entries(data.catMap).sort((a,b) => b[1]-a[1]);
    const labels  = entries.map(e => e[0]);
    const values  = entries.map(e => e[1]);
    const palette = ['#3b82f6','#f97316','#8b5cf6','#14b8a6','#ec4899','#6b7280','#10b981','#ef4444','#f59e0b'];
    const colors  = labels.map((_,i) => palette[i % palette.length]);

    if (values.length === 0) {
        ctx.parentElement.innerHTML = '<p style="text-align:center;padding:4rem;color:#94a3b8">Нет данных о расходах за выбранный период</p>';
        return;
    }

    charts['categoriesChart'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }]
        },
        options: {
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { size: 13 } } },
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            const total = ctx.dataset.data.reduce((a,b) => a+b, 0);
                            const pct   = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                            return `${ctx.label}: ${formatCurrency(ctx.parsed)} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ──────────────────────────────────────────────
// Столбчатый график (Сравнение)
// ──────────────────────────────────────────────
function initComparisonChart(data) {
    destroyChart('comparisonChart');
    const ctx = document.getElementById('comparisonChart');
    if (!ctx) return;

    charts['comparisonChart'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [
                { label: 'Доходы',  data: data.incomeData,  backgroundColor: '#10b981', borderRadius: 6 },
                { label: 'Расходы', data: data.expenseData, backgroundColor: '#ef4444', borderRadius: 6 }
            ]
        },
        options: chartOptions('bar')
    });
}

// ──────────────────────────────────────────────
// Средний расход в месяц
// ──────────────────────────────────────────────
function initAvgExpenseChart(data) {
    destroyChart('avgExpenseChart');
    const ctx = document.getElementById('avgExpenseChart');
    if (!ctx) return;

    const avg     = data.avgExpense;
    const avgLine = data.expenseData.map(() => avg);

    charts['avgExpenseChart'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Расходы',
                    data: data.expenseData,
                    backgroundColor: data.expenseData.map(v =>
                        v > avg ? 'rgba(239,68,68,0.8)' : 'rgba(59,130,246,0.8)'
                    ),
                    borderRadius: 6,
                    order: 2
                },
                {
                    label: 'Среднее',
                    data: avgLine,
                    type: 'line',
                    borderColor: '#f97316',
                    borderWidth: 2,
                    borderDash: [6, 4],
                    pointRadius: 0,
                    fill: false,
                    tension: 0,
                    order: 1
                }
            ]
        },
        options: chartOptions('bar')
    });

    const nonZero  = data.expenseData.filter(v => v > 0);
    const maxVal   = data.expenseData.length ? Math.max(...data.expenseData) : 0;
    const minVal   = nonZero.length ? Math.min(...nonZero) : 0;
    const maxMonth = data.labels[data.expenseData.indexOf(maxVal)] || '—';
    const minMonth = data.labels[data.expenseData.indexOf(minVal)] || '—';

    const statsEl = document.getElementById('avgExpenseStats');
    if (statsEl) {
        statsEl.innerHTML = `
            <div class="avg-stat"><span class="avg-stat-label">Среднее в месяц</span><span class="avg-stat-value">${formatCurrency(avg)}</span></div>
            <div class="avg-stat"><span class="avg-stat-label">Максимум (${maxMonth})</span><span class="avg-stat-value red">${formatCurrency(maxVal)}</span></div>
            <div class="avg-stat"><span class="avg-stat-label">Минимум (${minMonth})</span><span class="avg-stat-value green">${formatCurrency(minVal)}</span></div>
            <div class="avg-stat"><span class="avg-stat-label">Всего за период</span><span class="avg-stat-value">${formatCurrency(data.totalExpense)}</span></div>
        `;
    }
}

function chartOptions(type) {
    return {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { size: 13 } } },
            tooltip: {
                mode: type === 'bar' ? 'index' : 'index',
                intersect: false,
                callbacks: { label: ctx => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y ?? ctx.parsed)}` }
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
    };
}

// ──────────────────────────────────────────────
// Применение периода
// ──────────────────────────────────────────────
let currentData = null;
let activeTab   = 'dynamics';

function applyPeriod() {
    const months = parseInt(document.getElementById('periodSelect')?.value || '6');
    currentData  = buildPeriodData(months);
    updateMetrics(currentData);
    redrawActiveTab();
    showToast('Период обновлён', 'info');
}

function redrawActiveTab() {
    if (!currentData) return;
    if (activeTab === 'dynamics')   initLineChart(currentData);
    if (activeTab === 'categories') initCategoriesChart(currentData);
    if (activeTab === 'comparison') initComparisonChart(currentData);
    if (activeTab === 'avgexpense') initAvgExpenseChart(currentData);
}

// ──────────────────────────────────────────────
// Переключение вкладок
// ──────────────────────────────────────────────
function switchTab(tabName, btn) {
    activeTab = tabName;

    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel') .forEach(p => p.classList.remove('active'));

    if (btn) btn.classList.add('active');
    document.getElementById(tabName + '-tab')?.classList.add('active');

    // Инициализируем график только для активной вкладки
    if (!currentData) return;
    if (tabName === 'dynamics'   && !charts['reportsLineChart']) initLineChart(currentData);
    if (tabName === 'categories' && !charts['categoriesChart'])  initCategoriesChart(currentData);
    if (tabName === 'comparison' && !charts['comparisonChart'])  initComparisonChart(currentData);
    if (tabName === 'avgexpense' && !charts['avgExpenseChart'])  initAvgExpenseChart(currentData);
}

// ──────────────────────────────────────────────
// Инициализация при загрузке
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

document.addEventListener('DOMContentLoaded', async function() {
    initNavToggle();
    _transactions = await API.get('/transactions');
    const months  = parseInt(document.getElementById('periodSelect')?.value || '3');
    currentData   = buildPeriodData(months);
    updateMetrics(currentData);
    initLineChart(currentData);
});

window.switchTab   = switchTab;
window.applyPeriod = applyPeriod;
