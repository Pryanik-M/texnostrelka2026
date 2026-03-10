package com.example.ts

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.textfield.TextInputEditText
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class RegisterActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register)

        val emailEditText = findViewById<TextInputEditText>(R.id.emailEditText)
        val usernameEditText = findViewById<TextInputEditText>(R.id.usernameEditText)
        val passwordEditText = findViewById<TextInputEditText>(R.id.passwordEditText)
        val confirmPasswordEditText = findViewById<TextInputEditText>(R.id.confirmPasswordEditText)
        val registerButton = findViewById<Button>(R.id.registerButton)

        registerButton.setOnClickListener {
            val email = emailEditText.text.toString().trim()
            val username = usernameEditText.text.toString().trim()
            val password = passwordEditText.text.toString().trim()
            val confirm = confirmPasswordEditText.text.toString().trim()

            if (email.isEmpty() || username.isEmpty() || password.isEmpty() || confirm.isEmpty()) {
                Toast.makeText(this, "Заполните все поля", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            if (password != confirm) {
                Toast.makeText(this, "Пароли не совпадают", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            performRegister(email, username, password, confirm)
        }
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
        val builder = AlertDialog.Builder(this)
        builder.setTitle("Подтверждение")
        builder.setMessage("Введите код, отправленный на $email")

        val input = EditText(this)
        builder.setView(input)

        builder.setPositiveButton("ОК") { _, _ ->
            val code = input.text.toString().trim()
            if (code.isNotEmpty()) {
                verifyCode(code)
            }
        }
        builder.setNegativeButton("Отмена", null)
        builder.show()
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
