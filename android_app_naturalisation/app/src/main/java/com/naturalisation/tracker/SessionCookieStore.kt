package com.naturalisation.tracker

import android.content.Context
import android.webkit.CookieManager

object SessionCookieStore {
    fun captureFromWebView(context: Context): Boolean {
        val liveCookie = try {
            CookieManager.getInstance().getCookie(AnefApiClient.ANEF_HOME_URL).orEmpty()
        } catch (_: Exception) {
            ""
        }

        if (liveCookie.isBlank()) return false
        save(context, liveCookie)
        return true
    }

    fun resolveForRequest(context: Context): String {
        val liveCookie = try {
            CookieManager.getInstance().getCookie(AnefApiClient.ANEF_HOME_URL).orEmpty()
        } catch (_: Exception) {
            ""
        }

        if (liveCookie.isNotBlank()) {
            save(context, liveCookie)
            return liveCookie
        }

        return context.getSharedPreferences(StatusPrefs.PREFS_NAME, Context.MODE_PRIVATE)
            .getString(StatusPrefs.KEY_SESSION_COOKIE, "")
            .orEmpty()
    }

    private fun save(context: Context, cookie: String) {
        context.getSharedPreferences(StatusPrefs.PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(StatusPrefs.KEY_SESSION_COOKIE, cookie)
            .putLong(StatusPrefs.KEY_SESSION_COOKIE_AT, System.currentTimeMillis())
            .apply()
    }
}
