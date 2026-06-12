package com.naturalisation.tracker

data class AnefStageDefinition(
    val key: String,
    val title: String,
    val defaultDescription: String
)

object AnefTimeline {
    val orderedStages: List<AnefStageDefinition> = listOf(
        AnefStageDefinition(
            key = "depot",
            title = "1. Depot dossier",
            defaultDescription = "Depot de la demande et enregistrement sur ANEF."
        ),
        AnefStageDefinition(
            key = "instruction",
            title = "2. Instruction prefecture",
            defaultDescription = "Verification du dossier et eventuelles demandes de complement."
        ),
        AnefStageDefinition(
            key = "entretien",
            title = "3. Entretien assimilation",
            defaultDescription = "Entretien (EA) et analyse de ton parcours."
        ),
        AnefStageDefinition(
            key = "controle",
            title = "4. Controle administratif",
            defaultDescription = "Controles administratifs (etat civil, verifications SCEC/SDANF)."
        ),
        AnefStageDefinition(
            key = "decret",
            title = "5. Phase decret",
            defaultDescription = "Preparation puis insertion eventuelle dans un decret."
        ),
        AnefStageDefinition(
            key = "decision",
            title = "6. Decision",
            defaultDescription = "Decision finale (positive, negative ou autre issue notifiee)."
        )
    )

    fun stageKeyFrom(phaseLabel: String, statusCode: String): String {
        val phase = phaseLabel.trim().lowercase()
        val code = statusCode.trim().lowercase()

        return when {
            phase.contains("depot") || code.startsWith("draft") || code.startsWith("dossier_depose") -> "depot"
            phase.contains("instruction") ||
                code.startsWith("verification_") ||
                code.startsWith("instruction_") -> "instruction"
            phase.contains("entretien") || code.startsWith("ea_") -> "entretien"
            phase.contains("controle") ||
                code.startsWith("controle_") ||
                code.startsWith("scec_") ||
                code == "non_applicable" -> "controle"
            phase.contains("decret") ||
                code.startsWith("decret_") ||
                code == "transmis_a_ac" ||
                code.contains("insertion_decret") -> "decret"
            phase.contains("decision") ||
                code.startsWith("decision_") ||
                code.startsWith("css_") ||
                code.contains("irrecevabilite") -> "decision"
            else -> "instruction"
        }
    }

    fun stageIndex(stageKey: String): Int {
        val found = orderedStages.indexOfFirst { it.key == stageKey }
        return if (found >= 0) found else 1
    }
}
