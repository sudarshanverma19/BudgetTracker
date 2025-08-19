

let spendingChart = null;
let incomeChart = null;

function updateSpendingChart(expenses) {
  const ctx = document.getElementById("spending-chart").getContext("2d");

  // Group expenses by category
  const categoryTotals = {};
  expenses.forEach(exp => {
    if (exp.category) {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    }
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  // Chart colors
  const backgroundColors = [
    'rgba(255, 99, 132, 0.6)',
    'rgba(54, 162, 235, 0.6)',
    'rgba(255, 206, 86, 0.6)',
    'rgba(75, 192, 192, 0.6)',
    'rgba(153, 102, 255, 0.6)',
    'rgba(255, 159, 64, 0.6)'
  ];

  // Destroy previous chart if exists
  if (spendingChart) {
    spendingChart.destroy();
  }

  spendingChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        label: 'Spending Breakdown',
        data: data,
        backgroundColor: backgroundColors.slice(0, labels.length),
        borderColor: backgroundColors.slice(0, labels.length).map(c => c.replace('0.6', '1')),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        title: { display: true, text: 'Spending by Category' }
      }
    }
  });
}

function updateIncomeChart(incomes) {
  const ctx = document.getElementById("income-chart").getContext("2d");

  // Group incomes by description (or you can use another field if you want)
  const incomeTotals = {};
  incomes.forEach(inc => {
    if (inc.description) {
      incomeTotals[inc.description] = (incomeTotals[inc.description] || 0) + inc.amount;
    }
  });

  const labels = Object.keys(incomeTotals);
  const data = Object.values(incomeTotals);

  // Chart colors
  const backgroundColors = [
    'rgba(75, 192, 192, 0.6)',
    'rgba(255, 206, 86, 0.6)',
    'rgba(54, 162, 235, 0.6)',
    'rgba(255, 99, 132, 0.6)',
    'rgba(153, 102, 255, 0.6)',
    'rgba(255, 159, 64, 0.6)'
  ];

  // Destroy previous chart if exists
  if (incomeChart) {
    incomeChart.destroy();
  }

  incomeChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        label: 'Income Breakdown',
        data: data,
        backgroundColor: backgroundColors.slice(0, labels.length),
        borderColor: backgroundColors.slice(0, labels.length).map(c => c.replace('0.6', '1')),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        title: { display: true, text: 'Income by Description' }
      }
    }
  });
}
