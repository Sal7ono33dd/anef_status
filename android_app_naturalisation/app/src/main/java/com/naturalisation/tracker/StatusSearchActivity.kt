package com.naturalisation.tracker

import android.content.Intent
import android.content.SharedPreferences
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.naturalisation.tracker.databinding.ActivityStatusSearchBinding

private data class StatusForecast(
    val probability: Int,
    val remaining: String,
    val note: String
)

class StatusSearchActivity : AppCompatActivity() {
    private lateinit var binding: ActivityStatusSearchBinding
    private lateinit var prefs: SharedPreferences

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityStatusSearchBinding.inflate(layoutInflater)
        setContentView(binding.root)

        prefs = getSharedPreferences(StatusPrefs.PREFS_NAME, MODE_PRIVATE)

        binding.btnBack.setOnClickListener { finish() }
        binding.btnAnalyzeStatus.setOnClickListener { analyzeStatus() }
        binding.btnQuickEa.setOnClickListener { applyQuickStatus("ea_en_attente_ea") }
        binding.btnQuickControle.setOnClickListener { applyQuickStatus("controle_a_effectuer") }
        binding.btnQuickAc.setOnClickListener { applyQuickStatus("transmis_a_ac") }
        binding.btnQuickInseree.setOnClickListener { applyQuickStatus("inseree_dans_decret") }
        binding.btnOpenEntretien.setOnClickListener {
            startActivity(
                Intent(this, EntretienPrepActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
                }
            )
        }

        BottomNavHelper.setup(
            activity = this,
            bottomNav = binding.bottomNav,
            selectedItemId = R.id.nav_status
        )

        val lastKnownCode = prefs.getString(StatusPrefs.KEY_LAST_KNOWN_STATUS_CODE, "").orEmpty()
        if (lastKnownCode.isNotBlank() && lastKnownCode != "-") {
            binding.edtStatusInput.setText(lastKnownCode)
            analyzeStatus()
        }
    }

    private fun applyQuickStatus(code: String) {
        binding.edtStatusInput.setText(code)
        analyzeStatus()
    }

    private fun analyzeStatus() {
        val input = binding.edtStatusInput.text?.toString()?.trim().orEmpty()
        if (input.isBlank()) {
            Toast.makeText(this, "Saisis un statut pour lancer l'analyse.", Toast.LENGTH_LONG).show()
            return
        }

        val presentation = StatusMapper.fromInput(input)
        val knownCode = StatusMapper.isKnownCode(presentation.code)
        val forecast = estimateStatus(presentation.code)

        binding.txtStatusResultTitle.text = "Explication: ${presentation.description}"
        binding.txtStatusResultMeta.text = buildString {
            append("Code retenu: ${presentation.code}\n")
            append("Phase: ${presentation.phaseLabel}\n")
            append("Chance estimee d'obtention: ${forecast.probability}%\n")
            append("Temps restant estimable: ${forecast.remaining}")
        }
        binding.txtStatusResultHint.text = if (knownCode) {
            forecast.note
        } else {
            "Statut non reconnu exactement. Verifie le code ANEF saisi. ${forecast.note}"
        }
    }

    private fun estimateStatus(codeInput: String): StatusForecast {
        val code = codeInput.lowercase()
        return when {
            code == "decret_publie" ||
                code == "decret_naturalisation_publie" ||
                code == "demande_traitee" ->
                StatusForecast(
                    probability = 100,
                    remaining = "0 mois (decision deja publiee)",
                    note = "Le decret est publie: verifier ensuite les formalites d'etat civil."
                )

            code.startsWith("decision_negative") ||
                code.startsWith("irrecevabilite") ||
                code.startsWith("css_") ->
                StatusForecast(
                    probability = 5,
                    remaining = "Issue defavorable (recours eventuel selon delais)",
                    note = "Consulte rapidement les voies de recours (RAPO/contentieux) si tu es dans les delais."
                )

            code == "inseree_dans_decret" || code == "notification_envoyee" ->
                StatusForecast(
                    probability = 96,
                    remaining = "1 a 4 mois",
                    note = "Dossier tres avance: surveille les notifications et publications."
                )

            code == "prete_pour_insertion_decret" ||
                code == "a_verifier_avant_insertion_decret" ||
                code == "transmis_a_ac" ||
                code == "decret_en_preparation" ||
                code.startsWith("decret_") ->
                StatusForecast(
                    probability = 88,
                    remaining = "2 a 8 mois",
                    note = "Phase decret: delai variable selon charge administrative."
                )

            code.startsWith("controle_") || code.startsWith("scec_") || code == "non_applicable" ->
                StatusForecast(
                    probability = 76,
                    remaining = "4 a 10 mois",
                    note = "Controle administratif en cours: pieces et etat civil peuvent impacter les delais."
                )

            code.startsWith("prop_decision_pref_") ->
                StatusForecast(
                    probability = 70,
                    remaining = "5 a 12 mois",
                    note = "Decision prefectorale en cours de validation/signature."
                )

            code.startsWith("ea_") || code.contains("date_ea") ->
                StatusForecast(
                    probability = 63,
                    remaining = "6 a 14 mois",
                    note = "Etape entretien assimilation: la coherence du dossier est importante."
                )

            code.startsWith("instruction_") || code.startsWith("verification_") ->
                StatusForecast(
                    probability = 55,
                    remaining = "8 a 18 mois",
                    note = "Instruction en cours: complements ou files d'attente peuvent rallonger."
                )

            code == "dossier_depose" ->
                StatusForecast(
                    probability = 40,
                    remaining = "12 a 24 mois",
                    note = "Dossier depose: la phase d'instruction peut prendre du temps."
                )

            code == "draft" ->
                StatusForecast(
                    probability = 22,
                    remaining = "15 a 30 mois",
                    note = "Finalise et depose le dossier pour entrer dans le flux d'instruction."
                )

            else ->
                StatusForecast(
                    probability = 50,
                    remaining = "6 a 18 mois (approximation)",
                    note = "Estimation indicative uniquement, a confirmer par les updates ANEF."
                )
        }
    }
}
