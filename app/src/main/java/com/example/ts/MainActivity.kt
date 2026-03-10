package com.example.ts

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.text.InputType
import android.util.Log
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.textfield.TextInputEditText
import com.google.firebase.messaging.FirebaseMessaging
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val sharedPref = getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
        val savedToken = sharedPref.getString("auth_token", null)
        if (savedToken != null) {
            goToHome()
            return
        }

        setContentView(R.layout.activity_main)

        val emailEditText = findViewById<TextInputEditText>(R.id.emailEditText)
        val passwordEditText = findViewById<TextInputEditText>(R.id.passwordEditText)
        val loginButton = findViewById<Button>(R.id.loginButton)
        val registerButton = findViewById<Button>(R.id.registerButton)
        val forgotPasswordButton = findViewById<Button>(R.id.forgotPasswordButton)

        loginButton.setOnClickListener {
            val email = emailEditText.text.toString().trim()
            val password = passwordEditText.text.toString().trim()

            if (email.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Заполните все поля", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            performLogin(email, password)
        }

        registerButton.setOnClickListener {
            val intent = Intent(this, RegisterActivity::class.java)
            startActivity(intent)
        }

        forgotPasswordButton.setOnClickListener {
            showForgotPasswordEmailDialog()
        }
    }

    private fun showForgotPasswordEmailDialog() {
        val builder = AlertDialog.Builder(this)
        builder.setTitle("Восстановление пароля")
        builder.setMessage("Введите ваш email")

        val input = EditText(this)
        input.inputType = InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS
        builder.setView(input)

        builder.setPositiveButton("Отправить код") { _, _ ->
            val email = input.text.toString().trim()
            if (email.isNotEmpty()) {
                sendResetCode(email)
            }
        }
        builder.setNegativeButton("Отмена", null)
        builder.show()
    }

    private fun sendResetCode(email: String) {
        val request = ForgotPasswordRequest(email)
        NetworkClient.apiService.forgotPassword(request).enqueue(object : Callback<SimpleMessageResponse> {
            override fun onResponse(call: Call<SimpleMessageResponse>, response: Response<SimpleMessageResponse>) {
                if (response.isSuccessful) {
                    Toast.makeText(this@MainActivity, "Код отправлен на почту", Toast.LENGTH_SHORT).show()
                    showResetVerifyDialog()
                } else {
                    val errorMsg = ErrorUtils.parseError(response)
                    Toast.makeText(this@MainActivity, errorMsg, Toast.LENGTH_LONG).show()
                }
            }

            override fun onFailure(call: Call<SimpleMessageResponse>, t: Throwable) {
                Toast.makeText(this@MainActivity, "Ошибка сети", Toast.LENGTH_SHORT).show()
            }
        })
    }

    private fun showResetVerifyDialog() {
        val builder = AlertDialog.Builder(this)
        builder.setTitle("Подтверждение")
        builder.setMessage("Введите код из письма")

        val input = EditText(this)
        builder.setView(input)

        builder.setPositiveButton("Проверить") { _, _ ->
            val code = input.text.toString().trim()
            if (code.isNotEmpty()) {
                verifyResetCode(code)
            }
        }
        builder.setNegativeButton("Отмена", null)
        builder.show()
    }

    private fun verifyResetCode(code: String) {
        val request = ForgotVerifyRequest(code)
        NetworkClient.apiService.forgotVerify(request).enqueue(object : Callback<SimpleMessageResponse> {
            override fun onResponse(call: Call<SimpleMessageResponse>, response: Response<SimpleMessageResponse>) {
                if (response.isSuccessful) {
                    showNewPasswordDialog()
                } else {
                    val errorMsg = ErrorUtils.parseError(response)
                    Toast.makeText(this@MainActivity, errorMsg, Toast.LENGTH_LONG).show()
                }
            }

            override fun onFailure(call: Call<SimpleMessageResponse>, t: Throwable) {
                Toast.makeText(this@MainActivity, "Ошибка сети", Toast.LENGTH_SHORT).show()
            }
        })
    }

    private fun showNewPasswordDialog() {
        val builder = AlertDialog.Builder(this)
        builder.setTitle("Новый пароль")

        val layout = LinearLayout(this)
        layout.orientation = LinearLayout.VERTICAL
        layout.setPadding(50, 20, 50, 0)

        val passInput = EditText(this)
        passInput.hint = "Новый пароль"
        passInput.inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
        layout.addView(passInput)

        val confirmInput = EditText(this)
        confirmInput.hint = "Повторите пароль"
        confirmInput.inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
        layout.addView(confirmInput)

        builder.setView(layout)

        builder.setPositiveButton("Изменить") { _, _ ->
            val pass = passInput.text.toString().trim()
            val confirm = confirmInput.text.toString().trim()
            if (pass.isNotEmpty() && pass == confirm) {
                resetPassword(pass, confirm)
            } else {
                Toast.makeText(this, "Пароли не совпадают", Toast.LENGTH_SHORT).show()
            }
        }
        builder.setNegativeButton("Отмена", null)
        builder.show()
    }

    private fun resetPassword(pass: String, confirm: String) {
        val request = ResetPasswordRequest(pass, confirm)
        NetworkClient.apiService.resetPassword(request).enqueue(object : Callback<SimpleMessageResponse> {
            override fun onResponse(call: Call<SimpleMessageResponse>, response: Response<SimpleMessageResponse>) {
                if (response.isSuccessful) {
                    Toast.makeText(this@MainActivity, "Пароль успешно изменен", Toast.LENGTH_LONG).show()
                } else {
                    val errorMsg = ErrorUtils.parseError(response)
                    Toast.makeText(this@MainActivity, errorMsg, Toast.LENGTH_LONG).show()
                }
            }

            override fun onFailure(call: Call<SimpleMessageResponse>, t: Throwable) {
                Toast.makeText(this@MainActivity, "Ошибка сети", Toast.LENGTH_SHORT).show()
            }
        })
    }

    private fun performLogin(email: String, password: String) {
        val loginRequest = LoginRequest(email, password)
        NetworkClient.apiService.login(loginRequest).enqueue(object : Callback<LoginResponse> {
            override fun onResponse(call: Call<LoginResponse>, response: Response<LoginResponse>) {
                if (response.isSuccessful) {
                    val authToken = response.body()?.access
                    if (authToken != null) {
                        val sharedPref = getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
                        sharedPref.edit().putString("auth_token", authToken).apply()
                        
                        // Регистрируем устройство для пуш-уведомлений
                        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
                            if (task.isSuccessful) {
                                val fcmToken = task.result
                                val tokenRequest = TokenRegistrationRequest(fcmToken)
                                NetworkClient.apiService.registerDevice("Bearer $authToken", tokenRequest)
                                    .enqueue(object : Callback<Void> {
                                        override fun onResponse(call: Call<Void>, response: Response<Void>) {
                                            Log.d("FCM", "Device registered, response code: ${response.code()}")
                                            goToHome()
                                        }
                                        override fun onFailure(call: Call<Void>, t: Throwable) {
                                            Log.e("FCM", "Device register error", t)
                                            goToHome() // Все равно переходим, чтобы не блокировать вход
                                        }
                                    })
                            } else {
                                Log.e("FCM", "Fetching FCM registration token failed", task.exception)
                                goToHome()
                            }
                        }
                        
                        Toast.makeText(this@MainActivity, "Вход успешен", Toast.LENGTH_SHORT).show()
                    }
                } else {
                    val errorMsg = ErrorUtils.parseError(response)
                    Toast.makeText(this@MainActivity, errorMsg, Toast.LENGTH_LONG).show()
                }
            }

            override fun onFailure(call: Call<LoginResponse>, t: Throwable) {
                Toast.makeText(this@MainActivity, "Ошибка сети: ${t.message}", Toast.LENGTH_SHORT).show()
            }
        })
    }

    private fun goToHome() {
        val intent = Intent(this, HomeActivity::class.java)
        startActivity(intent)
        finish()
    }
}
