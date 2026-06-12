package com.naturalisation.tracker

import android.content.Context
import java.io.IOException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONException
import org.json.JSONObject

data class RawStatusSnapshot(
    val dossierId: String,
    val encryptedStatus: String,
    val statusDate: String,
    val typeDemande: String,
    val timbreFiscal: String,
    val demandeDate: String,
    val complementInstructionDate: String,
    val recepisseCompletuDate: String,
    val assimilationDate: String,
    val assimilationPlateforme: String,
    val decretId: String
)

sealed class AnefFetchResult {
    data class Success(val data: RawStatusSnapshot) : AnefFetchResult()
    data class AuthExpired(val reason: String) : AnefFetchResult()
    data class Error(val reason: String) : AnefFetchResult()
}

private data class HttpSnapshot(
    val code: Int,
    val contentType: String,
    val body: String,
    val finalUrl: String,
    val hadRedirect: Boolean
)

object AnefApiClient {
    const val ANEF_HOME_URL = "https://administration-etrangers-en-france.interieur.gouv.fr/"
    private const val API_STEPPER_ENDPOINT =
        "https://administration-etrangers-en-france.interieur.gouv.fr/api/anf/dossier-stepper"
    private const val API_DOSSIER_ENDPOINT =
        "https://administration-etrangers-en-france.interieur.gouv.fr/api/anf/usager/dossiers/"
    private const val API_NOTIFICATIONS_ENDPOINT =
        "https://administration-etrangers-en-france.interieur.gouv.fr/api/notifications"

    private val client = OkHttpClient.Builder()
        .followRedirects(true)
        .followSslRedirects(true)
        .build()

    suspend fun fetchCurrentStatus(context: Context): AnefFetchResult = withContext(Dispatchers.IO) {
        val cookie = SessionCookieStore.resolveForRequest(context)
        if (cookie.isBlank()) {
            return@withContext AnefFetchResult.AuthExpired("Aucun cookie de session ANEF.")
        }

        try {
            val stepper = makeRequest(url = API_STEPPER_ENDPOINT, cookie = cookie)
            if (isRedirectedToLogin(stepper.finalUrl, stepper.hadRedirect)) {
                return@withContext AnefFetchResult.AuthExpired(
                    "Session expiree (redirection vers connexion)."
                )
            }

            if (stepper.code == 401 || stepper.code == 403) {
                return@withContext AnefFetchResult.AuthExpired(
                    "Session expiree (${stepper.code})."
                )
            }

            if (stepper.code !in 200..299) {
                return@withContext AnefFetchResult.Error("API indisponible (${stepper.code}).")
            }

            if (!stepper.contentType.contains("application/json")) {
                return@withContext AnefFetchResult.AuthExpired(
                    "Reponse ANEF inattendue (${stepper.contentType.ifBlank { "unknown" }})."
                )
            }

            val stepperJson = try {
                JSONObject(stepper.body)
            } catch (_: JSONException) {
                return@withContext AnefFetchResult.AuthExpired(
                    "JSON invalide (session potentiellement expiree)."
                )
            }

            val dossier = stepperJson.optJSONObject("dossier")
            val encryptedStatus = dossier?.optString("statut").orEmpty()
            val statusDate = dossier?.optString("date_statut").orEmpty()
            val dossierId = dossier?.opt("id")?.toString().orEmpty()

            if (encryptedStatus.isBlank()) {
                val unauthorizedLike = Regex(
                    "(non\\s*autor|unauthor|session|expire|auth|connexion)",
                    RegexOption.IGNORE_CASE
                ).containsMatchIn(stepper.body)
                if (unauthorizedLike) {
                    return@withContext AnefFetchResult.AuthExpired(
                        "Session expiree (statut indisponible)."
                    )
                }
                return@withContext AnefFetchResult.Error("Statut dossier absent dans la reponse.")
            }

            var typeDemande = firstNonBlank(
                dossier?.optString("type_demande").orEmpty(),
                dossier?.optString("libelle_type_demande").orEmpty()
            )
            var timbreFiscal = ""
            var demandeDate = ""
            var complementInstructionDate = ""
            var assimilationDate = ""
            var assimilationPlateforme = ""
            var decretId = ""
            var recepisseCompletuDate = ""

            if (dossierId.isNotBlank()) {
                val detailsJson = fetchDossierDetailsJson(cookie = cookie, dossierId = dossierId)
                if (detailsJson != null) {
                    typeDemande = firstNonBlank(
                        typeDemande,
                        readPath(detailsJson, "demande", "type_demande", "libelle"),
                        readPath(detailsJson, "demande", "type_demande"),
                        readPath(detailsJson, "demande", "libelle_type_demande"),
                        readPath(detailsJson, "type_demande")
                    )
                    timbreFiscal = firstNonBlank(
                        readPath(detailsJson, "taxe_payee", "numero_timbre"),
                        readPath(detailsJson, "taxe_payee", "numero"),
                        readPath(detailsJson, "taxe_payee", "reference")
                    )
                    demandeDate = firstNonBlank(
                        readPath(detailsJson, "taxe_payee", "date_consommation"),
                        readPath(detailsJson, "demande", "date_depot"),
                        readPath(detailsJson, "date_creation")
                    )
                    complementInstructionDate = extractLatestComplementInstructionDate(detailsJson)
                    assimilationDate = readPath(detailsJson, "entretien_assimilation", "date_rdv")
                    assimilationPlateforme = readPath(
                        detailsJson,
                        "entretien_assimilation",
                        "unite_gestion",
                        "nom_plateforme"
                    )
                    decretId = extractFirstDecretId(detailsJson)
                }

                recepisseCompletuDate = fetchRecepisseCompletuDate(
                    cookie = cookie,
                    dossierId = dossierId
                )
            }

            if (typeDemande.isBlank()) {
                typeDemande = "Acces a la Nationalite Francaise"
            }

            return@withContext AnefFetchResult.Success(
                RawStatusSnapshot(
                    dossierId = dossierId,
                    encryptedStatus = encryptedStatus,
                    statusDate = statusDate,
                    typeDemande = typeDemande,
                    timbreFiscal = timbreFiscal,
                    demandeDate = demandeDate,
                    complementInstructionDate = complementInstructionDate,
                    recepisseCompletuDate = recepisseCompletuDate,
                    assimilationDate = assimilationDate,
                    assimilationPlateforme = assimilationPlateforme,
                    decretId = decretId
                )
            )
        } catch (io: IOException) {
            return@withContext AnefFetchResult.Error("Erreur reseau: ${io.message.orEmpty()}")
        } catch (ex: Exception) {
            return@withContext AnefFetchResult.Error("Erreur inattendue: ${ex.message.orEmpty()}")
        }
    }

