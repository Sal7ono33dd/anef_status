package com.naturalisation.tracker

import java.io.IOException
import java.util.concurrent.TimeUnit
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject

data class ChatTurn(val role: String, val content: String)

private data class PerplexityRequestPlan(
    val endpoint: String,
    val model: String,
    val includeSystemPrompt: Boolean
)

private class PerplexityHttpException(
    val statusCode: Int,
    val detail: String
) : IOException("Perplexity HTTP $statusCode: $detail")

object PerplexityClient {
    private const val API_URL_V1 = "https://api.perplexity.ai/v1/sonar"
    private const val API_URL_COMPAT = "https://api.perplexity.ai/chat/completions"

    private val client = OkHttpClient.Builder()
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(45, TimeUnit.SECONDS)
        .writeTimeout(20, TimeUnit.SECONDS)
        .build()

    private const val SYSTEM_PROMPT = """
Tu es un assistant expert de la procedure de naturalisation francaise (ANEF).
Tu aides de facon claire, concrete et pedagogique.
Tu expliques les etapes, les documents, les statuts, les delais habituels, et les bonnes pratiques de suivi.
Si la question depend de la prefecture ou d'un cas particulier, signale-le explicitement.
Tu ne donnes pas de conseil juridique ferme; tu fournis une information generale pratique.
Reponds en francais simple et structure.
"""

    fun ask(history: List<ChatTurn>): Result<String> {
        val token = BuildConfig.PPLX_API_KEY.trim()
        if (token.isBlank()) {
            return Result.failure(IllegalStateException("Token Perplexity manquant."))
        }

        val plans = listOf(
            PerplexityRequestPlan(
                endpoint = API_URL_V1,
                model = "sonar-pro",
                includeSystemPrompt = true
            ),
            PerplexityRequestPlan(
                endpoint = API_URL_V1,
                model = "sonar",
                includeSystemPrompt = true
            ),
            // Fallback minimaliste en cas de HTTP 400 sur une cle/model/format.
            PerplexityRequestPlan(
                endpoint = API_URL_V1,
                model = "sonar",
                includeSystemPrompt = false
            ),
            PerplexityRequestPlan(
                endpoint = API_URL_COMPAT,
                model = "sonar",
                includeSystemPrompt = false
            )
        )

        var lastError: Throwable = IOException("Perplexity: aucun essai execute.")

        for (plan in plans) {
            val result = runSingleAttempt(
                token = token,
                history = history,
                plan = plan
            )
            if (result.isSuccess) {
                return result
            }

            val failure = result.exceptionOrNull()
            if (failure != null) {
                lastError = failure
            }

            if (failure is PerplexityHttpException) {
                if (failure.statusCode == 401 || failure.statusCode == 403) {
                    return Result.failure(
                        IOException("Authentification Perplexity invalide ou non autorisee (${failure.statusCode}).")
                    )
                }
                if (failure.statusCode != 400 && failure.statusCode != 404) {
                    return Result.failure(failure)
                }
            }
        }

        return Result.failure(lastError)
    }

    private fun runSingleAttempt(
        token: String,
        history: List<ChatTurn>,
        plan: PerplexityRequestPlan
    ): Result<String> {
        return try {
            val messages = buildMessages(
                history = history,
                includeSystemPrompt = plan.includeSystemPrompt
            )
            val payload = JSONObject()
                .put("model", plan.model)
                .put("messages", messages)
                .put("language_preference", "fr")

            val request = Request.Builder()
                .url(plan.endpoint)
                .addHeader("Authorization", "Bearer $token")
                .addHeader("Content-Type", "application/json")
                .post(payload.toString().toRequestBody("application/json".toMediaType()))
                .build()

            client.newCall(request).execute().use { response ->
                val body = response.body?.string().orEmpty()
                if (!response.isSuccessful) {
                    val detail = extractErrorDetail(body)
                    return Result.failure(
                        PerplexityHttpException(
                            statusCode = response.code,
                            detail = detail
                        )
                    )
                }

                val text = parseContent(body)
                if (text.isBlank()) {
                    return Result.failure(IOException("Perplexity: reponse vide."))
                }
                Result.success(text)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun buildMessages(
        history: List<ChatTurn>,
        includeSystemPrompt: Boolean
    ): JSONArray {
        val messages = JSONArray()

        if (includeSystemPrompt) {
            messages.put(
                JSONObject()
                    .put("role", "system")
                    .put("content", SYSTEM_PROMPT.trim())
            )
        }

        val normalized = history.takeLast(24).mapNotNull { turn ->
            val content = turn.content.trim()
            if (content.isBlank()) return@mapNotNull null

            val role = when (turn.role.trim().lowercase()) {
                "assistant" -> "assistant"
                else -> "user"
            }
            role to content
        }.toMutableList()

        while (normalized.isNotEmpty() && normalized.first().first != "user") {
            normalized.removeAt(0)
        }

        val compact = mutableListOf<Pair<String, String>>()
        normalized.forEach { (role, content) ->
            val last = compact.lastOrNull()
            if (last != null && last.first == role) {
                compact[compact.lastIndex] = role to (last.second + "\n\n" + content)
            } else {
                compact += role to content
            }
        }

        compact.forEach { (role, content) ->
            messages.put(
                JSONObject()
                    .put("role", role)
                    .put("content", content.trim())
            )
        }

        if (messages.length() == 0) {
            messages.put(
                JSONObject()
                    .put("role", "user")
                    .put("content", "Bonjour, aide-moi sur la procedure ANEF.")
            )
        } else {
            val lastRole = messages.optJSONObject(messages.length() - 1)?.optString("role").orEmpty()
            if (lastRole != "user") {
                messages.put(
                    JSONObject()
                        .put("role", "user")
                        .put("content", "Continue avec les informations pratiques suivantes.")
                )
            }
        }

        return messages
    }

    private fun parseContent(raw: String): String {
        val root = JSONObject(raw)
        val choices = root.optJSONArray("choices") ?: return ""
        if (choices.length() == 0) return ""
        val first = choices.optJSONObject(0) ?: return ""
        val message = first.optJSONObject("message") ?: return ""
        val contentAny = message.opt("content")

        return when (contentAny) {
            is String -> contentAny.trim()
            is JSONArray -> {
                buildString {
                    for (i in 0 until contentAny.length()) {
                        val item = contentAny.opt(i)
                        val txt = when (item) {
                            is String -> item
                            is JSONObject -> item.optString("text")
                            else -> ""
                        }
                        if (txt.isNotBlank()) {
                            if (isNotEmpty()) append("\n")
                            append(txt.trim())
                        }
                    }
                }.trim()
            }
            else -> ""
        }
    }

    private fun extractErrorDetail(body: String): String {
        if (body.isBlank()) return "erreur sans detail."
        return try {
            val root = JSONObject(body)
            val nested = root.optJSONObject("error")
            val nestedMsg = nested?.optString("message").orEmpty()
            val topMsg = root.optString("message").orEmpty()
            val detail = when {
                nestedMsg.isNotBlank() -> nestedMsg
                topMsg.isNotBlank() -> topMsg
                else -> body
            }
            detail.replace("\n", " ").trim().take(300)
        } catch (_: Exception) {
            body.replace("\n", " ").trim().take(300)
        }
    }
}
