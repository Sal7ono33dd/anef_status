package com.naturalisation.tracker

import android.Manifest
import android.app.ActivityManager
import android.app.AlertDialog
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.content.res.ColorStateList
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.CheckBox
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.naturalisation.tracker.databinding.ActivityMainBinding
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.absoluteValue

private data class TimelineStepUi(
    val key: String,
    val title: String,
    val iconRes: Int,
    val badge: String,
    val isCurrent: Boolean,
    val isPending: Boolean
)

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private lateinit var prefs: SharedPreferences

    private var forceAnefView = false
    private var appInitialized = false

    private val notifPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (!granted) {
            Toast.makeText(
                this,
                "Notifications desactivees. Active-les pour les alertes de statut.",
                Toast.LENGTH_LONG
            ).show()
        }
    }

    private val prefsListener = SharedPreferences.OnSharedPreferenceChangeListener { _, _ ->
        refreshStatusPanel()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        prefs = getSharedPreferences(StatusPrefs.PREFS_NAME, MODE_PRIVATE)
        forceAnefView = intent?.getBooleanExtra(EXTRA_FORCE_ANEF_VIEW, false) == true

        if (shouldShowConsentDialog()) {
            showConsentDialog()
        } else {
            initializeMainUiIfNeeded()
        }
    }

    private fun initializeMainUiIfNeeded() {
        if (appInitialized) return
        appInitialized = true

        NotificationHelper.ensureChannel(this)
        SyncScheduler.scheduleAll(this)

        setupButtons()
        updateBackgroundSyncButtonVisibility()
        BottomNavHelper.setup(
            activity = this,
            bottomNav = binding.bottomNav,
            selectedItemId = R.id.nav_home
        )
        setupWebView(binding.webViewAnef)
        requestNotificationPermissionIfNeeded()
        refreshStatusPanel()

        binding.webViewAnef.loadUrl(AnefApiClient.ANEF_HOME_URL)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        if (intent.getBooleanExtra(EXTRA_FORCE_ANEF_VIEW, false)) {
            forceAnefView = true
            if (!appInitialized) return
            updateLayoutMode(currentAuthState())
            binding.webViewAnef.loadUrl(AnefApiClient.ANEF_HOME_URL)
        }
    }

    override fun onStart() {
        super.onStart()
        if (!appInitialized) return
        prefs.registerOnSharedPreferenceChangeListener(prefsListener)
    }

    override fun onStop() {
        super.onStop()
        if (!appInitialized) return
        prefs.unregisterOnSharedPreferenceChangeListener(prefsListener)
    }

    override fun onResume() {
        super.onResume()
        if (!appInitialized) return
        updateBackgroundSyncButtonVisibility()
    }

    private fun shouldShowConsentDialog(): Boolean {
        val accepted = prefs.getBoolean(StatusPrefs.KEY_CONSENT_ACCEPTED, false)
        val dontShowAgain = prefs.getBoolean(StatusPrefs.KEY_CONSENT_DONT_SHOW_AGAIN, false)
        return !accepted || !dontShowAgain
    }

    private fun showConsentDialog() {
        val dialogView = layoutInflater.inflate(R.layout.dialog_consent_rgpd, null)
        val checkDontShowAgain = dialogView.findViewById<CheckBox>(R.id.chkDontShowAgain)

        val dialog = AlertDialog.Builder(this)
            .setTitle(getString(R.string.consent_title))
            .setView(dialogView)
            .setCancelable(false)
            .setPositiveButton(getString(R.string.consent_accept)) { _, _ ->
                prefs.edit()
                    .putBoolean(StatusPrefs.KEY_CONSENT_ACCEPTED, true)
                    .putBoolean(StatusPrefs.KEY_CONSENT_DONT_SHOW_AGAIN, checkDontShowAgain.isChecked)
                    .apply()
                initializeMainUiIfNeeded()
            }
            .setNegativeButton(getString(R.string.consent_refuse)) { _, _ ->
                Toast.makeText(
                    this,
                    getString(R.string.consent_refused_closing),
                    Toast.LENGTH_LONG
                ).show()
                finishAffinity()
                finish()
            }
            .create()

        dialog.setCanceledOnTouchOutside(false)
        dialog.setOnKeyListener { _, keyCode, _ ->
            keyCode == KeyEvent.KEYCODE_BACK
        }
        dialog.show()
    }

    private fun setupButtons() {
        binding.btnSyncNow.setOnClickListener {
            SyncScheduler.enqueueImmediateSync(this, trigger = "manual_connected")
            Toast.makeText(this, "Synchro manuelle lancee.", Toast.LENGTH_SHORT).show()
        }

        binding.btnBackgroundSyncSettings.setOnClickListener {
            openBackgroundSyncSettings()
        }

        binding.btnSyncNowNotConnected.setOnClickListener {
            SyncScheduler.enqueueImmediateSync(this, trigger = "manual_not_connected")
            Toast.makeText(this, "Synchro manuelle lancee.", Toast.LENGTH_SHORT).show()
        }

        binding.btnOpenAnef.setOnClickListener {
            forceAnefView = true
            updateLayoutMode(currentAuthState())
            binding.webViewAnef.loadUrl(AnefApiClient.ANEF_HOME_URL)
        }

        binding.btnAccessAnef.setOnClickListener {
            forceAnefView = true
            updateLayoutMode(currentAuthState())
            binding.webViewAnef.loadUrl(AnefApiClient.ANEF_HOME_URL)
        }

        binding.btnBackDashboard.setOnClickListener {
            forceAnefView = false
            refreshStatusPanel()
        }

        binding.btnOpenChatbot.setOnClickListener {
            if (currentAuthState() != StatusPrefs.AUTH_STATE_OK) {
                Toast.makeText(
                    this,
                    "Connecte-toi sur ANEF pour ouvrir le chatbot.",
                    Toast.LENGTH_LONG
                ).show()
                return@setOnClickListener
            }
            startActivity(Intent(this, ChatbotActivity::class.java))
        }
    }

    private fun setupWebView(webView: WebView) {
        val cookieManager = CookieManager.getInstance()
        cookieManager.setAcceptCookie(true)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            cookieManager.setAcceptThirdPartyCookies(webView, true)
        }

        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.databaseEnabled = true
        webView.settings.loadsImagesAutomatically = true
        webView.settings.userAgentString = webView.settings.userAgentString + " ANF-Android-App"
        webView.webChromeClient = WebChromeClient()
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                CookieManager.getInstance().flush()
                if (url?.contains("administration-etrangers-en-france", ignoreCase = true) == true) {
                    SessionCookieStore.captureFromWebView(this@MainActivity)
                    SyncScheduler.enqueueImmediateSync(this@MainActivity, trigger = "webview_page_finished")
                }
            }
        }
    }

    private fun refreshStatusPanel() {
        val authState = currentAuthState()
        val syncState = prefs.getString(StatusPrefs.KEY_LAST_SYNC_STATE, "").orEmpty()
        val syncAt = prefs.getLong(StatusPrefs.KEY_LAST_SYNC_AT, 0L)
        val syncError = prefs.getString(StatusPrefs.KEY_LAST_SYNC_ERROR, "").orEmpty()
        val decryptError = prefs.getString(StatusPrefs.KEY_LAST_DECRYPT_ERROR, "").orEmpty()

        val description = prefs.getString(StatusPrefs.KEY_LAST_KNOWN_STATUS_DESCRIPTION, "-").orEmpty()
        val phase = prefs.getString(StatusPrefs.KEY_LAST_KNOWN_STATUS_PHASE, "-").orEmpty()
        val code = prefs.getString(StatusPrefs.KEY_LAST_KNOWN_STATUS_CODE, "-").orEmpty()
        val date = prefs.getString(StatusPrefs.KEY_LAST_KNOWN_STATUS_DATE, "-").orEmpty()
        val dossier = prefs.getString(StatusPrefs.KEY_LAST_KNOWN_DOSSIER_ID, "-").orEmpty()

        val typeDemande = prefs.getString(StatusPrefs.KEY_TYPE_DEMANDE, "").orEmpty()
            .ifBlank { "Acces a la Nationalite Francaise" }
        val timbreFiscal = prefs.getString(StatusPrefs.KEY_TIMBRE_FISCAL, "").orEmpty()
        val demandeDate = prefs.getString(StatusPrefs.KEY_DEMANDE_DATE, "").orEmpty()
        val complementInstructionDate =
            prefs.getString(StatusPrefs.KEY_COMPLEMENT_INSTRUCTION_DATE, "").orEmpty()
        val recepisseDate = prefs.getString(StatusPrefs.KEY_RECEPISSE_COMPLETUDE_DATE, "").orEmpty()
        val assimilationDate = prefs.getString(StatusPrefs.KEY_ASSIMILATION_DATE, "").orEmpty()
        val assimilationPlateforme =
            prefs.getString(StatusPrefs.KEY_ASSIMILATION_PLATEFORME, "").orEmpty()
        val decretId = prefs.getString(StatusPrefs.KEY_DECRET_ID, "").orEmpty()

        binding.txtTypeDemande.text = "Type de demande\n$typeDemande"
        binding.txtTimbreFiscal.text = "N° du timbre Fiscal\n${timbreFiscal.ifBlank { "-" }}"
        binding.txtEtatDemande.text =
            "Etat de la demande\nDerniere sauvegarde: ${formatDateForDisplay(date)}"

        val authText = when (authState) {
            StatusPrefs.AUTH_STATE_EXPIRED -> "Session: EXPIREE (reconnecte-toi dans ANEF)"
            StatusPrefs.AUTH_STATE_ERROR -> "Session: etat inconnu (erreur reseau/API)"
            else -> "Session: OK"
        }
        binding.txtAuthState.text = authText
        binding.txtAuthState.setTextColor(
            when (authState) {
                StatusPrefs.AUTH_STATE_EXPIRED -> Color.parseColor("#B91C1C")
                StatusPrefs.AUTH_STATE_ERROR -> Color.parseColor("#9A3412")
                else -> Color.parseColor("#166534")
            }
        )

        val lastSyncText = if (syncAt > 0L) {
            val formatted = SimpleDateFormat("dd/MM/yyyy HH:mm:ss", Locale.getDefault()).format(Date(syncAt))
            if (syncError.isNotBlank()) {
                "Derniere synchro: $formatted | $syncState | $syncError"
            } else {
                "Derniere synchro: $formatted | $syncState"
            }
        } else {
            "Derniere synchro: -"
        }
        binding.txtLastSync.text = lastSyncText

        val phaseSymbol = when {
            phase.contains("Instruction", ignoreCase = true) -> "[DOC]"
            phase.contains("Entretien", ignoreCase = true) -> "[EA]"
            phase.contains("Controle", ignoreCase = true) -> "[CTL]"
            phase.contains("decret", ignoreCase = true) -> "[DEC]"
            phase.contains("Decision", ignoreCase = true) -> "[RES]"
            else -> "[INFO]"
        }

        binding.txtStatusDesc.text = "Statut: $phaseSymbol $description ($phase)"
        binding.txtStatusBadge.text = "Phase: ${phase.ifBlank { "-" }}"
        binding.txtStatusMeta.text =
            if (code == "code_non_reconnu" && decryptError.isNotBlank()) {
                "Code: $code | Date: ${formatDateForDisplay(date)} | Dossier: ${dossier.ifBlank { "-" }} | decrypt: $decryptError"
            } else {
                "Code: $code | Date: ${formatDateForDisplay(date)} | Dossier: ${dossier.ifBlank { "-" }}"
            }

        applyStatusVisual(authState, phase, code)

        val timelineItems = buildTimelineSteps(
            statusCode = code,
            statusDescription = description,
            statusDate = date,
            demandeDate = demandeDate,
            complementInstructionDate = complementInstructionDate,
            recepisseDate = recepisseDate,
            assimilationDate = assimilationDate,
            assimilationPlateforme = assimilationPlateforme,
            decretId = decretId
        )
        renderTimeline(timelineItems)

        updateLayoutMode(authState)
    }

    private fun buildTimelineSteps(
        statusCode: String,
        statusDescription: String,
        statusDate: String,
        demandeDate: String,
        complementInstructionDate: String,
        recepisseDate: String,
        assimilationDate: String,
        assimilationPlateforme: String,
        decretId: String
    ): List<TimelineStepUi> {
        val currentIndexRaw = inferCurrentTimelineIndex(statusCode)

        val allSteps = listOf(
            Triple("demande_envoyee", "Demande envoyee", android.R.drawable.ic_menu_share),
            Triple("examen_pieces", "Examen des pieces en cours", android.R.drawable.ic_popup_sync),
            Triple("demande_deposee", "Demande deposee", android.R.drawable.ic_menu_save),
            Triple("traitement_plateforme", "Traitement en cours (Plateforme)", android.R.drawable.ic_menu_edit),
            Triple("recepisse_completude", "Reception du recepisse de completude", android.R.drawable.ic_menu_agenda),
            Triple("entretien_assimilation", "Entretien d'assimilation", android.R.drawable.ic_menu_myplaces),
            Triple("controle_administratif", "Controle administratif", android.R.drawable.ic_menu_search),
            Triple("decret_decision", "Decision / decret", android.R.drawable.ic_menu_info_details)
        )
        val currentIndex = currentIndexRaw.coerceIn(0, allSteps.lastIndex)
        val shownEnd = allSteps.lastIndex

        val timeline = mutableListOf<TimelineStepUi>()
        for (index in 0..shownEnd) {
            val def = allSteps[index]
            val badge = when (def.first) {
                "demande_envoyee" -> buildDateBadge(firstNonBlank(demandeDate, statusDate))
                "examen_pieces" -> when {
                    complementInstructionDate.isNotBlank() ->
                        "Complement demande le ${formatDateForDisplay(complementInstructionDate)}"
                    index == currentIndex -> statusDescription
                    index > currentIndex -> "En attente"
                    else -> "-"
                }
                "demande_deposee" -> buildDateBadge(firstNonBlank(demandeDate, statusDate))
                "traitement_plateforme" -> {
                    val platform = assimilationPlateforme.ifBlank { "-" }
                    if (index == currentIndex && statusDescription.isNotBlank()) {
                        if (platform == "-") statusDescription else "Plateforme: $platform"
                    } else if (index > currentIndex) {
                        "En attente"
                    } else {
                        "Plateforme: $platform"
                    }
                }
                "recepisse_completude" -> {
                    val value = buildDateBadge(recepisseDate)
                    if (value == "-" && index > currentIndex) "En attente" else value
                }
                "entretien_assimilation" -> joinNonBlank(
                    buildDateBadge(assimilationDate),
                    if (assimilationPlateforme.isNotBlank()) "Plateforme: $assimilationPlateforme" else ""
                ).ifBlank { if (index > currentIndex) "En attente" else "-" }
                "controle_administratif" -> if (index == currentIndex) statusDescription else if (index > currentIndex) "En attente" else "Controle en cours"
                "decret_decision" -> {
                    if (index > currentIndex) {
                        "En attente"
                    } else {
                        joinNonBlank(
                            if (decretId.isNotBlank()) "Decret N° $decretId" else "",
                            if (index == currentIndex) statusDescription else "",
                            if (index == currentIndex) buildDateBadge(statusDate) else ""
                        ).ifBlank { "-" }
                    }
                }
                else -> "-"
            }

            timeline += TimelineStepUi(
                key = def.first,
                title = def.second,
                iconRes = def.third,
                badge = badge,
                isCurrent = index == currentIndex,
                isPending = index > currentIndex
            )
        }

        return timeline
    }

    private fun inferCurrentTimelineIndex(statusCode: String): Int {
        val code = statusCode.trim().lowercase()
        if (code.isBlank() || code == "-") return 0
        return when {
            code == "draft" || code == "dossier_depose" -> 2
            code.startsWith("verification_") -> 1
            code.startsWith("instruction_") -> if (code.contains("recepisse")) 4 else 1
            code.startsWith("ea_") || code.contains("date_ea") -> 5
            code.startsWith("prop_decision_pref_") -> 6
            code.startsWith("controle_") || code.startsWith("scec_") || code == "non_applicable" -> 6
            code.startsWith("decret_") ||
                code == "transmis_a_ac" ||
                code.contains("insertion_decret") ||
                code.startsWith("decision_") ||
                code.startsWith("css_") ||
                code.contains("irrecevabilite") -> 7
            else -> 1
        }
    }

    private fun renderTimeline(items: List<TimelineStepUi>) {
        binding.timelineContainer.removeAllViews()
        if (items.isEmpty()) return

        items.forEachIndexed { index, step ->
            val itemLayout = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                gravity = Gravity.CENTER_HORIZONTAL
            }

            val iconFrame = FrameLayout(this).apply {
                setBackgroundResource(R.drawable.timeline_icon_bg)
                backgroundTintList = ColorStateList.valueOf(
                    Color.parseColor(
                        when {
                            step.isCurrent -> "#DBEAFE"
                            step.isPending -> "#F8FAFC"
                            else -> "#FFFFFF"
                        }
                    )
                )
                val iconParams = LinearLayout.LayoutParams(dp(46), dp(46))
                layoutParams = iconParams
            }

            val icon = ImageView(this).apply {
                setImageResource(step.iconRes)
                setColorFilter(
                    Color.parseColor(
                        when {
                            step.isCurrent -> "#1E3A8A"
                            step.isPending -> "#94A3B8"
                            else -> "#255A99"
                        }
                    )
                )
            }
            iconFrame.addView(
                icon,
                FrameLayout.LayoutParams(dp(24), dp(24), Gravity.CENTER)
            )

            val dot = View(this).apply {
                setBackgroundResource(R.drawable.timeline_dot)
            }

            val title = TextView(this).apply {
                text = if (step.isCurrent) "${step.title} (etape actuelle)" else step.title
                setTextColor(
                    Color.parseColor(
                        when {
                            step.isCurrent -> "#1F4E8A"
                            step.isPending -> "#64748B"
                            else -> "#1F4E8A"
                        }
                    )
                )
                textSize = 18f
                gravity = Gravity.CENTER
                setTypeface(typeface, android.graphics.Typeface.NORMAL)
            }

            val badge = TextView(this).apply {
                text = step.badge.ifBlank { "-" }
                setTextColor(Color.parseColor(if (step.isPending) "#94A3B8" else "#475569"))
                textSize = 12f
                gravity = Gravity.CENTER
                setPadding(dp(10), dp(3), dp(10), dp(3))
                setBackgroundResource(R.drawable.timeline_badge)
            }

            itemLayout.addView(iconFrame)
            itemLayout.addView(
                dot,
                LinearLayout.LayoutParams(dp(10), dp(10)).apply { topMargin = dp(10) }
            )
            itemLayout.addView(
                title,
                LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply { topMargin = dp(8) }
            )
            itemLayout.addView(
                badge,
                LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply { topMargin = dp(6) }
            )

            binding.timelineContainer.addView(
                itemLayout,
                LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                )
            )

            if (index < items.lastIndex) {
                val connector = View(this).apply {
                    setBackgroundColor(Color.parseColor("#1F4E8A"))
                    alpha = 0.25f
                }
                binding.timelineContainer.addView(
                    connector,
                    LinearLayout.LayoutParams(dp(2), dp(18)).apply {
                        gravity = Gravity.CENTER_HORIZONTAL
                        topMargin = dp(4)
                        bottomMargin = dp(4)
                    }
                )
            }
        }
    }

    private fun updateLayoutMode(authState: String) {
        val isConnected = authState == StatusPrefs.AUTH_STATE_OK
        val showDashboard = isConnected && !forceAnefView

        binding.layoutConnected.visibility = if (showDashboard) View.VISIBLE else View.GONE
        binding.layoutNotConnected.visibility = if (showDashboard) View.GONE else View.VISIBLE

        binding.btnBackDashboard.visibility =
            if (isConnected && forceAnefView) View.VISIBLE else View.GONE

        binding.txtConnectionHint.text =
            if (isConnected && forceAnefView) {
                "Session active. Tu peux consulter ANEF puis revenir au tableau de bord."
            } else {
                getString(R.string.not_connected_hint)
            }
    }

    private fun applyStatusVisual(authState: String, phase: String, code: String) {
        val (panelColor, badgeBgColor, badgeTextColor) = when {
            authState == StatusPrefs.AUTH_STATE_EXPIRED -> Triple("#FEE2E2", "#FECACA", "#991B1B")
            authState == StatusPrefs.AUTH_STATE_ERROR -> Triple("#FFEDD5", "#FED7AA", "#9A3412")
            phase.contains("Instruction", ignoreCase = true) -> Triple("#E8F1FB", "#DBEAFE", "#1E3A8A")
            phase.contains("Entretien", ignoreCase = true) -> Triple("#FFF3E8", "#FFEDD5", "#9A3412")
            phase.contains("Controle", ignoreCase = true) -> Triple("#E8F7FF", "#DBEAFE", "#0C4A6E")
            phase.contains("decret", ignoreCase = true) -> Triple("#E8F9EF", "#DCFCE7", "#166534")
            phase.contains("Decision", ignoreCase = true) -> Triple("#FFF2EC", "#FFEDD5", "#9A3412")
            code == "code_non_reconnu" -> Triple("#F1F5F9", "#E2E8F0", "#334155")
            else -> Triple("#EEF2FF", "#E0E7FF", "#1E3A8A")
        }

        binding.statusPanel.backgroundTintList = ColorStateList.valueOf(Color.parseColor(panelColor))
        binding.txtStatusBadge.backgroundTintList = ColorStateList.valueOf(Color.parseColor(badgeBgColor))
        binding.txtStatusBadge.setTextColor(Color.parseColor(badgeTextColor))
    }

    private fun currentAuthState(): String {
        return prefs.getString(StatusPrefs.KEY_AUTH_STATE, StatusPrefs.AUTH_STATE_EXPIRED).orEmpty()
    }

    private fun requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) ==
            PackageManager.PERMISSION_GRANTED
        ) {
            return
        }
        notifPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
    }

    private fun updateBackgroundSyncButtonVisibility() {
        val shouldShow = shouldShowBackgroundSyncSettingsButton()
        binding.btnBackgroundSyncSettings.visibility = if (shouldShow) View.VISIBLE else View.GONE
    }

    private fun shouldShowBackgroundSyncSettingsButton(): Boolean {
        val batteryOptimizationOk = isIgnoringBatteryOptimizationForApp()
        val backgroundRestricted = isBackgroundRestrictedForApp()
        return !batteryOptimizationOk || backgroundRestricted
    }

    private fun isIgnoringBatteryOptimizationForApp(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true
        val powerManager = getSystemService(POWER_SERVICE) as? PowerManager ?: return false
        return powerManager.isIgnoringBatteryOptimizations(packageName)
    }

    private fun isBackgroundRestrictedForApp(): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) return false
        val activityManager = getSystemService(ACTIVITY_SERVICE) as? ActivityManager ?: return false
        return activityManager.isBackgroundRestricted
    }

    private fun openBackgroundSyncSettings() {
        val targets = mutableListOf<Intent>()

        // Always open app details first: this is the most reliable entry point on all Android devices.
        targets += Intent(
            Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
            Uri.fromParts("package", packageName, null)
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !isIgnoringBatteryOptimizationForApp()) {
            targets += Intent(
                Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                Uri.parse("package:$packageName")
            )
            targets += Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
        }

        targets += Intent(Settings.ACTION_SETTINGS)

        for (intent in targets) {
            if (intent.resolveActivity(packageManager) != null) {
                try {
                    startActivity(intent)
                    return
                } catch (_: ActivityNotFoundException) {
                } catch (_: SecurityException) {
                }
            }
        }

        Toast.makeText(
            this,
            "Impossible d'ouvrir les reglages automatiquement.",
            Toast.LENGTH_LONG
        ).show()
    }

    private fun formatDateForDisplay(raw: String): String {
        if (raw.isBlank() || raw == "-") return "-"
        val patterns = listOf(
            "yyyy-MM-dd'T'HH:mm:ss.SSSX",
            "yyyy-MM-dd'T'HH:mm:ssX",
            "yyyy-MM-dd'T'HH:mm:ss",
            "yyyy-MM-dd"
        )
        for (pattern in patterns) {
            try {
                val parser = SimpleDateFormat(pattern, Locale.getDefault())
                parser.isLenient = true
                val date = parser.parse(raw) ?: continue
                return SimpleDateFormat("dd/MM/yyyy", Locale.getDefault()).format(date)
            } catch (_: Exception) {
            }
        }
        return raw
    }

    private fun buildDateBadge(raw: String): String {
        val date = formatDateForDisplay(raw)
        if (date == "-") return "-"
        val relative = relativeDate(raw)
        return if (relative.isBlank()) date else "$date ($relative)"
    }

    private fun relativeDate(raw: String): String {
        val parsed = parseDate(raw) ?: return ""
        val diffMillis = System.currentTimeMillis() - parsed.time
        val days = (diffMillis / (24L * 60L * 60L * 1000L)).toInt().absoluteValue

        return when {
            days == 0 -> "aujourd'hui"
            days == 1 -> "hier"
            days < 30 -> "il y a $days jours"
            days < 365 -> "il y a ${days / 30} mois"
            else -> {
                val years = days / 365
                val months = (days % 365) / 30
                if (months > 0) {
                    "il y a $years an(s) et $months mois"
                } else {
                    "il y a $years an(s)"
                }
            }
        }
    }

    private fun parseDate(raw: String): Date? {
        if (raw.isBlank() || raw == "-") return null
        val patterns = listOf(
            "yyyy-MM-dd'T'HH:mm:ss.SSSX",
            "yyyy-MM-dd'T'HH:mm:ssX",
            "yyyy-MM-dd'T'HH:mm:ss",
            "yyyy-MM-dd",
            "dd/MM/yyyy"
        )
        for (pattern in patterns) {
            try {
                val parser = SimpleDateFormat(pattern, Locale.getDefault())
                parser.isLenient = true
                val date = parser.parse(raw)
                if (date != null) return date
            } catch (_: Exception) {
            }
        }
        return null
    }

    private fun firstNonBlank(vararg values: String): String {
        for (v in values) {
            if (v.isNotBlank() && v != "-") return v
        }
        return ""
    }

    private fun joinNonBlank(vararg parts: String): String {
        return parts.filter { it.isNotBlank() && it != "-" }.joinToString(" | ")
    }

    private fun dp(value: Int): Int {
        return (value * resources.displayMetrics.density).toInt()
    }

    companion object {
        const val EXTRA_FORCE_ANEF_VIEW = "extra_force_anef_view"
    }
}
