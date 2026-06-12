package com.naturalisation.tracker

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters

class StatusSyncWorker(
    appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        NotificationHelper.ensureChannel(applicationContext)

        val trigger = inputData.getString(KEY_TRIGGER) ?: "worker"

        val outcome = StatusRepository(applicationContext).sync(
            trigger = trigger
        )

        return when (outcome) {
            SyncOutcome.SUCCESS -> Result.success()
            SyncOutcome.HANDLED_AUTH_EXPIRED -> Result.success()
            SyncOutcome.RETRYABLE_ERROR -> Result.retry()
        }
    }

    companion object {
        const val KEY_TRIGGER = "key_trigger"
    }
}
