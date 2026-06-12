package com.naturalisation.tracker

import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.widget.CheckBox
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.button.MaterialButton
import com.naturalisation.tracker.databinding.ActivityEntretienPrepBinding

private data class PrepSection(
    val title: String,
    val items: List<String>
)

private data class InterviewQa(
    val question: String,
    val answer: String
)

private data class PrepDocument(
    val title: String,
    val source: String,
    val url: String
)

class EntretienPrepActivity : AppCompatActivity() {
    private lateinit var binding: ActivityEntretienPrepBinding
    private lateinit var docsSearchInput: EditText

    private val sections = listOf(
        PrepSection(
            title = "1) Documents a preparer",
            items = listOf(
                "Piece d'identite et titre de sejour valides.",
                "Convocation entretien (papier ou capture lisible).",
                "Justificatifs de domicile recents.",
                "Diplomes/attestations selon ton dossier.",
                "Copies des documents transmis sur ANEF."
            )
        ),
        PrepSection(
            title = "2) Checklist la veille",
            items = listOf(
                "Verifier date, heure, adresse et trajet.",
                "Classer les documents dans un ordre logique.",
                "Relire ton parcours declare sur ANEF.",
                "Preparer des reponses courtes et coherentes.",
                "Dormir suffisamment et arriver en avance."
            )
        ),
        PrepSection(
            title = "3) Bonnes pratiques le jour J",
            items = listOf(
                "Repondre calmement et de facon precise.",
                "Dire la verite, meme si la reponse est \"je ne sais pas\".",
                "Demander une reformulation si une question est floue.",
                "Montrer une bonne comprehension des valeurs republicaines.",
                "Conserver convocation/recepisse apres l'entretien."
            )
        )
    )

    private val interviewSamples = listOf(
        InterviewQa(
            question = "Pourquoi souhaitez-vous devenir francais(e) ?",
            answer = "Je souhaite m'inscrire durablement dans la vie civique et sociale en France, ou je vis et travaille."
        ),
        InterviewQa(
            question = "Que signifie la devise \"Liberte, Egalite, Fraternite\" ?",
            answer = "C'est la base des valeurs republicaines: droits fondamentaux, egalite devant la loi et solidarite entre citoyens."
        ),
        InterviewQa(
            question = "Quel est le role du Parlement ?",
            answer = "Il vote la loi et controle l'action du Gouvernement (Assemblee nationale + Senat)."
        ),
        InterviewQa(
            question = "Qu'est-ce que la laicite ?",
            answer = "La neutralite de l'Etat vis-a-vis des religions, avec liberte de conscience et respect de la loi commune."
        ),
        InterviewQa(
            question = "Quels sont vos devoirs en tant que futur citoyen ?",
            answer = "Respecter les lois, participer a la vie citoyenne, payer l'impot et contribuer a la cohesion sociale."
        ),
        InterviewQa(
            question = "Comment participez-vous a la vie en France ?",
            answer = "Par mon travail, ma vie locale, mes relations sociales et mon respect des regles et institutions."
        )
    )

    private val historyHighlights = listOf(
        "1789: Revolution francaise, DDHC, souverainete du peuple.",
        "1792: Proclamation de la Premiere Republique.",
        "1905: Loi de separation des Eglises et de l'Etat (laicite).",
        "1944: Droit de vote des femmes.",
        "1958: Constitution de la Ve Republique.",
        "Valeurs clefs: liberte, egalite, fraternite, laicite, respect de la loi."
    )

    private val officialDocs = listOf(
        PrepDocument(
            title = "Livret du citoyen (PDF officiel)",
            source = "DGEF / Ministere de l'Interieur",
            url = "https://www.immigration.interieur.gouv.fr/sites/dgef/files/2025-04/Livret-du-citoyen-accessible.pdf"
        ),
        PrepDocument(
            title = "Charte des droits et devoirs du citoyen francais (PDF)",
            source = "Ministere de l'Interieur",
            url = "https://www.interieur.gouv.fr/content/download/36234/273742/file/Chartedesdroitsetdevoirs.pdf"
        ),
        PrepDocument(
            title = "Constitution de la Ve Republique (texte officiel)",
            source = "Legifrance",
            url = "https://www.legifrance.gouv.fr/loda/id/LEGITEXT000006071194/"
        ),
        PrepDocument(
            title = "Recherche naturalisation (guide administratif)",
            source = "Service-Public",
            url = "https://www.service-public.fr/particuliers/recherche?keyword=naturalisation"
        )
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityEntretienPrepBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnBack.setOnClickListener { finish() }
        BottomNavHelper.setup(
            activity = this,
            bottomNav = binding.bottomNav,
            selectedItemId = R.id.nav_entretien
        )
        renderSections()
    }

