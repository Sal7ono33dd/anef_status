package com.naturalisation.tracker

import android.util.Base64
import java.io.StringReader
import java.nio.charset.StandardCharsets
import java.security.KeyFactory
import java.security.PrivateKey
import java.security.spec.MGF1ParameterSpec
import java.security.spec.PKCS8EncodedKeySpec
import javax.crypto.Cipher
import javax.crypto.spec.OAEPParameterSpec
import javax.crypto.spec.PSource
import org.bouncycastle.asn1.pkcs.PrivateKeyInfo
import org.bouncycastle.openssl.PEMEncryptedKeyPair
import org.bouncycastle.openssl.PEMKeyPair
import org.bouncycastle.openssl.PEMParser
import org.bouncycastle.openssl.jcajce.JcaPEMKeyConverter
import org.bouncycastle.openssl.jcajce.JcePEMDecryptorProviderBuilder
import org.bouncycastle.openssl.jcajce.JceOpenSSLPKCS8DecryptorProviderBuilder
import org.bouncycastle.pkcs.PKCS8EncryptedPrivateKeyInfo

object StatusDecryptor {
    private const val PASSPHRASE = "wa_sir_3awtani_Dir_l_bou9_aaa_khay_div"
    private const val SPLIT_MARKER = "#K#"
    private val plainCodeRegex = Regex("^[a-z_]{4,120}$")

    @Volatile
    var lastError: String = ""
        private set

    private val privateKey: PrivateKey? by lazy {
        runCatching { loadPrivateKey() }
            .onFailure { lastError = "PrivateKey load failed: ${it.message.orEmpty()}" }
            .getOrNull()
    }

    fun decryptStatus(encryptedData: String?): String? {
        lastError = ""
        if (encryptedData.isNullOrBlank()) {
            lastError = "Empty encrypted status."
            return null
        }

        val input = encryptedData.trim()

        // In some environments status may already be plain.
        if (plainCodeRegex.matches(input.lowercase())) {
            return input.lowercase()
        }

        val key = privateKey ?: return null
        val normalized = input.replace("\\s".toRegex(), "")

        val decodedCandidates = buildList {
            runCatching { Base64.decode(normalized, Base64.DEFAULT) }.getOrNull()?.let { add(it) }
            runCatching { Base64.decode(normalized, Base64.NO_WRAP) }.getOrNull()?.let { add(it) }
            runCatching {
                Base64.decode(
                    normalized,
                    Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING
                )
            }.getOrNull()?.let { add(it) }
        }

        if (decodedCandidates.isEmpty()) {
            lastError = "Base64 decode failed."
            return null
        }

        val attempts = listOf(
            CipherAttempt("RSA/ECB/OAEPWithSHA-256AndMGF1Padding", null, oaepSha256Spec()),
            CipherAttempt("RSA/ECB/OAEPWithSHA-256AndMGF1Padding", null, null),
            CipherAttempt("RSA/ECB/OAEPPadding", null, oaepSha256Spec()),
            CipherAttempt("RSA/ECB/OAEPWithSHA-1AndMGF1Padding", null, null)
        )

        var firstFailure: String? = null
        for (candidate in decodedCandidates) {
            for (attempt in attempts) {
                val decrypted = runCatching {
                    val cipher = if (attempt.provider.isNullOrBlank()) {
                        Cipher.getInstance(attempt.transformation)
                    } else {
                        Cipher.getInstance(attempt.transformation, attempt.provider)
                    }

                    if (attempt.oaepSpec != null) {
                        cipher.init(Cipher.DECRYPT_MODE, key, attempt.oaepSpec)
                    } else {
                        cipher.init(Cipher.DECRYPT_MODE, key)
                    }
                    cipher.doFinal(candidate)
                }.onFailure {
                    if (firstFailure.isNullOrBlank()) {
                        firstFailure = "${attempt.transformation}: ${it.message.orEmpty()}"
                    }
                }.getOrNull() ?: continue

                val text = String(decrypted, StandardCharsets.UTF_8).trim()
                val extracted = text.substringBefore(SPLIT_MARKER).trim()
                if (extracted.isNotBlank()) {
                    return extracted.lowercase()
                }
            }
        }

        lastError = firstFailure ?: "RSA decrypt failed for all attempts."
        return null
    }

    private fun oaepSha256Spec(): OAEPParameterSpec {
        return OAEPParameterSpec(
            "SHA-256",
            "MGF1",
            MGF1ParameterSpec.SHA256,
            PSource.PSpecified.DEFAULT
        )
    }

    private fun loadPrivateKey(): PrivateKey {
        // First try: parse PEM PKCS#8 directly with Android/JCA KeyFactory.
        runCatching { parsePkcs8PemWithJca(PRIVATE_KEY_PEM) }
            .getOrNull()
            ?.let { return it }

        val parser = PEMParser(StringReader(PRIVATE_KEY_PEM.trim()))
        parser.use { pemParser ->
            val obj = pemParser.readObject()
            val converter = JcaPEMKeyConverter()

            return when (obj) {
                is PEMEncryptedKeyPair -> {
                    val decryptor = JcePEMDecryptorProviderBuilder().build(PASSPHRASE.toCharArray())
                    converter.getKeyPair(obj.decryptKeyPair(decryptor)).private
                }
                is PEMKeyPair -> converter.getKeyPair(obj).private
                is PKCS8EncryptedPrivateKeyInfo -> {
                    val provider = JceOpenSSLPKCS8DecryptorProviderBuilder()
                        .build(PASSPHRASE.toCharArray())
                    val keyInfo = obj.decryptPrivateKeyInfo(provider)
                    converter.getPrivateKey(keyInfo)
                }
                is PrivateKeyInfo -> converter.getPrivateKey(obj)
                else -> throw IllegalStateException("Unsupported PEM object: ${obj?.javaClass?.name}")
            }
        }
    }

