package com.example.ts

import android.app.DatePickerDialog
import android.os.Bundle
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.textfield.TextInputEditText
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import java.util.*

class AddSubscriptionActivity : AppCompatActivity() {

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

        subId = intent.getIntExtra("SUB_ID", -1)
        val authToken = getSharedPreferences("app_prefs", MODE_PRIVATE).getString("auth_token", "") ?: ""

        // Fetch categories first, then load subscription data if editing
        loadCategories(authToken) {
            if (subId != -1) {
                findViewById<TextView>(R.id.tv_title).text = "Edit Subscription"
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
            saveSubscription(authToken)
        }
    }

    private fun initViews() {
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

    private fun loadCategories(token: String, onLoaded: () -> Unit) {
        NetworkClient.apiService.getCategories("Bearer $token").enqueue(object : Callback<List<Category>> {
            override fun onResponse(call: Call<List<Category>>, response: Response<List<Category>>) {
                if (response.isSuccessful) {
                    categories = response.body() ?: emptyList()
                    val names = categories.map { it.name }.toMutableList()
                    names.add(0, "No Category")
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
        val name = etName.text.toString()
        val priceStr = etPrice.text.toString()
        if (name.isEmpty() || priceStr.isEmpty()) {
            Toast.makeText(this, "Name and Price are required", Toast.LENGTH_SHORT).show()
            return
        }
        val price = priceStr.toDoubleOrNull() ?: 0.0

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
                        Toast.makeText(this@AddSubscriptionActivity, "Created", Toast.LENGTH_SHORT).show()
                        finish()
                    } else {
                        Toast.makeText(this@AddSubscriptionActivity, "Error: ${response.code()}", Toast.LENGTH_SHORT).show()
                    }
                }
                override fun onFailure(call: Call<CreateSubscriptionResponse>, t: Throwable) {
                    Toast.makeText(this@AddSubscriptionActivity, "Failed: ${t.message}", Toast.LENGTH_SHORT).show()
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
                        Toast.makeText(this@AddSubscriptionActivity, "Updated", Toast.LENGTH_SHORT).show()
                        finish()
                    } else {
                        Toast.makeText(this@AddSubscriptionActivity, "Error: ${response.code()}", Toast.LENGTH_SHORT).show()
                    }
                }
                override fun onFailure(call: Call<Subscription>, t: Throwable) {
                    Toast.makeText(this@AddSubscriptionActivity, "Failed: ${t.message}", Toast.LENGTH_SHORT).show()
                }
            })
        }
    }
}
