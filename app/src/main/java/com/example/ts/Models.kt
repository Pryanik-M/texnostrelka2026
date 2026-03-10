package com.example.ts

import com.google.gson.annotations.SerializedName

// Auth & Profile
data class LoginRequest(val email: String, val password: String)
data class UserInfo(val id: Int, val username: String, val email: String)
data class LoginResponse(val access: String?, val refresh: String?, val user: UserInfo?, val error: String?, val detail: String?)

data class RegisterRequest(
    val email: String,
    val username: String,
    val password: String,
    @SerializedName("confirm_password") val confirmPassword: String
)

data class RegisterResponse(
    val message: String?,
    val errors: Map<String, Any>?
)

data class VerifyRequest(
    val code: String
)

data class VerifyResponse(
    val message: String?,
    val access: String?,
    val refresh: String?, val error: String?
)

data class ProfileResponse(
    val id: Int,
    val username: String,
    val email: String,
    @SerializedName("email_account") val emailAccount: String?,
    @SerializedName("candidates_count") val candidatesCount: Int
)

// Main Domain Models
data class Category(val id: Int, val name: String, val description: String?)

data class Subscription(
    val id: Int,
    val name: String,
    val category: Int?,
    val description: String?,
    val price: String,
    val currency: String,
    @SerializedName("billing_period") val billingPeriod: String,
    @SerializedName("start_date") val startDate: String?,
    @SerializedName("next_payment_date") val nextPaymentDate: String?,
    val status: String,
    @SerializedName("service_url") val serviceUrl: String?,
    val notes: String?
)

data class CreateSubscriptionRequest(
    val name: String,
    val category: Int? = null,
    val description: String? = "",
    val price: Double,
    val currency: String,
    @SerializedName("billing_period") val billingPeriod: String,
    @SerializedName("start_date") val startDate: String,
    @SerializedName("next_payment_date") val nextPaymentDate: String,
    val status: String = "active",
    @SerializedName("service_url") val serviceUrl: String? = "",
    val notes: String? = ""
)

data class UpdateSubscriptionRequest(
    val name: String? = null,
    val category: Int? = null,
    val description: String? = null,
    val price: Double? = null,
    val currency: String? = null,
    @SerializedName("billing_period") val billingPeriod: String? = null,
    @SerializedName("start_date") val startDate: String? = null,
    @SerializedName("next_payment_date") val nextPaymentDate: String? = null,
    val status: String? = null,
    @SerializedName("service_url") val serviceUrl: String? = null,
    val notes: String? = null
)

data class CreateSubscriptionResponse(
    val message: String?,
    val subscription: Subscription?
)

// Analytics
data class CategoryStats(val category__name: String, val count: Int?, val total: Double?)
data class MonthStats(val month: Int, val total: Double)
data class AnalyticsResponse(
    @SerializedName("subscriptions_by_category") val subsByCategory: List<CategoryStats>,
    @SerializedName("spending_by_category") val spendingByCategory: List<CategoryStats>,
    @SerializedName("spending_by_month") val spendingByMonth: List<MonthStats>,
    @SerializedName("most_expensive") val mostExpensive: Subscription?,
    val cheapest: Subscription?,
    @SerializedName("status_stats") val statusStats: List<Map<String, Any>>?
)

// Forecast
data class CalendarEntry(val name: String, val price: Double, val currency: String)
data class ForecastResponse(
    @SerializedName("upcoming_subscriptions") val upcoming: List<Subscription>,
    @SerializedName("total_week_spending") val totalWeekSpending: Double,
    @SerializedName("monthly_forecast") val monthlyForecast: Double,
    @SerializedName("yearly_forecast") val yearlyForecast: Double,
    @SerializedName("monthly_chart_labels") val chartLabels: List<String>,
    @SerializedName("monthly_chart_values") val chartValues: List<Double>,
    @SerializedName("calendar_data") val calendarData: Map<String, List<CalendarEntry>>
)

// Candidates
data class Candidate(
    val id: Int,
    val subject: String,
    val sender: String,
    @SerializedName("detected_service") val detectedService: String?,
    val snippet: String?,
    val confidence: Double
)

data class CreateFromCandidateRequest(
    val price: Double,
    val currency: String,
    @SerializedName("billing_period") val billingPeriod: String
)

// Requests
data class ForgotPasswordRequest(val email: String)
data class ForgotVerifyRequest(val code: String)
data class ResetPasswordRequest(val password: String, @SerializedName("confirm_password") val confirmPassword: String)
data class SimpleMessageResponse(val message: String?, val error: String?, val last_checked: String?)
data class ConnectEmailRequest(val password: String)
data class ConnectEmailResponse(val message: String?, val email: String?, val provider: String?, val error: String?)
data class TokenRegistrationRequest(val token: String)

// Errors
data class ErrorResponse(val error: String?, val errors: Map<String, Any>?, val detail: String?)
