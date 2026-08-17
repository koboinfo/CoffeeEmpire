import React from 'react';
import { Modal as RNModal, Pressable, ScrollView, Text, View } from 'react-native';
import { CloseIcon, WarningIcon } from '../icons';
import { colors } from '../theme/theme';

export interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  /** 'urgent' で警告アイコン・赤系アクセントの緊迫感ある演出に切り替える(機材故障・税金通知など)。 */
  tone?: 'default' | 'urgent';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AppModal({ visible, onClose, title, tone = 'default', children, footer }: AppModalProps) {
  const isUrgent = tone === 'urgent';
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 items-center justify-center bg-black/60 px-md" onPress={onClose}>
        <Pressable
          className="w-full max-w-[420px] max-h-[80%] rounded-lg border bg-surface"
          style={{
            borderColor: isUrgent ? colors.negative : colors.border,
            borderWidth: isUrgent ? 1.5 : 1,
            shadowColor: isUrgent ? colors.negative : '#000000',
            shadowOpacity: isUrgent ? 0.5 : 0.3,
            shadowRadius: isUrgent ? 16 : 10,
            shadowOffset: { width: 0, height: 0 },
            elevation: isUrgent ? 10 : 4,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {title ? (
            <View
              className="flex-row items-center justify-between border-b px-md py-sm"
              style={{ borderColor: isUrgent ? 'rgba(226,86,75,0.4)' : colors.border, backgroundColor: isUrgent ? 'rgba(226,86,75,0.12)' : undefined }}
            >
              <View className="flex-1 flex-row items-center gap-xs">
                {isUrgent ? <WarningIcon size={16} color={colors.negative} /> : null}
                <Text
                  className="flex-1 text-lg font-bold"
                  style={{ color: isUrgent ? colors.negative : colors.textPrimary }}
                  numberOfLines={1}
                >
                  {title}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={8}
                className="ml-sm h-7 w-7 items-center justify-center rounded-full bg-surface-alt"
              >
                <CloseIcon size={16} color={colors.textSecondary} />
              </Pressable>
            </View>
          ) : null}
          <ScrollView contentContainerClassName="gap-sm p-md" bounces={false}>
            {children}
          </ScrollView>
          {footer ? (
            <View className="flex-row justify-end gap-sm border-t border-border px-md py-sm">{footer}</View>
          ) : null}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
