package com.example.ts

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import android.widget.*
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.github.mikephil.charting.charts.LineChart
import com.github.mikephil.charting.charts.PieChart
import com.github.mikephil.charting.data.*
import com.google.android.material.appbar.MaterialToolbar
import com.google.android.material.bottomnavigation.BottomNavigationView
import com.google.android.material.floatingactionbutton.FloatingActionButton
import com.google.android.material.textfield.TextInputEditText
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import java.util.*

class HomeActivity : AppCompatActivity() {

    // Views
    private lateinit var viewProfile: View
    private lateinit var viewAnalytics: View
    private lateinit var viewForecast: View
    private lateinit var viewSubscriptions: View
    private lateinit var toolbar: MaterialToolbar

    // Profile Views
    private lateinit var profileInfoTextView: TextView
    private lateinit var connectEmailButton: Button
    private lateinit var testPushButton: Button
    private lateinit var btnSyncEmail: Button
    private lateinit var btnDisconnectEmail: Button
    private lateinit var btnViewCandidatesProfile: Button

    // Analytics Views
    private lateinit var tvMostExpensive: TextView
    private lateinit var pieChart: PieChart
    private lateinit var lineChart: LineChart

    // Forecast Views
    private lateinit var tvWeekTotal: TextView
    private lateinit var tvMonthForecast: TextView
    private lateinit var tvYearForecast: TextView
    private lateinit var calendarView: CalendarView
    private lateinit var tvSelectedDateInfo: TextView
    private lateinit var rvUpcoming: RecyclerView

    // Subscriptions Views
    private lateinit var rvSubscriptions: RecyclerView
    private lateinit var fabAddSubscription: FloatingActionButton
    private lateinit var btnViewCandidates: Button
    private lateinit var etSearch: TextInputEditText

