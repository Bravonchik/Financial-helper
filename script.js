// Инициализация графиков после загрузки страницы
document.addEventListener('DOMContentLoaded', function() {
    initPieChart();
    initLineChart();
    updateDashboardDisplay();
});

// Круговая диаграмма расходов по категориям
function initPieChart() {
    const ctx = document.getElementById('pieChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Продукты', 'Транспорт', 'Развлечения', 'Коммунальные', 'Прочее'],
            datasets: [{
                data: [36, 15, 12, 18, 18],
                backgroundColor: [
                    '#3b82f6', // Blue
                    '#f97316', // Orange
                    '#8b5cf6', // Purple
                    '#14b8a6', // Teal
                    '#6b7280'  // Dark Gray
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            return label + ': ' + value + '%';
                        }
                    }
                }
            }
        }
    });
}

// Линейный график динамики за 6 месяцев
function initLineChart() {
    const ctx = document.getElementById('lineChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя'],
            datasets: [
                {
                    label: 'Доходы',
                    data: [150000, 155000, 150000, 152000, 150000, 150000],
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
                    data: [105000, 100000, 118000, 95000, 115000, 100000],
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
                    display: false
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
                    max: 160000,
                    ticks: {
                        stepSize: 40000,
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

// Форматирование валюты
function formatCurrency(value) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

// Загрузка данных дашборда из localStorage
function loadDashboardData() {
    const data = JSON.parse(localStorage.getItem('dashboardData') || '{}');
    return {
        balance: data.balance || 52000,
        balanceTrend: data.balanceTrend || 12,
        income: data.income || 150000,
        expense: data.expense || 98000,
        savingsGoal: data.savingsGoal || 320000,
        savingsCurrent: data.savingsCurrent || 208000
    };
}

// Сохранение данных дашборда в localStorage
function saveDashboardData(data) {
    localStorage.setItem('dashboardData', JSON.stringify(data));
}

// Обновление отображения данных
function updateDashboardDisplay() {
    const data = loadDashboardData();
    
    document.getElementById('balanceValue').textContent = formatNumber(data.balance) + ' Р';
    document.getElementById('incomeValue').textContent = formatNumber(data.income) + ' Р';
    document.getElementById('expenseValue').textContent = formatNumber(data.expense) + ' Р';
    document.getElementById('savingsValue').textContent = formatNumber(data.savingsGoal) + ' Р';
    
    const trendSign = data.balanceTrend >= 0 ? '+' : '';
    document.getElementById('balanceTrend').textContent = trendSign + data.balanceTrend + '% от прошлого месяца';
    
    const savingsPercent = Math.round((data.savingsCurrent / data.savingsGoal) * 100);
    document.getElementById('savingsPercent').textContent = savingsPercent + '%';
    document.getElementById('savingsProgressBar').style.width = Math.min(savingsPercent, 100) + '%';
}

// Форматирование числа с пробелами
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Открытие модального окна редактирования
let currentEditType = '';

function openEditModal(type) {
    currentEditType = type;
    const modal = document.getElementById('editMetricModal');
    const data = loadDashboardData();
    
    const titles = {
        'balance': 'Изменить текущий баланс',
        'income': 'Изменить доходы',
        'expense': 'Изменить расходы',
        'savings': 'Изменить цель сбережений'
    };
    
    document.getElementById('editModalTitle').textContent = titles[type] || 'Изменить значение';
    
    // Показываем/скрываем дополнительные поля
    const trendGroup = document.getElementById('trendGroup');
    const savingsCurrentGroup = document.getElementById('savingsCurrentGroup');
    
    if (type === 'balance') {
        trendGroup.style.display = 'block';
        savingsCurrentGroup.style.display = 'none';
        document.getElementById('editMetricInput').value = data.balance;
        document.getElementById('editTrendInput').value = data.balanceTrend;
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

// Закрытие модального окна
function closeEditModal() {
    const modal = document.getElementById('editMetricModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('editMetricForm').reset();
}

// Обработка формы редактирования
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем сохраненные данные
    updateDashboardDisplay();
    
    const editForm = document.getElementById('editMetricForm');
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const data = loadDashboardData();
            const value = parseInt(document.getElementById('editMetricInput').value);
            
            if (currentEditType === 'balance') {
                data.balance = value;
                const trend = parseFloat(document.getElementById('editTrendInput').value) || 0;
                data.balanceTrend = trend;
            } else if (currentEditType === 'income') {
                data.income = value;
            } else if (currentEditType === 'expense') {
                data.expense = value;
            } else if (currentEditType === 'savings') {
                data.savingsGoal = value;
                const current = parseInt(document.getElementById('editSavingsCurrentInput').value) || 0;
                data.savingsCurrent = current;
            }
            
            saveDashboardData(data);
            updateDashboardDisplay();
            closeEditModal();
            alert('Изменения сохранены!');
        });
    }
    
    // Закрытие модального окна при клике вне его
    const modal = document.getElementById('editMetricModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeEditModal();
            }
        });
    }
});

// Делаем функции глобальными для использования в onclick
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;

// Обработчики кнопок
document.addEventListener('DOMContentLoaded', function() {
    // Кнопка "Добавить транзакцию"
    const addTransactionBtn = document.querySelector('.action-buttons .btn-primary');
    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'transactions.html';
        });
    }

    // Кнопка "Отчёты"
    const reportsBtn = document.querySelectorAll('.action-buttons .btn-secondary')[0];
    if (reportsBtn) {
        reportsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'reports.html';
        });
    }

    // Кнопка "План бюджета"
    const budgetBtn = document.querySelectorAll('.action-buttons .btn-secondary')[1];
    if (budgetBtn) {
        budgetBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'budget.html';
        });
    }
});

