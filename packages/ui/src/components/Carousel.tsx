import { Children, useState, type ReactNode } from 'react';
import {
  ScrollView,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export interface CarouselProps {
  /** Each child becomes a full-width page. */
  children: ReactNode;
  /** Show the page-dot indicator (default true). */
  showDots?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * A horizontally paged carousel with dot indicators — the dashboard highlights
 * pager (profile-completion card + counselor card). Built on a paging
 * `ScrollView` so it adds no dependency and behaves identically on iOS/Android.
 * Page width is measured via `onLayout` (not `Dimensions`) so it's correct
 * inside any padded container.
 */
export function Carousel({ children, showDots = true, style }: CarouselProps) {
  const t = useTheme();
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const pages = Children.toArray(children);

  function onLayout(e: LayoutChangeEvent) {
    setWidth(e.nativeEvent.layout.width);
  }

  function onMomentumScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (width > 0) setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  }

  return (
    <View style={style} onLayout={onLayout}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        // Snap even if pagingEnabled misses on some Android builds.
        snapToInterval={width > 0 ? width : undefined}
        decelerationRate="fast"
      >
        {width > 0
          ? pages.map((page, i) => (
              <View key={i} style={{ width }}>
                {page}
              </View>
            ))
          : null}
      </ScrollView>

      {showDots && pages.length > 1 ? (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: t.spacing.xs,
            marginTop: t.spacing.sm,
          }}
        >
          {pages.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === index ? 18 : 6,
                height: 6,
                borderRadius: t.radius.pill,
                backgroundColor: i === index ? t.color.primary : t.color.border,
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
