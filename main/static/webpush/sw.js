self.addEventListener("push", function(event) {

    let data = {};

    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const title = data.title || "Новое уведомление";

    const options = {
        body: data.body || "",
        icon: data.icon || "/static/icons/subscription.png",
        badge: data.icon || "/static/icons/subscription.png",
        data: {
            url: data.url || "/"
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );

});


self.addEventListener("notificationclick", function(event) {

    event.notification.close();

    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );

});