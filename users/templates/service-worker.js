self.addEventListener("push", function(event) {
    if (!event.data) return;
    let data = event.data.json();
    const options = {
        body: data.body,
        icon: data.icon || "/static/icons/subscription.png",
        actions: data.actions || [],
        data: {
            url: data.url, // Сохраняем URL из payload
            candidate_id: data.candidate_id
        }
    };
    event.waitUntil(
        self.registration.showNotification(data.title || "Внимание", options)
    );
});


self.addEventListener("notificationclick", function(event) {
    event.notification.close();
    const notificationData = event.notification.data || {};
    if (event.action === "add") {
        clients.openWindow("/subscriptions/add/?candidate=" + notificationData.candidate_id);
    } else if (event.action === "ignore") {
        clients.openWindow("/subscriptions/ignore/" + notificationData.candidate_id + "/");
    } else {
        // Если нажали на само уведомление (или это напоминание)
        const targetUrl = notificationData.url || "/subscriptions/detected/";
        clients.openWindow(targetUrl);
    }
});