package com.naturalisation.tracker

object StatusPrefs {
    const val PREFS_NAME = "anf_status_prefs"

    const val KEY_LAST_SYNC_AT = "last_sync_at"
    const val KEY_LAST_SYNC_TRIGGER = "last_sync_trigger"
    const val KEY_LAST_SYNC_STATE = "last_sync_state"
    const val KEY_LAST_SYNC_ERROR = "last_sync_error"

    const val KEY_LAST_KNOWN_STATUS = "last_known_status_encrypted"
    const val KEY_LAST_STATUS_FINGERPRINT = "last_status_fingerprint"
    const val KEY_LAST_KNOWN_STATUS_CODE = "last_known_status_code"
    const val KEY_LAST_KNOWN_STATUS_DESCRIPTION = "last_known_status_description"
    const val KEY_LAST_KNOWN_STATUS_PHASE = "last_known_status_phase"
    const val KEY_LAST_KNOWN_STATUS_DATE = "last_known_status_date"
    const val KEY_LAST_KNOWN_DOSSIER_ID = "last_known_dossier_id"
    const val KEY_LAST_DECRYPT_ERROR = "last_decrypt_error"
    const val KEY_TIMELINE_STAGE_DATA = "timeline_stage_data"
    const val KEY_SESSION_COOKIE = "session_cookie"
    const val KEY_SESSION_COOKIE_AT = "session_cookie_at"
    const val KEY_TYPE_DEMANDE = "type_demande"
    const val KEY_TIMBRE_FISCAL = "timbre_fiscal"
    const val KEY_DEMANDE_DATE = "demande_date"
    const val KEY_COMPLEMENT_INSTRUCTION_DATE = "complement_instruction_date"
    const val KEY_RECEPISSE_COMPLETUDE_DATE = "recepisse_completude_date"
    const val KEY_ASSIMILATION_DATE = "assimilation_date"
    const val KEY_ASSIMILATION_PLATEFORME = "assimilation_plateforme"
    const val KEY_DECRET_ID = "decret_id"

    const val KEY_LAST_NOTIFIED_STATUS_VALUE = "last_notified_status_value"
    const val KEY_LAST_DAILY_NOTIFICATION_DATE = "last_daily_notification_date"
    const val KEY_LAST_AUTH_NOTIFICATION_AT = "last_auth_notification_at"
    const val KEY_LAST_AUTH_RECOVERY_NOTIFICATION_AT = "last_auth_recovery_notification_at"
    const val KEY_LAST_STATUS_CHANGE_NOTIFICATION_AT = "last_status_change_notification_at"
    const val KEY_AUTH_STATE = "auth_state"
    const val KEY_CONSENT_ACCEPTED = "consent_accepted"
    const val KEY_CONSENT_DONT_SHOW_AGAIN = "consent_dont_show_again"

    const val AUTH_STATE_OK = "ok"
    const val AUTH_STATE_EXPIRED = "expired"
    const val AUTH_STATE_ERROR = "error"
}
