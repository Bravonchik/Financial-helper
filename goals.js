// ──────────────────────────────────────────────
// Toast
// ──────────────────────────────────────────────
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) { container = document.createElement('div'); container.id = 'toast-container'; document.body.appendChild(container); }
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
const GOALS_ICONS  = ['mobile-alt','laptop','car','plane','home','graduation-cap','gamepad','music','camera','tshirt','utensils','heart','gift','book','bicycle','dumbbell'];
const GOALS_COLORS = ['#3b82f6','#10b981','#f97316','#8b5cf6','#ef4444','#14b8a6','#f59e0b','#ec4899','#6366f1','#84cc16'];

let _goals        = [];
let selectedIcon  = GOALS_ICONS[0];
let selectedColor = GOALS_COLORS[0];
let editingGoalId = null;

function formatCurrency(v) {
    return new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',minimumFractionDigits:0,maximumFractionDigits:0}).format(v);
}
function escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ──────────────────────────────────────────────
// Рендер карточек
// ──────────────────────────────────────────────
function renderGoals() {
    const container = document.getElementById('goalsGrid');
    if (!container) return;

    if (_goals.length === 0) {
        container.innerHTML = `<div class="goals-empty">
            <i class="fas fa-bullseye"></i>
            <p>Нет целей накоплений. Добавьте первую!</p>
            <button class="btn btn-primary" onclick="openGoalModal()"><i class="fas fa-plus"></i> Добавить цель</button>
        </div>`;
        return;
    }

    container.innerHTML = _goals.map(goal => {
        const pct       = goal.target_amount > 0 ? Math.min(Math.round((goal.saved_amount / goal.target_amount) * 100), 100) : 0;
        const remaining = Math.max(goal.target_amount - goal.saved_amount, 0);
        const done      = pct >= 100;
        return `<div class="goal-card">
            <div class="goal-card-header">
                <div class="goal-icon" style="background:${goal.color}"><i class="fas fa-${goal.icon}"></i></div>
                <span class="goal-title">${escapeHtml(goal.name)}</span>
            </div>
            <div class="goal-amounts">
                <span class="goal-saved">${formatCurrency(goal.saved_amount)}</span>
                <span class="goal-target">из ${formatCurrency(goal.target_amount)}</span>
            </div>
            <div class="goal-progress-bar">
                <div class="goal-progress-fill" style="width:${pct}%;background:${goal.color}"></div>
            </div>
            <div class="goal-meta">
                <span class="goal-pct">${pct}%</span>
                ${done ? `<span class="goal-complete-badge"><i class="fas fa-check-circle"></i> Достигнуто!</span>`
                       : `<span class="goal-remaining">Осталось: ${formatCurrency(remaining)}</span>`}
            </div>
            <div class="goal-actions">
                <button class="action-link" onclick="openAddFundsModal(${goal.id})"><i class="fas fa-plus-circle"></i> Пополнить</button>
                <button class="action-link" onclick="openGoalModal(${goal.id})"><i class="fas fa-edit"></i> Изменить</button>
                <button class="action-link delete" onclick="deleteGoal(${goal.id})"><i class="fas fa-trash"></i> Удалить</button>
            </div>
        </div>`;
    }).join('');
}

