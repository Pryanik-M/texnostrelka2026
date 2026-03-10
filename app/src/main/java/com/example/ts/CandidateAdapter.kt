package com.example.ts

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView

class CandidateAdapter(
    private val candidates: List<Candidate>,
    private val onAccept: (Candidate) -> Unit,
    private val onIgnore: (Candidate) -> Unit
) : RecyclerView.Adapter<CandidateAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val service: TextView = view.findViewById(R.id.tv_candidate_service)
        val subject: TextView = view.findViewById(R.id.tv_candidate_subject)
        val snippet: TextView = view.findViewById(R.id.tv_candidate_snippet)
        val btnAccept: Button = view.findViewById(R.id.btn_accept_candidate)
        val btnIgnore: Button = view.findViewById(R.id.btn_ignore_candidate)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_candidate, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val candidate = candidates[position]
        holder.service.text = candidate.detectedService ?: "Unknown Service"
        holder.subject.text = candidate.subject
        holder.snippet.text = candidate.snippet
        
        holder.btnAccept.setOnClickListener { onAccept(candidate) }
        holder.btnIgnore.setOnClickListener { onIgnore(candidate) }
    }

    override fun getItemCount() = candidates.size
}
