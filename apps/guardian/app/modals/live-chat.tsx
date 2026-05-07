import React, { useCallback, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { X } from 'lucide-react-native';

import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function LiveChatModal() {
  const router = useRouter();
  const borderColor = useThemeColor({}, 'border');
  const iconColor = useThemeColor({}, 'text');
  const fabBackground = useThemeColor({ light: 'rgba(255,255,255,0.96)', dark: 'rgba(15,23,42,0.92)' }, 'background');
  const widgetOrigin = 'https://echoflow-widget.vercel.app';
  const organizationId = 'org_3DMBCtAfR3jyoXUsI2WrAjIltLe';
  const webViewRef = useRef<WebView>(null);

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
          if (widget && typeof widget.show === 'function') widget.show();
          if (button) button.style.display = 'none';
          if (container) {
            container.style.display = 'block';
            container.style.opacity = '1';
            container.style.transform = 'none';
          }
          if (container || Date.now() - start > MAX_WAIT_MS) return;
          requestAnimationFrame(tick);
        };
        tick();
        window.addEventListener('beforeunload', () => {
          try {
            if (window.EchoWidget && typeof window.EchoWidget.destroy === 'function') {
              window.EchoWidget.destroy();
            }
          } catch (e) {}
        });
      })();
    </script>
  </body>
</html>`,
    [organizationId, widgetOrigin]
  );

  const closeChatModal = useCallback(() => {
    webViewRef.current?.injectJavaScript(`
      try {
        if (window.EchoWidget?.hide) window.EchoWidget.hide();
        if (window.EchoWidget?.destroy) window.EchoWidget.destroy();
      } catch (e) {}
      true;
    `);
    setTimeout(() => router.back(), 120);
  }, [router]);

  return (
    <ThemedView style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: widgetHtml, baseUrl: widgetOrigin }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
        startInLoadingState
        onLoadEnd={() => {
          webViewRef.current?.injectJavaScript(`
            try {
              if (window.EchoWidget?.show) window.EchoWidget.show();
            } catch (e) {}
            true;
          `);
        }}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close live chat"
        onPress={closeChatModal}
        style={[styles.closeFab, { borderColor, backgroundColor: fabBackground }]}>
        <X size={18} color={iconColor} />
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeFab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#020617',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
});