// ──────────────────────────────────────────────
// Модальные окна
// ──────────────────────────────────────────────
function openGoalModal(id) {
    editingGoalId = id || null;
    const goal = id ? _goals.find(g => g.id === id) : null;
    selectedIcon  = goal ? goal.icon  : GOALS_ICONS[0];
    selectedColor = goal ? goal.color : GOALS_COLORS[0];
    document.getElementById('goalModalTitle').textContent = goal ? 'Изменить цель' : 'Новая цель';
    document.getElementById('goalName').value   = goal ? goal.name          : '';
    document.getElementById('goalTarget').value = goal ? goal.target_amount : '';
    document.getElementById('goalSaved').value  = goal ? goal.saved_amount  : '0';
    renderIconSelector();
    renderColorPickerGoals();
    document.getElementById('goalModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeGoalModal() { document.getElementById('goalModal').classList.remove('active'); document.body.style.overflow = ''; }

function openAddFundsModal(id) {
    const goal = _goals.find(g => g.id === id);
    if (!goal) return;
    document.getElementById('addFundsGoalId').value           = id;
    document.getElementById('addFundsGoalName').textContent   = goal.name;
    document.getElementById('addFundsAmount').value           = '';
    document.getElementById('addFundsModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeAddFundsModal() { document.getElementById('addFundsModal').classList.remove('active'); document.body.style.overflow = ''; }

function renderIconSelector() {
    document.getElementById('iconSelector').innerHTML = GOALS_ICONS.map(icon =>
        `<button type="button" class="icon-option${icon === selectedIcon ? ' active' : ''}" onclick="selectGoalIcon('${icon}')">
            <i class="fas fa-${icon}"></i></button>`).join('');
}
function renderColorPickerGoals() {
    document.getElementById('colorPickerGoals').innerHTML = GOALS_COLORS.map(color =>
        `<div class="color-option-goal${color === selectedColor ? ' active' : ''}" style="background:${color}" onclick="selectGoalColor('${color}')"></div>`).join('');
}
function selectGoalIcon(icon)   { selectedIcon  = icon;  renderIconSelector(); }
function selectGoalColor(color) { selectedColor = color; renderColorPickerGoals(); }

async function deleteGoal(id) {
    if (!confirm('Удалить цель?')) return;
    try {
        await API.delete('/goals/' + id);
        _goals = _goals.filter(g => g.id !== id);
        renderGoals();
        showToast('Цель удалена', 'info');
    } catch (err) { showToast(err.message, 'error'); }
}

// ──────────────────────────────────────────────
// Nav toggle
// ──────────────────────────────────────────────
function initNavToggle() {
    const toggle = document.getElementById('navToggle');
    const menu   = document.querySelector('.nav-menu');
    if (!toggle || !menu) return;
    toggle.addEventListener('click', e => { e.stopPropagation(); const open = menu.classList.toggle('nav-open'); toggle.querySelector('i').className = open ? 'fas fa-times' : 'fas fa-bars'; });
    document.addEventListener('click', e => { if (!menu.contains(e.target) && !toggle.contains(e.target)) { menu.classList.remove('nav-open'); const ic = toggle.querySelector('i'); if (ic) ic.className = 'fas fa-bars'; } });
}

// ──────────────────────────────────────────────
// Init
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function() {
    initNavToggle();
    _goals = await API.get('/goals');
    renderGoals();

    document.getElementById('goalForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const name          = document.getElementById('goalName').value.trim();
        const target_amount = parseFloat(document.getElementById('goalTarget').value);
        const saved_amount  = parseFloat(document.getElementById('goalSaved').value) || 0;
        if (!name || !target_amount || target_amount <= 0) { showToast('Заполните название и сумму цели', 'error'); return; }

        try {
            if (editingGoalId) {
                const updated = await API.put('/goals/' + editingGoalId, { name, target_amount, saved_amount, icon: selectedIcon, color: selectedColor });
                const idx = _goals.findIndex(g => g.id === editingGoalId);
                if (idx !== -1) _goals[idx] = updated;
                showToast('Цель обновлена', 'success');
            } else {
                const row = await API.post('/goals', { name, target_amount, saved_amount, icon: selectedIcon, color: selectedColor });
                _goals.push(row);
                showToast('Цель добавлена', 'success');
            }
            renderGoals();
            closeGoalModal();
        } catch (err) { showToast(err.message, 'error'); }
    });

    document.getElementById('addFundsForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const id     = parseInt(document.getElementById('addFundsGoalId').value);
        const amount = parseFloat(document.getElementById('addFundsAmount').value);
        if (!amount || amount <= 0) { showToast('Введите сумму', 'error'); return; }

        try {
            const updated = await API.post('/goals/' + id + '/fund', { amount });
            const idx = _goals.findIndex(g => g.id === id);
            if (idx !== -1) _goals[idx] = updated;
            renderGoals();
            closeAddFundsModal();
            const goal = _goals.find(g => g.id === id);
            showToast(goal && goal.saved_amount >= goal.target_amount
                ? `Цель «${goal.name}» достигнута!`
                : `Пополнено на ${formatCurrency(amount)}`, 'success');
        } catch (err) { showToast(err.message, 'error'); }
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', e => { if (e.target === modal) { modal.classList.remove('active'); document.body.style.overflow = ''; } });
    });
});

window.openGoalModal      = openGoalModal;
window.closeGoalModal     = closeGoalModal;
window.openAddFundsModal  = openAddFundsModal;
window.closeAddFundsModal = closeAddFundsModal;
window.deleteGoal         = deleteGoal;
window.selectGoalIcon     = selectGoalIcon;
window.selectGoalColor    = selectGoalColor;
