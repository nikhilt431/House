// Google Sheets Configuration
// Instructions: Deploy the Code.gs in your Google Sheet as a Web App, 
// set "Who has access" to "Anyone", and paste the URL here.
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwUwNRRh3OuN1yUtog_jCocKcJapz-G4Lec_xYkYOUE2cwdcQUC9Fs4oNA55-5DK_TnOA/exec';

const i18n = {
    en: {
        dashboard: "Dashboard", expenses: "Expenses", reports: "Reports", admin: "Admin",
        total_expense: "Total Expense", gap: "Gap", left: "left", over: "over",
        recent_expenses: "Recent Expenses", add_expense: "Add Expense",
        date: "Date", particular: "Particular", amount: "Amount", name: "Name", group: "Group", actions: "Actions",
        group_settlement: "Group Settlement", individual_contribution: "Individual Contribution",
        settlement_balance: "Settlement Balance", who_owes: "Who owes whom",
        monthly_stats: "Monthly Stats Summary", monthly_detailed: "Monthly Detailed Statement",
        select_month: "Select Month", select_name: "Select Name",
        prev_balance: "Previous Balances", house_mgmt: "House Management", member_dir: "Member Directory",
        close_month: "Close Month & Carry Forward", edit_opening: "Edit Opening Balances",
        toggle_theme: "Dark Mode", toggle_lang: "नेपाली",
        save: "Save", cancel: "Cancel", update: "Update", delete_confirm: "Are you sure you want to delete?",
        syncing: "⚡ Syncing from Sheet...", synced: "✅ Synced with Sheet", saved: "✅ All Changes Saved",
        offline: "Local Mode", error: "❌ Sync Failed",
        shopping_list: "Shopping List", item: "Item", requested_by: "Requested By", status: "Status",
        purchased: "Purchased", to_buy: "To Buy", add_item: "Add Item", mark_bought: "Mark as Bought",
        install_app: "Install App",
        all_months: "All Months",
        all_years: "All Years",
        calendar: "Calendar"
    },
    ne: {
        dashboard: "ड्यासबोर्ड", expenses: "खर्चहरू", reports: "रिपोर्टहरू", admin: "एडमिन",
        total_expense: "जम्मा खर्च", gap: "अन्तर", left: "बाँकी", over: "बढी",
        recent_expenses: "हालका खर्चहरू", add_expense: "खर्च थप्नुहोस्",
        date: "मिति", particular: "विवरण", amount: "रकम", name: "नाम", group: "समूह", actions: "कार्यहरू",
        group_settlement: "समूह मिलान", individual_contribution: "व्यक्तिगत योगदान",
        settlement_balance: "बाँकी हिसाब", who_owes: "कसले कसलाई तिर्ने",
        monthly_stats: "मासिक तथ्याङ्क सारांश", monthly_detailed: "मासिक विस्तृत विवरण",
        select_month: "महिना चयन गर्नुहोस्", select_name: "नाम चयन गर्नुहोस्",
        prev_balance: "अघिल्लो बाँकी", house_mgmt: "घर व्यवस्थापन", member_dir: "सदस्य सूची",
        close_month: "महिना बन्द र अगाडि बढाउनुहोस्", edit_opening: "सुरुको बाँकी सम्पादन गर्नुहोस्",
        toggle_theme: "डार्क मोड", toggle_lang: "English",
        save: "बचत गर्नुहोस्", cancel: "रद्द गर्नुहोस्", update: "अद्यावधिक गर्नुहोस्", delete_confirm: "के तपाइँ पक्का मेटाउन चाहनुहुन्छ?",
        syncing: "⚡ सिङ्क हुँदैछ...", synced: "✅ सिङ्क भयो", saved: "✅ सबै बचत भयो",
        offline: "लोकल मोड", error: "❌ सिङ्क असफल",
        shopping_list: "किनमेल सूची", item: "सामान", requested_by: "माग गर्ने", status: "स्थिति",
        purchased: "किनिएको", to_buy: "किन्न बाँकी", add_item: "सामान थप्नुहोस्", mark_bought: "किनिएको चिन्ह लगाउनुहोस्",
        install_app: "एप इन्स्टल गर्नुहोस्",
        all_months: "सबै महिना",
        all_years: "सबै वर्ष",
        calendar: "पात्रो"
    }
};

let currentLang = localStorage.getItem('lang') || 'en';

// Data & Configuration
let expenses = JSON.parse(localStorage.getItem('expenses')) || [
    { id: 1, date: '2024-04-01', particular: 'Electricity Bill', amount: 2500, name: 'Nikhil', group: 'Technical' },
    { id: 2, date: '2024-04-02', particular: 'Groceries', amount: 1200, name: 'Amit', group: 'Logistics' },
];

let members = JSON.parse(localStorage.getItem('members')) || [
    { id: 1, name: 'Nikhil', group: 'Technical' },
    { id: 2, name: 'Amit', group: 'Logistics' },
    { id: 3, name: 'Sneha', group: 'Finance' },
    { id: 4, name: 'Priya', group: 'Management' }
];

let carriedBalances = JSON.parse(localStorage.getItem('carriedBalances')) || {};
let shoppingItems = JSON.parse(localStorage.getItem('shoppingItems')) || [];
let budgets = JSON.parse(localStorage.getItem('budgets')) || {};
let templates = JSON.parse(localStorage.getItem('templates')) || [];
let events = []; // Will be initialized after date helper
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

let selectedIds = new Set();
let advancedFilter = {
    active: false,
    start: '',
    end: ''
};

const CATEGORY_ICONS = {
    "Technical": "🔌",
    "Logistics": "🚚",
    "Finance": "💰",
    "Management": "👔",
    "Household": "🏠",
    "Groceries": "🥦",
    "Utilities": "💡",
    "Personal": "👤",
    "Other": "📦"
};

const TARGET_BUDGET = 30000;

// State
let isInitialLoadComplete = !SCRIPT_URL; // If no URL, we are "complete" locally
let hasUnsavedChanges = false;
let isSavingToServer = false;
let monthlyChart = null;
let groupChart = null;
let dashTrendChart = null;
let dashGroupChart = null;
const bsNowInitial = typeof NepaliFunctions !== 'undefined' ? NepaliFunctions.BS.GetCurrentDate() : {year: 2081, month: 1};
const currentMonthStr = `${bsNowInitial.year}-${String(bsNowInitial.month).padStart(2, '0')}`;
const currentYearStr = `${bsNowInitial.year}`;
let calendarYear = bsNowInitial.year;
let calendarMonth = bsNowInitial.month;

let currentFilters = {
    year: currentYearStr,
    month: currentMonthStr,
    group: 'all'
};

const savedEvents = localStorage.getItem('events');
const demoSeen = localStorage.getItem('events_demo_seen');

if (savedEvents) {
    events = JSON.parse(savedEvents);
} else if (!demoSeen) {
    events = [
        { id: 999, type: 'birthday', name: 'Demo Birthday (Delete in Admin later)', date: NepaliFunctions.ConvertToDateFormat(bsNowInitial, "YYYY-MM-DD"), recurring: 'yes' }
    ];
} else {
    events = [];
}

// DOM Elements
const elements = {
    expenseTable: document.getElementById('expenses-tbody'),
    totalExpense: document.getElementById('total-expense'),
    gapDisplay: document.getElementById('gap-display'),
    individualList: document.getElementById('individual-summary-list'),
    groupSettlementList: document.getElementById('group-settlement-list'),
    prevBalanceList: document.getElementById('prev-balance-list'),
    balanceList: document.getElementById('balance-list'),
    yearFilters: document.querySelectorAll('.year-filter-input'),
    monthFilters: document.querySelectorAll('.month-filter-input'),
    groupFilters: document.querySelectorAll('.group-filter-input'),
    expenseForm: document.getElementById('expense-form'),
    expenseModal: document.getElementById('expense-modal'),
    addBtn: document.getElementById('add-expense-btn'),
    closeBtn: document.querySelector('.close-btn'),
    cancelBtn: document.querySelector('.cancel-btn'),
    expName: document.getElementById('exp-name'),
    expGroup: document.getElementById('exp-group'),
    memberForm: document.getElementById('member-form'),
    membersTable: document.getElementById('members-tbody'),
    editBalancesBtn: document.getElementById('edit-balances-btn-admin'),
    balanceModal: document.getElementById('balance-modal'),
    balanceForm: document.getElementById('balance-form'),
    balanceInputsContainer: document.getElementById('balance-inputs-container'),
    closeBalanceModal: document.getElementById('close-balance-modal'),
    resetAllBalances: document.getElementById('reset-all-balances'),
    syncStatus: document.getElementById('sync-status'),
    adminLogin: document.getElementById('admin-login'),
    adminPanel: document.getElementById('admin-panel'),
    adminPassword: document.getElementById('admin-password'),
    adminLoginBtn: document.getElementById('admin-login-btn'),
    adminError: document.getElementById('admin-error'),
    shoppingForm: document.getElementById('shopping-form'),
    shoppingTable: document.getElementById('shopping-tbody'),
    shopName: document.getElementById('shop-name'),
    expenseSearch: document.getElementById('expense-search'),
    notifBadge: document.getElementById('notif-badge'),
    notifDropdown: document.getElementById('notif-dropdown'),
    notifList: document.getElementById('notif-list'),
    clearNotifs: document.getElementById('clear-notifs'),
    userProfile: document.getElementById('user-profile'),
    userEmail: document.getElementById('user-email'),
    userName: document.getElementById('user-name'),
    userAvatar: document.getElementById('user-avatar'),
    budgetModal: document.getElementById('budget-modal'),
    budgetForm: document.getElementById('budget-form'),
    budgetInputsContainer: document.getElementById('budget-inputs-container'),
    editBudgetsBtn: document.getElementById('edit-budgets-btn-admin'),
    closeBudgetModal: document.getElementById('close-budget-modal'),
    templatesGrid: document.getElementById('templates-grid'),
    templateModal: document.getElementById('template-modal'),
    templateForm: document.getElementById('template-form'),
    addTemplateBtn: document.getElementById('add-template-btn'),
    closeTemplateModal: document.getElementById('close-template-modal'),
    bulkBar: document.getElementById('bulk-actions-bar'),
    selectedCount: document.getElementById('selected-count'),
    toast: document.getElementById('toast'),
    eventModal: document.getElementById('event-modal'),
    eventForm: document.getElementById('event-form'),
    eventListContainer: document.getElementById('event-list-container'),
    manageEventsBtn: document.getElementById('manage-events-btn-admin'),
    eventOverlay: document.getElementById('event-overlay'),
    overlayIcon: document.getElementById('overlay-icon'),
    overlayTitle: document.getElementById('overlay-title'),
    overlayDesc: document.getElementById('overlay-desc'),
    overlayTimer: document.getElementById('overlay-timer'),
    
    // User login elements
    loginOverlay: document.getElementById('login-overlay'),
    loginForm: document.getElementById('login-form'),
    loginUserSelect: document.getElementById('login-user-select'),
    loginPassword: document.getElementById('login-password'),
    loginError: document.getElementById('login-error'),
    loginGuestBtn: document.getElementById('login-guest-btn'),
    userDropdown: document.getElementById('user-dropdown'),
    userDropdownName: document.getElementById('user-dropdown-name'),
    userDropdownGroup: document.getElementById('user-dropdown-group'),
    logoutBtn: document.getElementById('logout-btn')
};

let notifications = JSON.parse(localStorage.getItem('notifications')) || [];

// ... initialization ...
async function init() {
    // If we have a script URL, clear local sample data to avoid overwriting cloud data
    if (SCRIPT_URL && !localStorage.getItem('expenses')) {
        expenses = [];
        members = [];
        carriedBalances = {};
        budgets = {};
    }
    
    updateUIWithTranslations();
    updateDynamicUI();
    renderAll();
    setupEventListeners();
    initUserLoginSystem();
    initDatePicker();
    startNepaliClock();
    
    // Request Notification Permission
    if ("Notification" in window) {
        Notification.requestPermission();
    }

    // Restore last active page
    const lastPage = localStorage.getItem('activePage') || 'dashboard';
    navigateToPage(lastPage);
    
    // Handle URL Parameters (Shortcuts)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'add-expense') {
        setTimeout(() => {
            const addBtn = document.getElementById('add-expense-btn');
            if (addBtn) addBtn.click();
        }, 800);
    }
    const queryPage = urlParams.get('page');
    if (queryPage) {
        navigateToPage(queryPage);
    }

    // Auto-refresh every 30 seconds for real-time feel, but only if no modal is active and the user is not interacting
    setInterval(() => {
        if (SCRIPT_URL && navigator.onLine) {
            const isModalOpen = document.querySelector('.modal.active') !== null || 
                                (elements.eventOverlay && elements.eventOverlay.classList.contains('active'));
            const isUserInteracting = document.activeElement && 
                                      (document.activeElement.tagName === 'INPUT' || 
                                       document.activeElement.tagName === 'TEXTAREA' || 
                                       document.activeElement.tagName === 'SELECT');
            if (!isModalOpen && !isUserInteracting && !hasUnsavedChanges) {
                loadFromGoogleSheets();
            }
        }
    }, 30 * 1000);

    // Restore offline pending sync states
    hasUnsavedChanges = localStorage.getItem('hasUnsavedChanges') === 'true';

    // Load from Google Sheets or sync offline pending changes if URL is provided
    if (SCRIPT_URL) {
        if (hasUnsavedChanges && navigator.onLine) {
            setSyncStatus('syncing', '💾 Syncing offline changes...');
            saveToGoogleSheets(true);
        } else {
            loadFromGoogleSheets();
        }
    } else {
        setSyncStatus('offline', 'Local Mode');
    }

    // Auto-sync when coming back online
    window.addEventListener('online', async () => {
        showToast("Internet connection restored! Syncing...", "success");
        if (SCRIPT_URL) {
            if (hasUnsavedChanges) {
                // Upload local offline changes first
                setSyncStatus('syncing', '💾 Syncing offline changes...');
                await saveToGoogleSheets(true);
                // Then fetch latest cloud data
                setTimeout(loadFromGoogleSheets, 1500);
            } else {
                loadFromGoogleSheets();
            }
        }
    });

    window.addEventListener('offline', () => {
        setSyncStatus('offline', '☁️ Offline Mode (Using Local Data)');
        showToast("Browsing offline. All updates will save locally and sync when online.", "info");
    });

    checkTodayEvents();
}

