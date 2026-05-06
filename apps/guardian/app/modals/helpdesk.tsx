import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function HelpDeskModal() {
  const router = useRouter();
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'background');
  const muted = useThemeColor({}, 'icon');
  const widgetOrigin = 'https://echoflow-widget.vercel.app';
  const organizationId = 'org_3DMBCtAfR3jyoXUsI2WrAjIltLe';
  const widgetHtml = useMemo(
    () => `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
    <base href="${widgetOrigin}/" />
    <title>Parent Support Chat</title>
    <style>
      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
        width: 100%;
        background: #f8fafc;
        overflow: hidden;
      }
      #root {
        height: 100%;
        width: 100%;
      }
      /* Adapt floating web widget into embedded full-card mode */
      #echoflow-widget-button {
        display: none !important;
      }
      #echoflow-widget-container {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        max-width: 100% !important;
        max-height: 100% !important;
        right: auto !important;
        left: auto !important;
        bottom: auto !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        display: block !important;
        opacity: 1 !important;
        transform: none !important;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script src="${widgetOrigin}/widget.js" data-organization-id="${organizationId}"></script>
    <script>
      (function () {
        const start = Date.now();
        const MAX_WAIT_MS = 7000;
        const tick = () => {
          const widget = window.EchoWidget;
          const container = document.getElementById('echoflow-widget-container');
          const button = document.getElementById('echoflow-widget-button');

          if (widget && typeof widget.show === 'function') {
            widget.show();
          }
          if (button) {
            button.style.display = 'none';
          }
          if (container) {
            container.style.display = 'block';
            container.style.opacity = '1';
            container.style.transform = 'none';
          }

          if (container || Date.now() - start > MAX_WAIT_MS) return;
          requestAnimationFrame(tick);
        };
        tick();
      })();
    </script>
  </body>
</html>`,
    [organizationId, widgetOrigin]
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <ThemedText type="defaultSemiBold">Help Desk</ThemedText>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.closeButton}>
          <ThemedText type="link">Close</ThemedText>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={[styles.sectionCard, { borderColor, backgroundColor: cardBackground }]}>
          <ThemedText type="subtitle">How to track your child</ThemedText>
          <ThemedText>1. Open the `Children` tab and select your child.</ThemedText>
          <ThemedText>2. Tap `Live Tracking` on the child details page.</ThemedText>
          <ThemedText>3. Use `Retry Check` if location does not refresh.</ThemedText>
        </View>

        <View style={[styles.sectionCard, { borderColor, backgroundColor: cardBackground }]}>
          <ThemedText type="subtitle">Notifications not working?</ThemedText>
          <ThemedText>Try these quick checks:</ThemedText>
          <ThemedText>- Make sure app notification permission is enabled.</ThemedText>
          <ThemedText>- Disable battery optimization for this app.</ThemedText>
          <ThemedText>- Confirm internet/data is active.</ThemedText>
          <ThemedText>- Pull down to refresh on the Notifications tab.</ThemedText>
          <ThemedText>- Log out and sign in again to refresh your session.</ThemedText>
        </View>

        <View style={[styles.sectionCard, { borderColor, backgroundColor: cardBackground }]}>
          <ThemedText type="subtitle">FAQ</ThemedText>
          <ThemedText type="defaultSemiBold">Why can’t I see billing or notifications?</ThemedText>
          <ThemedText style={{ color: muted }}>
            Your account needs at least one student assigned by the admin before these sections become active.
          </ThemedText>

          <ThemedText type="defaultSemiBold">What if live tracking shows old data?</ThemedText>
          <ThemedText style={{ color: muted }}>
            Check connection first, then refresh the tracking screen. If it persists, contact admin support.
          </ThemedText>

          <ThemedText type="defaultSemiBold">Payment marked failed, but money was deducted?</ThemedText>
          <ThemedText style={{ color: muted }}>
            Wait a few minutes and refresh Billing. If status is still wrong, share transaction reference with admin.
          </ThemedText>
        </View>

        <View style={[styles.sectionCard, { borderColor, backgroundColor: cardBackground }]}>
          <ThemedText type="subtitle">Live support chat</ThemedText>
          <ThemedText style={{ color: muted }}>
            Start chat for account help, billing questions, or tracking issues.
          </ThemedText>
          <View style={[styles.chatWrap, { borderColor }]}>
            <WebView
              source={{ html: widgetHtml, baseUrl: widgetOrigin }}
              originWhitelist={['*']}
              javaScriptEnabled
              domStorageEnabled
              mixedContentMode="always"
              thirdPartyCookiesEnabled
              sharedCookiesEnabled
              startInLoadingState
            />
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  closeButton: { paddingVertical: 6, paddingHorizontal: 10 },
  body: {
    padding: 16,
    gap: 12,
    paddingBottom: 28,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  chatWrap: {
    height: 460,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
