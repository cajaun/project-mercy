import * as Haptics from "expo-haptics";
import type { FC } from "react";
import React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SwiperDot, DOT_CONTAINER_WIDTH } from "./swiper-dot";
import { useSwiper } from "./swiper-context";
import { colorKit } from "reanimated-color-picker";


const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const _containerDefaultBgColor = colorKit.setAlpha("#fff", 0).hex();
const _containerPressedBgColor = colorKit.setAlpha("#fff", 0.1).hex();

interface SwiperPaginationProps {
  defaultDotColor?: string;
  activeDotColor?: string;
  
}

export const SwiperPagination: FC<SwiperPaginationProps> = ({
  defaultDotColor = "#BFBFBF",
  activeDotColor = "#000000",
}) => {
  const {
    content,
    currentIndex,
    setCurrentIndex,
    SwiperRef,
    dotsListRef,
    isDotsPressed,
    setIsDotsPressed,
  } = useSwiper();

  const listOffsetX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      listOffsetX.value = event.contentOffset.x;
    },
  });

  const translateXStep = content.length > 10 ? 12 : 15;
  const prevTranslateX = useSharedValue(0);

  const handleImageIndexChange = (action: "increase" | "decrease") => {
    const index = action === "increase" ? currentIndex + 1 : currentIndex - 1;

    if (index < 0 || index >= content.length) {
      return;
    }

    setCurrentIndex(index);

    if (Platform.OS === "ios") {
      // Only use haptics on iOS as it can feel overwhelming on Android
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (index >= 0 && index < content.length) {
      SwiperRef.current?.scrollToIndex({
        animated: false,
        index,
      });
    }
  };

  const handleFinalize = () => {
    if (!isDotsPressed) {
      return;
    }

    setIsDotsPressed(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const gesture = Gesture.Pan()
    .onStart(() => {
      prevTranslateX.value = 0;
    })
    .onUpdate((event) => {
      if (!isDotsPressed) {
        return;
      }

      const translateX = event.translationX;

      if (translateX - prevTranslateX.value > translateXStep) {
        runOnJS(handleImageIndexChange)("increase");
        prevTranslateX.value = translateX;
      }

      if (translateX - prevTranslateX.value < -translateXStep) {
        runOnJS(handleImageIndexChange)("decrease");
        prevTranslateX.value = translateX;
      }
    })
    .onFinalize(() => {
      runOnJS(handleFinalize)();
    });

  const rContainerStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withTiming(
        isDotsPressed ? _containerPressedBgColor : _containerDefaultBgColor,
        { duration: 150 }
      ),
    };
  });

  if (content.length <= 1) {
    return null;
  }

  return (
    <GestureDetector gesture={gesture}>
      <AnimatedPressable
        className="bg-white/10 p-2 rounded-full"
        style={[styles.container, rContainerStyle]}
        onLongPress={() => {
          setIsDotsPressed(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
        delayLongPress={200}
      >
        <View
          style={{
            width:
              DOT_CONTAINER_WIDTH * (content.length > 5 ? 7 : content.length),
          }}
        >
          <Animated.FlatList
            ref={dotsListRef}
      
            data={Array.from({
              length: content.length > 5 ? content.length + 4 : content.length,
            }).map((_, index) => index)}
            renderItem={({ item }) => (
              <SwiperDot
                index={item}
                listOffsetX={listOffsetX}
                isActive={
                  content.length > 5
                    ? item === currentIndex + 2
                    : item === currentIndex
                }
                totalContent={content.length}
                defaultDotColor={defaultDotColor}
                activeDotColor={activeDotColor}
              />
            )}
            horizontal
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
          />
        </View>
      </AnimatedPressable>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    borderCurve: "continuous",
  },
});


