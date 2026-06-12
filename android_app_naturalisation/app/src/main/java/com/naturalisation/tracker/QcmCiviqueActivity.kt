package com.naturalisation.tracker

import android.graphics.Color
import android.os.Bundle
import android.widget.LinearLayout
import android.widget.RadioButton
import android.widget.RadioGroup
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.naturalisation.tracker.databinding.ActivityQcmCiviqueBinding

private data class QcmQuestion(
    val question: String,
    val options: List<String>,
    val correctAnswer: String,
    val explanation: String
)

private data class RenderedQcmQuestion(
    val question: String,
    val options: List<String>,
    val correctIndex: Int,
    val explanation: String
)

class QcmCiviqueActivity : AppCompatActivity() {
    private lateinit var binding: ActivityQcmCiviqueBinding
    private val groups = mutableListOf<RadioGroup>()
    private var currentSeries = emptyList<RenderedQcmQuestion>()
    private var seriesNumber = 0

    private val questionBank = listOf(
        QcmQuestion(
            question = "Que represente la devise de la Republique francaise ?",
            options = listOf("Travail, Famille, Patrie", "Liberte, Egalite, Fraternite", "Union, Respect, Dignite"),
            correctAnswer = "Liberte, Egalite, Fraternite",
            explanation = "La devise officielle est Liberte, Egalite, Fraternite."
        ),
        QcmQuestion(
            question = "Qui vote les lois en France ?",
            options = listOf("Le Parlement", "Le Conseil d'Etat", "La Cour de cassation"),
            correctAnswer = "Le Parlement",
            explanation = "Les lois sont votees par le Parlement (Assemblee nationale et Senat)."
        ),
        QcmQuestion(
            question = "Quelle est la fete nationale francaise ?",
            options = listOf("Le 1er mai", "Le 14 juillet", "Le 11 novembre"),
            correctAnswer = "Le 14 juillet",
            explanation = "La fete nationale est le 14 juillet."
        ),
        QcmQuestion(
            question = "Quelle institution garantit la Constitution ?",
            options = listOf("Le Conseil constitutionnel", "Le Senat", "Le Prefet"),
            correctAnswer = "Le Conseil constitutionnel",
            explanation = "Le Conseil constitutionnel controle la conformite des lois a la Constitution."
        ),
        QcmQuestion(
            question = "Quel principe est fondamental dans la laicite francaise ?",
            options = listOf("Neutralite de l'Etat face aux religions", "Religion d'Etat officielle", "Interdiction des religions"),
            correctAnswer = "Neutralite de l'Etat face aux religions",
            explanation = "La laicite implique la neutralite de l'Etat et la liberte de conscience."
        ),
        QcmQuestion(
            question = "Quelle langue est celle de la Republique ?",
            options = listOf("Le francais", "Le latin", "L'anglais"),
            correctAnswer = "Le francais",
            explanation = "La Constitution indique: la langue de la Republique est le francais."
        ),
        QcmQuestion(
            question = "Quel texte fonde la Ve Republique ?",
            options = listOf("La Constitution de 1958", "Le Code civil", "La Charte de 1946"),
            correctAnswer = "La Constitution de 1958",
            explanation = "La Ve Republique est fondee par la Constitution du 4 octobre 1958."
        ),
        QcmQuestion(
            question = "Qui est chef de l'Etat en France ?",
            options = listOf("Le President de la Republique", "Le Premier president de la Cour des comptes", "Le President du Senat"),
            correctAnswer = "Le President de la Republique",
            explanation = "Le President de la Republique est le chef de l'Etat."
        ),
        QcmQuestion(
            question = "Quel est le role principal du Senat ?",
            options = listOf("Participer au vote de la loi", "Rendre des jugements", "Diriger les prefectures"),
            correctAnswer = "Participer au vote de la loi",
            explanation = "Le Senat participe a l'examen et au vote des lois."
        ),
        QcmQuestion(
            question = "Que signifie l'egalite devant la loi ?",
            options = listOf("La loi s'applique a tous sans distinction illegitime", "Chaque territoire a sa propre loi", "Seuls les citoyens nés en France sont concernes"),
            correctAnswer = "La loi s'applique a tous sans distinction illegitime",
            explanation = "L'egalite devant la loi est un principe constitutionnel."
        ),
        QcmQuestion(
            question = "Qui represente l'Etat dans le departement ?",
            options = listOf("Le prefet", "Le maire", "Le president de region"),
            correctAnswer = "Le prefet",
            explanation = "Le prefet represente l'Etat dans le departement."
        ),
        QcmQuestion(
            question = "Que celebre le 11 novembre ?",
            options = listOf("L'Armistice de 1918", "La prise de la Bastille", "La Liberation de Paris"),
            correctAnswer = "L'Armistice de 1918",
            explanation = "Le 11 novembre commemore l'Armistice de 1918."
        ),
        QcmQuestion(
            question = "Quel est le drapeau de la France ?",
            options = listOf("Bleu, blanc, rouge", "Rouge et blanc", "Bleu et or"),
            correctAnswer = "Bleu, blanc, rouge",
            explanation = "Le drapeau national est tricolore: bleu, blanc, rouge."
        ),
        QcmQuestion(
            question = "La citoyennete francaise donne notamment le droit de:",
            options = listOf("Voter aux elections nationales", "Eviter toute obligation fiscale", "Refuser toute loi"),
            correctAnswer = "Voter aux elections nationales",
            explanation = "La citoyennete donne notamment le droit de vote (selon conditions d'age et d'inscription)."
        ),
        QcmQuestion(
            question = "Quelle institution controle l'action du Gouvernement ?",
            options = listOf("Le Parlement", "La BCE", "Le Conseil regional"),
            correctAnswer = "Le Parlement",
            explanation = "Le Parlement vote la loi et controle l'action du Gouvernement."
        ),
        QcmQuestion(
            question = "Que signifie la fraternite dans la devise republicaine ?",
            options = listOf("Solidarite entre les personnes", "Priorite a une seule categorie", "Absence totale de regles"),
            correctAnswer = "Solidarite entre les personnes",
            explanation = "La fraternite renvoie a la solidarite et au vivre ensemble."
        ),
        QcmQuestion(
            question = "En France, la souverainete nationale appartient:",
            options = listOf("Au peuple", "Au Gouvernement uniquement", "Aux prefets"),
            correctAnswer = "Au peuple",
            explanation = "La souverainete nationale appartient au peuple, qui l'exerce par ses representants et le referendum."
        ),
        QcmQuestion(
            question = "Quelle est la capitale de la France ?",
            options = listOf("Lyon", "Paris", "Marseille"),
            correctAnswer = "Paris",
            explanation = "La capitale de la France est Paris."
        ),
        QcmQuestion(
            question = "Le respect des lois en France est:",
            options = listOf("Obligatoire pour tous", "Optionnel", "Reserve aux administrations"),
            correctAnswer = "Obligatoire pour tous",
            explanation = "Le respect de la loi s'impose a tous."
        ),
        QcmQuestion(
            question = "Quel organe peut etre saisi pour une question de constitutionnalite ?",
            options = listOf("Le Conseil constitutionnel", "Le Conseil europeen", "Le Conseil municipal"),
            correctAnswer = "Le Conseil constitutionnel",
            explanation = "Le Conseil constitutionnel est competent sur la constitutionnalite des lois."
        )
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityQcmCiviqueBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnBack.setOnClickListener { finish() }
        BottomNavHelper.setup(
            activity = this,
            bottomNav = binding.bottomNav,
            selectedItemId = R.id.nav_entretien
        )
        binding.btnNewSeries.setOnClickListener { loadRandomSeries() }
        binding.btnValidateQcm.setOnClickListener { evaluate() }

        loadRandomSeries()
    }

