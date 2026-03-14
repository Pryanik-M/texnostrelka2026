document.addEventListener('DOMContentLoaded', function() {
    const calendarData = window.calendarData;
    const events = [];

    // Создаем события для календаря (только с маркером, без текста)
    for (const date in calendarData) {
        if (calendarData[date].length > 0) {
            events.push({
                start: date,
                display: 'background',
                color: '#9C3FFF',
                classNames: ['payment-marker']
            });
        }
    }

    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'ru',
        events: events,

        headerToolbar: {
            left: 'prev,next',
            center: 'title',
            right: ''
        },

        height: 'auto',
        contentHeight: 'auto',

        // Кастомный рендеринг ячеек для добавления маркера
        dayCellDidMount: function(info) {
            // Форматируем дату правильно с учетом часового пояса
            const year = info.date.getFullYear();
            const month = String(info.date.getMonth() + 1).padStart(2, '0');
            const day = String(info.date.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            if (calendarData[dateStr] && calendarData[dateStr].length > 0) {
                // Добавляем фиолетовый маркер
                const marker = document.createElement('div');
                marker.className = 'payment-dot';
                marker.style.backgroundColor = '#9C3FFF';
                info.el.appendChild(marker);
            }
        },

        dateClick: function(info) {
            const date = info.dateStr;
            const list = document.getElementById("payments-list");
            const title = document.getElementById("selected-date");

            list.innerHTML = "";
            title.innerText = "Списания на " + date;

            if (calendarData[date] && calendarData[date].length > 0) {
                calendarData[date].forEach(item => {
                    const li = document.createElement("li");
                    li.innerHTML = `
                        <span class="payment-name" title="${item.name}">${item.name}</span>
                        <span class="payment-price">${item.price} ${item.currency}</span>
                    `;
                    list.appendChild(li);
                });
            } else {
                const li = document.createElement("li");
                li.className = 'no-payments';
                li.innerText = "Списаний нет";
                list.appendChild(li);
            }
        }
    });

    calendar.render();

    // 2. График прогноза на год
    new Chart(document.getElementById("yearChart"), {
        type: "line",
        data: {
            labels: window.monthLabels,
            datasets: [{
                label: "Прогноз расходов по месяцам",
                data: window.monthValues,
                borderColor: "#9C3FFF",
                backgroundColor: "rgba(156, 63, 255, 0.25)",
                tension: 0.45,      // плавность линии (как в analytics)
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
                    },
                    beginAtZero: true
                }
            }
        }
    });
});