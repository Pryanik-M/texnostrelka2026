self.addEventListener("push", function(event) {
    if (!event.data) return;

    let data;
    try {
        // Пробуем прочитать как объект
        data = event.data.json();
    } catch (e) {
        // Если пришла строка, пробуем превратить её в объект вручную
        try {
            data = JSON.parse(event.data.text());
        } catch (e2) {
            data = { title: "Новое письмо", body: event.data.text() };
        }
    }

    const options = {
        body: data.body || "У вас новое уведомление",
        icon: data.icon || "/static/icons/subscription.png",
        actions: data.actions || [],
        data: {
            candidate_id: data.candidate_id
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title || "Внимание", options)
    );
});




self.addEventListener("notificationclick", function(event) {

    event.notification.close();

    const data = event.notification.data || {};
    const candidate_id = data.candidate_id;

    if (event.action === "add") {

        clients.openWindow("/subscriptions/add/?candidate=" + candidate_id);

    } else if (event.action === "ignore") {

        clients.openWindow("/subscriptions/ignore/" + candidate_id + "/");

    } else {

        clients.openWindow("/subscriptions/detected/");
    }

});