// Render Core
function renderAll() {
    const filtered = filterExpenses();
    renderTable(filtered);
    const stats = calculateStats(filtered);
    renderStats(stats, filtered);
    renderCharts(filtered);
    renderMembers();
    renderMonthlyReport();
    updateStatementDropdown();
    renderShoppingList();
    renderTemplates();
    renderEvents();
    renderCalendarView();
}

function updateStatementDropdown() {
    const select = document.getElementById('statement-month-select');
    if (!select) return;

    const currentVal = select.value;
    const mKeys = [...new Set(expenses.map(exp => exp.date.substring(0, 7)))]
        .filter(m => m.length === 7)
        .sort().reverse();

    select.innerHTML = '<option value="" disabled>Select Month</option>' +
        mKeys.map(m => {
            const [y, mm] = m.split('-');
            const monthIdx = parseInt(mm) - 1;
            const yearStr = currentLang === 'ne' ? NepaliFunctions.ConvertToUnicode(y) : y;
            const monthName = currentLang === 'ne' ? NepaliFunctions.BS.GetMonthInUnicode(monthIdx) : NepaliFunctions.BS.GetMonth(monthIdx);
            return `<option value="${m}">${monthName} ${yearStr}</option>`;
        }).join('');

    if (currentVal && mKeys.includes(currentVal)) {
        select.value = currentVal;
    }
}

function renderMonthlyStatement(monthKey) {
    const tbody = document.getElementById('statement-tbody');
    if (!tbody) return;

    const filtered = expenses.filter(exp => exp.date.substring(0, 7) === monthKey)
        .sort((a, b) => b.date.localeCompare(a.date));

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No expenses found for this month.</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(exp => `
        <tr>
            <td>${formatDate(exp.date)}</td>
            <td>${exp.particular}</td>
            <td class="font-bold">रु ${exp.amount.toLocaleString()}</td>
            <td><span class="tag tag-${exp.name.toLowerCase().replace(/\s/g, '')}">${exp.name}</span></td>
            <td><span class="text-muted">${exp.group}</span></td>
        </tr>
    `).join('');
}

function renderMonthlyReport() {
    const tbody = document.getElementById('monthly-stats-tbody');
    if (!tbody) return;

    const monthlyData = {};
    expenses.forEach(exp => {
        const key = exp.date.substring(0, 7);
        if (key.length !== 7) return;

        if (!monthlyData[key]) {
            monthlyData[key] = { total: 0, groups: {}, members: {} };
        }

        const amount = parseFloat(exp.amount) || 0;
        monthlyData[key].total += amount;
        monthlyData[key].groups[exp.group] = (monthlyData[key].groups[exp.group] || 0) + amount;
        monthlyData[key].members[exp.name] = (monthlyData[key].members[exp.name] || 0) + amount;
    });

    const sortedMonths = Object.keys(monthlyData).sort().reverse();

    tbody.innerHTML = sortedMonths.map(m => {
        const data = monthlyData[m];
        const [y, mm] = m.split('-');
        const monthIdx = parseInt(mm) - 1;
        const yearStr = currentLang === 'ne' ? NepaliFunctions.ConvertToUnicode(y) : y;
        const monthName = currentLang === 'ne' ? NepaliFunctions.BS.GetMonthInUnicode(monthIdx) : NepaliFunctions.BS.GetMonth(monthIdx);
        const displayName = `${monthName} ${yearStr}`;

        // Top Group
        const topGroup = Object.entries(data.groups).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
        // Top Member
        const topMember = Object.entries(data.members).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

        return `
            <tr>
                <td><strong>${monthName}</strong></td>
                <td class="font-bold">रु ${data.total.toLocaleString()}</td>
                <td><span class="text-muted">${topGroup}</span></td>
                <td><span class="tag tag-${topMember.toLowerCase().replace(/\s/g, '')}">${topMember}</span></td>
            </tr>
        `;
    }).join('');
}

function updateDynamicUI() {
    // Update Expense Form Names
    elements.expName.innerHTML = '<option value="" disabled selected>' + i18n[currentLang].select_name + '</option>' +
        members.map(m => `<option value="${m.name}">${m.name}</option>`).join('');

    // Update Shopping Form Names
    if (elements.shopName) {
        elements.shopName.innerHTML = '<option value="" disabled selected>' + i18n[currentLang].select_name + '</option>' +
            members.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
    }

    // Update Admin Group List Suggestions
    const groupList = document.getElementById('group-list');
    if (groupList) {
        const uniqueGroups = [...new Set(members.map(m => m.group))];
        // Combine hardcoded defaults with existing ones
        const defaults = ["Technical", "Logistics", "Finance", "Management", "Household"];
        const allGroups = [...new Set([...defaults, ...uniqueGroups])];
        groupList.innerHTML = allGroups.map(g => `<option value="${g}">`).join('');
    }

    // Update Filters
    updateFiltersUI();
}

function filterExpenses() {
    const searchTerm = elements.expenseSearch ? elements.expenseSearch.value.toLowerCase() : '';
    return expenses.filter(exp => {
        // Date Range Logic
        if (advancedFilter.active) {
            if (advancedFilter.start && exp.date < advancedFilter.start) return false;
            if (advancedFilter.end && exp.date > advancedFilter.end) return false;
        } else {
            const year = exp.date.substring(0, 4);
            const monthYear = exp.date.substring(0, 7);
            
            const yearMatch = currentFilters.year === 'all' || year === currentFilters.year;
            const monthMatch = currentFilters.month === 'all' || monthYear === currentFilters.month;
            
            if (!yearMatch || !monthMatch) return false;
        }

        const groupMatch = currentFilters.group === 'all' || exp.group === currentFilters.group;
        const searchMatch = !searchTerm || 
            exp.particular.toLowerCase().includes(searchTerm) || 
            exp.name.toLowerCase().includes(searchTerm) ||
            exp.group.toLowerCase().includes(searchTerm);
            
        return groupMatch && searchMatch;
    });
}

function calculateStats(data, calculateDynamicPrev = true) {
    const total = data.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);

    // Group Member Counts
    const groupMemberMap = {};
    members.forEach(m => {
        groupMemberMap[m.group] = (groupMemberMap[m.group] || 0) + 1;
    });

    const individual = {};
    members.forEach(m => individual[m.name] = 0);
    data.forEach(exp => {
        const amount = parseFloat(exp.amount) || 0;
        if (individual.hasOwnProperty(exp.name)) individual[exp.name] += amount;
    });

    // Group Distribution
    const groupContribution = {};
    Object.keys(groupMemberMap).forEach(g => groupContribution[g] = 0);
    data.forEach(exp => {
        const amount = parseFloat(exp.amount) || 0;
        if (groupContribution.hasOwnProperty(exp.group)) {
            groupContribution[exp.group] += amount;
        }
    });

    const totalMembers = members.length;
    const avgIndividualShare = totalMembers > 0 ? total / totalMembers : 0;

    // Dynamic Previous Balances
    let prevBalances = {};
    Object.keys(groupMemberMap).forEach(g => prevBalances[g] = parseFloat(carriedBalances[g]) || 0);

    if (calculateDynamicPrev) {
        let cutoffDate = null;
        if (advancedFilter.active && advancedFilter.start) {
            cutoffDate = advancedFilter.start;
        } else if (!advancedFilter.active) {
            if (currentFilters.month !== 'all') {
                cutoffDate = currentFilters.month + '-00'; 
            } else if (currentFilters.year !== 'all') {
                cutoffDate = currentFilters.year + '-00-00';
            }
        }

        if (cutoffDate) {
            const pastExpenses = expenses.filter(exp => exp.date < cutoffDate);
            const pastTotal = pastExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
            const pastAvg = totalMembers > 0 ? pastTotal / totalMembers : 0;
            
            const pastGroupContribution = {};
            Object.keys(groupMemberMap).forEach(g => pastGroupContribution[g] = 0);
            pastExpenses.forEach(exp => {
                if (pastGroupContribution.hasOwnProperty(exp.group)) {
                    pastGroupContribution[exp.group] += (parseFloat(exp.amount) || 0);
                }
            });

            Object.keys(groupMemberMap).forEach(group => {
                const count = groupMemberMap[group];
                const required = pastAvg * count;
                const actual = pastGroupContribution[group];
                prevBalances[group] += (actual - required);
            });
        }
    }

    // Group Settlement
    const groupSettlements = Object.keys(groupMemberMap).map(group => {
        const count = groupMemberMap[group];
        const required = avgIndividualShare * count;
        const actual = parseFloat(groupContribution[group]) || 0;
        const prev = prevBalances[group] || 0;
        return {
            group,
            count,
            required,
            actual,
            prev,
            currentBalance: actual - required,
            totalDue: (actual - required) + prev
        };
    });

    return { total, individual, groupSettlements };
}

