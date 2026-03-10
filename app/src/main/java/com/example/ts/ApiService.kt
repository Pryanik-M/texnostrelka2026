package com.example.ts

import retrofit2.Call
import retrofit2.http.*

interface ApiService {
    // Auth & Device
    @POST("api/users/login/")
    fun login(@Body request: LoginRequest): Call<LoginResponse>

    @POST("api/users/register/")
    fun register(@Body request: RegisterRequest): Call<RegisterResponse>

    @POST("api/users/register/verify/")
    fun verify(@Body request: VerifyRequest): Call<VerifyResponse>

    @GET("api/users/profile/")
    fun getProfile(@Header("Authorization") bearerToken: String): Call<ProfileResponse>

    @POST("api/users/forgot-password/")
    fun forgotPassword(@Body request: ForgotPasswordRequest): Call<SimpleMessageResponse>

    @POST("api/users/forgot-password/verify/")
    fun forgotVerify(@Body request: ForgotVerifyRequest): Call<SimpleMessageResponse>

    @POST("api/users/reset-password/")
    fun resetPassword(@Body request: ResetPasswordRequest): Call<SimpleMessageResponse>

    @POST("api/users/device/register/")
    fun registerDevice(@Header("Authorization") bearerToken: String, @Body request: TokenRegistrationRequest): Call<Void>

    @POST("api/users/logout/")
    fun logout(@Header("Authorization") bearerToken: String): Call<Void>

    // Main App Features
    @GET("api/main/categories/")
    fun getCategories(@Header("Authorization") bearerToken: String): Call<List<Category>>

    @GET("api/main/subscriptions/")
    fun getSubscriptions(
        @Header("Authorization") bearerToken: String,
        @Query("search") search: String? = null,
        @Query("status") status: String? = null,
        @Query("order") order: String? = null,
        @Query("category") categoryId: Int? = null
    ): Call<List<Subscription>>

    @POST("api/main/subscriptions/")
    fun createSubscription(@Header("Authorization") bearerToken: String, @Body request: CreateSubscriptionRequest): Call<CreateSubscriptionResponse>

    @GET("api/main/subscriptions/{id}/")
    fun getSubscriptionDetail(@Header("Authorization") bearerToken: String, @Path("id") id: Int): Call<Subscription>

    @PATCH("api/main/subscriptions/{id}/")
    fun updateSubscription(@Header("Authorization") bearerToken: String, @Path("id") id: Int, @Body request: UpdateSubscriptionRequest): Call<Subscription>

    @DELETE("api/main/subscriptions/{id}/")
    fun deleteSubscription(@Header("Authorization") bearerToken: String, @Path("id") id: Int): Call<SimpleMessageResponse>

    @GET("api/main/analytics/")
    fun getAnalytics(@Header("Authorization") bearerToken: String): Call<AnalyticsResponse>

    @GET("api/main/forecast/")
    fun getForecast(@Header("Authorization") bearerToken: String): Call<ForecastResponse>

    @GET("api/main/candidates/")
    fun getCandidates(@Header("Authorization") bearerToken: String): Call<List<Candidate>>

    @POST("api/main/candidates/{id}/accept/")
    fun acceptCandidate(@Header("Authorization") bearerToken: String, @Path("id") id: Int): Call<Subscription>

    @POST("api/main/candidates/{id}/ignore/")
    fun ignoreCandidate(@Header("Authorization") bearerToken: String, @Path("id") id: Int): Call<SimpleMessageResponse>

    @POST("api/main/candidates/{id}/create/")
    fun createFromCandidate(@Header("Authorization") bearerToken: String, @Path("id") id: Int, @Body request: CreateFromCandidateRequest): Call<Subscription>

    @POST("api/main/email/sync/")
    fun emailSync(@Header("Authorization") bearerToken: String): Call<SimpleMessageResponse>

    @POST("api/main/email/disconnect/")
    fun emailDisconnect(@Header("Authorization") bearerToken: String): Call<SimpleMessageResponse>

    @POST("api/users/test-push/")
    fun testPush(@Header("Authorization") bearerToken: String): Call<SimpleMessageResponse>

    @POST("api/users/email/connect/")
    fun connectEmail(@Header("Authorization") bearerToken: String, @Body request: ConnectEmailRequest): Call<ConnectEmailResponse>
}