    private fun renderSections() {
        binding.prepContainer.removeAllViews()
        addQcmAccessSection()
        sections.forEach { section -> addChecklistSection(section) }
        addInterviewSamplesSection()
        addHistorySection()
        addOfficialDocsSection()
        addInternetSearchSection()
    }

    private fun addQcmAccessSection() {
        val card = createCard()
        card.addView(createTitle("0) Entrainement rapide"))
        card.addView(createBody("Lance une serie QCM civique depuis la rubrique Entretien."))

        val btnQcm = MaterialButton(this).apply {
            text = getString(R.string.btn_open_qcm)
            setOnClickListener {
                startActivity(
                    Intent(this@EntretienPrepActivity, QcmCiviqueActivity::class.java)
                )
            }
        }
        card.addView(
            btnQcm,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = dp(8) }
        )
        addCard(card)
    }

    private fun addChecklistSection(section: PrepSection) {
        val card = createCard()
        card.addView(createTitle(section.title))

        section.items.forEach { item ->
            val check = CheckBox(this).apply {
                text = item
                setTextColor(Color.parseColor("#334155"))
                textSize = 14f
            }
            card.addView(check)
        }
        addCard(card)
    }

    private fun addInterviewSamplesSection() {
        val card = createCard()
        card.addView(createTitle("4) Exemples de questions/reponses entretien"))
        card.addView(
            createBody(
                "Exemples courts pour t'entrainer a repondre clairement et sans contradiction."
            )
        )

        interviewSamples.forEachIndexed { index, qa ->
            val qaText = TextView(this).apply {
                text = "${index + 1}. Q: ${qa.question}\nR: ${qa.answer}"
                setTextColor(Color.parseColor("#0F172A"))
                textSize = 14f
                setPadding(0, if (index == 0) dp(6) else dp(8), 0, 0)
            }
            card.addView(qaText)
        }
        addCard(card)
    }

    private fun addHistorySection() {
        val card = createCard()
        card.addView(createTitle("5) Histoire de France - points a connaitre"))
        card.addView(
            createBody(
                "Repere ces dates-clefs: elles reviennent souvent dans les echanges d'assimilation."
            )
        )

        historyHighlights.forEach { line ->
            card.addView(createBody("- $line"))
        }
        addCard(card)
    }

    private fun addOfficialDocsSection() {
        val card = createCard()
        card.addView(createTitle("6) Livret et documents officiels telechargeables"))
        card.addView(
            createBody(
                "Ouvre les sources officielles. Les liens PDF peuvent etre telecharges directement."
            )
        )

        officialDocs.forEachIndexed { index, doc ->
            val title = TextView(this).apply {
                text = doc.title
                setTextColor(Color.parseColor("#1E293B"))
                textSize = 14f
                setTypeface(typeface, android.graphics.Typeface.BOLD)
                setPadding(0, if (index == 0) dp(8) else dp(12), 0, 0)
            }
            card.addView(title)

            val source = TextView(this).apply {
                text = "Source: ${doc.source}"
                setTextColor(Color.parseColor("#64748B"))
                textSize = 12f
            }
            card.addView(source)

            val actions = LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                setPadding(0, dp(6), 0, 0)
            }

            val btnOpen = MaterialButton(this).apply {
                text = "Ouvrir"
                setOnClickListener { openUrl(doc.url) }
            }
            actions.addView(
                btnOpen,
                LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
            )

            if (doc.url.lowercase().endsWith(".pdf")) {
                val btnDownload = MaterialButton(this).apply {
                    text = "Telecharger PDF"
                    setOnClickListener { downloadPdf(doc) }
                }
                actions.addView(
                    btnDownload,
                    LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f).apply {
                        leftMargin = dp(8)
                    }
                )
            }

            card.addView(actions)
        }
        addCard(card)
    }

    private fun addInternetSearchSection() {
        val card = createCard()
        card.addView(createTitle("7) Recherche internet de documents de preparation"))
        card.addView(
            createBody(
                "Saisis un theme puis lance une recherche web ou PDF telechargeables."
            )
        )

        docsSearchInput = EditText(this).apply {
            hint = "Ex: naturalisation entretien assimilation"
            setText("naturalisation entretien assimilation")
            setTextColor(Color.parseColor("#0F172A"))
            setHintTextColor(Color.parseColor("#94A3B8"))
            setBackgroundResource(R.drawable.panel_soft)
            setPadding(dp(12), dp(8), dp(12), dp(8))
        }
        card.addView(
            docsSearchInput,
            LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply { topMargin = dp(8) }
        )

        val actions = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(0, dp(8), 0, 0)
        }

        val btnSearchWeb = MaterialButton(this).apply {
            text = "Recherche web"
            setOnClickListener { searchDocumentsOnWeb(pdfOnly = false) }
        }
        actions.addView(
            btnSearchWeb,
            LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        )

        val btnSearchPdf = MaterialButton(this).apply {
            text = "Recherche PDF"
            setOnClickListener { searchDocumentsOnWeb(pdfOnly = true) }
        }
        actions.addView(
            btnSearchPdf,
            LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f).apply {
                leftMargin = dp(8)
            }
        )
        card.addView(actions)

        addCard(card)
    }

    private fun searchDocumentsOnWeb(pdfOnly: Boolean) {
        val base = docsSearchInput.text?.toString()?.trim().orEmpty()
        if (base.isBlank()) {
            Toast.makeText(this, "Saisis d'abord un theme de recherche.", Toast.LENGTH_LONG).show()
            return
        }
        val query = if (pdfOnly) {
            "$base naturalisation filetype:pdf"
        } else {
            "$base naturalisation ANEF"
        }
        val url = "https://www.google.com/search?q=" + Uri.encode(query)
        openUrl(url)
    }

    private fun downloadPdf(doc: PrepDocument) {
        try {
            val filename = buildFilename(doc.title)
            val request = DownloadManager.Request(Uri.parse(doc.url))
                .setTitle(filename)
                .setDescription("Document de preparation naturalisation")
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
        } catch (_: Exception) {
            Toast.makeText(this, "Echec telechargement, ouverture du lien.", Toast.LENGTH_LONG).show()
            openUrl(doc.url)
        }
    }

    private fun buildFilename(title: String): String {
        val base = title
            .replace(Regex("[^A-Za-z0-9 _-]"), "")
            .replace(Regex("\\s+"), "_")
            .take(60)
            .ifBlank { "document_naturalisation" }
        return "$base.pdf"
    }

    private fun openUrl(url: String) {
        if (url.isBlank()) return
        try {
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
        } catch (_: Exception) {
            Toast.makeText(this, "Impossible d'ouvrir le lien.", Toast.LENGTH_LONG).show()
        }
    }

    private fun createCard(): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundResource(R.drawable.panel_bg)
            setPadding(dp(12), dp(10), dp(12), dp(10))
        }
    }

    private fun createTitle(text: String): TextView {
        return TextView(this).apply {
            this.text = text
            setTextColor(Color.parseColor("#1F2937"))
            textSize = 16f
            setTypeface(typeface, android.graphics.Typeface.BOLD)
        }
    }

    private fun createBody(text: String): TextView {
        return TextView(this).apply {
            this.text = text
            setTextColor(Color.parseColor("#334155"))
            textSize = 13f
            setPadding(0, dp(4), 0, 0)
        }
    }

    private fun addCard(card: LinearLayout) {
        val params = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            topMargin = if (binding.prepContainer.childCount == 0) 0 else dp(8)
        }
        binding.prepContainer.addView(card, params)
    }

    private fun dp(value: Int): Int {
        return (value * resources.displayMetrics.density).toInt()
    }
}