    private var currentCalendarData: Map<String, List<CalendarEntry>>? = null

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (!isGranted) Toast.makeText(this, "Разрешение отклонено", Toast.LENGTH_SHORT).show()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_home)

        initViews()
        askNotificationPermission()

        val sharedPref = getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
        val token = sharedPref.getString("auth_token", null)

        if (token == null) {
            goToLogin()
            return
        }

        registerDeviceForPushes(token)

        findViewById<Button>(R.id.logoutButton).setOnClickListener {
            sharedPref.edit().remove("auth_token").apply()
            goToLogin()
        }

        // Listeners
        connectEmailButton.setOnClickListener { showConnectEmailDialog(token) }
        testPushButton.setOnClickListener { performTestPush(token) }
        btnSyncEmail.setOnClickListener { performEmailSync(token) }
        btnDisconnectEmail.setOnClickListener { performEmailDisconnect(token) }
        fabAddSubscription.setOnClickListener {
            val intent = Intent(this, AddSubscriptionActivity::class.java)
            startActivity(intent)
        }
        
        val goToCandidates = {
            startActivity(Intent(this, CandidatesActivity::class.java))
        }
        btnViewCandidates.setOnClickListener { goToCandidates() }
        btnViewCandidatesProfile.setOnClickListener { goToCandidates() }

        val bottomNavigation = findViewById<BottomNavigationView>(R.id.bottom_navigation)
        bottomNavigation.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_subscriptions -> { 
                    switchView(viewSubscriptions, "Подписки")
                    loadSubscriptions(token)
                    true 
                }
                R.id.nav_forecast -> { 
                    switchView(viewForecast, "Прогноз")
                    loadForecast(token)
                    true 
                }
                R.id.nav_analytics -> { 
                    switchView(viewAnalytics, "Аналитика")
                    loadAnalytics(token)
                    true 
                }
                R.id.nav_profile -> { 
                    switchView(viewProfile, "Профиль")
                    loadProfile(token)
                    true 
                }
                else -> false
            }
        }
        
        switchView(viewProfile, "Профиль")
        loadProfile(token)

        calendarView.setOnDateChangeListener { _, year, month, dayOfMonth ->
            val dateKey = String.format(Locale.US, "%04d-%02d-%02d", year, month + 1, dayOfMonth)
            showCalendarDetails(dateKey)
        }

        etSearch.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                loadSubscriptions(token)
            }
        })
    }

    override fun onResume() {
        super.onResume()
        val token = getSharedPreferences("app_prefs", Context.MODE_PRIVATE).getString("auth_token", null)
        if (token != null) {
            if (viewSubscriptions.visibility == View.VISIBLE) loadSubscriptions(token)
            if (viewProfile.visibility == View.VISIBLE) loadProfile(token)
            if (viewAnalytics.visibility == View.VISIBLE) loadAnalytics(token)
            if (viewForecast.visibility == View.VISIBLE) loadForecast(token)
        }
    }

    private fun initViews() {
        toolbar = findViewById(R.id.toolbar)
        setSupportActionBar(toolbar)

        viewProfile = findViewById(R.id.view_profile)
        viewAnalytics = findViewById(R.id.view_analytics)
        viewForecast = findViewById(R.id.view_forecast)
        viewSubscriptions = findViewById(R.id.view_subscriptions)

        profileInfoTextView = findViewById(R.id.profileInfoTextView)
        connectEmailButton = findViewById(R.id.connectEmailButton)
        testPushButton = findViewById(R.id.testPushButton)
        btnSyncEmail = findViewById(R.id.btn_sync_email)
        btnDisconnectEmail = findViewById(R.id.btn_disconnect_email)
        btnViewCandidatesProfile = findViewById(R.id.btn_view_candidates_profile)

        tvMostExpensive = findViewById(R.id.tv_most_expensive)
        pieChart = findViewById(R.id.pieChart)
        lineChart = findViewById(R.id.lineChart)

        tvWeekTotal = findViewById(R.id.tv_week_total)
        tvMonthForecast = findViewById(R.id.tv_month_forecast)
        tvYearForecast = findViewById(R.id.tv_year_forecast)
        calendarView = findViewById(R.id.calendarView)
        tvSelectedDateInfo = findViewById(R.id.tv_selected_date_info)
        rvUpcoming = findViewById(R.id.rv_upcoming)
        rvUpcoming.layoutManager = LinearLayoutManager(this)

        rvSubscriptions = findViewById(R.id.rv_subscriptions)
        rvSubscriptions.layoutManager = LinearLayoutManager(this)
        fabAddSubscription = findViewById(R.id.fab_add_subscription)
        btnViewCandidates = findViewById(R.id.btn_view_candidates)
        etSearch = findViewById(R.id.et_search)
    }

    private fun switchView(view: View, title: String) {
        viewProfile.visibility = View.GONE
        viewAnalytics.visibility = View.GONE
        viewForecast.visibility = View.GONE
        viewSubscriptions.visibility = View.GONE
        view.visibility = View.VISIBLE
        supportActionBar?.title = title
    }

    private fun loadProfile(token: String) {
        NetworkClient.apiService.getProfile("Bearer $token").enqueue(object : Callback<ProfileResponse> {
            override fun onResponse(call: Call<ProfileResponse>, response: Response<ProfileResponse>) {
                if (response.isSuccessful) {
                    val p = response.body() ?: return
                    profileInfoTextView.text = "${p.username}\n${p.email}"
                    
                    val hasAccount = p.emailAccount != null
                    connectEmailButton.visibility = if (hasAccount) View.GONE else View.VISIBLE
                    btnSyncEmail.visibility = if (hasAccount) View.VISIBLE else View.GONE
                    btnDisconnectEmail.visibility = if (hasAccount) View.VISIBLE else View.GONE
                    
                    if (p.candidatesCount > 0) {
                        btnViewCandidatesProfile.visibility = View.VISIBLE
                        btnViewCandidatesProfile.text = "Кандидаты (${p.candidatesCount})"
                        btnViewCandidates.visibility = View.VISIBLE
                        btnViewCandidates.text = "Кандидаты (${p.candidatesCount})"
                    } else {
                        btnViewCandidatesProfile.visibility = View.GONE
                        btnViewCandidates.visibility = View.GONE
                    }
                }
            }
            override fun onFailure(call: Call<ProfileResponse>, t: Throwable) {}
        })
    }

    private fun loadSubscriptions(token: String) {
        val searchText = etSearch.text?.toString()?.takeIf { it.isNotBlank() }

        NetworkClient.apiService.getSubscriptions("Bearer $token", search = searchText).enqueue(object : Callback<List<Subscription>> {
            override fun onResponse(call: Call<List<Subscription>>, response: Response<List<Subscription>>) {
                if (response.isSuccessful) {
                    val subs = response.body() ?: emptyList()
                    rvSubscriptions.adapter = SubscriptionAdapter(
                        subs,
                        onOpen = { sub ->
                            sub.serviceUrl?.let { url ->
                                try {
                                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                                    startActivity(intent)
                                } catch (e: Exception) {
                                    Toast.makeText(this@HomeActivity, "Некорректная ссылка", Toast.LENGTH_SHORT).show()
                                }
                            } ?: Toast.makeText(this@HomeActivity, "Ссылка отсутствует", Toast.LENGTH_SHORT).show()
                        },
                        onEdit = { sub ->
                            val intent = Intent(this@HomeActivity, AddSubscriptionActivity::class.java).apply {
                                putExtra("SUB_ID", sub.id)
                            }
                            startActivity(intent)
                        },
                        onDelete = { sub ->
                            AlertDialog.Builder(this@HomeActivity)
                                .setTitle("Удалить подписку")
                                .setMessage("Вы уверены, что хотите удалить ${sub.name}?")
                                .setPositiveButton("Удалить") { _, _ ->
                                    NetworkClient.apiService.deleteSubscription("Bearer $token", sub.id).enqueue(object : Callback<SimpleMessageResponse> {
                                        override fun onResponse(call: Call<SimpleMessageResponse>, response: Response<SimpleMessageResponse>) {
                                            if (response.isSuccessful) loadSubscriptions(token)
                                        }
                                        override fun onFailure(call: Call<SimpleMessageResponse>, t: Throwable) {}
                                    })
                                }
                                .setNegativeButton("Отмена", null)
                                .show()
                        }
                    )
                }
            }
            override fun onFailure(call: Call<List<Subscription>>, t: Throwable) {}
        })
    }

    private fun loadAnalytics(token: String) {
        NetworkClient.apiService.getAnalytics("Bearer $token").enqueue(object : Callback<AnalyticsResponse> {
            override fun onResponse(call: Call<AnalyticsResponse>, response: Response<AnalyticsResponse>) {
                if (response.isSuccessful) {
                    val data = response.body() ?: return
                    tvMostExpensive.text = "Самая дорогая: ${data.mostExpensive?.name} (${data.mostExpensive?.price} ${data.mostExpensive?.currency})"
                    setupPieChart(data.spendingByCategory)
                    val months = listOf("Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек")
                    val values = FloatArray(12) { 0f }
                    data.spendingByMonth.forEach { if (it.month in 1..12) values[it.month - 1] = it.total.toFloat() }
                    setupLineChart(months, values.toList())
                }
            }
            override fun onFailure(call: Call<AnalyticsResponse>, t: Throwable) {}
        })
    }

    private fun loadForecast(token: String) {
        NetworkClient.apiService.getForecast("Bearer $token").enqueue(object : Callback<ForecastResponse> {
            override fun onResponse(call: Call<ForecastResponse>, response: Response<ForecastResponse>) {
                if (response.isSuccessful) {
                    val data = response.body() ?: return
                    tvWeekTotal.text = String.format(Locale.US, "%.2f", data.totalWeekSpending)
                    tvMonthForecast.text = String.format(Locale.US, "%.2f", data.monthlyForecast)
                    tvYearForecast.text = String.format(Locale.US, "%.2f", data.yearlyForecast)
                    currentCalendarData = data.calendarData
                    rvUpcoming.adapter = UpcomingAdapter(data.upcoming)
                }
            }
            override fun onFailure(call: Call<ForecastResponse>, t: Throwable) {}
        })
    }

    private fun showCalendarDetails(dateKey: String) {
        val entries = currentCalendarData?.get(dateKey)
        if (entries.isNullOrEmpty()) {
            tvSelectedDateInfo.text = "Нет платежей на $dateKey"
        } else {
            val sb = StringBuilder("Платежи на $dateKey:\n")
            entries.forEach { sb.append("- ${it.name}: ${it.price} ${it.currency}\n") }
            tvSelectedDateInfo.text = sb.toString()
        }
    }

    private fun setupPieChart(stats: List<CategoryStats>) {
        val entries = stats.map { PieEntry(it.total?.toFloat() ?: 0f, it.category__name) }
        val dataSet = PieDataSet(entries, "")
        
        // Обновленные цвета (более яркая и современная палитра)
        dataSet.colors = listOf(
            android.graphics.Color.parseColor("#FF6384"),
            android.graphics.Color.parseColor("#36A2EB"),
            android.graphics.Color.parseColor("#FFCE56"),
            android.graphics.Color.parseColor("#4BC0C0"),
            android.graphics.Color.parseColor("#9966FF"),
            android.graphics.Color.parseColor("#FF9F40")
        )
        
        pieChart.data = PieData(dataSet)
        pieChart.description.isEnabled = false
        pieChart.legend.isEnabled = true
        pieChart.setHoleColor(android.graphics.Color.TRANSPARENT)
        pieChart.setEntryLabelColor(android.graphics.Color.BLACK)
        pieChart.animateY(1000)
        pieChart.invalidate()
    }

    private fun setupLineChart(labels: List<String>, values: List<Float>) {
        val entries = values.mapIndexed { index, value -> Entry(index.toFloat(), value) }
        val dataSet = LineDataSet(entries, "Траты по месяцам")
        
        dataSet.color = getColor(R.color.primary)
        dataSet.setCircleColor(getColor(R.color.primary))
        dataSet.lineWidth = 3f
        dataSet.circleRadius = 5f
        dataSet.setDrawCircleHole(true)
        dataSet.valueTextSize = 10f
        dataSet.setDrawFilled(true)
        dataSet.fillColor = getColor(R.color.primary)
        dataSet.fillAlpha = 50
        dataSet.mode = LineDataSet.Mode.CUBIC_BEZIER // Сглаженная линия
        
        lineChart.data = LineData(dataSet)
        lineChart.xAxis.valueFormatter = com.github.mikephil.charting.formatter.IndexAxisValueFormatter(labels)
        lineChart.xAxis.position = com.github.mikephil.charting.components.XAxis.XAxisPosition.BOTTOM
        lineChart.xAxis.setDrawGridLines(false)
        lineChart.xAxis.granularity = 1f
        lineChart.axisRight.isEnabled = false
        lineChart.description.isEnabled = false
        lineChart.animateX(1000)
        lineChart.invalidate()
    }

    // Вспомогательные методы
    private fun goToLogin() {
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }

    private fun askNotificationPermission() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            if (androidx.core.content.ContextCompat.checkSelfPermission(this, android.Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                requestPermissionLauncher.launch(android.Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }

    private fun registerDeviceForPushes(token: String) {
        com.google.firebase.messaging.FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (task.isSuccessful) {
                val fcmToken = task.result
                NetworkClient.apiService.registerDevice("Bearer $token", TokenRegistrationRequest(fcmToken)).enqueue(object : Callback<Void> {
                    override fun onResponse(call: Call<Void>, response: Response<Void>) {}
                    override fun onFailure(call: Call<Void>, t: Throwable) {}
                })
            }
        }
    }

    private fun performTestPush(token: String) {
        NetworkClient.apiService.testPush("Bearer $token").enqueue(object : Callback<SimpleMessageResponse> {
            override fun onResponse(call: Call<SimpleMessageResponse>, response: Response<SimpleMessageResponse>) {
                Toast.makeText(this@HomeActivity, "Запрос на уведомление отправлен", Toast.LENGTH_SHORT).show()
            }
            override fun onFailure(call: Call<SimpleMessageResponse>, t: Throwable) {}
        })
    }

    private fun performEmailSync(token: String) {
        NetworkClient.apiService.emailSync("Bearer $token").enqueue(object : Callback<SimpleMessageResponse> {
            override fun onResponse(call: Call<SimpleMessageResponse>, response: Response<SimpleMessageResponse>) {
                Toast.makeText(this@HomeActivity, "Синхронизация запущена", Toast.LENGTH_SHORT).show()
            }
            override fun onFailure(call: Call<SimpleMessageResponse>, t: Throwable) {}
        })
    }

    private fun performEmailDisconnect(token: String) {
        NetworkClient.apiService.emailDisconnect("Bearer $token").enqueue(object : Callback<SimpleMessageResponse> {
            override fun onResponse(call: Call<SimpleMessageResponse>, response: Response<SimpleMessageResponse>) {
                Toast.makeText(this@HomeActivity, "Почта отключена", Toast.LENGTH_SHORT).show()
                loadProfile(token)
            }
            override fun onFailure(call: Call<SimpleMessageResponse>, t: Throwable) {}
        })
    }

    private fun showConnectEmailDialog(token: String) {
        val input = EditText(this)
        input.inputType = android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD
        input.hint = "Пароль приложения (App Password)"
        AlertDialog.Builder(this)
            .setTitle("Подключить Gmail")
            .setMessage("Введите пароль приложения для вашей почты:")
            .setView(input)
            .setPositiveButton("Подключить") { _, _ ->
                val pwd = input.text.toString()
                NetworkClient.apiService.connectEmail("Bearer $token", ConnectEmailRequest(pwd)).enqueue(object : Callback<ConnectEmailResponse> {
                    override fun onResponse(call: Call<ConnectEmailResponse>, response: Response<ConnectEmailResponse>) {
                        if (response.isSuccessful) {
                            Toast.makeText(this@HomeActivity, "Успешно!", Toast.LENGTH_SHORT).show()
                            loadProfile(token)
                        } else {
                            Toast.makeText(this@HomeActivity, "Ошибка подключения", Toast.LENGTH_SHORT).show()
                        }
                    }
                    override fun onFailure(call: Call<ConnectEmailResponse>, t: Throwable) {}
                })
            }
            .setNegativeButton("Отмена", null)
            .show()
    }
}
