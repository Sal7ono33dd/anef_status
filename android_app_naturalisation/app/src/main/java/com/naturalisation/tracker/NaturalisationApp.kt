package com.naturalisation.tracker

import android.app.Application

class NaturalisationApp : Application() {
    override fun onCreate() {
        super.onCreate()
        NotificationHelper.ensureChannel(this)
        SyncScheduler.scheduleAll(this)
    }
}
