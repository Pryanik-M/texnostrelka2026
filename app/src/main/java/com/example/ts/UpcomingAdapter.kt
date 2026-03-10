package com.example.ts

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView

class UpcomingAdapter(private val items: List<Subscription>) : RecyclerView.Adapter<UpcomingAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val name: TextView = view.findViewById(R.id.tv_upcoming_name)
        val date: TextView = view.findViewById(R.id.tv_upcoming_date)
        val price: TextView = view.findViewById(R.id.tv_upcoming_price)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_upcoming_subscription, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val item = items[position]
        holder.name.text = item.name
        holder.date.text = "Next: ${item.nextPaymentDate}"
        holder.price.text = "${item.price} ${item.currency}"
    }

    override fun getItemCount() = items.size
}