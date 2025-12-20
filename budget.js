// Функции для работы с бюджетом

let selectedColor = '#3b82f6';

function openAddCategoryModal() {
    const modal = document.getElementById('addCategoryModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        initColorPicker('addCategoryModal');
    }
}

function openEditCategoryModal(name, amount, color) {
    const modal = document.getElementById('editCategoryModal');
    if (modal) {
        document.getElementById('editCategoryName').value = name;
        document.getElementById('editCategoryAmount').value = amount;
        selectedColor = color;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        initColorPicker('editCategoryModal');
        setActiveColor(color);
        
        // Сохраняем имя редактируемой категории
        window.editingCategoryName = name;
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function initColorPicker(modalId) {
    const modal = document.getElementById(modalId);
    const colorOptions = modal.querySelectorAll('.color-option');
    
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            colorOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            selectedColor = this.dataset.color;
        });
    });
}

function setActiveColor(color) {
    const modal = document.getElementById('editCategoryModal');
    if (modal) {
        const colorOptions = modal.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.color === color) {
                option.classList.add('active');
            }
        });
    }
}

// Загрузка категорий из localStorage
function loadCategories() {
    const categories = JSON.parse(localStorage.getItem('budgetCategories') || '[]');
    return categories;
}

// Сохранение категорий в localStorage
function saveCategories(categories) {
    localStorage.setItem('budgetCategories', JSON.stringify(categories));
}

// Инициализация дефолтных категорий
function initDefaultCategories() {
    const categories = loadCategories();
    if (categories.length === 0) {
        const defaultCategories = [
            { name: 'Продукты', budget: 40000, spent: 35000, color: '#3b82f6' },
            { name: 'Транспорт', budget: 10000, spent: 15000, color: '#f97316' },
            { name: 'Здоровье', budget: 10000, spent: 4500, color: '#ec4899' },
            { name: 'Косметика', budget: 10000, spent: 0, color: '#14b8a6' }
        ];
        saveCategories(defaultCategories);
    }
}

function deleteCategory(name) {
    if (confirm(`Вы уверены, что хотите удалить категорию "${name}"?`)) {
        const categories = loadCategories();
        const filtered = categories.filter(cat => cat.name !== name);
        saveCategories(filtered);
        alert(`Категория "${name}" удалена!`);
        location.reload(); // Перезагружаем страницу для обновления
    }
}

// Закрытие модальных окон при клике вне их
document.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            closeModal(modal.id);
        }
    });
});

// Обработка формы добавления категории
document.addEventListener('DOMContentLoaded', function() {
    initDefaultCategories();

    const addForm = document.getElementById('addCategoryForm');
    if (addForm) {
        addForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = addForm.querySelector('input[type="text"]').value;
            const amount = parseInt(addForm.querySelector('input[type="number"]').value);
            const colorOption = addForm.querySelector('.color-option.active');
            const color = colorOption ? colorOption.dataset.color : '#3b82f6';

            if (!name || !amount) {
                alert('Пожалуйста, заполните все поля');
                return;
            }

            const categories = loadCategories();
            const newCategory = {
                name: name,
                budget: amount,
                spent: 0,
                color: color
            };
            categories.push(newCategory);
            saveCategories(categories);

            alert('Категория успешно добавлена!');
            closeModal('addCategoryModal');
            addForm.reset();
            location.reload();
        });
    }

    const editForm = document.getElementById('editCategoryForm');
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('editCategoryName').value;
            const amount = parseInt(document.getElementById('editCategoryAmount').value);
            const colorOption = editForm.querySelector('.color-option.active');
            const color = colorOption ? colorOption.dataset.color : '#3b82f6';

            if (!name || !amount) {
                alert('Пожалуйста, заполните все поля');
                return;
            }

            const categories = loadCategories();
            const editingName = window.editingCategoryName || name;
            const index = categories.findIndex(cat => cat.name === editingName);
            if (index !== -1) {
                const spent = categories[index].spent; // Сохраняем потраченную сумму
                categories[index] = {
                    name: name,
                    budget: amount,
                    spent: spent,
                    color: color
                };
                saveCategories(categories);
                alert('Изменения сохранены!');
                closeModal('editCategoryModal');
                location.reload();
            } else {
                alert('Категория не найдена');
            }
        });
    }

    // Установка активного цвета по умолчанию
    const addModal = document.getElementById('addCategoryModal');
    if (addModal) {
        const firstColor = addModal.querySelector('.color-option');
        if (firstColor) {
            firstColor.classList.add('active');
        }
    }
});

