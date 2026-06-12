package com.naturalisation.tracker

import android.content.Context
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.workDataOf
import java.util.concurrent.TimeUnit

object SyncScheduler {
    private const val UNIQUE_PERIODIC_SYNC = "anf_periodic_sync"
    private const val UNIQUE_MANUAL_SYNC = "anf_manual_sync"
    private const val LEGACY_DAILY_REMINDER = "anf_daily_reminder"

    fun scheduleAll(context: Context) {
        // Cleanup ancien worker "rappel quotidien" pour garder des notifications strictement evenementielles.
        WorkManager.getInstance(context).cancelUniqueWork(LEGACY_DAILY_REMINDER)

        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val periodicSync = PeriodicWorkRequestBuilder<StatusSyncWorker>(15, TimeUnit.MINUTES)
            .setConstraints(constraints)
            .setInputData(
                workDataOf(
                    StatusSyncWorker.KEY_TRIGGER to "periodic"
                )
            )
            .build()

        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            UNIQUE_PERIODIC_SYNC,
            ExistingPeriodicWorkPolicy.KEEP,
            periodicSync
        )
    }

    fun enqueueImmediateSync(context: Context, trigger: String) {
        val oneTimeSync = OneTimeWorkRequestBuilder<StatusSyncWorker>()
            .setInputData(
                workDataOf(
                    StatusSyncWorker.KEY_TRIGGER to trigger
                )
            )
            .build()

        WorkManager.getInstance(context).enqueueUniqueWork(
            UNIQUE_MANUAL_SYNC,
            ExistingWorkPolicy.REPLACE,
            oneTimeSync
        )
    }
}