function renderStats(stats, filtered = []) {
    elements.totalExpense.textContent = `रु ${stats.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    const gap = TARGET_BUDGET - stats.total;
    const gapVal = elements.gapDisplay.querySelector('.gap-value');
    if (gap >= 0) {
        gapVal.textContent = `रु ${gap.toLocaleString('en-IN')} left`;
        gapVal.className = 'gap-value positive';
    } else {
        gapVal.textContent = `रु ${Math.abs(gap).toLocaleString('en-IN')} over`;
        gapVal.className = 'gap-value negative';
    }

    // Dynamic Logged-in User Dashboard Cards
    const userGroupCard = document.getElementById('dash-user-group-card');
    const userPersonalCard = document.getElementById('dash-user-personal-card');
    if (userGroupCard && userPersonalCard) {
        if (currentUser) {
            userGroupCard.style.display = 'block';
            userPersonalCard.style.display = 'block';
            
            const userGroupTotal = filtered.reduce((sum, exp) => {
                return sum + (exp.group === currentUser.group ? (parseFloat(exp.amount) || 0) : 0);
            }, 0);
            const userPersonalTotal = filtered.reduce((sum, exp) => {
                return sum + (exp.name === currentUser.name ? (parseFloat(exp.amount) || 0) : 0);
            }, 0);
            
            const userGroupLabel = document.getElementById('dash-user-group-label');
            const userGroupValue = document.getElementById('dash-user-group-value');
            const userPersonalLabel = document.getElementById('dash-user-personal-label');
            const userPersonalValue = document.getElementById('dash-user-personal-value');
            
            if (userGroupLabel) userGroupLabel.textContent = `${currentUser.group} Group Total`;
            if (userGroupValue) userGroupValue.textContent = `रु ${userGroupTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
            if (userPersonalLabel) userPersonalLabel.textContent = `${currentUser.name} Paid`;
            if (userPersonalValue) userPersonalValue.textContent = `रु ${userPersonalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        } else {
            userGroupCard.style.display = 'none';
            userPersonalCard.style.display = 'none';
        }
    }

    elements.individualList.innerHTML = Object.entries(stats.individual)
        .map(([name, amt]) => `
            <div class="summary-item">
                <span class="tag tag-${name.toLowerCase().replace(/\s/g, '')}">${name}</span>
                <span class="font-bold">रु ${amt.toLocaleString()}</span>
            </div>
        `).join('');

    elements.groupSettlementList.innerHTML = stats.groupSettlements.map(s => {
        const budgetLimit = parseFloat(budgets[s.group]) || 0;
        const percent = budgetLimit > 0 ? (s.actual / budgetLimit) * 100 : 0;
        const statusClass = percent > 100 ? 'danger' : (percent > 80 ? 'warning' : '');
        const icon = CATEGORY_ICONS[s.group] || CATEGORY_ICONS["Other"];

        return `
        <div class="summary-item" style="flex-direction: column; align-items: stretch; gap: 0.5rem; padding: 1rem 0;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center;">
                    <div class="category-icon">${icon}</div>
                    <div>
                        <div class="font-bold">${s.group} (${s.count} ppl)</div>
                        <div class="subtitle">Required: रु ${s.required.toFixed(0)}</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="font-bold">Paid: रु ${s.actual.toLocaleString()}</div>
                    <div style="color: ${s.currentBalance >= 0 ? 'var(--success)' : 'var(--danger)'}">
                        ${s.currentBalance >= 0 ? '+' : ''}रु ${s.currentBalance.toFixed(2)}
                    </div>
                </div>
            </div>
            ${budgetLimit > 0 ? `
            <div class="budget-progress-container">
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 2px;">
                    <span class="text-muted">Budget: रु ${budgetLimit.toLocaleString()}</span>
                    <span class="${statusClass}">${percent.toFixed(0)}% used</span>
                </div>
                <div class="progress-track">
                    <div class="progress-fill ${statusClass}" style="width: ${Math.min(percent, 100)}%"></div>
                </div>
            </div>
            ` : ''}
        </div>
    `}).join('');

    // Previous Balance Display
    elements.prevBalanceList.innerHTML = stats.groupSettlements.map(s => `
        <div class="summary-item">
            <span>${s.group} B/F</span>
            <span class="font-bold ${s.prev >= 0 ? 'text-success' : 'text-danger'}" 
                  style="color: ${s.prev >= 0 ? 'var(--success)' : 'var(--danger)'}">
                रु ${s.prev.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
        </div>
    `).join('');

    // Settlement Balance (The Individual list in Sidebar/Grid)
    elements.balanceList.innerHTML = stats.groupSettlements.map(s => `
        <div class="balance-card ${s.totalDue >= 0 ? 'positive' : 'negative'}">
            <div class="balance-info">
                <div class="balance-name">${s.group}</div>
                <div class="subtitle">${s.totalDue >= 0 ? 'Surplus (Receive)' : 'Deficit (Pay)'}</div>
            </div>
            <div class="balance-amount">रु ${Math.abs(s.totalDue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
    `).join('');
}

function renderTable(data) {
    elements.expenseTable.innerHTML = data.sort((a, b) => b.date.localeCompare(a.date)).map((exp, idx) => {
        const icon = CATEGORY_ICONS[exp.group] || CATEGORY_ICONS["Other"];
        const isSelected = selectedIds.has(exp.id.toString());
        const allowed = canModifyExpense(exp);
        
        return `
        <tr class="${isSelected ? 'row-selected' : ''}" style="${allowed ? '' : 'opacity: 0.85;'}">
            <td>
                <input type="checkbox" class="expense-checkbox row-checkbox" data-id="${exp.id}" ${isSelected ? 'checked' : ''} 
                       ${allowed ? '' : 'disabled style="opacity: 0.3; cursor: not-allowed;"'}>
            </td>
            <td style="font-weight: 500; color: var(--text-muted);">${idx + 1}</td>
            <td>
                ${formatDate(exp.date)}
                <span class="audit-info">Created: ${exp.createdAt ? exp.createdAt.substring(0,10) : 'N/A'}</span>
            </td>
            <td class="font-medium">
                <span style="margin-right: 0.5rem;">${icon}</span>
                ${exp.particular}
            </td>
            <td class="font-bold">रु ${exp.amount.toLocaleString()}</td>
            <td><span class="tag tag-${exp.name.toLowerCase().replace(/\s/g, '')}">${exp.name}</span></td>
            <td><span class="text-muted">${exp.group}</span></td>
            <td class="text-right">
                ${allowed ? `
                    <button class="secondary-btn btn-sm" data-id="${exp.id}" data-action="edit" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-right: 0.5rem;">Edit</button>
                    <button class="delete-btn" data-id="${exp.id}" data-action="delete">🗑️</button>
                ` : `
                    <span class="text-muted" style="font-size: 0.75rem; display: inline-flex; align-items: center; justify-content: flex-end; gap: 0.25rem; opacity: 0.7; padding-right: 0.5rem;">
                        🔒 Locked
                    </span>
                `}
            </td>
        </tr>
    `}).join('');
    
    updateBulkBar();
}

function renderMembers() {
    elements.membersTable.innerHTML = members.map(m => `
        <tr>
            <td><strong>${m.name}</strong></td>
            <td>${m.group}</td>
            <td class="text-right">
                <button class="secondary-btn btn-sm" data-id="${m.id}" data-action="edit-member">Edit</button>
                <button class="delete-btn" data-id="${m.id}" data-action="delete-member">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function renderCharts(data) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94A3B8' : '#6B7280';
    const gridColor = isDark ? '#334155' : '#E5E7EB';

    // Trends Chart
    const months = {};
    for (let i = 5; i >= 0; i--) {
        const bsNow = NepaliFunctions.BS.GetCurrentDate();
        const d = NepaliFunctions.BS.AddDays(bsNow, -(i * 30)); // Approximate month subtraction
        const key = `${d.year}-${String(d.month).padStart(2, '0')}`;
        months[key] = 0;
    }
    expenses.forEach(exp => {
        const key = exp.date.substring(0, 7);
        if (months.hasOwnProperty(key)) {
            months[key] += (parseFloat(exp.amount) || 0);
        }
    });

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: {
                grid: { color: gridColor },
                ticks: { color: textColor }
            },
            y: {
                grid: { color: gridColor },
                ticks: {
                    color: textColor,
                    callback: (val) => 'रु' + val.toLocaleString()
                }
            }
        }
    };

    if (monthlyChart) monthlyChart.destroy();
    const ctxM = document.getElementById('monthly-chart');
    if (ctxM) {
        monthlyChart = new Chart(ctxM, {
            type: 'bar',
            data: {
                labels: Object.keys(months).map(m => {
                    const [y, mm] = m.split('-');
                    const monthIdx = parseInt(mm) - 1;
                    return currentLang === 'ne' ? NepaliFunctions.BS.GetMonthInUnicode(monthIdx) : NepaliFunctions.BS.GetMonth(monthIdx).substring(0, 3);
                }),
                datasets: [{ label: 'Expenses', data: Object.values(months), backgroundColor: '#4F46E5', borderRadius: 6 }]
            },
            options: chartOptions
        });
    }

    if (dashTrendChart) dashTrendChart.destroy();
    const ctxDT = document.getElementById('dashboard-trend-chart');
    if (ctxDT) {
        dashTrendChart = new Chart(ctxDT, {
            type: 'bar',
            data: {
                labels: Object.keys(months).map(m => {
                    const [y, mm] = m.split('-');
                    const monthIdx = parseInt(mm) - 1;
                    return currentLang === 'ne' ? NepaliFunctions.BS.GetMonthInUnicode(monthIdx) : NepaliFunctions.BS.GetMonth(monthIdx).substring(0, 3);
                }),
                datasets: [{ label: 'Expenses', data: Object.values(months), backgroundColor: '#6366F1', borderRadius: 6 }]
            },
            options: chartOptions
        });
    }

    // Group Chart
    const groups = {};
    data.forEach(exp => { 
        const amount = parseFloat(exp.amount) || 0;
        groups[exp.group] = (groups[exp.group] || 0) + amount; 
    });

    const donutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: textColor }
            }
        },
        cutout: '70%'
    };

    if (groupChart) groupChart.destroy();
    const ctxG = document.getElementById('group-chart');
    if (ctxG) {
        groupChart = new Chart(ctxG, {
            type: 'doughnut',
            data: {
                labels: Object.keys(groups),
                datasets: [{ data: Object.values(groups), backgroundColor: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'], borderWidth: 0 }]
            },
            options: donutOptions
        });
    }

    if (dashGroupChart) dashGroupChart.destroy();
    const ctxDG = document.getElementById('dashboard-group-chart');
    if (ctxDG) {
        dashGroupChart = new Chart(ctxDG, {
            type: 'doughnut',
            data: {
                labels: Object.keys(groups),
                datasets: [{ data: Object.values(groups), backgroundColor: ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'], borderWidth: 0 }]
            },
            options: donutOptions
        });
    }
}

function navigateToPage(page) {
    document.querySelectorAll('.top-nav li, .mobile-bottom-nav li').forEach(l => {
        l.classList.toggle('active', l.getAttribute('data-page') === page);
    });

    document.querySelectorAll('.page-view').forEach(view => view.classList.remove('active'));
    const targetView = document.getElementById(`${page}-view`);
    if (targetView) targetView.classList.add('active');

    // Reset admin login state when leaving admin tab
    if (page !== 'admin') {
        if (elements.adminLogin) elements.adminLogin.style.display = 'block';
        if (elements.adminPanel) elements.adminPanel.style.display = 'none';
        if (elements.adminPassword) elements.adminPassword.value = '';
        if (elements.adminError) elements.adminError.style.display = 'none';
    }

    const pageTitle = page.charAt(0).toUpperCase() + page.slice(1);
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = pageTitle;
    renderAll();
}

function startNepaliClock() {
    const dateEl = document.getElementById('nepali-date-display');
    const timeEl = document.getElementById('nepali-time-display');
    if (!dateEl || !timeEl) return;

    setInterval(() => {
        const now = new Date();
        // Time
        const timeStr = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        // Nepali Date
        const bsDate = NepaliFunctions.AD2BS({
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            day: now.getDate()
        });
        
        const dateStr = currentLang === 'ne' 
            ? NepaliFunctions.BS.GetFullDate(bsDate, true)
            : NepaliFunctions.BS.GetFullDate(bsDate, false);

        dateEl.textContent = dateStr;
        timeEl.textContent = timeStr;
    }, 1000);
}

// Event Handlers
function setupEventListeners() {
    document.querySelectorAll('.top-nav li, .mobile-bottom-nav li').forEach(li => {
        li.addEventListener('click', () => {
            const page = li.getAttribute('data-page');
            if (!page) return;
            navigateToPage(page);
            localStorage.setItem('activePage', page);
        });
    });




    // Admin Login
    elements.adminLoginBtn.addEventListener('click', () => {
        const password = elements.adminPassword.value;
        if (password === 'tiwari123') {
            elements.adminLogin.style.display = 'none';
            elements.adminPanel.style.display = 'block';
            elements.adminError.style.display = 'none';
        } else {
            elements.adminError.style.display = 'block';
        }
    });

    // Language Toggle
    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
        langToggle.addEventListener('click', () => {
            currentLang = currentLang === 'en' ? 'ne' : 'en';
            localStorage.setItem('lang', currentLang);
            updateUIWithTranslations();
            renderAll();
        });
    }

    // PWA Install Logic
    let deferredPrompt;
    const installBtn = document.getElementById('install-btn');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (installBtn) installBtn.style.display = 'block';
    });

    if (installBtn) {
        installBtn.addEventListener('click', () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                deferredPrompt = null;
                installBtn.style.display = 'none';
            });
        });
    }

    elements.adminPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') elements.adminLoginBtn.click();
    });

    // Shopping List Form
    if (elements.shoppingForm) {
        elements.shoppingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const item = document.getElementById('shop-item').value;
            const requestedBy = currentUser ? currentUser.name : (elements.shopName.value || 'Guest');
            shoppingItems.push({ 
                id: Date.now(), 
                item, 
                requestedBy, 
                status: 'to_buy',
                createdAt: new Date().toISOString(),
                purchasedBy: null
            });
            document.getElementById('shop-item').value = '';
            saveData();
            renderShoppingList();
            sendNotification("Shopping List", `You added "${item}" to the list.`, 'shopping');
        });
    }

    // Shopping Table Actions
    if (elements.shoppingTable) {
        elements.shoppingTable.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const id = btn.getAttribute('data-id');
            const action = btn.getAttribute('data-action');
            if (id && action === 'toggle-shop') toggleShopStatus(id);
            if (id && action === 'delete-shop') deleteShopItem(id);
        });
    }

    elements.addBtn.addEventListener('click', () => {
        resetExpenseForm();
        elements.expenseModal.classList.add('active');
        // Set today's Nepali Date as default
        const bsDate = NepaliFunctions.BS.GetCurrentDate();
        document.getElementById('exp-date').value = NepaliFunctions.ConvertToDateFormat(bsDate, "YYYY-MM-DD");
        
        // Auto-prefill logged in user
        if (currentUser) {
            elements.expName.value = currentUser.name;
            elements.expGroup.value = currentUser.group;
        }
    });

    // Close Modals
    [elements.closeBtn, elements.cancelBtn].forEach(btn => {
        if (!btn) return;
        btn.addEventListener('click', () => {
            elements.expenseModal.classList.remove('active');
            resetExpenseForm();
        });
    });

    // Name -> Group AutoFill
    elements.expName.addEventListener('change', (e) => {
        const member = members.find(m => m.name === e.target.value);
        elements.expGroup.value = member ? member.group : '';
    });

    // Expense Submit (Save/Update)
    elements.expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const editIdVal = document.getElementById('edit-expense-id').value;
        const expenseData = {
            date: document.getElementById('exp-date').value,
            particular: document.getElementById('exp-particular').value,
            amount: parseFloat(document.getElementById('exp-amount').value),
            name: document.getElementById('exp-name').value,
            group: document.getElementById('exp-group').value
        };

        const now = new Date().toISOString();
        if (editIdVal) {
            const idx = expenses.findIndex(exp => exp.id == editIdVal);
            if (idx !== -1) {
                const exp = expenses[idx];
                if (!canModifyExpense(exp)) {
                    showToast("Access Denied: Only the creator or Admin Nikhil can edit this.", "error");
                    elements.expenseModal.classList.remove('active');
                    resetExpenseForm();
                    return;
                }
                expenses[idx] = { ...expenses[idx], ...expenseData, updatedAt: now };
                sendNotification("Expense Updated", `You updated: ${expenseData.particular}`, 'expenses');
            }
        } else {
            const createdBy = currentUser ? currentUser.name : 'Guest';
            expenses.push({ id: Date.now(), ...expenseData, createdBy, createdAt: now, updatedAt: now });
            sendNotification("Expense Added", `You added: ${expenseData.particular} (Rs. ${expenseData.amount})`, 'expenses');
        }

        saveData();
        renderAll();
        elements.expenseModal.classList.remove('active');
        resetExpenseForm();
    });

    // Members Form
    elements.memberForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const idVal = document.getElementById('edit-member-id').value;
        const name = document.getElementById('member-name').value;
        const group = document.getElementById('member-group').value;
        const passwordVal = document.getElementById('member-password').value || '1234';

        if (idVal) {
            const idx = members.findIndex(m => m.id == idVal);
            if (idx !== -1) {
                members[idx] = { ...members[idx], name, group, password: passwordVal };
                if (currentUser && currentUser.id == idVal) {
                    currentUser = members[idx];
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    updateUserProfileUI();
                }
            }
        } else {
            members.push({ id: Date.now(), name, group, password: passwordVal });
        }

        saveData(true);
        resetMemberForm();
        updateDynamicUI();
        renderAll();
    });

    document.getElementById('cancel-member-edit').addEventListener('click', resetMemberForm);

    // Global Filters
    elements.yearFilters.forEach(f => f.addEventListener('change', (e) => { 
        currentFilters.year = e.target.value; 
        currentFilters.month = 'all'; // Reset month when year changes
        updateFiltersUI(); 
        renderAll(); 
    }));
    elements.monthFilters.forEach(f => f.addEventListener('change', (e) => { 
        currentFilters.month = e.target.value; 
        updateFiltersUI(); // Update other filter views
        renderAll(); 
    }));
    elements.groupFilters.forEach(f => f.addEventListener('change', (e) => { 
        currentFilters.group = e.target.value; 
        updateFiltersUI(); // Update other filter views
        renderAll(); 
    }));

    // Statement Search
    const statementSelect = document.getElementById('statement-month-select');
    if (statementSelect) {
        statementSelect.addEventListener('change', (e) => {
            renderMonthlyStatement(e.target.value);
        });
    }

    // Opening Balances Logic
    elements.editBalancesBtn.addEventListener('click', () => {
        renderBalanceInputs();
        elements.balanceModal.classList.add('active');
    });

    elements.closeBalanceModal.addEventListener('click', () => {
        elements.balanceModal.classList.remove('active');
    });

    elements.balanceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputs = elements.balanceInputsContainer.querySelectorAll('input');
        inputs.forEach(input => {
            carriedBalances[input.name] = parseFloat(input.value) || 0;
        });
        saveData(true);
        renderAll();
        elements.balanceModal.classList.remove('active');
    });

    elements.resetAllBalances.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all opening balances to 0?')) {
            carriedBalances = {};
            saveData(true);
            renderAll();
            elements.balanceModal.classList.remove('active');
        }
    });

    // Table Actions (Event Delegation)
    elements.expenseTable.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-action');
        if (id && action === 'delete') deleteExpense(id);
        if (id && action === 'edit') editExpense(id);
    });

    elements.membersTable.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-action');
        if (id && action === 'delete-member') deleteMember(id);
        if (id && action === 'edit-member') editMember(id);
    });

    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);

            // Update Toggle Button Icon
            themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';

            // Re-render charts for new colors
            renderCharts(filterExpenses());
            
            // Update Date Picker Theme
            initDatePicker();
        });
    }

    // Initialize Theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (savedTheme === 'dark' && themeToggle) {
        themeToggle.textContent = '☀️';
    }

    // Search Input
    if (elements.expenseSearch) {
        elements.expenseSearch.addEventListener('input', () => {
            renderTable(filterExpenses());
        });
    }

    // Export Excel (CSV)
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportToCSV);
    }

    // Budget Management
    if (elements.editBudgetsBtn) {
        elements.editBudgetsBtn.addEventListener('click', () => {
            renderBudgetInputs();
            elements.budgetModal.classList.add('active');
        });
    }

    if (elements.closeBudgetModal) {
        elements.closeBudgetModal.addEventListener('click', () => {
            elements.budgetModal.classList.remove('active');
        });
    }

    if (elements.budgetForm) {
        elements.budgetForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const inputs = elements.budgetInputsContainer.querySelectorAll('input');
            inputs.forEach(input => {
                budgets[input.name] = parseFloat(input.value) || 0;
            });
            saveData(true);
            renderAll();
            elements.budgetModal.classList.remove('active');
            showToast('Budgets Updated', 'success');
        });
    }

    // Advanced Filters Toggle
    const toggleAdvBtn = document.getElementById('toggle-advanced-filters');
    const advDrawer = document.getElementById('advanced-filters-drawer');
    if (toggleAdvBtn) {
        toggleAdvBtn.addEventListener('click', () => {
            const isHidden = advDrawer.style.display === 'none';
            advDrawer.style.display = isHidden ? 'grid' : 'none';
            toggleAdvBtn.classList.toggle('primary-btn', isHidden);
            toggleAdvBtn.classList.toggle('secondary-btn', !isHidden);
        });
    }

    document.getElementById('apply-advanced-filters')?.addEventListener('click', () => {
        advancedFilter.active = true;
        advancedFilter.start = document.getElementById('filter-start-date').value;
        advancedFilter.end = document.getElementById('filter-end-date').value;
        renderAll();
        showToast('Filter Applied', 'success');
    });

    document.getElementById('reset-advanced-filters')?.addEventListener('click', () => {
        advancedFilter.active = false;
        document.getElementById('filter-start-date').value = '';
        document.getElementById('filter-end-date').value = '';
        renderAll();
        showToast('Filter Reset', 'info');
    });

    // Templates
    elements.addTemplateBtn?.addEventListener('click', () => {
        elements.templateForm.reset();
        updateTemplatePayerOptions();
        elements.templateModal.classList.add('active');
    });

    elements.closeTemplateModal?.addEventListener('click', () => {
        elements.templateModal.classList.remove('active');
    });

    elements.templateForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const template = {
            id: Date.now(),
            particular: document.getElementById('temp-particular').value,
            amount: parseFloat(document.getElementById('temp-amount').value) || 0,
            name: document.getElementById('temp-name').value,
            group: document.getElementById('temp-group').value
        };
        templates.push(template);
        saveData();
        renderTemplates();
        elements.templateModal.classList.remove('active');
        showToast('Template Saved', 'success');
    });

    // Event Management
    elements.manageEventsBtn?.addEventListener('click', () => {
        renderEvents();
        elements.eventModal.classList.add('active');
        
        // Init Date Picker for Event Date if not already
        const eventDateInput = document.getElementById('event-date');
        if (eventDateInput && typeof NepaliFunctions !== 'undefined') {
            $(eventDateInput).nepaliDatePicker({
                container: "body",
                dateFormat: "YYYY-MM-DD",
                language: currentLang === 'ne' ? "nepali" : "english",
            });
        }
    });

    elements.eventForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const editId = document.getElementById('edit-event-id').value;
        const eventData = {
            id: editId ? parseInt(editId) : Date.now(),
            type: document.getElementById('event-type').value,
            name: document.getElementById('event-name').value,
            date: document.getElementById('event-date').value,
            recurring: document.getElementById('event-recurring').value
        };

        if (editId) {
            const idx = events.findIndex(ev => ev.id == editId);
            if (idx !== -1) events[idx] = eventData;
        } else {
            events.push(eventData);
        }

        saveData(true);
        renderEvents();
        elements.eventForm.reset();
        document.getElementById('edit-event-id').value = '';
        showToast('Event Saved', 'success');
    });

    // Bulk Actions
    document.getElementById('select-all-expenses')?.addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('.row-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = e.target.checked;
            const id = cb.getAttribute('data-id');
            if (e.target.checked) selectedIds.add(id);
            else selectedIds.delete(id);
        });
        renderTable(filterExpenses());
    });

    elements.expenseTable.addEventListener('change', (e) => {
        if (e.target.classList.contains('row-checkbox')) {
            const id = e.target.getAttribute('data-id');
            if (e.target.checked) selectedIds.add(id);
            else selectedIds.delete(id);
            updateBulkBar();
        }
    });

    document.getElementById('bulk-delete-btn')?.addEventListener('click', () => {
        const allowedToDelete = Array.from(selectedIds).filter(id => {
            const exp = expenses.find(e => e.id.toString() === id);
            return exp && canModifyExpense(exp);
        });

        if (allowedToDelete.length === 0) {
            showToast("No authorized expenses selected.", "error");
            return;
        }

        if (confirm(`Delete ${allowedToDelete.length} selected expenses?`)) {
            expenses = expenses.filter(exp => !allowedToDelete.includes(exp.id.toString()));
            selectedIds.clear();
            saveData();
            renderAll();
            showToast('Bulk Delete Successful', 'success');
        }
    });

    document.getElementById('cancel-bulk-btn')?.addEventListener('click', () => {
        selectedIds.clear();
        const allCb = document.getElementById('select-all-expenses');
        if (allCb) allCb.checked = false;
        renderTable(filterExpenses());
    });

    document.getElementById('notif-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (elements.notifBadge) {
            elements.notifBadge.style.display = 'none';
        }
        elements.notifDropdown?.classList.toggle('active');
        renderNotifications();
    });

    elements.clearNotifs?.addEventListener('click', () => {
        notifications = [];
        localStorage.setItem('notifications', JSON.stringify(notifications));
        renderNotifications();
    });

    // Close dropdown on click outside
    window.addEventListener('click', () => {
        elements.notifDropdown?.classList.remove('active');
    });

    elements.notifDropdown?.addEventListener('click', (e) => e.stopPropagation());

    // Manual Sync when clicking the sync status badge
    if (elements.syncStatus) {
        elements.syncStatus.style.cursor = 'pointer';
        elements.syncStatus.title = 'Click to force sync';
        elements.syncStatus.addEventListener('click', () => {
            if (hasUnsavedChanges) {
                showToast('Unsaved changes detected. Syncing now...', 'info');
                saveToGoogleSheets(true); // Save immediately
            } else if (isSavingToServer) {
                showToast('Currently saving changes. Please wait.', 'info');
            } else if (isSyncing) {
                showToast('Currently loading latest data. Please wait.', 'info');
            } else {
                showToast('Refreshing latest data from Google Sheets...', 'info');
                loadFromGoogleSheets();
            }
        });
    }
    setupCalendarNavigation();
    setupAccountSettings();
}

