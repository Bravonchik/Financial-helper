# 📤 Инструкция по загрузке сайта на GitHub

## 📋 Какие файлы нужно загружать

### ✅ ЗАГРУЖАТЬ (все эти файлы):
- **HTML файлы**: `index.html`, `transactions.html`, `budget.html`, `reports.html`, `profile.html`, `login.html`
- **CSS файлы**: `styles.css`, `transactions.css`, `budget.css`, `reports.css`, `profile.css`, `login.css`
- **JavaScript файлы**: `script.js`, `transactions.js`, `budget.js`, `reports.js`, `profile.js`, `login.js`, `auth.js`
- **Документация**: `README.md`, `LOCAL_SERVER.md`
- **Конфигурация**: `.gitignore` (уже создан)

### ❌ НЕ загружать (автоматически исключаются через .gitignore):
- Системные файлы Windows (`Thumbs.db`, `Desktop.ini`)
- Временные файлы (`.tmp`, `.log`)
- Файлы редакторов (`.vscode/`, `.idea/`)
- `node_modules/` (если будет использоваться)

---

## 🚀 Пошаговая инструкция

### Шаг 1: Установка Git (если не установлен)

1. Скачайте Git с официального сайта: https://git-scm.com/download/win
2. Установите Git (оставьте все настройки по умолчанию)
3. Перезапустите терминал после установки

### Шаг 2: Инициализация Git репозитория

Откройте PowerShell или CMD в папке проекта и выполните:

```bash
# Инициализация репозитория
git init

# Добавление всех файлов (кроме тех, что в .gitignore)
git add .

# Первый коммит
git commit -m "Initial commit: Финансовый помощник"
```

### Шаг 3: Создание репозитория на GitHub

1. Зайдите на https://github.com
2. Войдите в свой аккаунт (или создайте новый)
3. Нажмите кнопку **"+"** в правом верхнем углу → **"New repository"**
4. Заполните:
   - **Repository name**: `financial-helper` (или любое другое имя)
   - **Description**: "Веб-приложение для управления личными финансами"
   - **Visibility**: Public (или Private, если хотите скрыть)
   - **НЕ ставьте галочки** на "Add a README file", "Add .gitignore", "Choose a license" (у нас уже есть файлы)
5. Нажмите **"Create repository"**

### Шаг 4: Подключение локального репозитория к GitHub

После создания репозитория GitHub покажет инструкции. Выполните в терминале:

```bash
# Добавление удалённого репозитория (замените USERNAME на ваш GitHub username)
git remote add origin https://github.com/USERNAME/financial-helper.git

# Переименование основной ветки в main (если нужно)
git branch -M main

# Загрузка файлов на GitHub
git push -u origin main
```

**Важно**: При первом `git push` GitHub попросит ввести логин и пароль. Используйте:
- **Username**: ваш GitHub username
- **Password**: Personal Access Token (НЕ обычный пароль!)

### Шаг 5: Создание Personal Access Token (если нужно)

Если GitHub просит токен вместо пароля:

1. Зайдите на GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Нажмите **"Generate new token (classic)"**
3. Назовите токен (например, "My Computer")
4. Выберите срок действия (например, 90 days)
5. Отметьте галочку **`repo`** (полный доступ к репозиториям)
6. Нажмите **"Generate token"**
7. **Скопируйте токен** (он показывается только один раз!)
8. Используйте этот токен как пароль при `git push`

---

## 🔄 Обновление файлов на GitHub

После изменения файлов выполните:

```bash
# Добавить изменения
git add .

# Создать коммит с описанием
git commit -m "Описание изменений"

# Загрузить на GitHub
git push
```

---

## 🌐 Публикация сайта через GitHub Pages

После загрузки на GitHub можно сделать сайт доступным онлайн:

1. Зайдите в ваш репозиторий на GitHub
2. Нажмите **Settings** (вверху справа)
3. В левом меню найдите **Pages**
4. В разделе **Source** выберите:
   - Branch: `main`
   - Folder: `/ (root)`
5. Нажмите **Save**
6. Через 1-2 минуты ваш сайт будет доступен по адресу:
   `https://USERNAME.github.io/financial-helper/`

---

## ⚠️ Важные замечания

1. **Не загружайте пароли и секретные ключи** - они не должны попасть в репозиторий
2. **Делайте понятные коммиты** - пишите, что именно изменили
3. **Регулярно делайте push** - чтобы не потерять изменения

---

## 🆘 Решение проблем

**Проблема**: "git is not recognized"
- **Решение**: Установите Git (см. Шаг 1)

**Проблема**: "Permission denied"
- **Решение**: Проверьте правильность Personal Access Token

**Проблема**: "Repository not found"
- **Решение**: Проверьте правильность URL репозитория и что вы авторизованы

**Проблема**: "Failed to push"
- **Решение**: Сначала выполните `git pull origin main`, затем `git push`

---

**Удачи с загрузкой! 🎉**