    private fun parsePkcs8PemWithJca(pem: String): PrivateKey {
        val normalized = pem
            .replace("-----BEGIN PRIVATE KEY-----", "")
            .replace("-----END PRIVATE KEY-----", "")
            .replace("\\s".toRegex(), "")
            .trim()
        val der = Base64.decode(normalized, Base64.DEFAULT)
        val spec = PKCS8EncodedKeySpec(der)
        return KeyFactory.getInstance("RSA").generatePrivate(spec)
    }

    private data class CipherAttempt(
        val transformation: String,
        val provider: String?,
        val oaepSpec: OAEPParameterSpec?
    )

    private const val PRIVATE_KEY_PEM = """
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC/WvhR9YrO6DHY
0UpAoIlIuDoF3PtLEJ3J0T5FOLAPSY2sa33AnECl6jWfM7uLuojuTDbfIz6J3vAo
sNUzwYFNHKx3EG1o6cYzjWm2LzZDa4e25wYlXcL2r3T0mFGS9DT7adKlomNURj4L
f2WUt11oNH8RYyH/uNk+kIL0HRJLtfTjyyjlWSyjUUDD1ATYZwjnQS2HvdcqJ+Go
3TTvqTG7yOPzC/lwSKG3zE3eL+pi9E9Lgw9NlSanewOu7toB9NiKwzP3kfSBNpkz
Sv4UBNClfp1UG+psSPnTx3Csil9TbPjSe99ZZ0/ffPf0h2xoga/7rWgScQwHzN9E
crvEfDgxAgMBAAECggEAa08Ikm2wOffcfEph6XwdgLpPT5ptEdtvoQ3GbessUGZf
HKHrE2iMmH6PM4g/VEx3Hat/2gJZv9dVtnv0E+IgMK4zyVFdCciPbbmP3qr7MzPK
F7fWqn26J7ydSc1hcZehXpwplNlL+qaphKkcvhlWOGm4GHgPSOjQa1V/GoZzDCE1
e1z9KpVuMMiV4d89FFiE3MHtnrmMnmUdbnesffVftnPmzkkGKKWTCL1BLrdEXgCz
GSFdqCo+PjcJjEojjmqHhgzTyjPOR6JGh0FqG9ht3aduIQMZfKR1p2+Ds18NlOZu
T60Lyc7Ud/d0H0f2h9GfftHYCSLkIxfTaAmoYXzXAQKBgQDoWc91xlh8Kb3vmIN1
IoVY2yhviDTpUqkGxvjt6WYmu38CFpEwSO0cpTVCAkWRKvjKLUOoCAaqfaTrN04t
LG85Z18gvSQKmncfv0zrKaTN/FrnKOA//hPCAcveDT6Ir9SCxgVmNBox70k89eQ+
5cDOZACqFhKcoAQa/LjF621HBQKBgQDS1Pi+GhSwbn6nBiqQdzU1+RpXdburzubd
3dgNlrAOmLoFEGqYNzaMcKbNljNTnAdv/FX6/NYaQGx/pYTs26o/SZZ+SE7Cl2RS
RJIuWeskuNEoH4W06JgO1djyHVOiHmKbyaATWCjoZSQnnHo8OUBUKOJpw8mrNlQl
IYUE0OLcPQKBgQDD3LlKUZnTiKhoqYrfGeuIfK34Xrwjlx+O6/l5LA+FRPaKfxWC
u2bNh+J+M0YLWksAuulWYvWjkGiOMz++Sr+zhxUkluwj2BPk+jDP53nafgju5YEr
0HU9TKBbHZUCSh384wo4HmGaiFiXf7wY3ToLgTciKZsk1qq/SRxFEvE6NQKBgHcS
Cs2qgybFsMf55o4ilS2/Ww4sEurMdny1bvD1usbzoJN9mwYOoMMeWEZh3ukIhPbN
J24R34WB/wT0YSc4RGVr1Q/LHJgv0lvYGEsPQ4tAyfeEHgp3FnHCerz6rSIxUPW1
IK/sKWZewNWSPULH/rnJQV4EUmBc1ZcG4E5A/u7tAoGBAMneO96PMhJFQDhsakTL
vGTbhuwBnFjbSuxmyebhszASOuKm8XTVDe004AZTSy7lAm+iYTkfeRbfVrIGWElT
5DWhmlN/zNTdX56dQWG3P5M48+bxZFXz0YCBAZJw8jZ5LcFuKrr5tQbcNZN9Pqgk
QJNdXtE3G7SjkDOn36yZSaXp
-----END PRIVATE KEY-----
"""
}
