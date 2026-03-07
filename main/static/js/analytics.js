document.addEventListener('DOMContentLoaded', function() {
    // Категории (Pie)
    new Chart(document.getElementById("categoryChart"), {
        type: "pie",
        data: {
            labels: window.categoryLabels,
            datasets: [{
                data: window.categoryCounts,
                backgroundColor: ["#ff6384", "#36a2eb", "#ffce56", "#4bc0c0", "#9966ff"]
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // Расходы (Bar)
    new Chart(document.getElementById("spendingChart"), {
        type: "bar",
        data: {
            labels: window.spendingLabels,
            datasets: [{
                label: "Расходы",
                data: window.spendingValues,
                backgroundColor: "#36a2eb"
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // Статусы (Doughnut)
    const statusLabels = window.statusStats.map(s => s.status);
    const statusCounts = window.statusStats.map(s => s.count);

    new Chart(document.getElementById("statusChart"), {
        type: "doughnut",
        data: {
            labels: statusLabels,
            datasets: [{
                data: statusCounts,
                backgroundColor: ["#4CAF50", "#FF9800", "#F44336"]
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // Линейный график по месяцам
    new Chart(document.getElementById("monthChart"), {
        type: "line",
        data: {
            labels: window.monthLabels,
            datasets: [{
                label: "Расходы по месяцам",
                data: window.monthValues,
                borderColor: "#4bc0c0",
                fill: false
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
});