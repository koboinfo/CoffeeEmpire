import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { AppModal } from './Modal';
import { AppButton } from './AppButton';
import { BuildingIcon, CoffeeBeanIcon, StaffIcon } from '../icons';
import { colors } from '../theme/theme';
import { hasSeenOnboarding, markOnboardingSeen } from '../state/persistence';

interface OnboardingStep {
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  title: string;
  description: string;
}

const STEPS: OnboardingStep[] = [
  {
    Icon: BuildingIcon,
    title: '① 空き物件を探して最初の店舗を借りる',
    description: '「マップ」タブで都市を選び、空きテナント(物件)をタップして最初のカフェを出店しましょう。',
  },
  {
    Icon: CoffeeBeanIcon,
    title: '② 豆を仕入れて価格を設定する',
    description: '「焙煎」タブで生豆を仕入れて焙煎し、店舗のメニュー価格を都市の所得水準に合わせて調整しましょう。',
  },
  {
    Icon: StaffIcon,
    title: '③ 従業員を雇ってターンを進める',
    description: '店舗詳細の「人事」タブでバリスタを雇い、HudBar右上の1x/2x/5xでターンを進めて経営を軌道に乗せましょう。',
  },
];

/**
 * 初回起動時のみ表示するウェルカムガイド。一度「はじめる」まで進めるとAsyncStorageに
 * 記録され、以後(黒字倒産からの再スタートを含め)二度と表示されない。
 */
export function OnboardingModal() {
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    hasSeenOnboarding().then((seen) => {
      if (!seen) setVisible(true);
    });
  }, []);

  const dismiss = () => {
    setVisible(false);
    markOnboardingSeen();
  };

  const isLastStep = stepIndex === STEPS.length - 1;
  const step = STEPS[stepIndex];

  return (
    <AppModal visible={visible} onClose={dismiss} title="Coffee Empireへようこそ">
      <View className="items-center gap-md py-sm">
        <View className="h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(217,114,44,0.16)' }}>
          <step.Icon size={30} color={colors.roast} />
        </View>
        <Text className="text-center text-base font-bold text-text-primary">{step.title}</Text>
        <Text className="text-center text-xs text-text-secondary">{step.description}</Text>
        <View className="flex-row gap-xs">
          {STEPS.map((_, index) => (
            <View
              key={index}
              className="h-[6px] w-[6px] rounded-full"
              style={{ backgroundColor: index === stepIndex ? colors.roast : colors.border }}
            />
          ))}
        </View>
        <AppButton
          label={isLastStep ? 'はじめる' : '次へ'}
          icon={isLastStep ? 'checkmark-circle' : 'arrow-forward'}
          onPress={() => (isLastStep ? dismiss() : setStepIndex((i) => i + 1))}
        />
      </View>
    </AppModal>
  );
}
