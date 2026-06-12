package com.naturalisation.tracker

import android.content.Intent
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.bottomnavigation.BottomNavigationView

object BottomNavHelper {
    fun setup(
        activity: AppCompatActivity,
        bottomNav: BottomNavigationView,
        selectedItemId: Int
    ) {
        bottomNav.selectedItemId = selectedItemId
        bottomNav.setOnItemSelectedListener { item ->
            val target = item.itemId
            if (target == selectedItemId) {
                return@setOnItemSelectedListener true
            }

            val intent = when (target) {
                R.id.nav_home -> Intent(activity, MainActivity::class.java)
                R.id.nav_chatbot -> Intent(activity, ChatbotActivity::class.java)
                R.id.nav_status -> Intent(activity, StatusSearchActivity::class.java)
                R.id.nav_entretien -> Intent(activity, EntretienPrepActivity::class.java)
                R.id.nav_decrets -> Intent(activity, DecretsActivity::class.java)
                else -> null
            }

            if (intent != null) {
                intent.flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
                activity.startActivity(intent)
            }
            true
        }
    }
}
