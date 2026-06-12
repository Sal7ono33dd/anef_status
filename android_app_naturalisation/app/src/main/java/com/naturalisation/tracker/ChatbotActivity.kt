package com.naturalisation.tracker

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.SharedPreferences
import android.graphics.Color
import android.os.Bundle
import android.speech.RecognizerIntent
import android.view.inputmethod.EditorInfo
import android.view.Gravity
import android.view.View
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.naturalisation.tracker.databinding.ActivityChatbotBinding
import java.util.Locale

class ChatbotActivity : AppCompatActivity() {
    private lateinit var binding: ActivityChatbotBinding
    private lateinit var prefs: SharedPreferences

    private val chatHistory = mutableListOf<ChatTurn>()
    private var chatRequestInFlight = false
    private val voiceInputLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode != Activity.RESULT_OK) return@registerForActivityResult

        val spokenText = result.data
            ?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
            ?.firstOrNull()
            ?.trim()
            .orEmpty()

        if (spokenText.isBlank()) {
            Toast.makeText(this, getString(R.string.chat_voice_empty), Toast.LENGTH_LONG).show()
            return@registerForActivityResult
        }

        val currentText = binding.edtChatInput.text?.toString()?.trim().orEmpty()
        val merged = if (currentText.isBlank()) spokenText else "$currentText $spokenText"
        binding.edtChatInput.setText(merged)
        binding.edtChatInput.setSelection(merged.length)
        binding.edtChatInput.requestFocus()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityChatbotBinding.inflate(layoutInflater)
        setContentView(binding.root)

        prefs = getSharedPreferences(StatusPrefs.PREFS_NAME, MODE_PRIVATE)

        setupButtons()
        setupKeyboardAwareLayout()
        BottomNavHelper.setup(
            activity = this,
            bottomNav = binding.bottomNav,
            selectedItemId = R.id.nav_chatbot
        )
        refreshConnectionState()
        addAssistantWelcome()
    }

    override fun onResume() {
        super.onResume()
        refreshConnectionState()
    }

    private fun setupButtons() {
        binding.btnBackMain.setOnClickListener { finish() }

        binding.btnOpenAnefFromChat.setOnClickListener {
            startActivity(
                Intent(this, MainActivity::class.java).apply {
                    putExtra(MainActivity.EXTRA_FORCE_ANEF_VIEW, true)
                    flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
                }
            )
            finish()
        }

        binding.btnSendChat.setOnClickListener {
            sendChatMessage()
        }

        binding.btnVoiceInput.setOnClickListener {
            startVoiceInput()
        }

        binding.edtChatInput.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_SEND) {
                sendChatMessage()
                true
            } else {
                false
            }
        }

        binding.btnQuickDocuments.setOnClickListener {
            sendQuickGuidePrompt(
                "Guide rapide documents: liste-moi les documents les plus frequents pour une demande de naturalisation ANEF, en separant obligatoires, selon cas particuliers, et erreurs frequentes a eviter."
            )
        }

        binding.btnQuickDelais.setOnClickListener {
            sendQuickGuidePrompt(
                "Guide rapide delais: donne les delais habituels de la procedure de naturalisation, ce qui est variable selon prefecture, et comment faire un suivi utile sans se tromper."
            )
        }

        binding.btnQuickEntretien.setOnClickListener {
            sendQuickGuidePrompt(
                "Guide rapide entretien: explique comment preparer l'entretien d'assimilation, les themes souvent verifies, et une checklist de preparation la veille."
            )
        }

        binding.btnQuickRecours.setOnClickListener {
            sendQuickGuidePrompt(
                "Guide rapide recours: explique les voies de recours (RAPO, contentieux), les delais importants et les pieces a preparer, en restant prudent juridiquement."
            )
        }
    }

    private fun startVoiceInput() {
        val localeTag = Locale.getDefault().toLanguageTag()
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, localeTag)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, localeTag)
            putExtra(RecognizerIntent.EXTRA_PROMPT, getString(R.string.chat_voice_prompt))
        }

        if (intent.resolveActivity(packageManager) == null) {
            Toast.makeText(this, getString(R.string.chat_voice_unavailable), Toast.LENGTH_LONG).show()
            return
        }

        try {
            voiceInputLauncher.launch(intent)
        } catch (_: ActivityNotFoundException) {
            Toast.makeText(this, getString(R.string.chat_voice_unavailable), Toast.LENGTH_LONG).show()
        }
    }

    private fun setupKeyboardAwareLayout() {
        ViewCompat.setOnApplyWindowInsetsListener(binding.root) { _, insets ->
            val keyboardVisible = insets.isVisible(WindowInsetsCompat.Type.ime())
            updateTopBlocksVisibility(keyboardVisible)
            insets
        }
        ViewCompat.requestApplyInsets(binding.root)
    }

    private fun updateTopBlocksVisibility(keyboardVisible: Boolean) {
        val topVisibility = if (keyboardVisible) View.GONE else View.VISIBLE
        binding.chatHeaderContainer.visibility = topVisibility
        binding.chatGuidesContainer.visibility = topVisibility
        if (keyboardVisible) {
            binding.chatScroll.post { binding.chatScroll.fullScroll(View.FOCUS_DOWN) }
        }
    }

    private fun refreshConnectionState() {
        val connected = isConnected()
        binding.txtChatState.text = if (connected) {
            "Session ANEF active. Pose ta question ou utilise un guide rapide."
        } else {
            "Session ANEF non active. Reconnecte-toi sur ANEF pour utiliser le chatbot."
        }
    }

    private fun addAssistantWelcome() {
        if (chatHistory.isNotEmpty()) return
        val welcome = """
Salut, je suis ton assistant naturalisation.
Tu peux utiliser les guides rapides: Documents, Delais, Entretien, Recours.
Je peux aussi t'expliquer chaque etape ANEF selon ton statut.
""".trimIndent()
        chatHistory += ChatTurn(role = "assistant", content = welcome)
        appendChatBubble("assistant", welcome)
    }

    private fun sendQuickGuidePrompt(prompt: String) {
        if (!ensureConnectedForChat()) return
        binding.edtChatInput.setText(prompt)
        sendChatMessage()
    }

    private fun sendChatMessage() {
        if (chatRequestInFlight) return
        if (!ensureConnectedForChat()) return

        val text = binding.edtChatInput.text?.toString()?.trim().orEmpty()
        if (text.isBlank()) return

        binding.edtChatInput.setText("")
        chatHistory += ChatTurn(role = "user", content = text)
        trimHistory()
        appendChatBubble("user", text)

        chatRequestInFlight = true
        binding.btnSendChat.isEnabled = false
        binding.btnSendChat.alpha = 0.6f

        Thread {
            val result = PerplexityClient.ask(chatHistory.toList())
            runOnUiThread {
                chatRequestInFlight = false
                binding.btnSendChat.isEnabled = true
                binding.btnSendChat.alpha = 1f

                result.onSuccess { answer ->
                    chatHistory += ChatTurn(role = "assistant", content = answer)
                    trimHistory()
                    appendChatBubble("assistant", answer)
                }.onFailure { error ->
                    val msg = "Erreur chatbot: ${error.message.orEmpty()}"
                    appendChatBubble("assistant", msg)
                    Toast.makeText(this, msg, Toast.LENGTH_LONG).show()
                }
            }
        }.start()
    }

    private fun ensureConnectedForChat(): Boolean {
        if (isConnected()) return true
        Toast.makeText(
            this,
            "Reconnecte-toi sur ANEF pour activer le chatbot.",
            Toast.LENGTH_LONG
        ).show()
        return false
    }

    private fun isConnected(): Boolean {
        val authState = prefs.getString(StatusPrefs.KEY_AUTH_STATE, StatusPrefs.AUTH_STATE_EXPIRED).orEmpty()
        return authState == StatusPrefs.AUTH_STATE_OK
    }

    private fun appendChatBubble(role: String, message: String) {
        val bubble = TextView(this).apply {
            text = message
            setTextSize(14f)
            setTextColor(if (role == "user") Color.WHITE else Color.parseColor("#1F2937"))
            setBackgroundResource(
                if (role == "user") R.drawable.chat_bubble_user else R.drawable.chat_bubble_assistant
            )
            setPadding(dp(12), dp(8), dp(12), dp(8))
            maxWidth = (resources.displayMetrics.widthPixels * 0.78f).toInt()
        }

        val params = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            topMargin = dp(8)
            gravity = if (role == "user") Gravity.END else Gravity.START
        }

        binding.chatContainer.addView(bubble, params)
        binding.chatScroll.post { binding.chatScroll.fullScroll(View.FOCUS_DOWN) }
    }

    private fun trimHistory() {
        val keep = 24
        if (chatHistory.size > keep) {
            val drop = chatHistory.size - keep
            chatHistory.subList(0, drop).clear()
        }
    }

    private fun dp(value: Int): Int {
        return (value * resources.displayMetrics.density).toInt()
    }
}
