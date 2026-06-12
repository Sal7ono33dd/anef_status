package com.naturalisation.tracker

import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.button.MaterialButton
import com.naturalisation.tracker.databinding.ActivityDecretsBinding

class DecretsActivity : AppCompatActivity() {
    private lateinit var binding: ActivityDecretsBinding
    private var loading = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDecretsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnBack.setOnClickListener { finish() }
        BottomNavHelper.setup(
            activity = this,
            bottomNav = binding.bottomNav,
            selectedItemId = R.id.nav_decrets
        )
        binding.btnRefresh.setOnClickListener { loadDecrets(force = true) }

        loadDecrets(force = false)
    }

    private fun loadDecrets(force: Boolean) {
        if (loading) return
        loading = true
        binding.btnRefresh.isEnabled = false
        binding.txtStatus.text = if (force) "Actualisation en cours..." else getString(R.string.decrets_loading)

        Thread {
            val result = DecretFeedClient.fetchLatest()
            runOnUiThread {
                loading = false
                binding.btnRefresh.isEnabled = true

                result.onSuccess { items ->
                    binding.txtStatus.text = "Derniere mise a jour: ${items.size} resultat(s)"
                    renderItems(items)
                }.onFailure { error ->
                    binding.txtStatus.text = "Erreur: ${error.message.orEmpty()}"
                    renderItems(emptyList())
                }
            }
        }.start()
    }

    private fun renderItems(items: List<PublicDecret>) {
        binding.decretsContainer.removeAllViews()
        if (items.isEmpty()) {
            val empty = TextView(this).apply {
                text = "Aucun decret disponible pour le moment."
                setTextColor(Color.parseColor("#64748B"))
                textSize = 14f
            }
            binding.decretsContainer.addView(empty)
            return
        }

        items.forEachIndexed { index, decret ->
            val card = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                setBackgroundResource(R.drawable.panel_bg)
                setPadding(dp(12), dp(10), dp(12), dp(10))
            }

            val title = TextView(this).apply {
                text = decret.title
                setTextColor(Color.parseColor("#1F2937"))
                textSize = 15f
                setTypeface(typeface, android.graphics.Typeface.BOLD)
            }
            val date = TextView(this).apply {
                text = "Date de publication: ${decret.publicationDate}"
                setTextColor(Color.parseColor("#475569"))
                textSize = 13f
            }

            val actions = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
            }

            val btnOpen = MaterialButton(this).apply {
                text = "Ouvrir"
                setOnClickListener { openUrl(decret.articleUrl) }
            }
            actions.addView(
                btnOpen,
                LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            )

            val btnDownload = MaterialButton(this).apply {
                text = if (decret.pdfUrl.isBlank()) "PDF indisponible" else "Telecharger PDF"
                isEnabled = decret.pdfUrl.isNotBlank()
                setOnClickListener {
                    if (decret.pdfUrl.isBlank()) return@setOnClickListener
                    downloadPdf(decret)
                }
            }
            actions.addView(
                btnDownload,
                LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f).apply {
                    leftMargin = dp(8)
                }
            )

            card.addView(title)
            card.addView(date)
            card.addView(
                actions,
                LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    topMargin = dp(8)
                }
            )

            binding.decretsContainer.addView(
                card,
                LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                ).apply { topMargin = if (index == 0) 0 else dp(8) }
            )
        }
    }

    private fun downloadPdf(decret: PublicDecret) {
        try {
            val filename = buildFilename(decret)
            val request = DownloadManager.Request(Uri.parse(decret.pdfUrl))
                .setTitle(filename)
                .setDescription("Decret naturalisation")
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                .setMimeType("application/pdf")
                .setDestinationInExternalFilesDir(
                    this,
                    Environment.DIRECTORY_DOWNLOADS,
                    filename
                )
            val manager = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            manager.enqueue(request)
            Toast.makeText(this, "Telechargement lance: $filename", Toast.LENGTH_LONG).show()
        } catch (e: Exception) {
            Toast.makeText(this, "Impossible de telecharger, ouverture du lien PDF.", Toast.LENGTH_LONG).show()
            openUrl(decret.pdfUrl)
        }
    }

    private fun buildFilename(decret: PublicDecret): String {
        val base = decret.title
            .replace(Regex("[^A-Za-z0-9 _-]"), "")
            .replace(Regex("\\s+"), "_")
            .take(70)
            .ifBlank { "decret_naturalisation" }
        return "$base.pdf"
    }

    private fun openUrl(url: String) {
        if (url.isBlank()) return
        startActivity(
            Intent(Intent.ACTION_VIEW, Uri.parse(url))
        )
    }

    private fun dp(value: Int): Int {
        return (value * resources.displayMetrics.density).toInt()
    }
}
