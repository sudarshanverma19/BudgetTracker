// ====================== DOM ELEMENTS ======================
// Loading overlay for auth check
const authLoader = document.createElement('div');
authLoader.className = 'loader auth-loader';
authLoader.style.position = 'fixed';
authLoader.style.top = '0';
authLoader.style.left = '0';
authLoader.style.width = '100vw';
authLoader.style.height = '100vh';
authLoader.style.background = 'rgba(255,255,255,0.7)';
authLoader.style.display = 'flex';
authLoader.style.alignItems = 'center';
authLoader.style.justifyContent = 'center';
authLoader.style.zIndex = '9999';
authLoader.innerHTML = '<div class="loader"></div>';
document.body.appendChild(authLoader);
authLoader.style.display = 'block';
const loginSection = document.getElementById('login-section');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const loginError = document.getElementById('login-error');

// Form elements
const incomeForm = document.getElementById('income-form');
const expenseForm = document.getElementById('expense-form');
const goalForm = document.getElementById('goal-form');

// Loading indicators
const loginLoader = document.createElement('div');
loginLoader.className = 'loader';
loginForm.appendChild(loginLoader);
loginLoader.style.display = 'none';

// ====================== FIREBASE CONFIG ======================
const firebaseConfig = {
  apiKey: "AIzaSyCrDlkIw39Zil7gZQILwpIa7f7ITXeLdS0",
  authDomain: "budgertracker.firebaseapp.com",
  projectId: "budgertracker",
  storageBucket: "budgertracker.firebasestorage.app",
  messagingSenderId: "387176020743",
  appId: "1:387176020743:web:2ce32ef9f6efcdcbde23a2"
};

// ====================== GLOBAL VARIABLES ======================
let currentUser = null;
let allIncomes = [];
let allExpenses = [];
let allGoals = [];

// ====================== FIREBASE INITIALIZATION ======================
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ====================== AUTHENTICATION ======================
auth.onAuthStateChanged((user) => {
  // Hide loader after auth check
  authLoader.style.display = 'none';
  currentUser = user;
  if (user) {
    loginSection.classList.add('hidden');
    dashboard.classList.remove('hidden');
    loadUserData(user.uid);
  } else {
    // Redirect to login page if not authenticated
    if (window.location.pathname !== '/login.html' && window.location.pathname !== 'login.html') {
      // If you have a separate login.html, redirect to it
      // window.location.href = 'login.html';
      // Otherwise, show login section (single page)
      loginSection.classList.remove('hidden');
      dashboard.classList.add('hidden');
      resetAllForms();
    }
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    loginLoader.style.display = 'block';
    loginError.textContent = '';
    await auth.signInWithEmailAndPassword(email, password);
  } catch (error) {
    loginError.textContent = getFriendlyAuthError(error.code);
  } finally {
    loginLoader.style.display = 'none';
  }
});

logoutBtn.addEventListener('click', () => auth.signOut());

// ====================== FIRESTORE OPERATIONS ======================
function loadUserData(userId) {
  // Prevent Firestore calls if userId is not set
  if (!userId) return;
  // Incomes with error handling
  db.collection(`users/${userId}/incomes`)
    .orderBy('date', 'desc')
    .onSnapshot(
      (snapshot) => {
        allIncomes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateIncomeTable(allIncomes);
        updateSummary();
      },
      (error) => showDataError("income", error)
    );

  // Expenses
  db.collection(`users/${userId}/expenses`)
    .orderBy('date', 'desc')
    .onSnapshot(
      (snapshot) => {
        allExpenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateExpenseTable(allExpenses);
        updateSummary();
      },
      (error) => showDataError("expense", error)
    );

  // Goals
  db.collection(`users/${userId}/goals`)
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      (snapshot) => {
        allGoals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateGoalsTable(allGoals);
      },
      (error) => showDataError("goal", error)
    );
}

// ====================== FORM HANDLERS ======================
incomeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const incomeData = {
    description: document.getElementById('income-description').value.trim(),
    amount: document.getElementById('income-amount').value,
    date: document.getElementById('income-date').value
  };

  if (!validateTransaction(incomeData, 'income')) return;

  try {
    await db.collection(`users/${currentUser.uid}/incomes`).add({
      ...incomeData,
      amount: parseFloat(incomeData.amount),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    incomeForm.reset();
    showToast('Income added successfully!');
  } catch (error) {
    showToast('Error adding income: ' + error.message, 'error');
  }
});

expenseForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const expenseData = {
    description: document.getElementById('expense-description').value.trim(),
    amount: document.getElementById('expense-amount').value,
    category: document.getElementById('expense-category').value,
    date: document.getElementById('expense-date').value
  };

  if (!validateTransaction(expenseData, 'expense')) return;

  try {
    await db.collection(`users/${currentUser.uid}/expenses`).add({
      ...expenseData,
      amount: parseFloat(expenseData.amount),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    expenseForm.reset();
    showToast('Expense added successfully!');
  } catch (error) {
    showToast('Error adding expense: ' + error.message, 'error');
  }
});

goalForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const goalData = {
    name: document.getElementById('goal-name').value.trim(),
    targetAmount: document.getElementById('goal-target').value
  };

  if (!validateGoal(goalData)) return;

  try {
    await db.collection(`users/${currentUser.uid}/goals`).add({
      ...goalData,
      targetAmount: parseFloat(goalData.targetAmount),
      currentAmount: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    goalForm.reset();
    showToast('Goal set successfully!');
  } catch (error) {
    showToast('Error setting goal: ' + error.message, 'error');
  }
});

// ====================== VALIDATION HELPERS ======================
function validateTransaction(data, type) {
  if (!data.description) {
    showToast(`Please enter a ${type} description`, 'error');
    return false;
  }
  if (isNaN(data.amount) || data.amount <= 0) {
    showToast('Amount must be a positive number', 'error');
    return false;
  }
  if (!data.date) {
    showToast('Please select a date', 'error');
    return false;
  }
  if (type === 'expense' && !data.category) {
    showToast('Please select a category', 'error');
    return false;
  }
  return true;
}

function validateGoal(data) {
  if (!data.name) {
    showToast('Please enter a goal name', 'error');
    return false;
  }
  if (isNaN(data.targetAmount) || data.targetAmount <= 0) {
    showToast('Target amount must be a positive number', 'error');
    return false;
  }
  return true;
}

// ====================== UI UPDATES ======================
function updateIncomeTable(incomes) {
  const tableBody = document.querySelector('#income-table tbody');
  tableBody.innerHTML = incomes.map(income => `
    <tr>
      <td>${income.description}</td>
      <td>$${income.amount.toFixed(2)}</td>
      <td>${formatDate(income.date)}</td>
      <td><button data-type="income" data-id="${income.id}" class="delete-btn">Delete</button></td>
    </tr>
  `).join('');

  // Update Chart.js pie chart with latest incomes
  if (typeof updateIncomeChart === 'function') {
    updateIncomeChart(incomes);
  }
}

function updateExpenseTable(expenses) {
  const tableBody = document.querySelector('#expense-table tbody');
  tableBody.innerHTML = expenses.map(expense => `
    <tr>
      <td>${expense.description}</td>
      <td>$${expense.amount.toFixed(2)}</td>
      <td>${expense.category}</td>
      <td>${formatDate(expense.date)}</td>
      <td><button data-type="expense" data-id="${expense.id}" class="delete-btn">Delete</button></td>
    </tr>
  `).join('');

  // Update Chart.js pie chart with latest expenses
  if (typeof updateSpendingChart === 'function') {
    updateSpendingChart(expenses);
  }
}

function updateGoalsTable(goals) {
  const tableBody = document.querySelector('#goals-table tbody');
  tableBody.innerHTML = goals.map(goal => `
    <tr>
      <td>${goal.name}</td>
      <td>$${goal.targetAmount.toFixed(2)}</td>
      <td>
        <div class="progress-container">
          <div class="progress-bar" style="width: ${Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)}%"></div>
        </div>
        ${((goal.currentAmount / goal.targetAmount) * 100).toFixed(0)}%
      </td>
      <td><button data-type="goal" data-id="${goal.id}" class="delete-btn">Delete</button></td>
    </tr>
  `).join('');
}

function updateSummary() {
  const totalIncome = allIncomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpense = allExpenses.reduce((sum, e) => sum + e.amount, 0);
  const balance = totalIncome - totalExpense;
  
  document.getElementById('total-income').textContent = `$${totalIncome.toFixed(2)}`;
  document.getElementById('total-expenses').textContent = `$${totalExpense.toFixed(2)}`;
  
  const balanceElement = document.getElementById('total-balance');
  balanceElement.textContent = `$${Math.abs(balance).toFixed(2)}`;
  balanceElement.style.color = balance >= 0 ? '#2ecc71' : '#e74c3c';
}

// ====================== UTILITY FUNCTIONS ======================
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString();
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.remove(), 3000);
}

function getFriendlyAuthError(code) {
  const errors = {
    'auth/invalid-email': 'Invalid email address',
    'auth/user-disabled': 'Account disabled',
    'auth/user-not-found': 'Account not found',
    'auth/wrong-password': 'Incorrect password',
    'auth/too-many-requests': 'Too many attempts. Try again later'
  };
  return errors[code] || 'Login failed. Please try again.';
}

function resetAllForms() {
  incomeForm.reset();
  expenseForm.reset();
  goalForm.reset();
}

function showDataError(type, error) {
  console.error(`Error loading ${type} data:`, error);
  showToast(`Failed to load ${type} data`, 'error');
}

// ====================== EVENT DELEGATION ======================
document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('delete-btn')) {
    const type = e.target.getAttribute('data-type');
    const id = e.target.getAttribute('data-id');
    
    try {
      await db.collection(`users/${currentUser.uid}/${type}s`).doc(id).delete();
      showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted`);
    } catch (error) {
      showToast(`Error deleting ${type}: ${error.message}`, 'error');
    }
  }
});