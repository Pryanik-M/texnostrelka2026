package com.example.ts

import android.app.DatePickerDialog
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import java.util.*

class AddSubscriptionActivity : AppCompatActivity() {

    private lateinit var tilName: TextInputLayout
    private lateinit var tilPrice: TextInputLayout
    private lateinit var tilCurrency: TextInputLayout
    private lateinit var tilStartDate: TextInputLayout
    private lateinit var tilNextPayment: TextInputLayout
    
    private lateinit var etName: TextInputEditText
    private lateinit var etPrice: TextInputEditText
    private lateinit var etCurrency: TextInputEditText
    private lateinit var spinnerCategory: Spinner
    private lateinit var etDescription: TextInputEditText
    private lateinit var spinnerPeriod: Spinner
    private lateinit var etStartDate: TextInputEditText
    private lateinit var etNextPayment: TextInputEditText
    private lateinit var spinnerStatus: Spinner
    private lateinit var etUrl: TextInputEditText
    private lateinit var etNotes: TextInputEditText
    private lateinit var btnSave: Button

    private var subId: Int = -1
    private var categories: List<Category> = emptyList()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_add_subscription)

        initViews()
        setupTextWatchers()

        subId = intent.getIntExtra("SUB_ID", -1)
        val authToken = getSharedPreferences("app_prefs", MODE_PRIVATE).getString("auth_token", "") ?: ""

        loadCategories(authToken) {
            if (subId != -1) {
                findViewById<TextView>(R.id.tv_title).text = "Редактировать подписку"
                loadSubscriptionData(authToken, subId)
            } else {
                val candidateService = intent.getStringExtra("CANDIDATE_SERVICE")
                if (candidateService != null) {
                    etName.setText(candidateService)
                }
                val today = String.format(Locale.US, "%04d-%02d-%02d", 
                    Calendar.getInstance().get(Calendar.YEAR),
                    Calendar.getInstance().get(Calendar.MONTH) + 1,
                    Calendar.getInstance().get(Calendar.DAY_OF_MONTH))
                etStartDate.setText(today)
                etNextPayment.setText(today)
            }
        }

        etStartDate.setOnClickListener { showDatePicker(etStartDate) }
        etNextPayment.setOnClickListener { showDatePicker(etNextPayment) }

        btnSave.setOnClickListener {
            if (validateInputs()) {
                saveSubscription(authToken)
            }
        }
    }

    private fun initViews() {
        tilName = findViewById(R.id.til_name)
        tilPrice = findViewById(R.id.til_price)
        tilCurrency = findViewById(R.id.til_currency)
        tilStartDate = findViewById(R.id.til_start_date)
        tilNextPayment = findViewById(R.id.til_next_payment)

        etName = findViewById(R.id.et_name)
        etPrice = findViewById(R.id.et_price)
        etCurrency = findViewById(R.id.et_currency)
        spinnerCategory = findViewById(R.id.spinner_category)
        etDescription = findViewById(R.id.et_description)
        spinnerPeriod = findViewById(R.id.spinner_period)
        etStartDate = findViewById(R.id.et_start_date)
        etNextPayment = findViewById(R.id.et_next_payment)
        spinnerStatus = findViewById(R.id.spinner_status)
        etUrl = findViewById(R.id.et_url)
        etNotes = findViewById(R.id.et_notes)
        btnSave = findViewById(R.id.btn_save)
    }

    private fun setupTextWatchers() {
        val watcher = object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                tilName.error = null
                tilPrice.error = null
                tilCurrency.error = null
                tilStartDate.error = null
                tilNextPayment.error = null
            }
            override fun afterTextChanged(s: Editable?) {}
        }
        etName.addTextChangedListener(watcher)
        etPrice.addTextChangedListener(watcher)
        etCurrency.addTextChangedListener(watcher)
    }

    private fun validateInputs(): Boolean {
        var isValid = true
        if (etName.text.toString().trim().isEmpty()) {
            tilName.error = "Введите название"
            isValid = false
        }
        val priceStr = etPrice.text.toString().trim()
        if (priceStr.isEmpty()) {
            tilPrice.error = "Введите цену"
            isValid = false
        } else if (priceStr.toDoubleOrNull() == null) {
            tilPrice.error = "Некорректное число"
            isValid = false
        }
        if (etCurrency.text.toString().trim().isEmpty()) {
            tilCurrency.error = "Введите валюту"
            isValid = false
        }
        if (etStartDate.text.toString().isEmpty()) {
            tilStartDate.error = "Выберите дату"
            isValid = false
        }
        if (etNextPayment.text.toString().isEmpty()) {
            tilNextPayment.error = "Выберите дату"
            isValid = false
        }
        return isValid
    }

    private fun loadCategories(token: String, onLoaded: () -> Unit) {
        NetworkClient.apiService.getCategories("Bearer $token").enqueue(object : Callback<List<Category>> {
            override fun onResponse(call: Call<List<Category>>, response: Response<List<Category>>) {
                if (response.isSuccessful) {
                    categories = response.body() ?: emptyList()
                    val names = categories.map { it.name }.toMutableList()
                    names.add(0, "Без категории")
                    val adapter = ArrayAdapter(this@AddSubscriptionActivity, android.R.layout.simple_spinner_item, names)
                    adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
                    spinnerCategory.adapter = adapter
                }
                onLoaded()
            }
            override fun onFailure(call: Call<List<Category>>, t: Throwable) {
                onLoaded()
            }
        })
    }

    private fun showDatePicker(editText: TextInputEditText) {
        val c = Calendar.getInstance()
        val currentStr = editText.text.toString()
        if (currentStr.isNotEmpty()) {
            val parts = currentStr.split("-")
            if (parts.size == 3) {
                try {
                    c.set(Calendar.YEAR, parts[0].toInt())
                    c.set(Calendar.MONTH, parts[1].toInt() - 1)
                    c.set(Calendar.DAY_OF_MONTH, parts[2].toInt())
                } catch (e: Exception) {}
            }
        }

        DatePickerDialog(this, { _, year, month, day ->
            val date = String.format(Locale.US, "%04d-%02d-%02d", year, month + 1, day)
            editText.setText(date)
        }, c.get(Calendar.YEAR), c.get(Calendar.MONTH), c.get(Calendar.DAY_OF_MONTH)).show()
    }

    private fun loadSubscriptionData(token: String, id: Int) {
        NetworkClient.apiService.getSubscriptionDetail("Bearer $token", id).enqueue(object : Callback<Subscription> {
            override fun onResponse(call: Call<Subscription>, response: Response<Subscription>) {
                if (response.isSuccessful) {
                    response.body()?.let { sub ->
                        etName.setText(sub.name)
                        etPrice.setText(sub.price)
                        etCurrency.setText(sub.currency)
                        etDescription.setText(sub.description)
                        etUrl.setText(sub.serviceUrl)
                        etStartDate.setText(sub.startDate)
                        etNextPayment.setText(sub.nextPaymentDate)
                        etNotes.setText(sub.notes)
                        
                        val periods = resources.getStringArray(R.array.billing_periods)
                        val pIndex = periods.indexOf(sub.billingPeriod)
                        if (pIndex >= 0) spinnerPeriod.setSelection(pIndex)

                        val statuses = resources.getStringArray(R.array.subscription_statuses)
                        val sIndex = statuses.indexOf(sub.status)
                        if (sIndex >= 0) spinnerStatus.setSelection(sIndex)

                        sub.category?.let { catId ->
                            val cIndex = categories.indexOfFirst { it.id == catId }
                            if (cIndex >= 0) spinnerCategory.setSelection(cIndex + 1)
                        }
                    }
                }
            }
            override fun onFailure(call: Call<Subscription>, t: Throwable) {}
        })
    }

    private fun saveSubscription(token: String) {
        val name = etName.text.toString().trim()
        val price = etPrice.text.toString().trim().toDouble()

        val categoryId = if (spinnerCategory.selectedItemPosition > 0) {
            categories[spinnerCategory.selectedItemPosition - 1].id
        } else null

        if (subId == -1) {
            val request = CreateSubscriptionRequest(
                name = name,
                category = categoryId,
                description = etDescription.text.toString(),
                price = price,
                currency = etCurrency.text.toString(),
                billingPeriod = spinnerPeriod.selectedItem.toString(),
                startDate = etStartDate.text.toString(),
                nextPaymentDate = etNextPayment.text.toString(),
                status = spinnerStatus.selectedItem.toString(),
                serviceUrl = etUrl.text.toString(),
                notes = etNotes.text.toString()
            )
            NetworkClient.apiService.createSubscription("Bearer $token", request).enqueue(object : Callback<CreateSubscriptionResponse> {
                override fun onResponse(call: Call<CreateSubscriptionResponse>, response: Response<CreateSubscriptionResponse>) {
                    if (response.isSuccessful) {
                        Toast.makeText(this@AddSubscriptionActivity, "Сохранено", Toast.LENGTH_SHORT).show()
                        finish()
                    } else {
                        Toast.makeText(this@AddSubscriptionActivity, "Ошибка сервера", Toast.LENGTH_SHORT).show()
                    }
                }
                override fun onFailure(call: Call<CreateSubscriptionResponse>, t: Throwable) {
                    Toast.makeText(this@AddSubscriptionActivity, "Ошибка сети", Toast.LENGTH_SHORT).show()
                }
            })
        } else {
            val request = UpdateSubscriptionRequest(
                name = name,
                category = categoryId,
                description = etDescription.text.toString(),
                price = price,
                currency = etCurrency.text.toString(),
                billingPeriod = spinnerPeriod.selectedItem.toString(),
                startDate = etStartDate.text.toString(),
                nextPaymentDate = etNextPayment.text.toString(),
                status = spinnerStatus.selectedItem.toString(),
                serviceUrl = etUrl.text.toString(),
                notes = etNotes.text.toString()
            )
            NetworkClient.apiService.updateSubscription("Bearer $token", subId, request).enqueue(object : Callback<Subscription> {
                override fun onResponse(call: Call<Subscription>, response: Response<Subscription>) {
                    if (response.isSuccessful) {
                        Toast.makeText(this@AddSubscriptionActivity, "Обновлено", Toast.LENGTH_SHORT).show()
                        finish()
                    } else {
                        Toast.makeText(this@AddSubscriptionActivity, "Ошибка сервера", Toast.LENGTH_SHORT).show()
                    }
                }
                override fun onFailure(call: Call<Subscription>, t: Throwable) {
                    Toast.makeText(this@AddSubscriptionActivity, "Ошибка сети", Toast.LENGTH_SHORT).show()
                }
            })
        }
    }
}