    private fun fetchDossierDetailsJson(cookie: String, dossierId: String): JSONObject? {
        val raw = makeRequest(url = API_DOSSIER_ENDPOINT + dossierId, cookie = cookie)
        if (raw.code !in 200..299) return null
        if (!raw.contentType.contains("application/json")) return null

        val json = try {
            JSONObject(raw.body)
        } catch (_: JSONException) {
            return null
        }

        return json.optJSONObject("data") ?: json
    }

    private fun fetchRecepisseCompletuDate(cookie: String, dossierId: String): String {
        return try {
            val raw = makeRequest(url = API_NOTIFICATIONS_ENDPOINT, cookie = cookie)
            if (raw.code !in 200..299) return ""
            if (!raw.contentType.contains("application/json")) return ""

            val root = JSONObject(raw.body)
            val items = root.optJSONArray("_items") ?: return ""
            var newest: String = ""
            for (i in 0 until items.length()) {
                val item = items.optJSONObject(i) ?: continue
                val idDemande = item.opt("id_demande")?.toString().orEmpty()
                val typeNotification = item.optString("type_notification").orEmpty()
                val motif = item.optString("motif_notification").orEmpty()

                if (idDemande != dossierId) continue
                if (typeNotification != "NATIONALITE") continue
                if (motif != "RECEPISSE_COMPLETUDE_ENVOYE") continue

                val created = item.optString("_created").orEmpty()
                if (created.isBlank()) continue
                if (newest.isBlank() || created > newest) {
                    newest = created
                }
            }
            newest
        } catch (_: Exception) {
            ""
        }
    }

    private fun extractLatestComplementInstructionDate(details: JSONObject): String {
        val complements = details.optJSONArray("demande_complement") ?: return ""
        var newest = ""
        for (i in 0 until complements.length()) {
            val item = complements.optJSONObject(i) ?: continue
            val type = item.optString("type_complement").orEmpty()
            if (type != "COMPLEMENT_INSTRUCTION") continue
            val created = item.optString("date_creation_demande").orEmpty()
            if (created.isBlank()) continue
            if (newest.isBlank() || created > newest) {
                newest = created
            }
        }
        return newest
    }

    private fun extractFirstDecretId(details: JSONObject): String {
        val identites = details.optJSONObject("demande")
            ?.optJSONObject("informations")
            ?.optJSONObject("etat_civil")
            ?.optJSONArray("identites_decrets") ?: return ""

        for (i in 0 until identites.length()) {
            val identite = identites.optJSONObject(i) ?: continue
            val decretId = identite.optJSONObject("decret")?.opt("id")?.toString().orEmpty()
            if (decretId.isNotBlank()) return decretId
        }
        return ""
    }

    private fun makeRequest(url: String, cookie: String): HttpSnapshot {
        val request = Request.Builder()
            .url(url)
            .header("Accept", "application/json, text/plain, */*")
            .header("Cookie", cookie)
            .header("Cache-Control", "no-cache")
            .build()

        client.newCall(request).execute().use { response ->
            return HttpSnapshot(
                code = response.code,
                contentType = response.header("Content-Type").orEmpty().lowercase(),
                body = response.body?.string().orEmpty(),
                finalUrl = response.request.url.toString(),
                hadRedirect = response.priorResponse != null
            )
        }
    }

    private fun isRedirectedToLogin(finalUrl: String, hadRedirect: Boolean): Boolean {
        if (!hadRedirect) return false
        return Regex("(connexion|login|auth|sso|compte)", RegexOption.IGNORE_CASE)
            .containsMatchIn(finalUrl)
    }

    private fun readPath(root: JSONObject?, vararg keys: String): String {
        if (root == null || keys.isEmpty()) return ""
        var current: Any = root
        for ((index, key) in keys.withIndex()) {
            val asObj = current as? JSONObject ?: return ""
            val next = asObj.opt(key) ?: return ""
            if (index == keys.lastIndex) {
                return next.toString().trim()
            }
            current = next
        }
        return ""
    }

    private fun firstNonBlank(vararg values: String): String {
        for (v in values) {
            if (v.isNotBlank()) return v.trim()
        }
        return ""
    }
}
