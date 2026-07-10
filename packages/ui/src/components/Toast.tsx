import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastOptions {
  message: string;
  type?: ToastType;
  /** Auto-dismiss delay in ms. Defaults to 3000. */
  duration?: number;
}

export interface ToastContextValue {
  /** Show a transient notification. Replaces any toast already on screen. */
  show: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Global toast host. Mount once near the app root (inside ThemeProvider +
 * SafeAreaProvider). Any wrapped component calls `useToast().show(...)` to give
 * lightweight, non-blocking success/error feedback for an action — unlike a
 * native Alert it doesn't interrupt the flow or require a tap to dismiss.
 *
 * The visuals derive entirely from the design tokens, so the designer's system
 * restyles it from `tokens.ts` without touching call sites.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<(ToastOptions & { type: ToastType }) | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const hide = useCallback(() => {
    clearTimer();
    Animated.timing(opacity, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setToast(null);
    });
  }, [opacity]);

  const show = useCallback(
    ({ message, type = 'info', duration = 3000 }: ToastOptions) => {
      clearTimer();
      setToast({ message, type });
      opacity.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
      timer.current = setTimeout(hide, duration);
    },
    [hide, opacity],
  );

  // Clean up a pending timer if the provider unmounts.
  useEffect(() => clearTimer, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? <ToastView toast={toast} opacity={opacity} onPress={hide} /> : null}
    </ToastContext.Provider>
  );
}

function ToastView({
  toast,
  opacity,
  onPress,
}: {
  toast: ToastOptions & { type: ToastType };
  opacity: Animated.Value;
  onPress: () => void;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const accent =
    toast.type === 'success'
      ? t.color.success
      : toast.type === 'error'
        ? t.color.danger
        : t.color.primary;
  const icon = toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ';

  return (
    // box-none lets touches fall through everywhere except the toast pill itself.
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: insets.bottom + t.spacing.lg,
        paddingHorizontal: t.spacing.lg,
        alignItems: 'center',
        pointerEvents: 'box-none',
      }}
    >
      <Animated.View style={{ opacity, width: '100%', maxWidth: 520 }}>
        <Pressable
          accessibilityRole="alert"
          onPress={onPress}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: t.spacing.sm,
            backgroundColor: t.color.text,
            borderLeftWidth: 4,
            borderLeftColor: accent,
            borderRadius: t.radius.md,
            paddingVertical: t.spacing.md,
            paddingHorizontal: t.spacing.lg,
            // Subtle elevation so it reads as floating above content.
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 6,
          }}
        >
          <Text style={{ color: accent, fontWeight: t.fontWeight.bold }}>{icon}</Text>
          <Text style={{ color: t.color.background, flexShrink: 1 }}>{toast.message}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

/** Access the toast host. Throws if used outside a `ToastProvider`. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
