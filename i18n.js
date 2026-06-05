// ──────────────────────────────────────────────
// Система интернационализации (RU / EN)
// ──────────────────────────────────────────────
const I18n = (() => {
  const LANG_KEY = 'lang';

  const TRANSLATIONS = {
    en: {
      // ── Навигация ──────────────────────────────
      'Финансовый помощник': 'Financial Assistant',
      'Главная': 'Home',
      'Транзакции': 'Transactions',
      'Бюджет': 'Budget',
      'Отчёты': 'Reports',
      'Цели': 'Goals',
      'Профиль': 'Profile',

      // ── Дашборд ────────────────────────────────
      'Дашборд': 'Dashboard',
      'Обзор ваших финансов': 'Overview of your finances',
      'Текущий баланс': 'Current balance',
      'Доходы': 'Income',
      'Расходы': 'Expenses',
      'Доход': 'Income',
      'Расход': 'Expense',
      'Дневной лимит до конца месяца': 'Daily limit until end of month',
      'Осталось дней': 'Days remaining',
      'Остаток бюджета': 'Budget remaining',
      'Изменить': 'Edit',
      'Цель сбережений': 'Savings goal',
      'Достигнуто': 'Achieved',
      'Добавить транзакцию': 'Add transaction',
      'План бюджета': 'Budget plan',
      'Расходы по категориям': 'Expenses by category',
      'Динамика за 6 месяцев': 'Dynamics over 6 months',
      'Быстрое добавление': 'Quick add',
      'Тип операции': 'Operation type',
      'Категория': 'Category',
      'Выберите категорию': 'Select category',
      'Описание': 'Description',
      'Введите описание': 'Enter description',
      'Сумма (₽)': 'Amount (₽)',
      'Сумма (Р)': 'Amount (₽)',
      'Дата': 'Date',
      'Отмена': 'Cancel',
      'Сохранить': 'Save',
      'Изменить значение': 'Change value',
      'Значение (Р)': 'Value (₽)',
      'Изменение (%)': 'Change (%)',
      'Текущая сумма (Р)': 'Current amount (₽)',

      // ── Категории ──────────────────────────────
      'Продукты': 'Groceries',
      'Развлечения': 'Entertainment',
      'Транспорт': 'Transport',
      'Связь': 'Communication',
      'Одежда': 'Clothing',
      'Стипендия': 'Scholarship',
      'Подработка': 'Side work',
      'Прочее': 'Other',
      'Коммунальные': 'Utilities',

      // ── Транзакции ─────────────────────────────
      'Все операции по вашему счёту': 'All account operations',
      'Пример CSV': 'CSV example',
      'Импорт CSV': 'Import CSV',
      'Экспорт CSV': 'Export CSV',
      'Добавить': 'Add',
      'Фильтры': 'Filters',
      'Поиск по описанию': 'Search by description',
      'Все категории': 'All categories',
      'Все операции': 'All operations',
      'Все месяцы': 'All months',
      'Сначала новые': 'Newest first',
      'Сначала старые': 'Oldest first',
      'Тип': 'Type',
      'Действия': 'Actions',
      'Повторять каждый месяц': 'Repeat every month',
      'Удалить': 'Delete',
      'Нет транзакций': 'No transactions',

      // ── Бюджет ─────────────────────────────────
      'Планирование бюджета': 'Budget planning',
      'Управляйте своими расходами по категориям': 'Manage your expenses by category',
      'Добавить категорию': 'Add category',
      'Месячный бюджет': 'Monthly budget',
      'Запланировано на текущий месяц': 'Planned for current month',
      'Потрачено': 'Spent',
      'Осталось': 'Remaining',
      'До конца месяца': 'Until end of month',
      'Общий прогресс': 'Overall progress',
      'Использовано бюджета': 'Budget used',
      'Превышение бюджета': 'Budget exceeded',
      'Добавить новую категорию': 'Add new category',
      'Создайте новую категорию бюджета для отслеживания расходов': 'Create a new budget category to track expenses',
      'Название категории': 'Category name',
      'Например: Образование': 'E.g.: Education',
      'Цвет категории': 'Category color',
      'Редактировать категорию': 'Edit category',
      'Измените параметры категории бюджета': 'Change budget category parameters',
      'Сохранить изменения': 'Save changes',

      // ── Цели ───────────────────────────────────
      'Цели накоплений': 'Savings goals',
      'Откладывайте на мечту шаг за шагом': 'Save for your dreams step by step',
      'Новая цель': 'New goal',
      'Название цели': 'Goal name',
      'Например: Новый телефон': 'E.g.: New phone',
      'Целевая сумма (Р)': 'Target amount (₽)',
      'Уже накоплено (Р)': 'Already saved (₽)',
      'Иконка': 'Icon',
      'Цвет': 'Color',
      'Пополнить цель': 'Add to goal',
      'Цель:': 'Goal:',
      'Сумма пополнения (Р)': 'Top-up amount (₽)',
      'Пополнить': 'Top up',
      'Нет целей': 'No goals',

      // ── Отчёты ─────────────────────────────────
      'Анализ ваших финансов': 'Analysis of your finances',
      'Период:': 'Period:',
      'Последние 6 месяцев': 'Last 6 months',
      'Последние 3 месяца': 'Last 3 months',
      'Последний год': 'Last year',
      'Текущий месяц': 'Current month',
      'Применить': 'Apply',
      'Всего доходов': 'Total income',
      'За 6 месяцев': 'For 6 months',
      'Всего расходов': 'Total expenses',
      'Средний расход': 'Average expense',
      'В месяц': 'Per month',
      'Сбережения': 'Savings',
      'Динамика': 'Dynamics',
      'По категориям': 'By category',
      'Сравнение': 'Comparison',
      'Доходы и расходы по месяцам': 'Income and expenses by month',
      'Средний расход в месяц': 'Average monthly expense',
      'Расходы за день': 'Daily expenses',
      'Остаток': 'Balance',
      'Ежедневная динамика за текущий месяц': 'Daily dynamics for current month',
      'Доходы и расходы по месяцам': 'Income and expenses by month',

      // ── Профиль ────────────────────────────────
      'Личная информация': 'Personal information',
      'Загрузить фото': 'Upload photo',
      'JPG, PNG. Макс. 5МВ': 'JPG, PNG. Max 5MB',
      'Имя': 'First name',
      'Фамилия': 'Last name',
      'Телефон': 'Phone',
      'Финансовые настройки': 'Financial settings',
      'Валюта по умолчанию': 'Default currency',
      'Начало месяца': 'Month start',
      'Настройки уведомлений': 'Notification settings',
      'Уведомления о транзакциях': 'Transaction notifications',
      'Уведомления о превышении бюджета': 'Budget exceeded notifications',
      'Еженедельные отчёты': 'Weekly reports',
      'Уведомления о достижении целей': 'Goal achievement notifications',
      'Сохранить настройки': 'Save settings',
      'Общие настройки': 'General settings',
      'Язык интерфейса': 'Interface language',
      'Русский': 'Russian',
      'Тема оформления': 'Theme',
      'Светлая': 'Light',
      'Тёмная': 'Dark',
      'Автоматическая': 'Auto',
      'Смена пароля': 'Change password',
      'Текущий пароль': 'Current password',
      'Новый пароль': 'New password',
      'Подтвердите новый пароль': 'Confirm new password',
      'Изменить пароль': 'Change password',
      'Введите текущий пароль': 'Enter current password',
      'Минимум 6 символов': 'Minimum 6 characters',
      'Повторите пароль': 'Repeat password',
      'Сессия': 'Session',
      'После выхода потребуется снова войти в аккаунт.': 'After logout you will need to sign in again.',
      'Выйти из аккаунта': 'Log out',
      'Настройки': 'Settings',
      'Безопасность': 'Security',

      // ── Вкладки профиля ────────────────────────
      'Профиль': 'Profile',

      // ── Вход / Регистрация ─────────────────────
      'Войдите в свой аккаунт': 'Sign in to your account',
      'Имя пользователя': 'Username',
      'Пароль': 'Password',
      'Войти': 'Sign in',
      'Нет аккаунта?': 'No account?',
      'Зарегистрироваться': 'Sign up',
      'Создать аккаунт': 'Create account',
      'Начните управлять финансами': 'Start managing your finances',
      'Подтвердите пароль': 'Confirm password',
      'Уже есть аккаунт?': 'Already have an account?',
      'Пароли не совпадают': 'Passwords do not match',

      // ── Динамические строки dashboard ──────────
      '% от прошлого месяца': '% vs last month',
      'За текущий месяц': 'Current month',
      ' дн.': ' d.',
      ' Р': ' ₽',
      ' Р/день': ' ₽/day',
      'Внимание по бюджету': 'Budget warning',
      'превышен на': 'exceeded by',
      'использовано': 'used',
      'Заполните все поля': 'Fill in all fields',
      'Транзакция добавлена': 'Transaction added',
      'Изменить текущий баланс': 'Edit current balance',
      'Изменить доходы': 'Edit income',
      'Изменить расходы': 'Edit expenses',
      'Изменить цель сбережений': 'Edit savings goal',
      // Месяцы (короткие)
      'Янв': 'Jan', 'Фев': 'Feb', 'Мар': 'Mar', 'Апр': 'Apr',
      'Май': 'May', 'Июн': 'Jun', 'Июл': 'Jul', 'Авг': 'Aug',
      'Сен': 'Sep', 'Окт': 'Oct', 'Ноя': 'Nov', 'Дек': 'Dec',

      // ── Общие ──────────────────────────────────
      'Нет данных': 'No data',
      'Загрузка...': 'Loading...',
      'Ошибка сервера': 'Server error',
      'Нет соединения с сервером': 'No server connection',
      'Изменения сохранены': 'Changes saved',
      'Тема изменена': 'Theme changed',
      'Настройки сохранены': 'Settings saved',
      'Пароль изменён': 'Password changed',
      'Фото сохранено': 'Photo saved',
    }
  };

  // ── Геттер / сеттер языка ────────────────────
  function getLang() {
    return localStorage.getItem(LANG_KEY) || 'ru';
  }

  function setLang(lang) {
    localStorage.setItem(LANG_KEY, lang);
    location.reload();
  }

  // ── Перевод одной строки ─────────────────────
  function t(key) {
    const lang = getLang();
    if (lang === 'ru') return key;
    return TRANSLATIONS[lang]?.[key] ?? key;
  }

  // ── Применить перевод к странице ────────────
  function apply() {
    const lang = getLang();
    document.documentElement.lang = lang === 'en' ? 'en' : 'ru';
    if (lang === 'ru') return;

    const dict = TRANSLATIONS[lang];
    if (!dict) return;

    // 1. Текстовые узлы — заменяем только если trimmed точно совпадает
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    for (const node of textNodes) {
      const raw     = node.textContent;
      const trimmed = raw.trim();
      if (trimmed && dict[trimmed]) {
        node.textContent = raw.replace(trimmed, dict[trimmed]);
      }
    }

    // 2. Плейсхолдеры
    document.querySelectorAll('[placeholder]').forEach(el => {
      const p = el.getAttribute('placeholder');
      if (dict[p]) el.setAttribute('placeholder', dict[p]);
    });

    // 3. aria-label и title
    document.querySelectorAll('[aria-label], [title]').forEach(el => {
      const a = el.getAttribute('aria-label');
      if (a && dict[a]) el.setAttribute('aria-label', dict[a]);
      const tt = el.getAttribute('title');
      if (tt && dict[tt]) el.setAttribute('title', dict[tt]);
    });
  }

  // ── Инициализация при загрузке ───────────────
  document.addEventListener('DOMContentLoaded', () => {
    apply();

    // Синхронизируем селектор языка (если есть на странице)
    const sel = document.getElementById('langSelect');
    if (sel) {
      sel.value = getLang();
      sel.addEventListener('change', function () {
        setLang(this.value);
      });
    }
  });

  return { getLang, setLang, t, apply };
})();
