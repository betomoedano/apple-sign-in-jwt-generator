import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { SignJWT } from "jose";

export default function Home() {
  const [keyId, setKeyId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [clientId, setClientId] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [expiration, setExpiration] = useState("15777000"); // Default 6 months in seconds
  const [expirationDate, setExpirationDate] = useState("");
  const [generating, setGenerating] = useState(false);
  const [jwt, setJwt] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Calculate human-readable date based on expiration seconds
  useEffect(() => {
    if (expiration) {
      const now = new Date();
      const expiresAt = new Date(
        now.getTime() + parseInt(expiration, 10) * 1000
      );
      setExpirationDate(
        expiresAt.toLocaleDateString() + " " + expiresAt.toLocaleTimeString()
      );
    }
  }, [expiration]);

  // Set predefined expiration values
  const setExpirationPeriod = (period: string) => {
    switch (period) {
      case "1month":
        setExpiration("2592000"); // 30 days in seconds
        break;
      case "6months":
        setExpiration("15777000"); // 6 months in seconds (approximately)
        break;
      case "1year":
        setExpiration("31536000"); // 365 days in seconds
        break;
    }
  };

  // Convert PEM format to ArrayBuffer
  const pemToArrayBuffer = (pem: string): ArrayBuffer => {
    // Remove headers, footers, and whitespace
    const base64 = pem
      .replace(/-----BEGIN PRIVATE KEY-----/, "")
      .replace(/-----END PRIVATE KEY-----/, "")
      .replace(/\s+/g, "");

    // Decode base64 to binary string
    const binaryString = atob(base64);

    // Convert binary string to ArrayBuffer
    const buffer = new ArrayBuffer(binaryString.length);
    const view = new Uint8Array(buffer);

    for (let i = 0; i < binaryString.length; i++) {
      view[i] = binaryString.charCodeAt(i);
    }

    return buffer;
  };

  const handleSubmit = async () => {
    // Reset states
    setError("");
    setJwt("");
    setCopied(false);
    setGenerating(true);

    try {
      // Make sure all required fields are filled
      if (!keyId || !teamId || !clientId || !privateKey || !expiration) {
        throw new Error("All fields are required");
      }

      try {
        // Normalize the private key by removing whitespace and ensuring it has headers
        let formattedKey = privateKey.trim();

        // If the key doesn't already have proper format
        if (!formattedKey.includes("-----BEGIN PRIVATE KEY-----")) {
          formattedKey = `-----BEGIN PRIVATE KEY-----\n${formattedKey}\n-----END PRIVATE KEY-----`;
        }

        // Get the current time for the "issued at" claim
        const now = Math.floor(Date.now() / 1000);

        // Import the private key
        const privateKeyObject = await crypto.subtle.importKey(
          "pkcs8",
          pemToArrayBuffer(formattedKey),
          {
            name: "ECDSA",
            namedCurve: "P-256",
          },
          false,
          ["sign"]
        );

        // Create and sign the JWT
        const token = await new SignJWT({})
          .setProtectedHeader({
            alg: "ES256",
            kid: keyId,
          })
          .setIssuedAt(now)
          .setIssuer(teamId)
          .setSubject(clientId)
          .setExpirationTime(now + parseInt(expiration, 10))
          .sign(privateKeyObject);

        setJwt(token);
      } catch (err: any) {
        console.error("Error generating JWT:", err);
        throw new Error(
          "Failed to generate JWT. Check your private key and other credentials."
        );
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (jwt) {
      navigator.clipboard.writeText(jwt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.title}>Apple Client Secret Generator</Text>
          <Text style={styles.description}>
            Securely generate JWTs for Apple Sign-In using your credentials.
            Works entirely in your browser — no data is sent to servers or
            stored anywhere.
          </Text>

          <View style={styles.githubContainer}>
            <TouchableOpacity
              style={styles.githubLink}
              onPress={() =>
                Linking.openURL(
                  "https://github.com/betomoedano/apple-sign-in-jwt-generator"
                )
              }
            >
              <FontAwesome name="github" size={20} color="#aaa" />
              <Text style={styles.githubText}>View on GitHub</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Key ID (kid)</Text>
            <TextInput
              style={styles.input}
              value={keyId}
              onChangeText={setKeyId}
              placeholder="10-character key identifier"
              placeholderTextColor="#666"
            />
            <Text style={styles.hint}>
              This is the 10-character Key ID from your Auth Key in Apple
              Developer Portal.
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Team ID (iss)</Text>
            <TextInput
              style={styles.input}
              value={teamId}
              onChangeText={setTeamId}
              placeholder="Your Apple Developer Team ID"
              placeholderTextColor="#666"
            />
            <Text style={styles.hint}>
              Find your Team ID in the membership section of Apple Developer
              Account.
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Client ID (sub)</Text>
            <TextInput
              style={styles.input}
              value={clientId}
              onChangeText={setClientId}
              placeholder="Your Service ID identifier"
              placeholderTextColor="#666"
            />
            <Text style={styles.hint}>
              Paste the identifier of your Services ID from Apple Developer
              Portal (not the Bundle ID).
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Private Key</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={privateKey}
              onChangeText={setPrivateKey}
              placeholder="Paste your private key (-----BEGIN PRIVATE KEY-----...)"
              placeholderTextColor="#666"
              multiline
              numberOfLines={5}
            />
            <Text style={styles.hint}>
              You can see the content of your .p8 file by dragging it to VS
              Code, then copy-paste the value here. The key must be in PKCS#8
              format.
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Expiration</Text>
            <View style={styles.expirationContainer}>
              <View style={styles.expirationInputContainer}>
                <TextInput
                  style={[styles.input, styles.expirationInput]}
                  value={expiration}
                  onChangeText={setExpiration}
                  placeholder="Seconds"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                />
                <Text style={styles.expirationDate}>
                  Expires: {expirationDate}
                </Text>
              </View>
              <View style={styles.durationButtonsContainer}>
                <TouchableOpacity
                  style={styles.durationButton}
                  onPress={() => setExpirationPeriod("1month")}
                >
                  <Text style={styles.durationButtonText}>1 Month</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.durationButton}
                  onPress={() => setExpirationPeriod("6months")}
                >
                  <Text style={styles.durationButtonText}>6 Months</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.durationButton}
                  onPress={() => setExpirationPeriod("1year")}
                >
                  <Text style={styles.durationButtonText}>1 Year</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleSubmit}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.generateButtonText}>Generate JWT</Text>
            )}
          </TouchableOpacity>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {jwt ? (
            <View style={styles.resultContainer}>
              <Text style={styles.resultLabel}>Your JWT:</Text>
              <View style={styles.jwtContainer}>
                <Text style={styles.jwt} selectable>
                  {jwt}
                </Text>
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={copyToClipboard}
                >
                  <FontAwesome
                    name={copied ? "check" : "copy"}
                    size={24}
                    color={copied ? "#4CAF50" : "#4C9AFF"}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.tokenTip}>
                ⚠️ Remember to generate a new token before it expires to prevent
                API requests from failing. Apple tokens are typically valid for
                6 months.
              </Text>
            </View>
          ) : null}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Made with ❤️ by{" "}
              <Text
                style={styles.footerLink}
                onPress={() => Linking.openURL("https://codewithbeto.dev")}
              >
                codewithbeto.dev
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 24,
    maxWidth: 700,
    width: "100%",
    alignSelf: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#aaa",
    marginBottom: 16,
    lineHeight: 22,
  },
  githubContainer: {
    marginBottom: 32,
  },
  githubLink: {
    flexDirection: "row",
    alignItems: "center",
  },
  githubText: {
    color: "#aaa",
    marginLeft: 8,
    fontSize: 14,
    textDecorationLine: "underline",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ddd",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1e1e1e",
    color: "#fff",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  generateButton: {
    backgroundColor: "#4C9AFF",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },
  generateButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 14,
    marginTop: 16,
  },
  resultContainer: {
    overflow: "scroll",
    marginTop: 32,
    backgroundColor: "#1e1e1e",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#333",
    position: "relative",
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ddd",
    marginBottom: 8,
  },
  jwtContainer: {
    position: "relative",
    marginBottom: 12,
  },
  jwt: {
    fontSize: 14,
    color: "#aaa",
    fontFamily: "SpaceMono",
    paddingVertical: 8,
    paddingRight: 40,
  },
  copyButton: {
    position: "absolute",
    top: 8,
    right: 0,
    padding: 8,
  },
  tokenTip: {
    fontSize: 12,
    color: "#ffa500",
    marginTop: 8,
    lineHeight: 16,
  },
  hint: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  expirationContainer: {
    gap: 12,
  },
  expirationInputContainer: {
    marginBottom: 8,
  },
  expirationInput: {
    marginBottom: 4,
  },
  expirationDate: {
    fontSize: 12,
    color: "#4C9AFF",
    marginTop: 4,
  },
  durationButtonsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  durationButton: {
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    padding: 8,
    flex: 1,
    alignItems: "center",
  },
  durationButtonText: {
    color: "#ddd",
    fontSize: 13,
  },
  footer: {
    marginTop: 48,
    marginBottom: 16,
    alignItems: "center",
  },
  footerText: {
    color: "#888",
    fontSize: 14,
  },
  footerLink: {
    color: "#4C9AFF",
    textDecorationLine: "underline",
  },
});
