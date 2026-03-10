package com.example.ts

import com.google.gson.Gson
import retrofit2.Response

object ErrorUtils {
    fun parseError(response: Response<*>): String {
        val errorBody = response.errorBody()?.string() ?: return "Неизвестная ошибка"
        return try {
            val gson = Gson()
            val errorResponse = gson.fromJson(errorBody, ErrorResponse::class.java)
            
            // 1. Поле 'error' (как в вашем login_api)
            if (!errorResponse.error.isNullOrEmpty()) return errorResponse.error
            
            // 2. Поле 'detail' (стандарт для DRF SimpleJWT)
            if (!errorResponse.detail.isNullOrEmpty()) return errorResponse.detail
            
            // 3. Словарь 'errors' (ваша RegistrationForm)
            if (!errorResponse.errors.isNullOrEmpty()) {
                val sb = StringBuilder()
                for ((field, messages) in errorResponse.errors) {
                    val fieldName = when(field) {
                        "email" -> "Email"
                        "username" -> "Имя пользователя"
                        "password" -> "Пароль"
                        "confirm_password" -> "Подтверждение пароля"
                        else -> field
                    }
                    val msgText = if (messages is List<*>) messages.joinToString(", ") else messages.toString()
                    sb.append("$fieldName: $msgText\n")
                }
                return sb.toString().trim()
            }
            
            errorBody
        } catch (e: Exception) {
            errorBody
        }
    }
}
