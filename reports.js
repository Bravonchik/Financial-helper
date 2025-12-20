// Функции для страницы отчётов

// Переключение вкладок
function switchTab(tabName) {
    // Убираем активный класс со всех вкладок и панелей
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });

    // Добавляем активный класс к выбранной вкладке и панели
    event.target.classList.add('active');
    document.getElementById(tabName + '-tab').classList.add('active');

    // Инициализируем график для активной вкладки
    initChartForTab(tabName);
}

// Обработка смены периода
document.addEventListener('DOMContentLoaded', function() {
    const applyBtn = document.querySelector('.period-control .btn-primary');
    const periodSelect = document.querySelector('.period-select');
    
    if (applyBtn && periodSelect) {
        applyBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const selectedPeriod = periodSelect.value;
            updateReportsForPeriod(selectedPeriod);
        });
    }
});

// Обновление отчетов для выбранного периода
function updateReportsForPeriod(period) {
    // Уничтожаем существующие графики
    const charts = Chart.getChart('reportsLineChart');
    if (charts) charts.destroy();
    
    const categoriesChart = Chart.getChart('categoriesChart');
    if (categoriesChart) categoriesChart.destroy();
    
    const comparisonChart = Chart.getChart('comparisonChart');
    if (comparisonChart) comparisonChart.destroy();
    
    // В зависимости от периода обновляем данные
    let months = [];
    let incomeData = [];
    let expenseData = [];
    
    if (period === 'Последние 6 месяцев') {
        months = ['Май', 'Июнь', 'Июль', 'Авг', 'Сен', 'Окт'];
        incomeData = [145000, 150000, 155000, 148000, 150000, 150000];
        expenseData = [105000, 100000, 118000, 95000, 115000, 100000];
    } else if (period === 'Последние 3 месяца') {
        months = ['Авг', 'Сен', 'Окт'];
        incomeData = [148000, 150000, 150000];
        expenseData = [95000, 115000, 100000];
    } else if (period === 'Последний год') {
        months = ['Ноя', 'Дек', 'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июнь', 'Июль', 'Авг', 'Сен', 'Окт'];
        incomeData = [150000, 145000, 140000, 145000, 150000, 148000, 145000, 150000, 155000, 148000, 150000, 150000];
        expenseData = [100000, 95000, 90000, 95000, 100000, 98000, 105000, 100000, 118000, 95000, 115000, 100000];
    } else if (period === 'Текущий месяц') {
        months = ['Окт'];
        incomeData = [150000];
        expenseData = [100000];
    }
    
    // Пересоздаем графики с новыми данными
    setTimeout(() => {
        initReportsLineChartWithData(months, incomeData, expenseData);
        initCategoriesChart();
        initComparisonChartWithData(months, incomeData, expenseData);
    }, 100);
    
    alert('Период изменен на: ' + period);
}

// Инициализация линейного графика с данными
function initReportsLineChartWithData(labels, incomeData, expenseData) {
    const ctx = document.getElementById('reportsLineChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Доходы',
                    data: incomeData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 6,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 8
                },
                {
                    label: 'Расходы',
                    data: expenseData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 6,
                    pointBackgroundColor: '#ef4444',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y || 0;
                            return context.dataset.label + ': ' + formatCurrency(value);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString('ru-RU');
                        }
                    },
                    grid: {
                        color: '#e5e7eb'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// Инициализация графика сравнения с данными
function initComparisonChartWithData(labels, incomeData, expenseData) {
    const ctx = document.getElementById('comparisonChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Доходы',
                    data: incomeData,
                    backgroundColor: '#10b981',
                    borderRadius: 8
                },
                {
                    label: 'Расходы',
                    data: expenseData,
                    backgroundColor: '#ef4444',
                    borderRadius: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y || 0;
                            return context.dataset.label + ': ' + formatCurrency(value);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString('ru-RU');
                        }
                    },
                    grid: {
                        color: '#e5e7eb'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Инициализация графиков
document.addEventListener('DOMContentLoaded', function() {
    initReportsLineChart();
    initCategoriesChart();
    initComparisonChart();
});

// Линейный график доходов и расходов
function initReportsLineChart() {
    const labels = ['Май', 'Июнь', 'Июль', 'Авг', 'Сен', 'Окт'];
    const incomeData = [145000, 150000, 155000, 148000, 150000, 150000];
    const expenseData = [105000, 100000, 118000, 95000, 115000, 100000];
    initReportsLineChartWithData(labels, incomeData, expenseData);
}

// График по категориям
function initCategoriesChart() {
    const ctx = document.getElementById('categoriesChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Продукты', 'Транспорт', 'Развлечения', 'Коммунальные', 'Здоровье', 'Прочее'],
            datasets: [{
                data: [220000, 90000, 72000, 108000, 27000, 108000],
                backgroundColor: [
                    '#3b82f6',
                    '#f97316',
                    '#8b5cf6',
                    '#14b8a6',
                    '#ec4899',
                    '#6b7280'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return label + ': ' + formatCurrency(value) + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

// График сравнения
function initComparisonChart() {
    const labels = ['Май', 'Июнь', 'Июль', 'Авг', 'Сен', 'Окт'];
    const incomeData = [145000, 150000, 155000, 148000, 150000, 150000];
    const expenseData = [105000, 100000, 118000, 95000, 115000, 100000];
    initComparisonChartWithData(labels, incomeData, expenseData);
}

// Инициализация графика для активной вкладки
function initChartForTab(tabName) {
    // Графики уже инициализированы при загрузке страницы
    // Можно добавить дополнительную логику обновления при необходимости
}

// Форматирование валюты
function formatCurrency(value) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

