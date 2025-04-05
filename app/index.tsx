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
import { SignJWT, importPKCS8 } from "jose";

export default function Home() {
  const [keyId, setKeyId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [clientId, setClientId] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [expiration, setExpiration] = useState("15690000"); // ~5 months 29 days in seconds (just under Apple's 6 month limit)
  const [expirationDate, setExpirationDate] = useState("");
  const [generating, setGenerating] = useState(false);
  const [jwt, setJwt] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showDecoded, setShowDecoded] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState("6months");

  // Calculate human-readable date based on expiration seconds
  useEffect(() => {
    if (expiration) {
      const now = new Date();
      const expiresAt = new Date(
        now.getTime() + parseInt(expiration, 10) * 1000
      );
      setExpirationDate(expiresAt.toLocaleString());
    }
  }, [expiration]);

  // Set predefined expiration values, ensuring we don't exceed Apple's 6 month limit
  const setExpirationPeriod = (period: string) => {
    setSelectedDuration(period);
    switch (period) {
      case "1month":
        setExpiration("2592000"); // 30 days in seconds
        break;
      case "6months":
        setExpiration("15690000"); // ~5 months 29 days in seconds (just under Apple's 6 month limit)
        break;
    }
  };

  const handleSubmit = async () => {
    // Reset states
    setError("");
    setJwt("");
    setCopied(false);
    setGenerating(true);
    setShowDecoded(false);

    try {
      if (!keyId || !teamId || !clientId || !privateKey || !expiration) {
        throw new Error("All fields are required");
      }

      // Validate expiration is not more than Apple's maximum allowed time
      if (parseInt(expiration, 10) > 15777000) {
        throw new Error(
          "Expiration time cannot exceed 6 months (15777000 seconds)"
        );
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
        const privateKeyObject = await importPKCS8(privateKey, "ES256");

        // Create and sign the JWT
        const token = await new SignJWT({})
          .setProtectedHeader({
            alg: "ES256",
            kid: keyId,
          })
          .setIssuedAt(now)
          .setIssuer(teamId)
          .setSubject(clientId)
          .setAudience("https://appleid.apple.com")
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

  const toggleDecodedJWT = () => {
    setShowDecoded(!showDecoded);
  };

  const getDecodedJWT = () => {
    if (!jwt) return null;
    try {
      const parts = jwt.split(".");
      const decodedHeader = JSON.parse(atob(parts[0]));
      const decodedPayload = JSON.parse(atob(parts[1]));

      // Add human readable dates to payload
      const issuedAt = new Date(decodedPayload.iat * 1000).toLocaleString();
      const expiresAt = new Date(decodedPayload.exp * 1000).toLocaleString();
      decodedPayload.iat_readable = `Issued at: ${issuedAt}`;
      decodedPayload.exp_readable = `Expires at: ${expiresAt}`;

      return {
        header: JSON.stringify(decodedHeader, null, 2),
        payload: JSON.stringify(decodedPayload, null, 2),
      };
    } catch (err) {
      return null;
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
              Portal. e.g. dev.codewthbeto.myapp.web
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Private Key</Text>
            <TextInput
              style={[
                styles.input,
                styles.multilineInput,
                { fontFamily: "monospace", fontSize: 11 },
              ]}
              value={privateKey}
              onChangeText={setPrivateKey}
              placeholder="-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgXXXX/8TiDZMFfsZbK
ARRDdYVcnKADkgvc8cDFkhvld+KgCgYIKoZIzj0DAQehRANCAASyyyya66dh/8D7Q
TN7wseIC6lszNPLCMMJu7QCWCxYa3ZqUTG9f4Vqg04Fe1Db7HHm5BTgrLkFmxMBb
/VEfZZZZ
-----END PRIVATE KEY-----"
              placeholderTextColor="#666"
              multiline
              numberOfLines={6}
              autoCapitalize="none"
              autoCorrect={false}
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
                  style={[
                    styles.durationButton,
                    selectedDuration === "1month" && styles.selectedDuration,
                  ]}
                  onPress={() => setExpirationPeriod("1month")}
                >
                  <Text
                    style={[
                      styles.durationButtonText,
                      selectedDuration === "1month" &&
                        styles.selectedDurationText,
                    ]}
                  >
                    1 Month
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.durationButton,
                    selectedDuration === "6months" && styles.selectedDuration,
                  ]}
                  onPress={() => setExpirationPeriod("6months")}
                >
                  <Text
                    style={[
                      styles.durationButtonText,
                      selectedDuration === "6months" &&
                        styles.selectedDurationText,
                    ]}
                  >
                    6 Months (recommended)
                  </Text>
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
              <TouchableOpacity
                style={styles.decodeButton}
                onPress={toggleDecodedJWT}
              >
                <Text style={styles.decodeButtonText}>
                  {showDecoded ? "Hide Decoded JWT" : "Show Decoded JWT"}
                </Text>
              </TouchableOpacity>

              {showDecoded && getDecodedJWT() && (
                <View style={styles.decodedContainer}>
                  <Text style={styles.decodedLabel}>Header:</Text>
                  <Text style={styles.decodedText} selectable>
                    {getDecodedJWT()?.header}
                  </Text>
                  <Text style={styles.decodedLabel}>Payload:</Text>
                  <Text style={styles.decodedText} selectable>
                    {getDecodedJWT()?.payload}
                  </Text>
                </View>
              )}

              <Text style={styles.tokenTip}>
                ⚠️ Remember to generate a new token before this one expires to
                prevent API requests from failing ⚠️
              </Text>
              <Text style={styles.tokenTip}>
                ❗️ Don't share your JWT with anyone ❗
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
    paddingTop: 30,
  },
  content: {
    padding: 24,
    maxWidth: 700,
    width: "100%",
    alignSelf: "center",
  },
  title: {
    fontSize: 32,
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
  decodeButton: {
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  decodeButtonText: {
    color: "#4C9AFF",
    fontSize: 14,
    fontWeight: "600",
  },
  decodedContainer: {
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  decodedLabel: {
    color: "#ddd",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  decodedText: {
    color: "#aaa",
    fontSize: 12,
    fontFamily: "monospace",
    marginBottom: 12,
  },
  tokenTip: {
    fontSize: 12,
    color: "#ffa500",
    marginTop: 8,
    lineHeight: 16,
    textAlign: "center",
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
  selectedDuration: {
    backgroundColor: "#4C9AFF",
  },
  durationButtonText: {
    color: "#ddd",
    fontSize: 13,
  },
  selectedDurationText: {
    color: "#fff",
    fontWeight: "bold",
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
