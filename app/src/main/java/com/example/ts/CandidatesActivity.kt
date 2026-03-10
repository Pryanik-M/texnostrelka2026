package com.example.ts

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class CandidatesActivity : AppCompatActivity() {

    private lateinit var rvCandidates: RecyclerView
    private lateinit var token: String

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_candidates)

        rvCandidates = findViewById(R.id.rv_candidates)
        rvCandidates.layoutManager = LinearLayoutManager(this)

        token = getSharedPreferences("app_prefs", MODE_PRIVATE).getString("auth_token", "") ?: ""
        
        loadCandidates()
    }

    private fun loadCandidates() {
        NetworkClient.apiService.getCandidates("Bearer $token").enqueue(object : Callback<List<Candidate>> {
            override fun onResponse(call: Call<List<Candidate>>, response: Response<List<Candidate>>) {
                if (response.isSuccessful) {
                    val candidates = response.body() ?: emptyList()
                    rvCandidates.adapter = CandidateAdapter(
                        candidates,
                        onAccept = { candidate -> acceptCandidate(candidate) },
                        onIgnore = { candidate -> ignoreCandidate(candidate) }
                    )
                }
            }
            override fun onFailure(call: Call<List<Candidate>>, t: Throwable) {
                Toast.makeText(this@CandidatesActivity, "Error: ${t.message}", Toast.LENGTH_SHORT).show()
            }
        })
    }

    private fun acceptCandidate(candidate: Candidate) {
        NetworkClient.apiService.acceptCandidate("Bearer $token", candidate.id).enqueue(object : Callback<Subscription> {
            override fun onResponse(call: Call<Subscription>, response: Response<Subscription>) {
                if (response.isSuccessful) {
                    Toast.makeText(this@CandidatesActivity, "Accepted", Toast.LENGTH_SHORT).show()
                    loadCandidates()
                }
            }
            override fun onFailure(call: Call<Subscription>, t: Throwable) {}
        })
    }

    private fun ignoreCandidate(candidate: Candidate) {
        NetworkClient.apiService.ignoreCandidate("Bearer $token", candidate.id).enqueue(object : Callback<SimpleMessageResponse> {
            override fun onResponse(call: Call<SimpleMessageResponse>, response: Response<SimpleMessageResponse>) {
                if (response.isSuccessful) {
                    Toast.makeText(this@CandidatesActivity, "Ignored", Toast.LENGTH_SHORT).show()
                    loadCandidates()
                }
            }
            override fun onFailure(call: Call<SimpleMessageResponse>, t: Throwable) {}
        })
    }
}
