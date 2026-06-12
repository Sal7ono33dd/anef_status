package com.naturalisation.tracker

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONException
import org.json.JSONObject

enum class SyncOutcome {
    SUCCESS,
    RETRYABLE_ERROR,
    HANDLED_AUTH_EXPIRED
}

class StatusRepository(private val context: Context) {
    private val prefs = context.getSharedPreferences(StatusPrefs.PREFS_NAME, Context.MODE_PRIVATE)

    suspend fun sync(trigger: String): SyncOutcome {
        val now = System.currentTimeMillis()
        val authStateBefore = prefs.getString(StatusPrefs.KEY_AUTH_STATE, StatusPrefs.AUTH_STATE_OK).orEmpty()

        return when (val result = AnefApiClient.fetchCurrentStatus(context)) {
            is AnefFetchResult.Success -> {
                val statusCode = StatusDecryptor.decryptStatus(result.data.encryptedStatus) ?: "code_non_reconnu"
                val presentation = StatusMapper.fromCode(statusCode)
                val currentFingerprint = buildStatusFingerprint(
                    dossierId = result.data.dossierId,
                    statusDate = result.data.statusDate,
                    statusCode = presentation.code,
                    statusDescription = presentation.description
                )
                val previousFingerprint = prefs.getString(
                    StatusPrefs.KEY_LAST_STATUS_FINGERPRINT,
                    prefs.getString(StatusPrefs.KEY_LAST_KNOWN_STATUS, "")
                ).orEmpty()
                val statusChanged = previousFingerprint.isNotBlank() && previousFingerprint != currentFingerprint

                val editor = prefs.edit()
                    .putLong(StatusPrefs.KEY_LAST_SYNC_AT, now)
                    .putString(StatusPrefs.KEY_LAST_SYNC_TRIGGER, trigger)
                    .putString(StatusPrefs.KEY_LAST_SYNC_STATE, StatusPrefs.AUTH_STATE_OK)
                    .putString(StatusPrefs.KEY_LAST_SYNC_ERROR, "")
                    .putString(StatusPrefs.KEY_LAST_KNOWN_STATUS, result.data.encryptedStatus)
                    .putString(StatusPrefs.KEY_LAST_STATUS_FINGERPRINT, currentFingerprint)
                    .putString(StatusPrefs.KEY_LAST_KNOWN_STATUS_CODE, presentation.code)
                    .putString(StatusPrefs.KEY_LAST_KNOWN_STATUS_DESCRIPTION, presentation.description)
                    .putString(StatusPrefs.KEY_LAST_KNOWN_STATUS_PHASE, presentation.phaseLabel)
                    .putString(StatusPrefs.KEY_LAST_KNOWN_STATUS_DATE, result.data.statusDate)
                    .putString(StatusPrefs.KEY_LAST_KNOWN_DOSSIER_ID, result.data.dossierId)
                    .putString(StatusPrefs.KEY_LAST_DECRYPT_ERROR, StatusDecryptor.lastError)
                    .putString(StatusPrefs.KEY_TYPE_DEMANDE, result.data.typeDemande)
                    .putString(StatusPrefs.KEY_TIMBRE_FISCAL, result.data.timbreFiscal)
                    .putString(StatusPrefs.KEY_DEMANDE_DATE, result.data.demandeDate)
                    .putString(
                        StatusPrefs.KEY_COMPLEMENT_INSTRUCTION_DATE,
                        result.data.complementInstructionDate
                    )
                    .putString(
                        StatusPrefs.KEY_RECEPISSE_COMPLETUDE_DATE,
                        result.data.recepisseCompletuDate
                    )
                    .putString(StatusPrefs.KEY_ASSIMILATION_DATE, result.data.assimilationDate)
                    .putString(
                        StatusPrefs.KEY_ASSIMILATION_PLATEFORME,
                        result.data.assimilationPlateforme
                    )
                    .putString(StatusPrefs.KEY_DECRET_ID, result.data.decretId)
                    .putString(StatusPrefs.KEY_AUTH_STATE, StatusPrefs.AUTH_STATE_OK)

                updateTimelineSnapshot(
                    editor = editor,
                    phaseLabel = presentation.phaseLabel,
                    statusCode = presentation.code,
                    description = presentation.description,
                    statusDate = result.data.statusDate
                )

                if (statusChanged) {
                    val lastNotifiedFingerprint =
                        prefs.getString(StatusPrefs.KEY_LAST_NOTIFIED_STATUS_VALUE, "").orEmpty()
                    if (lastNotifiedFingerprint != currentFingerprint) {
                        NotificationHelper.postNotification(
                            context,
                            title = "ANEF: changement de statut",
                            message = buildStatusChangeMessage(
                                description = presentation.description,
                                phaseLabel = presentation.phaseLabel,
                                statusDate = result.data.statusDate
                            )
                        )
                        editor.putLong(StatusPrefs.KEY_LAST_STATUS_CHANGE_NOTIFICATION_AT, now)
                        editor.putString(StatusPrefs.KEY_LAST_NOTIFIED_STATUS_VALUE, currentFingerprint)
                    }
                }

                editor.apply()
                SyncOutcome.SUCCESS
            }

            is AnefFetchResult.AuthExpired -> {
                val editor = prefs.edit()
                    .putLong(StatusPrefs.KEY_LAST_SYNC_AT, now)
                    .putString(StatusPrefs.KEY_LAST_SYNC_TRIGGER, trigger)
                    .putString(StatusPrefs.KEY_LAST_SYNC_STATE, StatusPrefs.AUTH_STATE_EXPIRED)
                    .putString(StatusPrefs.KEY_LAST_SYNC_ERROR, result.reason)
                    .putString(StatusPrefs.KEY_AUTH_STATE, StatusPrefs.AUTH_STATE_EXPIRED)

                if (authStateBefore != StatusPrefs.AUTH_STATE_EXPIRED) {
                    NotificationHelper.postNotification(
                        context,
                        title = "ANEF: session expiree",
                        message = "Reconnecte-toi sur ANEF pour reactiver la synchro et les notifications."
                    )
                    editor.putLong(StatusPrefs.KEY_LAST_AUTH_NOTIFICATION_AT, now)
                }

                editor.apply()
                SyncOutcome.HANDLED_AUTH_EXPIRED
            }

            is AnefFetchResult.Error -> {
                val looksAuthExpired = Regex(
                    "(session|expire|auth|connexion|401|403|unauthor)",
                    RegexOption.IGNORE_CASE
                ).containsMatchIn(result.reason)

                if (looksAuthExpired) {
                    val editor = prefs.edit()
                        .putLong(StatusPrefs.KEY_LAST_SYNC_AT, now)
                        .putString(StatusPrefs.KEY_LAST_SYNC_TRIGGER, trigger)
                        .putString(StatusPrefs.KEY_LAST_SYNC_STATE, StatusPrefs.AUTH_STATE_EXPIRED)
                        .putString(StatusPrefs.KEY_LAST_SYNC_ERROR, result.reason)
                        .putString(StatusPrefs.KEY_AUTH_STATE, StatusPrefs.AUTH_STATE_EXPIRED)

                    if (authStateBefore != StatusPrefs.AUTH_STATE_EXPIRED) {
                        NotificationHelper.postNotification(
                            context,
                            title = "ANEF: session expiree",
                            message = "Reconnecte-toi sur ANEF pour reactiver la synchro et les notifications."
                        )
                        editor.putLong(StatusPrefs.KEY_LAST_AUTH_NOTIFICATION_AT, now)
                    }
                    editor.apply()
                    SyncOutcome.HANDLED_AUTH_EXPIRED
                } else {
                    prefs.edit()
                        .putLong(StatusPrefs.KEY_LAST_SYNC_AT, now)
                        .putString(StatusPrefs.KEY_LAST_SYNC_TRIGGER, trigger)
                        .putString(StatusPrefs.KEY_LAST_SYNC_STATE, StatusPrefs.AUTH_STATE_ERROR)
                        .putString(StatusPrefs.KEY_LAST_SYNC_ERROR, result.reason)
                        .putString(StatusPrefs.KEY_AUTH_STATE, StatusPrefs.AUTH_STATE_ERROR)
                        .apply()
                    SyncOutcome.RETRYABLE_ERROR
                }
            }
        }
    }

