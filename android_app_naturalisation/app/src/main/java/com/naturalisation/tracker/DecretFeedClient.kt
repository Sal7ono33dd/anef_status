package com.naturalisation.tracker

import java.io.IOException
import java.util.concurrent.TimeUnit
import okhttp3.OkHttpClient
import okhttp3.Request

data class PublicDecret(
    val title: String,
    val publicationDate: String,
    val articleUrl: String,
    val pdfUrl: String
)

object DecretFeedClient {
    private const val HOST = "https://www.legifrance.gouv.fr"
    private const val SEARCH_URL =
        "$HOST/search/all?tab_selection=all&searchField=ALL&query=decret+naturalisation+francaise&page=1&init=true"
    private const val JORF_DAILY_URL = "$HOST/jorf/jo"

    private val searchUrls = listOf(
        SEARCH_URL,
        JORF_DAILY_URL
    )

    private val client = OkHttpClient.Builder()
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(35, TimeUnit.SECONDS)
        .build()

    fun fetchLatest(limit: Int = 12): Result<List<PublicDecret>> {
        return try {
            val idCandidates = LinkedHashSet<String>()
            val errors = mutableListOf<String>()

            for (url in searchUrls) {
                try {
                    val html = getHtml(url)
                    extractJorfIds(html).forEach { idCandidates += it }
                } catch (e: Exception) {
                    errors += e.message.orEmpty()
                }
            }

            val decrets = mutableListOf<PublicDecret>()
            for (id in idCandidates) {
                if (decrets.size >= limit) break
                val articleUrl = "$HOST/jorf/id/$id"
                try {
                    val html = getHtml(articleUrl)
                    val parsed = parseArticle(html, articleUrl)
                    if (parsed.title.lowercase().contains("naturalisation")) {
                        decrets += parsed
                    }
                } catch (_: Exception) {
                    // Ignore a single failed article fetch to avoid breaking the whole screen.
                }
            }

            val finalItems = decrets
                .distinctBy { it.articleUrl }
                .take(limit)
                .ifEmpty { fallbackItems(errors.firstOrNull()) }

            Result.success(finalItems)
        } catch (e: Exception) {
            Result.success(fallbackItems(e.message))
        }
    }

    private fun extractJorfIds(html: String): List<String> {
        return Regex("/jorf/id/(JORFTEXT\\d{8,})")
            .findAll(html)
            .map { it.groupValues[1] }
            .distinct()
            .toList()
    }

    private fun fallbackItems(reason: String?): List<PublicDecret> {
        val message = reason?.take(90).orEmpty()
        val hint = if (message.isBlank()) "" else " ($message)"
        return listOf(
            PublicDecret(
                title = "Acces direct a la recherche Legifrance (fallback)$hint",
                publicationDate = "-",
                articleUrl = SEARCH_URL,
                pdfUrl = ""
            ),
            PublicDecret(
                title = "Journal officiel du jour",
                publicationDate = "-",
                articleUrl = JORF_DAILY_URL,
                pdfUrl = ""
            )
        )
    }

    private fun parseArticle(html: String, articleUrl: String): PublicDecret {
        val title = extractMeta(html, "og:title")
            .ifBlank { extractTitleTag(html) }
            .ifBlank { "Decret JORF" }
            .let(::cleanText)

        val publicationDate = Regex("du\\s+(\\d{1,2}\\s+[A-Za-zÀ-ÖØ-öø-ÿ]+\\s+\\d{4})")
            .find(title)
            ?.groupValues
            ?.getOrNull(1)
            .orEmpty()

        val pdfPath = Regex("(/download/file/[^\"']+/JOE_TEXTE)")
            .find(html)
            ?.groupValues
            ?.getOrNull(1)
            .orEmpty()

        return PublicDecret(
            title = title,
            publicationDate = publicationDate.ifBlank { "-" },
            articleUrl = articleUrl,
            pdfUrl = if (pdfPath.isBlank()) "" else HOST + pdfPath
        )
    }

    private fun extractMeta(html: String, property: String): String {
        val pattern = Regex(
            "<meta\\s+property=[\"']$property[\"']\\s+content=[\"']([^\"']+)[\"']",
            RegexOption.IGNORE_CASE
        )
        return pattern.find(html)?.groupValues?.getOrNull(1).orEmpty()
    }

    private fun extractTitleTag(html: String): String {
        val match = Regex("<title>(.*?)</title>", setOf(RegexOption.IGNORE_CASE, RegexOption.DOT_MATCHES_ALL))
            .find(html)
            ?.groupValues
            ?.getOrNull(1)
            .orEmpty()
        return match
    }

    private fun cleanText(input: String): String {
        return input
            .replace(Regex("<[^>]*>"), " ")
            .replace("&nbsp;", " ")
            .replace("&amp;", "&")
            .replace("&quot;", "\"")
            .replace("&#39;", "'")
            .replace(Regex("\\s+"), " ")
            .trim()
    }

    private fun getHtml(url: String): String {
        val request = Request.Builder()
            .url(url)
            .header(
                "User-Agent",
                "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Mobile Safari/537.36"
            )
            .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
            .header("Accept-Language", "fr-FR,fr;q=0.9,en;q=0.8")
            .header("Referer", HOST + "/")
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw IOException("HTTP ${response.code} sur $url")
            }
            return response.body?.string().orEmpty()
        }
    }
}
