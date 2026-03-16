document.addEventListener('DOMContentLoaded', function() {
    new Chart(document.getElementById("categoryChart"), {
        type: "pie",
        data: {
            labels: window.categoryLabels,
            datasets: [{
                data: window.categoryCounts,
                backgroundColor: ["#9C3FFF", "#3FFFE9", "#FF3A9C", "#FFBB4E"]
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
            backgroundColor: "#9C3FFF",
            borderRadius: 6
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
            legend: {
                labels: {
                    color: "#555"
                }
            }
        },
        scales: {
            x: {
                grid: {
                    color: "rgba(0,0,0,0.05)"
                }
            },
            y: {
                grid: {
                    color: "rgba(0,0,0,0.05)"
                }
            }
        }
    }
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
                backgroundColor: ["#9C3FFF", "#3FFFE9", "#FF3A9C"]
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
            borderColor: "#9C3FFF",
            backgroundColor: "rgba(108,75,255,0.25)",
            tension: 0.45,      // плавность линии
            fill: true,         // закрашенная область
            pointRadius: 5,
            pointBackgroundColor: "#9C3FFF",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2
        }]
    },

    options: {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
            legend: {
                labels: {
                    color: "#555",
                    font: {
                        size: 14
                    }
                }
            }
        },

        scales: {
            x: {
                grid: {
                    color: "rgba(0,0,0,0.05)"
                }
            },
            y: {
                grid: {
                    color: "rgba(0,0,0,0.05)"
                }
            }
        }
    }
});
});