// Member Actions
window.editMember = function (id) {
    const member = members.find(m => m.id == id);
    if (!member) return;
    document.getElementById('edit-member-id').value = member.id;
    document.getElementById('member-name').value = member.name;
    document.getElementById('member-group').value = member.group;
    document.getElementById('member-password').value = member.password || '1234';
    document.getElementById('save-member-btn').textContent = 'Update Member';
    document.getElementById('cancel-member-edit').style.display = 'inline-block';
};

function deleteMember(id) {
    if (confirm('Delete this member? Expenses linked to this member will remain but calculation will adjust.')) {
        members = members.filter(m => m.id != id);
        saveData(true);
        updateDynamicUI();
        renderAll();
    }
}

function resetMemberForm() {
    elements.memberForm.reset();
    document.getElementById('edit-member-id').value = '';
    document.getElementById('member-password').value = '';
    document.getElementById('save-member-btn').textContent = 'Add Member';
    document.getElementById('cancel-member-edit').style.display = 'none';
}

// Helpers
function formatDate(dateStr) {
    if (!dateStr) return "";
    
    // Handle ISO strings or strings with time (e.g., 2083-01-09T18:15:00.000Z)
    // We only care about the YYYY-MM-DD part
    const cleanDate = dateStr.toString().substring(0, 10);
    
    const dateObj = NepaliFunctions.ConvertToDateObject(cleanDate, "YYYY-MM-DD");
    if (!dateObj) return dateStr;
    
    if (currentLang === 'ne') {
        return NepaliFunctions.BS.GetFullDate(dateObj, true);
    } else {
        return NepaliFunctions.BS.GetFullDate(dateObj, false);
    }
}

function updateFiltersUI() {
    const t = i18n[currentLang];
    
    // Populate Years
    const years = [...new Set(expenses.map(exp => exp.date.substring(0, 4)))]
        .filter(y => y.length === 4)
        .sort().reverse();

    const yearHTML = `<option value="all">${t.all_years}</option>` +
        years.map(y => {
            const yearStr = currentLang === 'ne' ? NepaliFunctions.ConvertToUnicode(y) : y;
            return `<option value="${y}" ${currentFilters.year === y ? 'selected' : ''}>${yearStr}</option>`;
        }).join('');
    
    elements.yearFilters.forEach(f => f.innerHTML = yearHTML);

    // Populate Months
    const filteredExpensesForMonths = currentFilters.year === 'all' 
        ? expenses 
        : expenses.filter(exp => exp.date.substring(0, 4) === currentFilters.year);

    const mKeys = [...new Set(filteredExpensesForMonths.map(exp => exp.date.substring(0, 7)))]
        .filter(m => m.length === 7)
        .sort().reverse();

    const monthHTML = `<option value="all">${t.all_months}</option>` +
        mKeys.map(m => {
            const [y, mm] = m.split('-');
            const monthIdx = parseInt(mm) - 1;
            const yearStr = currentLang === 'ne' ? NepaliFunctions.ConvertToUnicode(y) : y;
            const monthName = currentLang === 'ne' ? NepaliFunctions.BS.GetMonthInUnicode(monthIdx) : NepaliFunctions.BS.GetMonth(monthIdx);
            return `<option value="${m}" ${currentFilters.month === m ? 'selected' : ''}>${monthName} ${yearStr}</option>`;
        }).join('');
    
    elements.monthFilters.forEach(f => f.innerHTML = monthHTML);

    const gKeys = [...new Set(members.map(m => m.group))].sort();
    const groupHTML = `<option value="all">${t.all_groups || 'All Groups'}</option>` +
        gKeys.map(g => `<option value="${g}" ${currentFilters.group === g ? 'selected' : ''}>${g}</option>`).join('');
    
    elements.groupFilters.forEach(f => {
        f.innerHTML = groupHTML;
        f.value = currentFilters.group;
    });
}