    private fun loadRandomSeries() {
        val size = 8.coerceAtMost(questionBank.size)
        currentSeries = questionBank
            .shuffled()
            .take(size)
            .map { q ->
                val shuffledOptions = q.options.shuffled()
                RenderedQcmQuestion(
                    question = q.question,
                    options = shuffledOptions,
                    correctIndex = shuffledOptions.indexOf(q.correctAnswer),
                    explanation = q.explanation
                )
            }

        seriesNumber += 1
        binding.txtQcmSeries.text = "Serie aleatoire #$seriesNumber - ${currentSeries.size} questions"
        binding.txtQcmResult.text = ""
        renderQuestions()
    }

    private fun renderQuestions() {
        binding.questionsContainer.removeAllViews()
        groups.clear()

        currentSeries.forEachIndexed { index, q ->
            val card = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                setBackgroundResource(R.drawable.panel_bg)
                backgroundTintList = android.content.res.ColorStateList.valueOf(
                    Color.parseColor("#FFFFFF")
                )
                setPadding(dp(12), dp(10), dp(12), dp(10))
            }

            val title = TextView(this).apply {
                text = "${index + 1}. ${q.question}"
                setTextColor(Color.parseColor("#1F2937"))
                textSize = 15f
                setTypeface(typeface, android.graphics.Typeface.BOLD)
            }
            card.addView(title)

            val group = RadioGroup(this).apply {
                orientation = RadioGroup.VERTICAL
            }
            q.options.forEach { option ->
                val rb = RadioButton(this).apply {
                    text = option
                    setTextColor(Color.parseColor("#334155"))
                    textSize = 14f
                }
                group.addView(rb)
            }
            groups += group
            card.addView(group)

            val params = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = if (index == 0) 0 else dp(8)
            }
            binding.questionsContainer.addView(card, params)
        }
    }

    private fun evaluate() {
        var score = 0
        val feedback = StringBuilder()

        currentSeries.forEachIndexed { index, question ->
            val group = groups[index]
            val selectedId = group.checkedRadioButtonId
            val selectedIndex = group.indexOfChild(group.findViewById(selectedId))
            if (selectedIndex == question.correctIndex) {
                score++
            } else {
                feedback.append("${index + 1}) ${question.explanation}\n")
            }
        }

        val summary = "Score: $score/${currentSeries.size}"
        val details = if (feedback.isNotBlank()) {
            "\n\nPoints a revoir:\n$feedback"
        } else {
            "\n\nExcellent, toutes les reponses sont justes."
        }
        binding.txtQcmResult.text = summary + details
    }

    private fun dp(value: Int): Int {
        return (value * resources.displayMetrics.density).toInt()
    }
}
