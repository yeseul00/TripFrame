import React, { useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Dimensions,
  Platform,
  type ListRenderItemInfo,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { encryptedStorage } from '../storage/encryptedStorage'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export const ONBOARDING_FLAG_KEY = 'onboarding_complete'

interface Slide {
  id: string
  icon: string
  title: string
  subtitle: string
  cta?: string
}

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: '🔍',
    title: '여행의 빈 칸을 찾아드려요',
    subtitle: '이동수단이 빠진 구간을 자동으로 감지해요.\n놓친 교통편 예약, 앱이 먼저 알려드릴게요.',
  },
  {
    id: '2',
    icon: '⏱',
    title: '집 출발 시간을 역산해요',
    subtitle: '항공편 시간에서 거꾸로 계산해\n몇 시에 집을 나서야 하는지 알려드려요.',
  },
  {
    id: '3',
    icon: '✈️',
    title: '지금 시작해볼까요?',
    subtitle: '첫 여행 일정을 만들어보세요.',
    cta: '시작하기',
  },
]

interface OnboardingScreenProps {
  onComplete: () => void
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const flatListRef = useRef<FlatList<Slide>>(null)

  async function complete() {
    try {
      await encryptedStorage.setItem(ONBOARDING_FLAG_KEY, 'true')
    } catch (e) {
      console.warn('[Onboarding] storage error, proceeding anyway:', e)
    }
    onComplete()
  }

  function goNext() {
    const next = currentIndex + 1
    if (next < SLIDES.length) {
      flatListRef.current?.scrollToIndex({ index: next, animated: true })
      setCurrentIndex(next)
    }
  }

  function renderItem({ item }: ListRenderItemInfo<Slide>) {
    return (
      <View style={{ width: SCREEN_WIDTH }} className="flex-1 items-center justify-center px-8">
        <Text className="text-6xl mb-8">{item.icon}</Text>
        <Text className="text-white text-2xl font-bold text-center mb-4">{item.title}</Text>
        <Text className="text-muted text-base text-center leading-6">{item.subtitle}</Text>

        {item.cta && (
          <TouchableOpacity
            onPress={complete}
            className="mt-10 bg-primary rounded-full px-10 py-4"
          >
            <Text className="text-white text-base font-bold">{item.cta}</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }

  // 웹 환경: FlatList 대신 ScrollView + 명시적 배경색 적용 (B-01)
  if (Platform.OS === 'web') {
    const slide = SLIDES[currentIndex]
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#0F0F13' }}>
        <View style={{ alignItems: 'flex-end', paddingHorizontal: 16, paddingTop: 16 }}>
          <TouchableOpacity onPress={complete}>
            <Text style={{ color: '#6B7280', fontSize: 14 }}>건너뛰기</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: 48 }}>
            <Text style={{ fontSize: 64, marginBottom: 32 }}>{slide.icon}</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 }}>{slide.title}</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 16, textAlign: 'center', lineHeight: 24 }}>{slide.subtitle}</Text>
            {slide.cta && (
              <TouchableOpacity
                onPress={complete}
                style={{ marginTop: 40, backgroundColor: '#A78BFA', borderRadius: 999, paddingHorizontal: 40, paddingVertical: 16 }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>{slide.cta}</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 32, paddingBottom: 40 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {SLIDES.map((_, i) => (
              <View key={i} style={{
                borderRadius: 999,
                width: i === currentIndex ? 20 : 8,
                height: 8,
                backgroundColor: i === currentIndex ? '#A78BFA' : '#4B5563',
              }} />
            ))}
          </View>
          {currentIndex < SLIDES.length - 1 && (
            <TouchableOpacity onPress={goNext} style={{ borderWidth: 1, borderColor: '#374151', borderRadius: 999, paddingHorizontal: 24, paddingVertical: 8, backgroundColor: '#1F2937' }}>
              <Text style={{ color: '#FFFFFF' }}>다음</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      {/* 건너뛰기 */}
      <View className="items-end px-4 pt-4">
        <TouchableOpacity onPress={complete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text className="text-muted text-sm">건너뛰기</Text>
        </TouchableOpacity>
      </View>

      {/* 슬라이드 */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
          setCurrentIndex(index)
        }}
        className="flex-1"
      />

      {/* 페이지 인디케이터 + 다음 버튼 */}
      <View className="flex-row items-center justify-between px-8 pb-10">
        {/* Dots */}
        <View className="flex-row gap-2">
          {SLIDES.map((_, i) => (
            <View
              key={i}
              className={`rounded-full ${i === currentIndex ? 'w-5 h-2 bg-primary' : 'w-2 h-2 bg-gray-600'}`}
            />
          ))}
        </View>

        {/* 다음 버튼 (마지막 슬라이드에서는 숨김) */}
        {currentIndex < SLIDES.length - 1 && (
          <TouchableOpacity
            onPress={goNext}
            className="bg-card border border-gray-700 rounded-full px-6 py-2"
          >
            <Text className="text-white text-sm">다음 →</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  )
}