function deleteExpense(id) {
    const exp = expenses.find(e => e.id == id);
    if (exp && !canModifyExpense(exp)) {
        showToast("Access Denied: Only the creator or Admin Nikhil can delete this.", "error");
        return;
    }
    if (confirm('Delete this expense?')) {
        expenses = expenses.filter(exp => exp.id != id);
        saveData();
        renderAll();
    }
}

function saveData(immediate = false) {
    localStorage.setItem('expenses', JSON.stringify(expenses));
    localStorage.setItem('members', JSON.stringify(members));
    localStorage.setItem('carriedBalances', JSON.stringify(carriedBalances));
    localStorage.setItem('shoppingItems', JSON.stringify(shoppingItems));
    localStorage.setItem('budgets', JSON.stringify(budgets));
    localStorage.setItem('templates', JSON.stringify(templates));
    localStorage.setItem('events', JSON.stringify(events));
    localStorage.setItem('notifications', JSON.stringify(notifications));

    hasUnsavedChanges = true;
    localStorage.setItem('hasUnsavedChanges', 'true');

    if (SCRIPT_URL) {
        saveToGoogleSheets(immediate);
    }
}

function setSyncStatus(type, textKey) {
    if (!elements.syncStatus) return;
    elements.syncStatus.className = 'status-badge ' + type;
    elements.syncStatus.textContent = i18n[currentLang][textKey] || textKey;
}

function updateUIWithTranslations() {
    const t = i18n[currentLang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            if (el.tagName === 'INPUT' && el.placeholder) {
                el.placeholder = t[key];
            } else {
                // If the element has a span (like in nav), update that
                const span = el.querySelector('span');
                if (span) span.textContent = t[key];
                else el.textContent = t[key];
            }
        }
    });
}

let isSyncing = false;
async function loadFromGoogleSheets() {
    if (isSyncing) return;
    if (isSavingToServer || hasUnsavedChanges || saveTimeout) {
        showToast('Sync skipped: Local changes are pending save.', 'info');
        console.log("Sync load skipped: local changes are pending save/sync.");
        return;
    }
    if (!navigator.onLine) {
        setSyncStatus('offline', '☁️ Offline Mode (Using Local Data)');
        isInitialLoadComplete = true; 
        return;
    }

    isSyncing = true;
    setSyncStatus('syncing', '⚡ Syncing from Sheet...');

    const processData = (data) => {
        isSyncing = false;
        if (!data) {
            isInitialLoadComplete = true;
            setSyncStatus('saved', '✅ Synced with Sheet');
            return;
        }

        // Compare each dataset to see if it actually changed
        const expChanged = data.expenses && JSON.stringify(expenses) !== JSON.stringify(data.expenses);
        const memChanged = data.members && JSON.stringify(members) !== JSON.stringify(data.members);
        const balChanged = data.carriedBalances && JSON.stringify(carriedBalances) !== JSON.stringify(data.carriedBalances);
        const shopChanged = data.shoppingItems && JSON.stringify(shoppingItems) !== JSON.stringify(data.shoppingItems);
        const budChanged = data.budgets && JSON.stringify(budgets) !== JSON.stringify(data.budgets);
        const tempChanged = data.templates && JSON.stringify(templates) !== JSON.stringify(data.templates);
        const evtChanged = data.events && Array.isArray(data.events) && JSON.stringify(events) !== JSON.stringify(data.events);

        const hasAnyChange = expChanged || memChanged || balChanged || shopChanged || budChanged || tempChanged || evtChanged;

        if (isInitialLoadComplete && !hasAnyChange) {
            // Nothing changed in Google Sheets! Do not re-render anything to prevent resetting scroll, focus, or cursor!
            console.log("Sync completed: No changes found on Google Sheets. Skipping re-render.");
            setSyncStatus('saved', '✅ Synced with Sheet');
            return;
        }

        // Notification Logic for Cloud Changes
        const hasLocalData = !!localStorage.getItem('expenses');
        if (hasLocalData) {
            let newNotificationsAdded = false;
            
            // 1. New Expenses
            if (expChanged) {
                const newItems = data.expenses.filter(e => !expenses.some(old => old.id === e.id));
                newItems.forEach(item => {
                    if (currentUser && item.name === currentUser.name) return;
                    
                    const creator = item.createdBy || item.name;
                    const msg = `${creator} added expense: ${item.particular} (Rs. ${item.amount})`;
                    
                    if (isInitialLoadComplete) {
                        sendNotification("New Expense", msg, 'expenses');
                    } else {
                        addSilentNotification("New Expense", msg, 'expenses');
                        newNotificationsAdded = true;
                    }
                });
            }
            
            // 2. Shopping List Updates
            if (shopChanged) {
                const newItems = data.shoppingItems.filter(i => !shoppingItems.some(old => old.id === i.id));
                newItems.forEach(item => {
                    if (currentUser && item.requestedBy === currentUser.name) return;
                    
                    const msg = `${item.requestedBy} requested: ${item.item}`;
                    
                    if (isInitialLoadComplete) {
                        sendNotification("New Shopping Item", msg, 'shopping');
                    } else {
                        addSilentNotification("New Shopping Item", msg, 'shopping');
                        newNotificationsAdded = true;
                    }
                });
                
                const purchasedItems = data.shoppingItems.filter(i => i.status === 'purchased' && shoppingItems.some(old => old.id === i.id && old.status === 'to_buy'));
                purchasedItems.forEach(item => {
                    if (currentUser && item.purchasedBy === currentUser.name) return;
                    
                    const msg = `${item.purchasedBy || 'Someone'} purchased: ${item.item}`;
                    
                    if (isInitialLoadComplete) {
                        sendNotification("Shopping Item Bought", msg, 'shopping');
                    } else {
                        addSilentNotification("Shopping Item Bought", msg, 'shopping');
                        newNotificationsAdded = true;
                    }
                });
            }
            
            if (newNotificationsAdded && !isInitialLoadComplete) {
                showToast("New updates in notification center!", "info");
            }
        }

        // Update local variables
        if (data.expenses) expenses = data.expenses;
        if (data.members) {
            members = data.members.map(incomingMem => {
                const existingMem = members.find(m => m.id == incomingMem.id);
                const passwordVal = incomingMem.password || (existingMem ? existingMem.password : '') || '1234';
                const uiModeVal = incomingMem.uiMode || (existingMem ? existingMem.uiMode : '') || 'professional';
                
                // Helper to parse true/false strings from Google Sheets
                const getBool = (incomingKey, fallbackKey, defaultVal = true) => {
                    const val = incomingMem[incomingKey];
                    if (val !== undefined && val !== "") {
                        return val === 'TRUE' || val === true || val === 'true';
                    }
                    if (existingMem && existingMem.customFeatures && existingMem.customFeatures[fallbackKey] !== undefined) {
                        return existingMem.customFeatures[fallbackKey];
                    }
                    return defaultVal;
                };

                return {
                    ...incomingMem,
                    id: incomingMem.id,
                    name: incomingMem.name,
                    group: incomingMem.group,
                    password: passwordVal,
                    uiMode: uiModeVal,
                    customFeatures: {
                        expenses: getBool('showExpenses', 'expenses'),
                        shopping: getBool('showShopping', 'shopping'),
                        calendar: getBool('showCalendar', 'calendar'),
                        reports: getBool('showReports', 'reports'),
                        admin: getBool('showAdmin', 'admin'),
                        dashShowFilters: getBool('dashShowFilters', 'dashShowFilters'),
                        dashShowCharts: getBool('dashShowCharts', 'dashShowCharts'),
                        dashShowSettlement: getBool('dashShowSettlement', 'dashShowSettlement')
                    }
                };
            });
            
            // Also keep currentUser object updated if it is in the list
            if (currentUser) {
                const updatedMe = members.find(m => m.id == currentUser.id);
                if (updatedMe) {
                    currentUser = updatedMe;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    applyUserUiMode(currentUser);
                }
            }
        }
        if (data.carriedBalances) carriedBalances = data.carriedBalances;
        if (data.shoppingItems) shoppingItems = data.shoppingItems;
        if (data.budgets) budgets = data.budgets;
        if (data.templates) templates = data.templates;
        if (data.events && Array.isArray(data.events)) events = data.events;

        if (data.userEmail) {
            elements.userProfile.style.display = 'block';
            elements.userEmail.textContent = data.userEmail;
            elements.userName.textContent = data.userEmail.split('@')[0].toUpperCase();
            elements.userAvatar.textContent = data.userEmail.charAt(0).toUpperCase();
        }

        // Save to localStorage immediately so offline loads are current
        localStorage.setItem('expenses', JSON.stringify(expenses));
        localStorage.setItem('members', JSON.stringify(members));
        localStorage.setItem('carriedBalances', JSON.stringify(carriedBalances));
        localStorage.setItem('shoppingItems', JSON.stringify(shoppingItems));
        localStorage.setItem('budgets', JSON.stringify(budgets));
        localStorage.setItem('templates', JSON.stringify(templates));
        localStorage.setItem('events', JSON.stringify(events));

        // Granular rendering! Only touch specific sections of the DOM that changed!
        if (expChanged || memChanged || balChanged || budChanged || !isInitialLoadComplete) {
            const filtered = filterExpenses();
            renderTable(filtered);
            const stats = calculateStats(filtered);
            renderStats(stats, filtered);
            renderCharts(filtered);
            renderMonthlyReport();
            updateStatementDropdown();
        }
        
        if (memChanged || !isInitialLoadComplete) {
            renderMembers();
            updateDynamicUI();
            if (typeof updateLoginUserDropdown === 'function') {
                updateLoginUserDropdown();
                updateUserProfileUI();
            }
        }
        
        if (shopChanged || !isInitialLoadComplete) {
            renderShoppingList();
        }
        
        if (tempChanged || !isInitialLoadComplete) {
            renderTemplates();
        }
        
        if (evtChanged || !isInitialLoadComplete) {
            renderEvents();
        }

        isInitialLoadComplete = true;
        setSyncStatus('saved', '✅ Synced with Sheet');
    };

    if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
            .withSuccessHandler(processData)
            .withFailureHandler(() => {
                isSyncing = false;
                setSyncStatus('offline', '☁️ Offline Mode (Native Load Failed)');
                isInitialLoadComplete = true;
            })
            .getAllDataWithUser();
    } else if (SCRIPT_URL) {
        try {
            const response = await fetch(SCRIPT_URL);
            const data = await response.json();
            processData(data);
        } catch (err) {
            isSyncing = false;
            console.error('Fetch error:', err);
            setSyncStatus('offline', '☁️ Offline Mode (Sync Failed)');
            isInitialLoadComplete = true; 
        }
    }
}

let saveTimeout = null;
async function saveToGoogleSheets(immediate = false) {
    clearTimeout(saveTimeout);

    const executeSave = () => {
        if (!isInitialLoadComplete) return;

        isSavingToServer = true;
        setSyncStatus('syncing', '💾 Saving to Sheet...');

        const serializedMembers = members.map(m => {
            const copy = { ...m };
            if (m.customFeatures) {
                copy.showExpenses = m.customFeatures.expenses ? 'TRUE' : 'FALSE';
                copy.showShopping = m.customFeatures.shopping ? 'TRUE' : 'FALSE';
                copy.showCalendar = m.customFeatures.calendar ? 'TRUE' : 'FALSE';
                copy.showReports = m.customFeatures.reports ? 'TRUE' : 'FALSE';
                copy.showAdmin = m.customFeatures.admin ? 'TRUE' : 'FALSE';
                copy.dashShowFilters = m.customFeatures.dashShowFilters ? 'TRUE' : 'FALSE';
                copy.dashShowCharts = m.customFeatures.dashShowCharts ? 'TRUE' : 'FALSE';
                copy.dashShowSettlement = m.customFeatures.dashShowSettlement ? 'TRUE' : 'FALSE';
            } else {
                copy.showExpenses = 'TRUE';
                copy.showShopping = 'TRUE';
                copy.showCalendar = 'TRUE';
                copy.showReports = 'TRUE';
                copy.showAdmin = 'TRUE';
                copy.dashShowFilters = 'TRUE';
                copy.dashShowCharts = 'TRUE';
                copy.dashShowSettlement = 'TRUE';
            }
            delete copy.customFeatures;
            return copy;
        });

        const payload = {
            action: 'save_data',
            expenses: expenses,
            members: serializedMembers,
            carriedBalances: carriedBalances,
            shoppingItems: shoppingItems,
            budgets: budgets,
            templates: templates,
            events: events
        };

        const handleSuccess = (res) => {
            isSavingToServer = false;
            saveTimeout = null;
            if (res && res.status !== 'error') {
                hasUnsavedChanges = false;
                localStorage.setItem('hasUnsavedChanges', 'false');
                setSyncStatus('saved', 'saved');
            } else {
                setSyncStatus('error', 'error');
            }
        };

        const handleFailure = (err) => {
            isSavingToServer = false;
            saveTimeout = null;
            console.error("Save failed:", err);
            setSyncStatus('error', 'error');
        };

        if (typeof google !== 'undefined' && google.script && google.script.run) {
            google.script.run
                .withSuccessHandler((res) => handleSuccess(res))
                .withFailureHandler((err) => handleFailure(err))
                .saveToSheetRows(payload);
        } else if (SCRIPT_URL) {
            fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(payload)
            })
            .then(r => r.json())
            .then(res => handleSuccess(res))
            .catch(err => handleFailure(err));
        }
    };

    if (immediate) {
        executeSave();
    } else {
        setSyncStatus('syncing', '💾 Changes pending sync...');
        saveTimeout = setTimeout(executeSave, 2000);
    }
}

