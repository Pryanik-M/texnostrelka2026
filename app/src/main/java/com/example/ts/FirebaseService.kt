package com.example.ts

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class FirebaseService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d("FCM", "TOKEN: $token")
        sendTokenToServer(token)
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        
        Log.d("FCM", "Received message from: ${message.from}")

        // 1. Проверяем наличие 'notification' (обычно для тестов из консоли)
        var title = message.notification?.title
        var body = message.notification?.body

        // 2. Проверяем наличие 'data' (Django Celery часто шлет именно сюда для надежности)
        if (title == null && message.data.isNotEmpty()) {
            title = message.data["title"]
            body = message.data["body"]
        }

        // Если нашли хоть какие-то данные, показываем уведомление
        if (title != null || body != null) {
            showNotification(title ?: "Уведомление", body ?: "")
        }
    }

    private fun sendTokenToServer(token: String) {
        val sharedPref = getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
        val authToken = sharedPref.getString("auth_token", null)
        
        if (authToken != null) {
            val request = TokenRegistrationRequest(token)
            NetworkClient.apiService.registerDevice("Bearer $authToken", request).enqueue(object : Callback<Void> {
                override fun onResponse(call: Call<Void>, response: Response<Void>) {
                    if (response.isSuccessful) {
                        Log.d("FCM", "Token successfully sent to server")
                    }
                }
                override fun onFailure(call: Call<Void>, t: Throwable) {
                    Log.e("FCM", "Network error while sending token")
                }
            })
        }
    }

    private fun showNotification(title: String, body: String) {
        val intent = Intent(this, MainActivity::class.java)
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
        val pendingIntent = PendingIntent.getActivity(this, 0, intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)

        val channelId = "default_channel"
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(channelId, "Default Channel", NotificationManager.IMPORTANCE_HIGH)
            notificationManager.createNotificationChannel(channel)
        }

        val notificationBuilder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_HIGH) // Важно для фоновых задач
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)

        notificationManager.notify(System.currentTimeMillis().toInt(), notificationBuilder.build())
    }
}
