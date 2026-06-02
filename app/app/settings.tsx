/**
 * App Settings
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, TextInput, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '../constants/Colors';
import { FontFamily } from '../constants/Theme';
import {
  clearAllData,
  getGeminiApiKey,
  saveGeminiApiKey,
  clearGeminiApiKey,
  getUseLocation,
  setUseLocation as persistUseLocation,
} from '../lib/storage';
import {
  loadProviderConfig,
  updateProviderConfig,
  ProviderType,
  PROVIDER_DEFAULTS,
} from '../lib/ai-providers';

const AI_STUDIO_URL = 'https://aistudio.google.com/app/apikey';
const GROQ_CONSOLE_URL = 'https://console.groq.com/keys';

const PROVIDERS: { type: ProviderType; label: string; icon: keyof typeof Ionicons.glyphMap; desc: string }[] = [
  { type: 'gemini', label: 'Gemini',  icon: 'logo-google',     desc: 'Best vision quality. Paid API key required.' },
  { type: 'groq',   label: 'Groq',    icon: 'flash-outline',   desc: 'Free tier, very fast. Great for suggestions.' },
  { type: 'custom', label: 'Custom',  icon: 'code-slash-outline', desc: 'Any OpenAI-compatible endpoint.' },
];

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [metric, setMetric] = useState(true);

  // Gemini key (vision/photo scanning)
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [useLocation, setUseLocationState] = useState(false);

  // Provider config (text suggestions + recipe)
  const [providerType, setProviderType] = useState<ProviderType>('gemini');
  const [providerKey, setProviderKey] = useState('');
  const [providerKeyInput, setProviderKeyInput] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [providerModel, setProviderModel] = useState('');

  useEffect(() => {
    (async () => {
      const [savedKey, locPref, cfg] = await Promise.all([
        getGeminiApiKey(),
        getUseLocation(),
        loadProviderConfig(),
      ]);
      setHasSavedKey(!!savedKey);
      setUseLocationState(locPref);
      setProviderType(cfg.type);
      setProviderKey(cfg.apiKey || '');
      setCustomUrl(cfg.baseUrl || '');
      setProviderModel(cfg.textModel || PROVIDER_DEFAULTS[cfg.type]?.textModel || '');
    })();
  }, []);

  const handleSelectProvider = async (type: ProviderType) => {
    setProviderType(type);
    const defaults = PROVIDER_DEFAULTS[type];
    setCustomUrl(defaults.baseUrl || '');
    setProviderModel(defaults.textModel || '');
    await updateProviderConfig({ type, baseUrl: defaults.baseUrl, textModel: defaults.textModel, visionModel: defaults.visionModel });
  };

  const handleSaveProviderKey = async () => {
    const key = providerKeyInput.trim();
    if (!key) { Alert.alert('No key entered', 'Paste your API key first.'); return; }
    setProviderKey(key);
    setProviderKeyInput('');
    await updateProviderConfig({ apiKey: key });
    Alert.alert('Saved', `${PROVIDERS.find(p => p.type === providerType)?.label} key saved.`);
  };

  const handleSaveCustomUrl = async () => {
    await updateProviderConfig({ baseUrl: customUrl, textModel: providerModel });
    Alert.alert('Saved', 'Custom endpoint saved.');
  };

  const handleSaveKey = async () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      Alert.alert('No key entered', 'Paste your Gemini API key first.');
      return;
    }
    await saveGeminiApiKey(trimmed);
    setHasSavedKey(true);
    setApiKeyInput('');
    Alert.alert('Saved', 'Your Gemini API key is now used for scans and suggestions.');
  };

  const handleClearKey = async () => {
    await clearGeminiApiKey();
    setHasSavedKey(false);
    setApiKeyInput('');
    Alert.alert('Cleared', 'Reverted to the bundled demo key (if configured).');
  };

  const handleToggleLocation = async (value: boolean) => {
    setUseLocationState(value);
    await persistUseLocation(value);
  };

  const handleClearData = () => {
    Alert.alert('Clear All Data', 'This will delete all your food logs, profile, and settings. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete Everything', style: 'destructive', onPress: async () => {
        await clearAllData();
        router.replace('/');
      }},
    ]);
  };

  const sections = [
    {
      title: 'PREFERENCES',
      items: [
        { icon: 'notifications-outline', label: 'Meal Reminders', toggle: true, value: notifications, onToggle: setNotifications },
        { icon: 'phone-portrait-outline', label: 'Haptic Feedback', toggle: true, value: haptics, onToggle: setHaptics },
        { icon: 'scale-outline', label: 'Use Metric Units', toggle: true, value: metric, onToggle: setMetric },
      ],
    },
    {
      title: 'APP',
      items: [
        { icon: 'information-circle-outline', label: 'About Kcal.AI', value: 'v1.0.0' },
        { icon: 'shield-checkmark-outline', label: 'Privacy Policy' },
        { icon: 'document-text-outline', label: 'Terms of Service' },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {sections.map((section, si) => (
          <View key={si} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item: any, ii) => (
                <View key={ii} style={[styles.row, ii < section.items.length - 1 && styles.rowBorder]}>
                  <View style={styles.rowLeft}>
                    <Ionicons name={item.icon} size={20} color={Colors.primary} />
                    <Text style={styles.rowLabel}>{item.label}</Text>
                  </View>
                  {item.toggle ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      trackColor={{ false: Colors.surfaceContainerHigh, true: Colors.primary + '60' }}
                      thumbColor={item.value ? Colors.primary : Colors.textMuted}
                    />
                  ) : item.value ? (
                    <Text style={styles.rowValue}>{item.value}</Text>
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Provider switcher */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI PROVIDER</Text>
          <View style={styles.sectionCard}>
            {PROVIDERS.map((p, i) => {
              const active = providerType === p.type;
              return (
                <TouchableOpacity
                  key={p.type}
                  style={[styles.row, i < PROVIDERS.length - 1 && styles.rowBorder, active && styles.rowActive]}
                  onPress={() => handleSelectProvider(p.type)}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowLeft}>
                    <Ionicons name={p.icon} size={20} color={active ? Colors.primary : Colors.textMuted} />
                    <View>
                      <Text style={[styles.rowLabel, active && { color: Colors.primary }]}>{p.label}</Text>
                      <Text style={styles.rowValue}>{p.desc}</Text>
                    </View>
                  </View>
                  {active && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Provider key entry (not for Gemini — that has its own section below) */}
          {providerType !== 'gemini' && (
            <View style={[styles.sectionCard, { marginTop: 8 }]}>
              <View style={styles.aiBlock}>
                <View style={styles.rowLeft}>
                  <Ionicons name="key-outline" size={18} color={Colors.primary} />
                  <Text style={styles.rowLabel}>
                    {providerType === 'groq' ? 'Groq API Key' : 'API Key'}
                  </Text>
                </View>
                <Text style={styles.aiStatus}>
                  {providerKey ? 'Key is set.' : 'No key saved yet.'}
                </Text>
                <TextInput
                  style={styles.keyInput}
                  value={providerKeyInput}
                  onChangeText={setProviderKeyInput}
                  placeholder={providerKey ? 'Enter new key to replace' : 'Paste API key'}
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity style={styles.keySaveBtn} onPress={handleSaveProviderKey} activeOpacity={0.8}>
                  <Text style={styles.keySaveText}>Save Key</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL(providerType === 'groq' ? GROQ_CONSOLE_URL : AI_STUDIO_URL)}>
                  <Text style={styles.aiLink}>
                    {providerType === 'groq' ? 'Get free key at Groq Console →' : 'Get key →'}
                  </Text>
                </TouchableOpacity>
                {providerType === 'custom' && (
                  <>
                    <TextInput
                      style={[styles.keyInput, { marginTop: 8 }]}
                      value={customUrl}
                      onChangeText={setCustomUrl}
                      placeholder="Base URL (e.g. http://localhost:11434/v1)"
                      placeholderTextColor={Colors.textMuted}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TextInput
                      style={[styles.keyInput, { marginTop: 6 }]}
                      value={providerModel}
                      onChangeText={setProviderModel}
                      placeholder="Model ID (e.g. gpt-4o-mini)"
                      placeholderTextColor={Colors.textMuted}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity style={[styles.keySaveBtn, { marginTop: 8 }]} onPress={handleSaveCustomUrl} activeOpacity={0.8}>
                      <Text style={styles.keySaveText}>Save Endpoint</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Gemini key (vision / photo scanning) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI</Text>
          <View style={styles.sectionCard}>
            <View style={styles.aiBlock}>
              <View style={styles.rowLeft}>
                <Ionicons name="key-outline" size={20} color={Colors.primary} />
                <Text style={styles.rowLabel}>Gemini Key (vision/scanning)</Text>
              </View>
              <Text style={styles.aiStatus}>
                {hasSavedKey ? 'Your key is set — used for scans & suggestions.' : 'Using bundled demo key.'}
              </Text>
              <TextInput
                style={styles.keyInput}
                value={apiKeyInput}
                onChangeText={setApiKeyInput}
                placeholder={hasSavedKey ? 'Enter a new key to replace' : 'Paste Gemini API key'}
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.keyBtnRow}>
                <TouchableOpacity style={styles.keySaveBtn} onPress={handleSaveKey} activeOpacity={0.8}>
                  <Text style={styles.keySaveText}>Save Key</Text>
                </TouchableOpacity>
                {hasSavedKey && (
                  <TouchableOpacity style={styles.keyClearBtn} onPress={handleClearKey} activeOpacity={0.8}>
                    <Text style={styles.keyClearText}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity onPress={() => Linking.openURL(AI_STUDIO_URL)}>
                <Text style={styles.aiLink}>Get a free key at Google AI Studio →</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.row, styles.rowBorderTop]}>
              <View style={styles.rowLeft}>
                <Ionicons name="location-outline" size={20} color={Colors.primary} />
                <Text style={styles.rowLabel}>Use location for suggestions</Text>
              </View>
              <Switch
                value={useLocation}
                onValueChange={handleToggleLocation}
                trackColor={{ false: Colors.surfaceContainerHigh, true: Colors.primary + '60' }}
                thumbColor={useLocation ? Colors.primary : Colors.textMuted}
              />
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATA</Text>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleClearData}>
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
            <Text style={styles.dangerText}>Clear All Data</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Kcal.AI v1.0.0 · Made for 8x Engineer Contest</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  title: { fontFamily: FontFamily.heading, fontSize: 17, color: Colors.textPrimary },
  scroll: { paddingHorizontal: 20, gap: 8 },
  section: { marginTop: 16, gap: 12 },
  sectionTitle: { fontFamily: FontFamily.heading, fontSize: 11, color: Colors.textMuted, letterSpacing: 2 },
  sectionCard: { backgroundColor: Colors.surfaceCard, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowBorderTop: { borderTopWidth: 1, borderTopColor: Colors.border },
  rowActive: { backgroundColor: Colors.macroCaloriesBg },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { fontFamily: FontFamily.body, fontSize: 15, color: Colors.textPrimary },
  rowValue: { fontFamily: FontFamily.body, fontSize: 13, color: Colors.textMuted },
  aiBlock: { padding: 16, gap: 10 },
  aiStatus: { fontFamily: FontFamily.body, fontSize: 12, color: Colors.textMuted },
  keyInput: {
    fontFamily: FontFamily.body,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  keyBtnRow: { flexDirection: 'row', gap: 10 },
  keySaveBtn: { flex: 1, backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  keySaveText: { fontFamily: FontFamily.heading, fontSize: 14, color: Colors.onPrimary },
  keyClearBtn: { paddingHorizontal: 18, justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  keyClearText: { fontFamily: FontFamily.heading, fontSize: 14, color: Colors.textMuted },
  aiLink: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.primary },
  dangerBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,107,138,0.1)', padding: 16, borderRadius: 16 },
  dangerText: { fontFamily: FontFamily.heading, fontSize: 15, color: Colors.error },
  footer: { fontFamily: FontFamily.body, fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 32 },
});