function renderBalanceInputs() {
    const groups = [...new Set(members.map(m => m.group))];
    elements.balanceInputsContainer.innerHTML = groups.map(g => `
        <div class="form-group">
            <label>${g} Opening Balance</label>
            <input type="number" name="${g}" value="${carriedBalances[g] || 0}" step="0.01">
        </div>
    `).join('');
}



function canModifyExpense(exp) {
    if (!currentUser) return false;
    if (currentUser.name.toLowerCase() === 'nikhil') return true;
    const creator = exp.createdBy || exp.name;
    return currentUser.name.toLowerCase() === creator.toLowerCase();
}

function editExpense(id) {
    const exp = expenses.find(e => e.id == id);
    if (!exp) return;
    
    if (!canModifyExpense(exp)) {
        showToast("Access Denied: Only the creator or Admin Nikhil can edit this.", "error");
        return;
    }
    
    document.getElementById('edit-expense-id').value = exp.id;
    
    // Ensure date is in BS format for the picker
    let dateVal = exp.date;
    // If it looks like an AD date (pre-migration), convert it
    if (parseInt(dateVal.split('-')[0]) < 2070) {
        const adDate = new Date(dateVal);
        const bsDate = NepaliFunctions.AD2BS(adDate);
        dateVal = NepaliFunctions.ConvertToDateFormat(bsDate, "YYYY-MM-DD");
    }
    
    document.getElementById('exp-date').value = dateVal;
    document.getElementById('exp-particular').value = exp.particular;
    document.getElementById('exp-amount').value = exp.amount;
    document.getElementById('exp-name').value = exp.name;
    document.getElementById('exp-group').value = exp.group;
    document.getElementById('modal-title').textContent = 'Edit Expense';
    elements.expenseModal.classList.add('active');
}

function editMember(id) {
    const member = members.find(m => m.id == id);
    if (!member) return;
    document.getElementById('edit-member-id').value = member.id;
    document.getElementById('member-name').value = member.name;
    document.getElementById('member-group').value = member.group;
    document.getElementById('save-member-btn').textContent = 'Update Member';
    document.getElementById('cancel-member-edit').style.display = 'inline-block';
}

function resetExpenseForm() {
    elements.expenseForm.reset();
    document.getElementById('edit-expense-id').value = '';
    document.getElementById('modal-title').textContent = 'New Expense';
}

function renderShoppingList() {
    if (!elements.shoppingTable) return;
    const t = i18n[currentLang];
    elements.shoppingTable.innerHTML = shoppingItems.map(item => {
        const age = timeAgo(item.createdAt);
        const purchaserInfo = item.purchasedBy ? `<div class="purchaser-info" style="font-size: 0.72rem; color: var(--success); margin-top: 0.2rem; display: flex; align-items: center; gap: 0.25rem;"><span>✅</span> <span>Bought by: <strong>${item.purchasedBy}</strong></span></div>` : '';
        
        return `
        <tr class="${item.status === 'purchased' ? 'row-dimmed' : ''}">
            <td>
                <div style="${item.status === 'purchased' ? 'text-decoration: line-through;' : ''}">${item.item}</div>
                <div class="text-muted" style="font-size: 0.7rem;">${age}</div>
                ${purchaserInfo}
            </td>
            <td>${item.requestedBy}</td>
            <td>
                <span class="tag ${item.status === 'purchased' ? 'tag-success' : 'tag-warning'}">
                    ${t[item.status]}
                </span>
            </td>
            <td class="text-right">
                <button class="icon-btn" data-id="${item.id}" data-action="toggle-shop" title="${t.mark_bought}">
                    ${item.status === 'purchased' ? '🔄' : '✅'}
                </button>
                <button class="icon-btn" data-id="${item.id}" data-action="delete-shop" title="Delete">🗑️</button>
            </td>
        </tr>
    `}).join('');
}

function timeAgo(date) {
    if (!date) return '';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + "y ago";
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + "mo ago";
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + (interval === 1 ? " day ago" : " days ago");
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + (interval === 1 ? " hr ago" : " hrs ago");
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + (interval === 1 ? " min ago" : " mins ago");
    return "Just now";
}

function toggleShopStatus(id) {
    const item = shoppingItems.find(i => i.id == id);
    if (item) {
        if (item.status === 'purchased') {
            item.status = 'to_buy';
            item.purchasedBy = null;
        } else {
            item.status = 'purchased';
            
            // Use active user session if available, with fallbacks
            let purchaser = '';
            if (typeof currentUser !== 'undefined' && currentUser) {
                purchaser = currentUser.name;
            } else {
                purchaser = document.getElementById('user-name')?.textContent?.trim();
            }

            if (!purchaser) {
                purchaser = localStorage.getItem('last_purchaser');
            }

            if (!purchaser || purchaser === 'Someone') {
                purchaser = prompt("Who is purchasing this item?");
                if (!purchaser) purchaser = 'Someone';
                localStorage.setItem('last_purchaser', purchaser);
            }

            item.purchasedBy = purchaser;
        }
        saveData();
        renderShoppingList();
    }
}

function deleteShopItem(id) {
    if (confirm(i18n[currentLang].delete_confirm)) {
        shoppingItems = shoppingItems.filter(i => i.id != id);
        saveData();
        renderShoppingList();
    }
}

function initDatePicker() {
    const dateInput = document.getElementById("exp-date");
    if (!dateInput) return;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    // Initialize or Update Nepali Date Picker
    // Note: The library usually handles re-initialization well
    $(dateInput).nepaliDatePicker({
        container: "body",
        dateFormat: "YYYY-MM-DD",
        language: currentLang === 'ne' ? "nepali" : "english",
        mode: isDark ? "dark" : "light",
        miniEnglishDates: true, // Shows Gregorian dates alongside Nepali dates
        onSelect: function(data) {
            // data is the selected date object
        }
    });

    // Apply dark/light class to the container
    const observer = new MutationObserver(() => {
        const containers = document.querySelectorAll('.ndp-container');
        containers.forEach(container => {
            if (isDark) {
                container.classList.add('ndp-dark');
                container.classList.remove('ndp-light');
            } else {
                container.classList.add('ndp-light');
                container.classList.remove('ndp-dark');
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

function renderBudgetInputs() {
    const groups = [...new Set(members.map(m => m.group))];
    elements.budgetInputsContainer.innerHTML = groups.map(g => `
        <div class="form-group">
            <label>${g}</label>
            <input type="number" name="${g}" value="${budgets[g] || 0}" step="1">
        </div>
    `).join('');
}

function exportToCSV() {
    const headers = ['Date', 'Particular', 'Amount', 'Name', 'Group'];
    const rows = expenses.map(e => [e.date, e.particular, e.amount, e.name, e.group]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n"
        + rows.map(r => r.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Tiwari_Expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function renderTemplates() {
    if (!elements.templatesGrid) return;
    const items = templates.map(t => {
        const icon = CATEGORY_ICONS[t.group] || CATEGORY_ICONS["Other"];
        return `
        <div class="template-card" onclick="useTemplate(${t.id})">
            <div class="template-icon">${icon}</div>
            <div class="template-name">${t.particular}</div>
            <div class="template-amount">रु ${t.amount || 'Variable'}</div>
            <button class="delete-btn btn-sm" onclick="event.stopPropagation(); deleteTemplate(${t.id})" style="position: absolute; top: 5px; right: 5px; opacity: 0.5;">&times;</button>
        </div>
    `}).join('');

    // Prepend to the grid before the "Add" button
    const addBtn = `
        <div class="template-card" id="add-template-btn" onclick="openTemplateModal()" style="border: 1px dashed var(--primary); color: var(--primary);">
            <div class="template-icon">➕</div>
            <div class="template-name">Add Template</div>
        </div>
    `;
    elements.templatesGrid.innerHTML = items + addBtn;
}

function openTemplateModal() {
    elements.templateForm.reset();
    updateTemplatePayerOptions();
    elements.templateModal.classList.add('active');
}

function updateTemplatePayerOptions() {
    const select = document.getElementById('temp-name');
    if (!select) return;
    select.innerHTML = '<option value="" disabled selected>Select Default Payer</option>' +
        members.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
}

function useTemplate(id) {
    const t = templates.find(temp => temp.id == id);
    if (!t) return;
    
    // Autofill main expense form
    resetExpenseForm();
    
    const nameInput = document.getElementById('exp-name');
    const groupInput = document.getElementById('exp-group');
    
    document.getElementById('exp-particular').value = t.particular;
    document.getElementById('exp-amount').value = t.amount || '';
    nameInput.value = t.name;
    
    // Dynamically find the group based on the name to ensure it's always current
    const member = members.find(m => m.name === t.name);
    groupInput.value = member ? member.group : (t.group || '');
    
    // Set today's Nepali Date as default
    const bsDate = NepaliFunctions.BS.GetCurrentDate();
    document.getElementById('exp-date').value = NepaliFunctions.ConvertToDateFormat(bsDate, "YYYY-MM-DD");
    
    elements.expenseModal.classList.add('active');
    showToast('Template Applied', 'success');
}

function deleteTemplate(id) {
    if (confirm('Delete this template?')) {
        templates = templates.filter(t => t.id != id);
        saveData();
        renderTemplates();
    }
}

function renderBudgetInputs() {
    const groups = [...new Set(members.map(m => m.group))];
    elements.budgetInputsContainer.innerHTML = groups.map(g => `
        <div class="form-group">
            <label>${g}</label>
            <input type="number" name="${g}" value="${budgets[g] || 0}" step="1">
        </div>
    `).join('');
}

function openTemplateModal() {
    elements.templateForm.reset();
    updateTemplatePayerOptions();
    elements.templateModal.classList.add('active');
}

function updateTemplatePayerOptions() {
    const select = document.getElementById('temp-name');
    if (!select) return;
    select.innerHTML = '<option value="" disabled selected>Select Default Payer</option>' +
        members.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
}

function updateBulkBar() {
    if (!elements.bulkBar) return;
    if (selectedIds.size > 0) {
        elements.bulkBar.style.display = 'flex';
        elements.selectedCount.textContent = `${selectedIds.size} items selected`;
    } else {
        elements.bulkBar.style.display = 'none';
    }
}

function showToast(msg, type = 'success') {
    if (!elements.toast) return;
    const icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️');
    document.getElementById('toast-icon').textContent = icon;
    document.getElementById('toast-message').textContent = msg;
    elements.toast.className = `toast ${type}`;
    elements.toast.style.display = 'flex';
    
    setTimeout(() => {
        elements.toast.style.display = 'none';
    }, 3000);
}

function playNotificationSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);

        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
        console.log("Audio feedback blocked or not supported");
    }
}

function sendNotification(title, msg, targetPage = null) {
    showToast(msg, 'success');
    playNotificationSound();
    
    // Add to notification list
    const newNotif = {
        id: Date.now(),
        title: title,
        msg: msg,
        targetPage: targetPage,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        read: false
    };
    notifications.unshift(newNotif);
    if (notifications.length > 20) notifications.pop(); // Keep only last 20
    localStorage.setItem('notifications', JSON.stringify(notifications));

    // Show Red Badge
    if (elements.notifBadge) {
        elements.notifBadge.style.display = 'block';
    }
    
    if (document.visibilityState === 'hidden' && "Notification" in window && Notification.permission === "granted") {
        try {
            new Notification(title, { 
                body: msg, 
                icon: 'icon-192.png',
                badge: 'icon-192.png'
            });
        } catch (e) {
            console.error("Notification failed", e);
        }
    }
}

function addSilentNotification(title, msg, targetPage = null) {
    const newNotif = {
        id: Date.now() + Math.random(),
        title: title,
        msg: msg,
        targetPage: targetPage,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        read: false
    };
    notifications.unshift(newNotif);
    if (notifications.length > 20) notifications.pop();
    localStorage.setItem('notifications', JSON.stringify(notifications));

    if (elements.notifBadge) {
        elements.notifBadge.style.display = 'block';
    }
}

function renderEvents() {
    if (!elements.eventListContainer) return;
    elements.eventListContainer.innerHTML = events.map(ev => `
        <div class="event-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border-bottom: 1px solid var(--border);">
            <div>
                <strong>${ev.name}</strong> (${ev.date})
                <div class="text-muted" style="font-size: 0.7rem;">${ev.type} | Recurring: ${ev.recurring}</div>
            </div>
            <div>
                <button class="icon-btn" onclick="editEvent(${ev.id})">✏️</button>
                <button class="icon-btn" onclick="deleteEvent(${ev.id})">🗑️</button>
            </div>
        </div>
    `).join('') || '<p class="text-center text-muted">No events added yet</p>';
}

function editEvent(id) {
    const ev = events.find(e => e.id == id);
    if (!ev) return;
    document.getElementById('edit-event-id').value = ev.id;
    document.getElementById('event-type').value = ev.type;
    document.getElementById('event-name').value = ev.name;
    document.getElementById('event-date').value = ev.date;
    document.getElementById('event-recurring').value = ev.recurring;
}

function deleteEvent(id) {
    if (confirm('Delete this event?')) {
        if (id === 999) {
            localStorage.setItem('events_demo_seen', 'true');
        }
        events = events.filter(ev => ev.id != id);
        saveData(true);
        renderEvents();
    }
}

function checkTodayEvents() {
    if (!elements.eventOverlay) return;
    
    const bsDate = NepaliFunctions.BS.GetCurrentDate();
    const todayStrFull = NepaliFunctions.ConvertToDateFormat(bsDate, "YYYY-MM-DD");
    const todayMonthDay = todayStrFull.substring(5); // MM-DD

    const todayEvents = events.filter(ev => {
        if (ev.recurring === 'yes') {
            return ev.date.substring(5) === todayMonthDay;
        }
        return ev.date === todayStrFull;
    });

    if (todayEvents.length === 0) return;

    let currentEventIndex = 0;
    let timerInterval = null;

    const displayEvent = (index) => {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        const ev = todayEvents[index];
        elements.overlayTitle.textContent = ev.type === 'birthday' ? 'Happy Birthday!' : 'Event Today!';
        elements.overlayDesc.textContent = ev.name;
        elements.overlayIcon.textContent = ev.type === 'birthday' ? '🎂' : (ev.type === 'function' ? '🎊' : '📅');
        
        elements.eventOverlay.classList.add('active');
        
        let secondsLeft = 10;
        elements.overlayTimer.textContent = `Closing in ${secondsLeft}s...`;
        
        timerInterval = setInterval(() => {
            secondsLeft--;
            elements.overlayTimer.textContent = `Closing in ${secondsLeft}s...`;
            if (secondsLeft <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                nextEvent();
            }
        }, 1000);
        
        elements.eventOverlay.dataset.timerId = timerInterval;
    };

    const nextEvent = () => {
        currentEventIndex++;
        if (currentEventIndex < todayEvents.length) {
            displayEvent(currentEventIndex);
        } else {
            elements.eventOverlay.classList.remove('active');
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
        }
    };

    window.closeEventOverlay = function() {
        nextEvent();
    };

    displayEvent(0);
}

function renderNotifications() {
    if (!elements.notifList) return;
    
    if (notifications.length === 0) {
        elements.notifList.innerHTML = '<p class="empty-notif">No new updates</p>';
        return;
    }

    elements.notifList.innerHTML = notifications.map(n => `
        <div class="notif-item ${n.read ? '' : 'new'}" data-page="${n.targetPage || ''}" style="cursor: ${n.targetPage ? 'pointer' : 'default'}">
            <span class="notif-item-title">${n.title}</span>
            <p class="notif-item-desc">${n.msg}</p>
            <span class="notif-item-time">${n.time}</span>
        </div>
    `).join('');
    
    // Add click listeners
    const items = elements.notifList.querySelectorAll('.notif-item');
    items.forEach(item => {
        item.addEventListener('click', () => {
            const page = item.getAttribute('data-page');
            if (page) {
                navigateToPage(page);
                elements.notifDropdown.classList.remove('active');
            }
        });
    });
    
    // Mark all as read after opening
    notifications = notifications.map(n => ({ ...n, read: true }));
    localStorage.setItem('notifications', JSON.stringify(notifications));
}

// Expose functions globally for inline HTML event handlers
window.editEvent = editEvent;
window.deleteEvent = deleteEvent;
window.useTemplate = useTemplate;
window.deleteTemplate = deleteTemplate;
window.openTemplateModal = openTemplateModal;

// User Authentication & Management Functions
function updateLoginUserDropdown() {
    if (!elements.loginUserSelect) return;
    elements.loginUserSelect.innerHTML = '<option value="" disabled selected>Select Your Name</option>' +
        members.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
}

function updateUserProfileUI() {
    if (!elements.userProfile) return;
    
    if (currentUser) {
        elements.userProfile.style.display = 'flex';
        elements.userAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
        elements.userDropdownName.textContent = currentUser.name;
        elements.userDropdownGroup.textContent = currentUser.group;
        
        applyUserUiMode(currentUser);
        
        // Auto-select in Payer select inputs if adding
        if (elements.expName) {
            elements.expName.value = currentUser.name;
            // Trigger group autofill
            const member = members.find(m => m.name === currentUser.name);
            if (elements.expGroup && member) {
                elements.expGroup.value = member.group;
            }
        }
        if (elements.shopName) {
            elements.shopName.value = currentUser.name;
        }
    } else {
        elements.userProfile.style.display = 'none';
        if (elements.userDropdown) {
            elements.userDropdown.classList.remove('active');
            elements.userDropdown.style.display = 'none';
        }
        applyUserUiMode(null);
    }
}

function initUserLoginSystem() {
    // Show login overlay if not logged in
    if (!currentUser) {
        elements.loginOverlay.classList.add('active');
    } else {
        elements.loginOverlay.classList.remove('active');
        updateUserProfileUI();
    }
    
    updateLoginUserDropdown();
    
    // Login form submission
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = elements.loginUserSelect.value;
            const passwordVal = elements.loginPassword.value;
            
            const member = members.find(m => m.name === name);
            if (!member) {
                showLoginError("Member not found!");
                return;
            }
            
            const correctPassword = member.password || '1234';
            if (passwordVal === correctPassword) {
                currentUser = member;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                elements.loginOverlay.classList.remove('active');
                updateUserProfileUI();
                elements.loginForm.reset();
                if (elements.loginError) elements.loginError.style.display = 'none';
                showToast(`Welcome back, ${member.name}!`, 'success');
            } else {
                showLoginError("Invalid password! Default is 1234.");
            }
        });
    }
    
    // Guest button click
    if (elements.loginGuestBtn) {
        elements.loginGuestBtn.addEventListener('click', () => {
            currentUser = null;
            localStorage.removeItem('currentUser');
            elements.loginOverlay.classList.remove('active');
            updateUserProfileUI();
            showToast("Browsing as Guest", 'info');
        });
    }
    
    // Toggle User Profile Dropdown
    if (elements.userProfile) {
        elements.userProfile.addEventListener('click', (e) => {
            e.stopPropagation();
            if (elements.userDropdown) {
                const isVisible = elements.userDropdown.style.display === 'block';
                elements.userDropdown.style.display = isVisible ? 'none' : 'block';
            }
        });
    }
    
    // Click outside user profile closes dropdown
    document.addEventListener('click', (e) => {
        if (elements.userDropdown && !elements.userDropdown.contains(e.target) && e.target !== elements.userProfile) {
            elements.userDropdown.style.display = 'none';
        }
    });
    
    // Logout button click
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', () => {
            currentUser = null;
            localStorage.removeItem('currentUser');
            updateUserProfileUI();
            elements.loginOverlay.classList.add('active');
            updateLoginUserDropdown();
            showToast("Signed out successfully", 'info');
        });
    }
}

