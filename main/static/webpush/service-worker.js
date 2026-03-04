self.addEventListener("push", function(event) {

    let data = {};

    try {
        data = event.data.json();
    } catch (e) {
        data = {
            title: "Новое уведомление",
            body: event.data.text()
        };
    }

    const options = {
        body: data.body,
        icon: data.icon || "/static/icons/subscription.png",
        badge: data.icon || "/static/icons/subscription.png",
        data: {
            url: data.url || "/"
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );

});


self.addEventListener("notificationclick", function(event) {

    event.notification.close();

    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );

});