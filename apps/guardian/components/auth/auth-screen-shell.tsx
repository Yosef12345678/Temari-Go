import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { AppBrand } from '@/components/app-brand';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type AuthScreenShellProps = {
  subtitle: string;
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function AuthScreenShell({ subtitle, title, description, children }: AuthScreenShellProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
      className="bg-background flex-1">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
        contentInsetAdjustmentBehavior="always">
        <View className="flex-1 justify-center px-4 py-8">
          <AppBrand subtitle={subtitle} />
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              {description ? <CardDescription>{description}</CardDescription> : null}
            </CardHeader>
            <CardContent className="gap-4">{children}</CardContent>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
