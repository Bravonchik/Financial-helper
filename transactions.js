// Функции для работы с транзакциями

function openAddTransactionModal() {
    const modal = document.getElementById('transactionModal');
    if (modal) {
        resetTransactionForm();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
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
    
    if (!transaction) {
        alert('Транзакция не найдена');
        return;
    }
    
    // Заполняем форму данными транзакции
    document.getElementById('transactionModalTitle').textContent = 'Изменить транзакцию';
    document.getElementById('transactionId').value = transaction.id;
    document.getElementById('transactionSubmitBtn').textContent = 'Сохранить';
    
    // Показываем кнопку удаления
    document.getElementById('deleteTransactionBtn').style.display = 'inline-flex';
    
    // Заполняем поля
    if (transaction.type === 'income') {
        document.getElementById('typeIncome').checked = true;
    } else {
        document.getElementById('typeExpense').checked = true;
    }
    
    document.getElementById('transactionCategory').value = transaction.category;
    document.getElementById('transactionDescription').value = transaction.description;
    document.getElementById('transactionAmount').value = transaction.amount;
    document.getElementById('transactionDate').value = transaction.date;
    
    // Открываем модальное окно
    openAddTransactionModal();
}

function deleteCurrentTransaction() {
    const transactionId = document.getElementById('transactionId').value;
    
    if (!transactionId) {
        return;
    }
    
    if (confirm('Вы уверены, что хотите удалить эту транзакцию?')) {
        const transactions = loadTransactions();
        const filtered = transactions.filter(t => t.id !== parseInt(transactionId));
        saveTransactions(filtered);
        renderTransactions();
        closeModal('transactionModal');
        alert('Транзакция удалена!');
    }
}

// Закрытие модального окна при клике вне его
document.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            closeModal(modal.id);
        }
    });
});

// Загрузка транзакций из localStorage
function loadTransactions() {
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    return transactions;
}

// Сохранение транзакций в localStorage
function saveTransactions(transactions) {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Добавление новой транзакции
function addTransaction(transaction) {
    const transactions = loadTransactions();
    transaction.id = Date.now();
    transaction.date = transaction.date || new Date().toISOString().split('T')[0];
    transactions.unshift(transaction);
    saveTransactions(transactions);
    return transaction;
}

// Обновление таблицы транзакций
function renderTransactions() {
    const transactions = loadTransactions();
    const tbody = document.querySelector('.transactions-table tbody');
    if (!tbody) return;

    if (transactions.length === 0) {
        // Если нет сохраненных транзакций, оставляем дефолтные
        return;
    }

    tbody.innerHTML = transactions.map(trans => {
        const date = new Date(trans.date).toLocaleDateString('ru-RU');
        const categoryColors = {
            'Продукты': 'blue',
            'Транспорт': 'orange',
            'Развлечения': 'purple',
            'Коммунальные': 'teal',
            'Здоровье': 'pink',
            'Зарплата': 'green',
            'Фриланс': 'green'
        };
        const categoryColor = categoryColors[trans.category] || 'blue';
        const isIncome = trans.type === 'income';
        const amountClass = isIncome ? 'positive' : 'negative';
        const amountSign = isIncome ? '+' : '-';
        const typeBadge = isIncome ? 'income' : 'expense';
        const typeText = isIncome ? 'Доход' : 'Расход';

        return `
            <tr>
                <td>${date}</td>
                <td><span class="category-badge ${categoryColor}">${trans.category}</span></td>
                <td>${trans.description}</td>
                <td><span class="type-badge ${typeBadge}">${typeText}</span></td>
                <td class="amount ${amountClass}">${amountSign} ${parseInt(trans.amount).toLocaleString('ru-RU')} Р</td>
                <td><a href="#" class="action-link" onclick="editTransaction(${trans.id})">Изменить</a></td>
            </tr>
        `;
    }).join('');
}

// Обработка формы добавления/редактирования транзакции
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('transactionForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const transactionId = document.getElementById('transactionId').value;
            const type = document.querySelector('input[name="type"]:checked').value;
            const category = document.getElementById('transactionCategory').value;
            const description = document.getElementById('transactionDescription').value;
            const amount = document.getElementById('transactionAmount').value;
            const date = document.getElementById('transactionDate').value;

            if (!category || !description || !amount || !date) {
                alert('Пожалуйста, заполните все поля');
                return;
            }

            const transactions = loadTransactions();
            
            if (transactionId) {
                // Редактирование существующей транзакции
                const index = transactions.findIndex(t => t.id === parseInt(transactionId));
                if (index !== -1) {
                    transactions[index] = {
                        id: parseInt(transactionId),
                        type: type,
                        category: category,
                        description: description,
                        amount: amount,
                        date: date
                    };
                    saveTransactions(transactions);
                    renderTransactions();
                    alert('Транзакция успешно изменена!');
                }
            } else {
                // Добавление новой транзакции
                const transaction = {
                    type: type,
                    category: category,
                    description: description,
                    amount: amount,
                    date: date
                };
                addTransaction(transaction);
                renderTransactions();
                alert('Транзакция успешно добавлена!');
            }
            
            closeModal('transactionModal');
            resetTransactionForm();
        });
    }

    // Загружаем транзакции при загрузке страницы
    renderTransactions();
});

// Сброс формы транзакции
function resetTransactionForm() {
    const form = document.getElementById('transactionForm');
    if (form) {
        form.reset();
        document.getElementById('transactionId').value = '';
        document.getElementById('transactionModalTitle').textContent = 'Добавить транзакцию';
        document.getElementById('transactionSubmitBtn').textContent = 'Добавить';
        document.getElementById('deleteTransactionBtn').style.display = 'none';
        if (document.getElementById('typeIncome')) {
            document.getElementById('typeIncome').checked = true;
        }
    }
}

