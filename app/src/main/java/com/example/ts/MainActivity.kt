package com.example.ts

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.InputType
import android.text.TextWatcher
import android.util.Log
import android.util.Patterns
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout
import com.google.firebase.messaging.FirebaseMessaging
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class MainActivity : AppCompatActivity() {

    private lateinit var emailLayout: TextInputLayout
    private lateinit var passwordLayout: TextInputLayout
    private lateinit var emailEditText: TextInputEditText
    private lateinit var passwordEditText: TextInputEditText

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val sharedPref = getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
        val savedToken = sharedPref.getString("auth_token", null)
        if (savedToken != null) {
            goToHome()
            return
        }

        setContentView(R.layout.activity_main)

        emailLayout = findViewById(R.id.emailLayout)
        passwordLayout = findViewById(R.id.passwordLayout)
        emailEditText = findViewById(R.id.emailEditText)
        passwordEditText = findViewById(R.id.passwordEditText)
        val loginButton = findViewById<Button>(R.id.loginButton)
        val registerButton = findViewById<Button>(R.id.registerButton)
        val forgotPasswordButton = findViewById<Button>(R.id.forgotPasswordButton)

        setupTextWatchers()

        loginButton.setOnClickListener {
            if (validateInputs()) {
                val email = emailEditText.text.toString().trim()
                val password = passwordEditText.text.toString().trim()
                performLogin(email, password)
            }
        }

        registerButton.setOnClickListener {
            val intent = Intent(this, RegisterActivity::class.java)
            startActivity(intent)
        }

        forgotPasswordButton.setOnClickListener {
            showForgotPasswordEmailDialog()
        }
    }

    private fun setupTextWatchers() {
        emailEditText.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                emailLayout.error = null
            }
            override fun afterTextChanged(s: Editable?) {}
        })

        passwordEditText.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                passwordLayout.error = null
            }
            override fun afterTextChanged(s: Editable?) {}
        })
    }

    private fun validateInputs(): Boolean {
        var isValid = true
        val email = emailEditText.text.toString().trim()
        val password = passwordEditText.text.toString().trim()

        if (email.isEmpty()) {
            emailLayout.error = "Введите email"
            isValid = false
        } else if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            emailLayout.error = "Некорректный формат email"
            isValid = false
        }

        if (password.isEmpty()) {
            passwordLayout.error = "Введите пароль"
            isValid = false
        } else if (password.length < 8) {
            passwordLayout.error = "Пароль должен быть не менее 8 символов"
            isValid = false
        } else if (!password.any { it.isLetter() }) {
            passwordLayout.error = "Пароль должен содержать хотя бы одну букву"
            isValid = false
        }

        return isValid
    }

    private fun showForgotPasswordEmailDialog() {
        val emailInputLayout = TextInputLayout(this).apply {
            hint = "Email"
            setPadding(40, 20, 40, 0)
        }
        val input = EditText(this).apply {
            inputType = InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS
        }
        emailInputLayout.addView(input)

        val dialog = AlertDialog.Builder(this)
            .setTitle("Восстановление пароля")
            .setMessage("Введите ваш email")
            .setView(emailInputLayout)
            .setPositiveButton("Отправить код", null)
            .setNegativeButton("Отмена", null)
            .create()

        dialog.setOnShowListener {
            val button = dialog.getButton(AlertDialog.BUTTON_POSITIVE)
            button.setOnClickListener {
                val email = input.text.toString().trim()
                if (email.isEmpty()) {
                    emailInputLayout.error = "Введите email"
                } else if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
                    emailInputLayout.error = "Некорректный email"
                } else {
                    sendResetCode(email)
                    dialog.dismiss()
                }
            }
        }
        dialog.show()
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
        val inputLayout = TextInputLayout(this).apply {
            hint = "Код подтверждения"
            setPadding(40, 20, 40, 0)
        }
        val input = EditText(this)
        inputLayout.addView(input)

        val dialog = AlertDialog.Builder(this)
            .setTitle("Подтверждение")
            .setMessage("Введите код из письма")
            .setView(inputLayout)
            .setPositiveButton("Проверить", null)
            .setNegativeButton("Отмена", null)
            .create()

        dialog.setOnShowListener {
            val button = dialog.getButton(AlertDialog.BUTTON_POSITIVE)
            button.setOnClickListener {
                val code = input.text.toString().trim()
                if (code.isEmpty()) {
                    inputLayout.error = "Введите код"
                } else {
                    verifyResetCode(code)
                    dialog.dismiss()
                }
            }
        }
        dialog.show()
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
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(50, 20, 50, 0)
        }

        val passLayout = TextInputLayout(this).apply { hint = "Новый пароль" }
        val passInput = EditText(this).apply {
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
        }
        passLayout.addView(passInput)

        val confirmLayout = TextInputLayout(this).apply { hint = "Повторите пароль" }
        val confirmInput = EditText(this).apply {
            inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
        }
        confirmLayout.addView(confirmInput)

        layout.addView(passLayout)
        layout.addView(confirmLayout)

        val dialog = AlertDialog.Builder(this)
            .setTitle("Новый пароль")
            .setView(layout)
            .setPositiveButton("Изменить", null)
            .setNegativeButton("Отмена", null)
            .create()

        dialog.setOnShowListener {
            val button = dialog.getButton(AlertDialog.BUTTON_POSITIVE)
            button.setOnClickListener {
                val pass = passInput.text.toString().trim()
                val confirm = confirmInput.text.toString().trim()

                var valid = true
                if (pass.length < 8) {
                    passLayout.error = "Минимум 8 символов"
                    valid = false
                } else if (!pass.any { it.isLetter() }) {
                    passLayout.error = "Нужна хотя бы одна буква"
                    valid = false
                }
                
                if (pass != confirm) {
                    confirmLayout.error = "Пароли не совпадают"
                    valid = false
                }

                if (valid) {
                    resetPassword(pass, confirm)
                    dialog.dismiss()
                }
            }
        }
        dialog.show()
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
                        
                        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
                            if (task.isSuccessful) {
                                val fcmToken = task.result
                                val tokenRequest = TokenRegistrationRequest(fcmToken)
                                NetworkClient.apiService.registerDevice("Bearer $authToken", tokenRequest)
                                    .enqueue(object : Callback<Void> {
                                        override fun onResponse(call: Call<Void>, response: Response<Void>) {
                                            goToHome()
                                        }
                                        override fun onFailure(call: Call<Void>, t: Throwable) {
                                            goToHome()
                                        }
                                    })
                            } else {
                                goToHome()
                            }
                        }
                        Toast.makeText(this@MainActivity, "Вход успешен", Toast.LENGTH_SHORT).show()
                    }
                } else {
                    val errorMsg = ErrorUtils.parseError(response)
                    emailLayout.error = errorMsg // Выводим ошибку от сервера в поле email
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