function showLoginError(msg) {
    if (elements.loginError) {
        elements.loginError.textContent = msg;
        elements.loginError.style.display = 'block';
    }
}

// Global window exposure for callbacks
window.updateLoginUserDropdown = updateLoginUserDropdown;
window.updateUserProfileUI = updateUserProfileUI;

// ==========================================
// HOUSEHOLD INTERACTIVE CALENDAR VIEWS
// ==========================================

function renderCalendarView() {
    const titleEl = document.getElementById('calendar-month-year-title');
    const weekdaysEl = document.querySelector('.calendar-weekdays');
    const gridEl = document.getElementById('calendar-days-grid');
    if (!titleEl || !gridEl || !weekdaysEl) return;

    // Header Display (Nepali BS Month Name & Year)
    const nepMonthName = currentLang === 'ne' 
        ? NepaliFunctions.BS.GetMonthInUnicode(calendarMonth - 1)
        : NepaliFunctions.BS.GetMonth(calendarMonth - 1);
    const nepYearStr = currentLang === 'ne' 
        ? NepaliFunctions.ConvertToUnicode(calendarYear) 
        : calendarYear.toString();
    titleEl.textContent = `${nepMonthName} ${nepYearStr}`;

    // Render Weekday headers (English/Nepali)
    const weekdayLabels = currentLang === 'ne'
        ? NepaliFunctions.BS.GetDaysUnicodeShort()
        : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    weekdaysEl.innerHTML = weekdayLabels.map(day => `<div>${day}</div>`).join('');

    // Grid Calculations
    const daysInMonth = NepaliFunctions.BS.GetDaysInMonth(calendarYear, calendarMonth);
    const firstDayStr = NepaliFunctions.BS.GetFullDay({year: calendarYear, month: calendarMonth, day: 1});
    const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const startingDayIndex = weekdayNames.indexOf(firstDayStr);

    let gridHTML = '';

    // Render empty padded days at start
    for (let i = 0; i < startingDayIndex; i++) {
        gridHTML += `<div class="calendar-day padding-day" style="background: var(--bg-main); opacity: 0.15; border: 1px solid var(--border); min-height: 90px; padding: 0.5rem;"></div>`;
    }

    // Render month days
    const todayBS = NepaliFunctions.BS.GetCurrentDate();
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        // Find events on this day
        const dayMonthStr = dateStr.substring(5); // MM-DD
        const dayEvents = events.filter(ev => {
            if (ev.recurring === 'yes') {
                return ev.date.substring(5) === dayMonthStr;
            }
            return ev.date === dateStr;
        });

        // Find expenses on this day
        const dayExpenses = expenses.filter(exp => exp.date === dateStr);
        const dayExpenseSum = dayExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

        // Styling for special days
        const isToday = todayBS.year === calendarYear && todayBS.month === calendarMonth && todayBS.day === d;
        const dayStyle = isToday 
            ? `border: 2px solid var(--primary); background: rgba(99, 102, 241, 0.05);` 
            : `border: 1px solid var(--border);`;
        
        // Nepali unicode day number
        const displayDay = currentLang === 'ne' 
            ? NepaliFunctions.ConvertToUnicode(d) 
            : d.toString();

        // Construct HTML for badges inside the grid day
        let badgesHTML = '';
        
        // Birthdays
        dayEvents.filter(ev => ev.type === 'birthday').forEach(ev => {
            badgesHTML += `
                <div class="cal-badge birthday-badge" style="background: rgba(99, 102, 241, 0.15); color: #6366F1; font-size: 0.7rem; font-weight: bold; border-radius: 4px; padding: 2px 4px; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    🎂 ${ev.name}
                </div>
            `;
        });

        // Functions
        dayEvents.filter(ev => ev.type !== 'birthday').forEach(ev => {
            badgesHTML += `
                <div class="cal-badge function-badge" style="background: rgba(245, 158, 11, 0.15); color: #F59E0B; font-size: 0.7rem; font-weight: bold; border-radius: 4px; padding: 2px 4px; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    🎊 ${ev.name}
                </div>
            `;
        });

        // Expense sum
        if (dayExpenseSum > 0) {
            badgesHTML += `
                <div class="cal-badge expense-badge" style="background: rgba(16, 185, 129, 0.15); color: #10B981; font-size: 0.7rem; font-weight: bold; border-radius: 4px; padding: 2px 4px; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    रु ${dayExpenseSum.toLocaleString()}
                </div>
            `;
        }

        gridHTML += `
            <div class="calendar-day" data-day="${d}" style="${dayStyle} min-height: 95px; padding: 0.5rem; cursor: pointer; display: flex; flex-direction: column; justify-content: space-between; transition: all 0.2s; position: relative;" onclick="openDayDetails(${d})">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
                    <span class="day-number" style="font-weight: 700; font-size: 0.95rem; color: ${isToday ? 'var(--primary)' : 'var(--text-main)'}; ${isToday ? 'background: var(--primary); color: white; border-radius: 50%; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center;' : ''}">
                        ${displayDay}
                    </span>
                </div>
                <div class="day-badges-container" style="display: flex; flex-direction: column; gap: 2px; margin-top: 4px; width: 100%; flex-grow: 1; justify-content: flex-end;">
                    ${badgesHTML}
                </div>
            </div>
        `;
    }

    gridEl.innerHTML = gridHTML;
}

