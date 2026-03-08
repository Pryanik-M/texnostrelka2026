document.addEventListener('DOMContentLoaded', function() {
    // 1. Календарь
    const calendarData = window.calendarData;
    const events = [];

    for (const date in calendarData) {
        calendarData[date].forEach(item => {
            events.push({
                title: item.name + " — " + item.price + " " + item.currency,
                start: date
            });
        });
    }

    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'ru',
        events: events,
        dateClick: function(info) {
            const date = info.dateStr;
            const list = document.getElementById("payments-list");
            const title = document.getElementById("selected-date");

            list.innerHTML = "";
            title.innerText = "Списания на " + date;

            if (calendarData[date]) {
                calendarData[date].forEach(item => {
                    const li = document.createElement("li");
                    li.innerText = item.name + " — " + item.price + " " + item.currency;
                    list.appendChild(li);
                });
            } else {
                const li = document.createElement("li");
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
                label: "Прогноз расходов",
                data: window.monthValues,
                borderColor: "#6C5CE7",
                backgroundColor: "rgba(108,92,231,0.1)",
                fill: true
            }]
        },
        options: { responsive: true }
    });
});