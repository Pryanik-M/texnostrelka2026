package com.example.ts

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.util.Patterns
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class RegisterActivity : AppCompatActivity() {

    private lateinit var emailLayout: TextInputLayout
    private lateinit var usernameLayout: TextInputLayout
    private lateinit var passwordLayout: TextInputLayout
    private lateinit var confirmPasswordLayout: TextInputLayout
    private lateinit var emailEditText: TextInputEditText
    private lateinit var usernameEditText: TextInputEditText
    private lateinit var passwordEditText: TextInputEditText
    private lateinit var confirmPasswordEditText: TextInputEditText

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register)

        emailLayout = findViewById(R.id.emailLayout)
        usernameLayout = findViewById(R.id.usernameLayout)
        passwordLayout = findViewById(R.id.passwordLayout)
        confirmPasswordLayout = findViewById(R.id.confirmPasswordLayout)

        emailEditText = findViewById(R.id.emailEditText)
        usernameEditText = findViewById(R.id.usernameEditText)
        passwordEditText = findViewById(R.id.passwordEditText)
        confirmPasswordEditText = findViewById(R.id.confirmPasswordEditText)
        val registerButton = findViewById<Button>(R.id.registerButton)

        setupTextWatchers()

        registerButton.setOnClickListener {
            if (validateInputs()) {
                val email = emailEditText.text.toString().trim()
                val username = usernameEditText.text.toString().trim()
                val password = passwordEditText.text.toString().trim()
                val confirm = confirmPasswordEditText.text.toString().trim()
                performRegister(email, username, password, confirm)
            }
        }
    }

    private fun setupTextWatchers() {
        val layouts = listOf(emailLayout, usernameLayout, passwordLayout, confirmPasswordLayout)
        val edits = listOf(emailEditText, usernameEditText, passwordEditText, confirmPasswordEditText)

        edits.forEachIndexed { index, editText ->
            editText.addTextChangedListener(object : TextWatcher {
                override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
                override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                    layouts[index].error = null
                }
                override fun afterTextChanged(s: Editable?) {}
            })
        }
    }

    private fun validateInputs(): Boolean {
        var isValid = true

        val email = emailEditText.text.toString().trim()
        val username = usernameEditText.text.toString().trim()
        val password = passwordEditText.text.toString().trim()
        val confirm = confirmPasswordEditText.text.toString().trim()

        if (email.isEmpty()) {
            emailLayout.error = "Введите email"
            isValid = false
        } else if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            emailLayout.error = "Некорректный формат email"
            isValid = false
        }

        if (username.isEmpty()) {
            usernameLayout.error = "Введите имя пользователя"
            isValid = false
        } else if (username.length < 3) {
            usernameLayout.error = "Минимум 3 символа"
            isValid = false
        }

        if (password.isEmpty()) {
            passwordLayout.error = "Введите пароль"
            isValid = false
        } else if (password.length < 8) {
            passwordLayout.error = "Минимум 8 символов"
            isValid = false
        } else if (!password.any { it.isLetter() }) {
            passwordLayout.error = "Нужна хотя бы одна буква"
            isValid = false
        }

        if (confirm.isEmpty()) {
            confirmPasswordLayout.error = "Подтвердите пароль"
            isValid = false
        } else if (password != confirm) {
            confirmPasswordLayout.error = "Пароли не совпадают"
            isValid = false
        }

        return isValid
    }

    private fun performRegister(email: String, username: String, pass: String, confirm: String) {
        val request = RegisterRequest(email, username, pass, confirm)
        NetworkClient.apiService.register(request).enqueue(object : Callback<RegisterResponse> {
            override fun onResponse(call: Call<RegisterResponse>, response: Response<RegisterResponse>) {
                if (response.isSuccessful) {
                    Toast.makeText(this@RegisterActivity, "Код отправлен на почту", Toast.LENGTH_SHORT).show()
                    showVerifyDialog(email)
                } else {
                    val errorMsg = ErrorUtils.parseError(response)
                    Toast.makeText(this@RegisterActivity, errorMsg, Toast.LENGTH_LONG).show()
                }
            }

            override fun onFailure(call: Call<RegisterResponse>, t: Throwable) {
                Toast.makeText(this@RegisterActivity, "Ошибка сети", Toast.LENGTH_SHORT).show()
            }
        })
    }

    private fun showVerifyDialog(email: String) {
        val inputLayout = TextInputLayout(this).apply {
            hint = "Код из письма"
            setPadding(40, 20, 40, 0)
        }
        val input = EditText(this)
        inputLayout.addView(input)

        val dialog = AlertDialog.Builder(this)
            .setTitle("Подтверждение")
            .setMessage("Введите код, отправленный на $email")
            .setView(inputLayout)
            .setCancelable(false)
            .setPositiveButton("ОК", null)
            .setNegativeButton("Отмена") { d, _ -> d.dismiss() }
            .create()

        dialog.setOnShowListener {
            val button = dialog.getButton(AlertDialog.BUTTON_POSITIVE)
            button.setOnClickListener {
                val code = input.text.toString().trim()
                if (code.isEmpty()) {
                    inputLayout.error = "Введите код"
                } else {
                    verifyCode(code)
                    dialog.dismiss()
                }
            }
        }
        dialog.show()
    }

    private fun verifyCode(code: String) {
        val request = VerifyRequest(code)
        NetworkClient.apiService.verify(request).enqueue(object : Callback<VerifyResponse> {
            override fun onResponse(call: Call<VerifyResponse>, response: Response<VerifyResponse>) {
                if (response.isSuccessful) {
                    val token = response.body()?.access
                    if (token != null) {
                        saveTokenAndGoHome(token)
                    } else {
                        Toast.makeText(this@RegisterActivity, "Успешно!", Toast.LENGTH_LONG).show()
                        finish()
                    }
                } else {
                    val errorMsg = ErrorUtils.parseError(response)
                    Toast.makeText(this@RegisterActivity, errorMsg, Toast.LENGTH_LONG).show()
                }
            }

            override fun onFailure(call: Call<VerifyResponse>, t: Throwable) {
                Toast.makeText(this@RegisterActivity, "Ошибка сети", Toast.LENGTH_SHORT).show()
            }
        })
    }

    private fun saveTokenAndGoHome(token: String) {
        val sharedPref = getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
        sharedPref.edit().putString("auth_token", token).apply()
        
        val intent = Intent(this, HomeActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
}
