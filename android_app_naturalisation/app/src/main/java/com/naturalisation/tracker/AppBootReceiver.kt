package com.naturalisation.tracker

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class AppBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action.orEmpty()
        if (
            action == Intent.ACTION_BOOT_COMPLETED ||
            action == Intent.ACTION_MY_PACKAGE_REPLACED
        ) {
            NotificationHelper.ensureChannel(context)
            SyncScheduler.scheduleAll(context)
            SyncScheduler.enqueueImmediateSync(context, trigger = "boot_or_update")
        }
    }
}