// Global functions for events
window.openDayDetails = function(day) {
    const drawer = document.getElementById('day-details-drawer');
    const drawerTitle = document.getElementById('drawer-date-title');
    const drawerBody = document.getElementById('drawer-details-body');
    if (!drawer || !drawerBody || !drawerTitle) return;

    // Save date state globally for the "Add" buttons
    drawer.dataset.selectedDate = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Format Date Headers
    const bsDate = { year: calendarYear, month: calendarMonth, day: day };
    const nepDateStr = NepaliFunctions.BS.GetFullDate(bsDate, currentLang === 'ne');
    const adDate = NepaliFunctions.BS2AD(bsDate);
    const engMonth = NepaliFunctions.AD.GetMonth(adDate.month - 1);
    const engDateStr = `${engMonth} ${adDate.day}, ${adDate.year}`;

    drawerTitle.textContent = `${nepDateStr} (${engDateStr})`;

    // Get Data
    const dateStr = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayExpenses = expenses.filter(exp => exp.date === dateStr);
    const dayMonthStr = dateStr.substring(5);
    const dayEvents = events.filter(ev => {
        if (ev.recurring === 'yes') return ev.date.substring(5) === dayMonthStr;
        return ev.date === dateStr;
    });

    let bodyHTML = '';

    // Render Events Section
    if (dayEvents.length > 0) {
        bodyHTML += `
            <div style="margin-bottom: 1.5rem;">
                <h4 style="margin: 0 0 0.5rem 0; font-size: 0.9rem; text-transform: uppercase; color: var(--primary); letter-spacing: 0.5px; font-weight: 700;">📅 Events Today</h4>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    ${dayEvents.map(ev => `
                        <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-main); padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border);">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-size: 1.25rem;">${ev.type === 'birthday' ? '🎂' : '🎊'}</span>
                                <div>
                                    <strong style="font-size: 0.9rem;">${ev.name}</strong>
                                    <div class="subtitle" style="font-size: 0.75rem;">${ev.type === 'birthday' ? 'Birthday' : 'Function'} ${ev.recurring === 'yes' ? '(Yearly Recurring)' : ''}</div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 0.25rem;">
                                <button class="secondary-btn btn-sm" onclick="editEventFromCal(${ev.id})" style="padding: 0.2rem 0.4rem; font-size: 0.7rem;">Edit</button>
                                <button class="delete-btn" onclick="deleteEventFromCal(${ev.id})" style="font-size: 0.8rem; padding: 0.2rem 0.4rem;">🗑️</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Render Expenses Section
    if (dayExpenses.length > 0) {
        const totalSum = dayExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
        bodyHTML += `
            <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <h4 style="margin: 0; font-size: 0.9rem; text-transform: uppercase; color: #10B981; letter-spacing: 0.5px; font-weight: 700;">💸 Expenses Today</h4>
                    <strong style="color: #10B981; font-size: 0.95rem;">Total: रु ${totalSum.toLocaleString()}</strong>
                </div>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    ${dayExpenses.map(exp => {
                        const icon = CATEGORY_ICONS[exp.group] || CATEGORY_ICONS["Other"];
                        const allowed = canModifyExpense(exp);
                        return `
                            <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-main); padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border);">
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    <div class="category-icon" style="width: 32px; height: 32px; font-size: 1.1rem; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; background: var(--card-bg); border: 1px solid var(--border);">${icon}</div>
                                    <div>
                                        <strong style="font-size: 0.9rem;">${exp.particular}</strong>
                                        <div class="subtitle" style="font-size: 0.75rem;">Paid By: <span class="tag tag-${exp.name.toLowerCase().replace(/\s/g, '')}">${exp.name}</span> (${exp.group})</div>
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    <strong style="font-size: 0.9rem; color: var(--text-main);">रु ${exp.amount.toLocaleString()}</strong>
                                    ${allowed ? `
                                        <button class="secondary-btn btn-sm" onclick="editExpenseFromCal(${exp.id})" style="padding: 0.2rem 0.4rem; font-size: 0.7rem;">Edit</button>
                                        <button class="delete-btn" onclick="deleteExpenseFromCal(${exp.id})" style="font-size: 0.8rem; padding: 0.2rem 0.4rem;">🗑️</button>
                                    ` : '🔒'}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    if (dayEvents.length === 0 && dayExpenses.length === 0) {
        bodyHTML = `
            <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted);">
                <p style="margin: 0; font-size: 1.5rem;">🍃</p>
                <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem;">No events or expenses scheduled for this day.</p>
            </div>
        `;
    }

    drawerBody.innerHTML = bodyHTML;
    drawer.style.display = 'flex';
};

// Add / Edit callbacks
window.editExpenseFromCal = function(id) {
    document.getElementById('day-details-drawer').style.display = 'none';
    editExpense(id);
};

window.deleteExpenseFromCal = function(id) {
    if (confirm("Delete this expense?")) {
        document.getElementById('day-details-drawer').style.display = 'none';
        deleteExpense(id);
    }
};

window.editEventFromCal = function(id) {
    document.getElementById('day-details-drawer').style.display = 'none';
    const ev = events.find(e => e.id == id);
    if (!ev) return;
    
    // Open Event Modal
    elements.eventModal.classList.add('active');
    document.getElementById('edit-event-id').value = ev.id;
    document.getElementById('event-type').value = ev.type;
    document.getElementById('event-name').value = ev.name;
    document.getElementById('event-date').value = ev.date;
    document.getElementById('event-recurring').value = ev.recurring;
};

window.deleteEventFromCal = function(id) {
    if (confirm("Delete this event?")) {
        document.getElementById('day-details-drawer').style.display = 'none';
        deleteEvent(id);
    }
};

// Setup navigation listeners
function setupCalendarNavigation() {
    const prevBtn = document.getElementById('cal-prev-btn');
    const nextBtn = document.getElementById('cal-next-btn');
    const closeBtn = document.getElementById('close-drawer-btn');
    const drawer = document.getElementById('day-details-drawer');
    const addExpenseBtn = document.getElementById('drawer-add-expense-btn');
    const addEventBtn = document.getElementById('drawer-add-event-btn');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            calendarMonth--;
            if (calendarMonth < 1) {
                calendarMonth = 12;
                calendarYear--;
            }
            renderCalendarView();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            calendarMonth++;
            if (calendarMonth > 12) {
                calendarMonth = 1;
                calendarYear++;
            }
            renderCalendarView();
        });
    }

    if (closeBtn && drawer) {
        closeBtn.addEventListener('click', () => {
            drawer.style.display = 'none';
        });
        drawer.addEventListener('click', (e) => {
            if (e.target === drawer) drawer.style.display = 'none';
        });
    }

    if (addExpenseBtn && drawer) {
        addExpenseBtn.addEventListener('click', () => {
            const selectedDate = drawer.dataset.selectedDate;
            drawer.style.display = 'none';
            
            // Open Add Expense modal
            resetExpenseForm();
            elements.expenseModal.classList.add('active');
            document.getElementById('exp-date').value = selectedDate;
            if (currentUser) {
                elements.expName.value = currentUser.name;
                elements.expGroup.value = currentUser.group;
            }
        });
    }

    if (addEventBtn && drawer) {
        addEventBtn.addEventListener('click', () => {
            const selectedDate = drawer.dataset.selectedDate;
            drawer.style.display = 'none';
            
            // Open Add Event modal/panel
            elements.eventModal.classList.add('active');
            document.getElementById('edit-event-id').value = '';
            document.getElementById('event-name').value = '';
            document.getElementById('event-date').value = selectedDate;
            document.getElementById('event-recurring').value = 'yes';
        });
    }
}

// Exposure for global callbacks
window.renderCalendarView = renderCalendarView;
window.setupCalendarNavigation = setupCalendarNavigation;

// ==========================================
// INTERFACE MODES (EASY, ADVANCED, PRO)
// ==========================================

function applyUserUiMode(user) {
    const mode = user ? (user.uiMode || 'professional') : 'professional';
    
    const customFeatures = (user && user.customFeatures) ? user.customFeatures : {
        expenses: true,
        shopping: true,
        calendar: true,
        reports: true,
        admin: true,
        dashShowFilters: true,
        dashShowCharts: true,
        dashShowSettlement: true
    };

    const visibleTabs = {
        dashboard: true,
        expenses: false,
        shopping: false,
        calendar: false,
        reports: false,
        admin: false
    };

    if (mode === 'easy') {
        visibleTabs.expenses = true;
        visibleTabs.shopping = true;
    } else if (mode === 'professional') {
        visibleTabs.expenses = true;
        visibleTabs.shopping = true;
        visibleTabs.calendar = true;
        visibleTabs.reports = true;
        visibleTabs.admin = true;
    } else if (mode === 'advanced') {
        visibleTabs.expenses = !!customFeatures.expenses;
        visibleTabs.shopping = !!customFeatures.shopping;
        visibleTabs.calendar = !!customFeatures.calendar;
        visibleTabs.reports = !!customFeatures.reports;
        visibleTabs.admin = !!customFeatures.admin;
    }

    document.querySelectorAll('.desktop-nav li, .mobile-bottom-nav li').forEach(li => {
        const page = li.getAttribute('data-page');
        if (page === 'dashboard') {
            li.style.display = '';
            return;
        }
        if (visibleTabs[page]) {
            li.style.display = '';
        } else {
            li.style.display = 'none';
        }
    });

    const templateSec = document.querySelector('.templates-section');
    if (templateSec) {
        templateSec.style.display = (mode === 'easy') ? 'none' : '';
    }

    // Toggle Dashboard Configurations
    const dashFilters = document.getElementById('dashboard-filter-section');
    const dashCharts = document.getElementById('dashboard-charts-section');
    const dashSettlement = document.getElementById('group-settlement-container');
    const dashIndividual = document.getElementById('individual-summary-container');
    const dashBalanceList = document.querySelector('.balance-section.card');

    let showFilters = true;
    let showCharts = true;
    let showSettlement = true;

    if (mode === 'easy') {
        showFilters = false;
        showCharts = false;
        showSettlement = false;
    } else if (mode === 'advanced') {
        showFilters = customFeatures.dashShowFilters !== false;
        showCharts = customFeatures.dashShowCharts !== false;
        showSettlement = customFeatures.dashShowSettlement !== false;
    }

    if (dashFilters) dashFilters.style.display = showFilters ? '' : 'none';
    if (dashCharts) dashCharts.style.display = showCharts ? '' : 'none';
    if (dashSettlement) dashSettlement.style.display = showSettlement ? '' : 'none';
    if (dashIndividual) dashIndividual.style.display = showSettlement ? '' : 'none';
    if (dashBalanceList) dashBalanceList.style.display = showSettlement ? '' : 'none';
    
    const activePage = localStorage.getItem('activePage') || 'dashboard';
    if (activePage !== 'dashboard' && !visibleTabs[activePage]) {
        navigateToPage('dashboard');
        localStorage.setItem('activePage', 'dashboard');
    }
}

function setupAccountSettings() {
    const openBtn = document.getElementById('open-settings-btn');
    const closeBtn = document.getElementById('close-settings-modal');
    const cancelBtn = document.getElementById('cancel-settings-btn');
    const modal = document.getElementById('account-settings-modal');
    const form = document.getElementById('account-settings-form');
    const modeRadios = document.getElementsByName('ui-mode');
    const advSection = document.getElementById('advanced-features-selection');

    if (!modal) return;

    modeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'advanced') {
                advSection.style.display = 'block';
            } else {
                advSection.style.display = 'none';
            }
        });
    });

    if (openBtn) {
        openBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (elements.userDropdown) {
                elements.userDropdown.style.display = 'none';
            }
            if (!currentUser) {
                showToast("Please sign in to modify settings!", "error");
                return;
            }

            modal.classList.add('active');
            document.getElementById('settings-password').value = '';
            
            const userMode = currentUser.uiMode || 'professional';
            modeRadios.forEach(r => {
                r.checked = (r.value === userMode);
            });

            if (userMode === 'advanced') {
                advSection.style.display = 'block';
            } else {
                advSection.style.display = 'none';
            }

            const features = currentUser.customFeatures || {
                expenses: true,
                shopping: true,
                calendar: true,
                reports: true,
                admin: true,
                dashShowFilters: true,
                dashShowCharts: true,
                dashShowSettlement: true
            };

            document.getElementById('feature-expenses').checked = !!features.expenses;
            document.getElementById('feature-shopping').checked = !!features.shopping;
            document.getElementById('feature-calendar').checked = !!features.calendar;
            document.getElementById('feature-reports').checked = !!features.reports;
            document.getElementById('feature-admin').checked = !!features.admin;
            document.getElementById('dash-show-filters').checked = features.dashShowFilters !== false;
            document.getElementById('dash-show-charts').checked = features.dashShowCharts !== false;
            document.getElementById('dash-show-settlement').checked = features.dashShowSettlement !== false;
        });
    }

    const closeModal = () => {
        modal.classList.remove('active');
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!currentUser) return;

            const newPassword = document.getElementById('settings-password').value.trim();
            if (newPassword) {
                currentUser.password = newPassword;
            }

            let selectedMode = 'professional';
            modeRadios.forEach(r => {
                if (r.checked) selectedMode = r.value;
            });
            currentUser.uiMode = selectedMode;

            currentUser.customFeatures = {
                expenses: document.getElementById('feature-expenses').checked,
                shopping: document.getElementById('feature-shopping').checked,
                calendar: document.getElementById('feature-calendar').checked,
                reports: document.getElementById('feature-reports').checked,
                admin: document.getElementById('feature-admin').checked,
                dashShowFilters: document.getElementById('dash-show-filters').checked,
                dashShowCharts: document.getElementById('dash-show-charts').checked,
                dashShowSettlement: document.getElementById('dash-show-settlement').checked
            };

            const idx = members.findIndex(m => m.id == currentUser.id);
            if (idx !== -1) {
                members[idx] = { ...members[idx], ...currentUser };
            }

            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            saveData(true);
            
            applyUserUiMode(currentUser);
            updateUserProfileUI();
            closeModal();
            showToast("Account Settings Saved Successfully!", "success");
        });
    }
}

// Exposure for global callbacks
window.applyUserUiMode = applyUserUiMode;
window.setupAccountSettings = setupAccountSettings;

init();
checkTodayEvents();
