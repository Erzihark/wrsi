import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Button } from './Button';
import { Text } from './Text';

export interface ConfirmOptions {
  message: string;
  title?: string;
  /** Confirm button label (default "Confirm"). */
  confirmText?: string;
  /** Cancel button label (default "Cancel"). */
  cancelText?: string;
  /** Style the confirm button as destructive (red). */
  destructive?: boolean;
}

export interface ConfirmContextValue {
  /**
   * Show a themed confirmation dialog. Resolves `true` if the user confirms,
   * `false` if they cancel or dismiss it.
   */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

interface PendingState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

/**
 * Global confirmation-dialog host. Mount once near the app root. Any wrapped
 * component calls `await useConfirm().confirm({...})` to gate a destructive or
 * consequential action behind an explicit yes/no.
 *
 * Replaces ad-hoc native `Alert.alert(...)` confirms with a single themed
 * surface driven by the design tokens, so the designer restyles it in one place.
 * Text is passed in by the caller (where i18n `t` is available), keeping this
 * component decoupled from the translation layer.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const t = useTheme();
  const [pending, setPending] = useState<PendingState | null>(null);
  // Guards against a resolve firing twice (e.g. confirm tap + onRequestClose).
  const settled = useRef(false);

  const confirm = useCallback((options: ConfirmOptions) => {
    settled.current = false;
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  const settle = useCallback(
    (value: boolean) => {
      if (settled.current) return;
      settled.current = true;
      pending?.resolve(value);
      setPending(null);
    },
    [pending],
  );

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Modal
        visible={pending != null}
        transparent
        animationType="fade"
        onRequestClose={() => settle(false)}
      >
        <Pressable
          onPress={() => settle(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.45)',
            justifyContent: 'center',
            padding: t.spacing.xl,
          }}
        >
          {/* Stop taps on the card from dismissing via the backdrop press. */}
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: t.color.background,
              borderRadius: t.radius.lg,
              padding: t.spacing.xl,
              gap: t.spacing.md,
            }}
          >
            {pending?.title ? <Text variant="title">{pending.title}</Text> : null}
            {pending ? <Text>{pending.message}</Text> : null}
            <View style={{ flexDirection: 'row', gap: t.spacing.sm, marginTop: t.spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Button
                  variant="secondary"
                  title={pending?.cancelText ?? 'Cancel'}
                  onPress={() => settle(false)}
                  testID="confirm-dialog-cancel"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  variant={pending?.destructive ? 'danger' : 'primary'}
                  title={pending?.confirmText ?? 'Confirm'}
                  onPress={() => settle(true)}
                  testID="confirm-dialog-confirm"
                />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ConfirmContext.Provider>
  );
}

/** Access the confirm host. Throws if used outside a `ConfirmProvider`. */
export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider');
  return ctx;
}
