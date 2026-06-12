package com.naturalisation.tracker

import java.text.Normalizer

data class StatusPresentation(
    val code: String,
    val description: String,
    val phaseLabel: String
)

object StatusMapper {
    private val statusMap = mapOf(
        "draft" to "Dossier en brouillon",
        "dossier_depose" to "Dossier depose",
        "verification_formelle_a_traiter" to "Prefecture: verification a traiter",
        "verification_formelle_en_cours" to "Prefecture: verification formelle en cours",
        "verification_formelle_mise_en_demeure" to "Prefecture: mise en demeure",
        "instruction_a_affecter" to "Prefecture: attente affectation",
        "instruction_recepisse_completude_a_envoyer" to "Prefecture: recepisse a envoyer",
        "instruction_recepisse_completude_a_envoyer_retour_complement_a_traiter" to "Prefecture: complements a verifier",
        "instruction_date_ea_a_fixer" to "Prefecture: date entretien a fixer",
        "ea_demande_report_ea" to "Prefecture: demande report entretien",
        "ea_en_attente_ea" to "Prefecture: attente convocation entretien",
        "ea_crea_a_valider" to "Prefecture: entretien passe, compte-rendu a valider",
        "prop_decision_pref_a_effectuer" to "Prefecture: decision a effectuer",
        "prop_decision_pref_en_attente_retour_hierarchique" to "Prefecture: attente retour hierarchique",
        "prop_decision_pref_en_attente_retour_hierarchiqu" to "Prefecture: attente retour hierarchique",
        "prop_decision_pref_prop_a_editer" to "Prefecture: decision prise, redaction en cours",
        "prop_decision_pref_en_attente_retour_signataire" to "Prefecture: attente retour signataire",
        "controle_a_affecter" to "SDANF: attente affectation",
        "controle_a_effectuer" to "SDANF: controle etat civil a effectuer",
        "controle_en_attente_pec" to "SCEC: attente validation piece etat civil",
        "controle_pec_a_faire" to "SCEC: validation en cours piece etat civil",
        "controle_transmise_pour_decret" to "SDANF: decret transmis pour approbation",
        "controle_en_attente_retour_hierarchique" to "SDANF: attente retour hierarchique decret",
        "controle_decision_a_editer" to "SDANF: decision prise, edition prochaine",
        "controle_en_attente_signature" to "SDANF: attente signature",
        "controle_demande_notifiee" to "Controle: demande notifiee",
        "transmis_a_ac" to "Decret: dossier transmis au service decret",
        "a_verifier_avant_insertion_decret" to "Decret: verification avant insertion",
        "prete_pour_insertion_decret" to "Decret: dossier pret pour insertion",
        "inseree_dans_decret" to "Decret: demande inseree dans decret",
        "decret_envoye_prefecture" to "Decret envoye a prefecture",
        "notification_envoyee" to "Decret: notification envoyee",
        "demande_traitee" to "Decret: demande finalisee",
        "decret_naturalisation_publie" to "Decision: decret de naturalisation publie",
        "decret_en_preparation" to "Decision: decret en preparation",
        "decret_a_qualifier" to "Decision: decret a qualifier",
        "decret_en_validation" to "Decision: decret en validation",
        "decision_negative_en_delais_recours" to "Decision negative en delais de recours",
        "irrecevabilite_manifeste" to "Decision: irrecevabilite manifeste",
        "irrecevabilite_manifeste_en_delais_recours" to "Decision: irrecevabilite en delais de recours",
        "decision_notifiee" to "Decision notifiee",
        "demande_en_cours_rapo" to "Decision: demande en cours RAPO",
        "decret_publie" to "Decret de naturalisation publie",
        "css_en_delais_recours" to "Classement sans suite en delais de recours",
        "css_notifie" to "Classement sans suite notifie",
        "css_mise_en_demeure_a_affecter" to "CSS: mise en demeure a affecter",
        "css_manuels_a_affecter" to "CSS manuels a affecter",
        "css_manuels_a_rediger" to "CSS manuels a rediger",
        "css_mise_en_demeure_a_rediger" to "CSS mise en demeure a rediger",
        "css_automatiques_a_affecter" to "CSS automatiques a affecter",
        "css_automatiques_a_rediger" to "CSS automatiques a rediger",
        "prenat_a_traiter" to "Prenaturalisation: a traiter",
        "prenat_en_cours" to "Prenaturalisation: en cours",
        "prenat_en_attente_complements" to "Prenaturalisation: attente complements",
        "prenat_cloture" to "Prenaturalisation: cloturee",
        "scec_a_faire" to "SCEC a faire",
        "scec_en_cours" to "SCEC en cours",
        "scec_en_attente" to "SCEC en attente",
        "scec_bloque" to "SCEC bloque",
        "scec_termine" to "SCEC termine",
        "non_applicable" to "SCEC non attribuable",
        "code_non_reconnu" to "Code non reconnu"
    )

    fun fromCode(inputCode: String?): StatusPresentation {
        val code = inputCode?.trim()?.lowercase().orEmpty().ifBlank { "code_non_reconnu" }
        val description = statusMap[code] ?: code
        val phase = when {
            code.startsWith("verification_") || code.startsWith("instruction_") -> "Instruction prefecture"
            code.startsWith("ea_") -> "Entretien assimilation"
            code.startsWith("controle_") || code.startsWith("scec_") || code == "non_applicable" -> "Controle administratif"
            code.startsWith("decret_") || code.startsWith("transmis_a_ac") || code.contains("insertion_decret") -> "Phase decret"
            code.startsWith("decision_") || code.startsWith("css_") || code.contains("irrecevabilite") -> "Decision"
            code.startsWith("draft") || code.startsWith("dossier_depose") -> "Depot dossier"
            else -> "Suivi dossier"
        }
        return StatusPresentation(code = code, description = description, phaseLabel = phase)
    }

    fun fromInput(input: String?): StatusPresentation {
        val raw = input?.trim().orEmpty()
        if (raw.isBlank()) {
            return fromCode("code_non_reconnu")
        }

        val codeCandidate = raw.lowercase()
            .replace(Regex("[\\s\\-]+"), "_")
            .replace(Regex("[^a-z0-9_]+"), "")
        if (statusMap.containsKey(codeCandidate)) {
            return fromCode(codeCandidate)
        }

        val normalizedInput = normalizeForMatch(raw)
        val byDescriptionExact = statusMap.entries.firstOrNull {
            normalizeForMatch(it.value) == normalizedInput
        }?.key
        if (byDescriptionExact != null) {
            return fromCode(byDescriptionExact)
        }

        val byCodeContains = statusMap.keys.firstOrNull {
            val normalizedCode = normalizeForMatch(it)
            normalizedCode.contains(normalizedInput) || normalizedInput.contains(normalizedCode)
        }
        if (byCodeContains != null) {
            return fromCode(byCodeContains)
        }

        val byDescriptionContains = statusMap.entries.firstOrNull {
            normalizeForMatch(it.value).contains(normalizedInput)
        }?.key
        if (byDescriptionContains != null) {
            return fromCode(byDescriptionContains)
        }

        return fromCode(codeCandidate)
    }

    fun isKnownCode(inputCode: String?): Boolean {
        val code = inputCode?.trim()?.lowercase().orEmpty()
        return statusMap.containsKey(code)
    }

    private fun normalizeForMatch(text: String): String {
        val normalized = Normalizer.normalize(text.lowercase(), Normalizer.Form.NFD)
        return normalized
            .replace(Regex("\\p{Mn}+"), "")
            .replace(Regex("[^a-z0-9]+"), " ")
            .trim()
    }
}
