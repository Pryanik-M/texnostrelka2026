package com.example.ts

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView

class SubscriptionAdapter(
    private val subscriptions: List<Subscription>,
    private val onOpen: (Subscription) -> Unit,
    private val onEdit: (Subscription) -> Unit,
    private val onDelete: (Subscription) -> Unit
) : RecyclerView.Adapter<SubscriptionAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val name: TextView = view.findViewById(R.id.tv_sub_name)
        val price: TextView = view.findViewById(R.id.tv_sub_price)
        val date: TextView = view.findViewById(R.id.tv_sub_date)
        val status: TextView = view.findViewById(R.id.tv_sub_status)
        val btnOpen: Button = view.findViewById(R.id.btn_open_service)
        val btnEdit: Button = view.findViewById(R.id.btn_edit_sub)
        val btnDelete: Button = view.findViewById(R.id.btn_delete_sub)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_subscription, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val sub = subscriptions[position]
        holder.name.text = sub.name
        holder.price.text = "${sub.price} ${sub.currency}"
        holder.date.text = "Next: ${sub.nextPaymentDate}"
        holder.status.text = sub.status.uppercase()
        
        if (sub.status == "active") {
            holder.status.setBackgroundResource(R.drawable.bg_status_active)
        }

        holder.btnOpen.setOnClickListener { onOpen(sub) }
        holder.btnEdit.setOnClickListener { onEdit(sub) }
        holder.btnDelete.setOnClickListener { onDelete(sub) }
    }

    override fun getItemCount() = subscriptions.size
}