    private fun buildStatusFingerprint(
        dossierId: String,
        statusDate: String,
        statusCode: String,
        statusDescription: String
    ): String {
        return listOf(
            dossierId.trim(),
            statusDate.trim(),
            statusCode.trim(),
            statusDescription.trim()
        ).joinToString("|")
    }

    private fun buildStatusChangeMessage(
        description: String,
        phaseLabel: String,
        statusDate: String
    ): String {
        val datePart = statusDate.trim()
        return if (datePart.isBlank()) {
            "$description ($phaseLabel)"
        } else {
            "$description ($phaseLabel) - maj: $datePart"
        }
    }

    private fun updateTimelineSnapshot(
        editor: SharedPreferences.Editor,
        phaseLabel: String,
        statusCode: String,
        description: String,
        statusDate: String
    ) {
        val raw = prefs.getString(StatusPrefs.KEY_TIMELINE_STAGE_DATA, "").orEmpty()
        val root = try {
            if (raw.isBlank()) JSONObject() else JSONObject(raw)
        } catch (_: JSONException) {
            JSONObject()
        }

        val stageKey = AnefTimeline.stageKeyFrom(phaseLabel = phaseLabel, statusCode = statusCode)
        val stageEntry = root.optJSONObject(stageKey) ?: JSONObject()
        if (statusDate.isNotBlank()) {
            stageEntry.put("date", statusDate)
        }
        if (description.isNotBlank()) {
            stageEntry.put("description", description)
        }
        stageEntry.put("phase_label", phaseLabel)
        stageEntry.put("updated_at", System.currentTimeMillis())
        root.put(stageKey, stageEntry)

        val currentIndex = AnefTimeline.stageIndex(stageKey)
        for (index in 0..currentIndex) {
            val definition = AnefTimeline.orderedStages[index]
            val previousEntry = root.optJSONObject(definition.key) ?: JSONObject()
            if (previousEntry.optString("description").isBlank()) {
                previousEntry.put("description", definition.defaultDescription)
            }
            root.put(definition.key, previousEntry)
        }

        editor.putString(StatusPrefs.KEY_TIMELINE_STAGE_DATA, root.toString())
    }
}
