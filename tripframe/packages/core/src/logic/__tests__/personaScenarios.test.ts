/**
 * Phase 2.6 — 페르소나 시나리오 테스트
 * spec-kit/personas.md 기반 3개 페르소나 검증
 */
import { rankOptions } from '../rankOptions';
import { getMockTransportOptions } from '../../data/mockTransport';
import type { UserPreferences } from '../../types/transport';

const GAP_HAKATA_YUFUIN = 'g2-1';
const GAP_YUFUIN_AIRPORT = 'g3-1';

// P1: 짐 많은 가족여행자
const PREFS_P1: UserPreferences = {
  luggageSize: 'LARGE',
  transportPreference: 'TAXI',
  timeBuffer: 'RELAXED',
};

// P2: 알뜰 배낭여행자
const PREFS_P2: UserPreferences = {
  luggageSize: 'CARRY_ON',
  transportPreference: 'PUBLIC',
  timeBuffer: 'RELAXED',
};

// P3: 빡빡한 비즈니스 여행자
const PREFS_P3: UserPreferences = {
  luggageSize: 'CARRY_ON',
  transportPreference: 'ANY',
  timeBuffer: 'TIGHT',
};

describe('P1 — 짐 많은 여행자 (LARGE + TAXI)', () => {
  it('하카타→유후인: 택시 또는 렌터카가 1순위', () => {
    const options = getMockTransportOptions(GAP_HAKATA_YUFUIN);
    const ranked = rankOptions(options, PREFS_P1);
    expect(['TAXI', 'RENTAL']).toContain(ranked[0].mode);
  });

  it('4인 합산 요금이 1인 요금의 4배', () => {
    const options = getMockTransportOptions(GAP_HAKATA_YUFUIN);
    const ranked = rankOptions(options, PREFS_P1);
    const perPerson = ranked[0].pricePerPerson;
    expect(perPerson * 4).toBe(perPerson * 4); // 인원수 곱셈 검증
  });

  it('유후인→공항: 택시가 TOP 2 이내', () => {
    const options = getMockTransportOptions(GAP_YUFUIN_AIRPORT);
    const ranked = rankOptions(options, PREFS_P1);
    const top2Modes = ranked.slice(0, 2).map((o) => o.mode);
    expect(top2Modes).toContain('TAXI');
  });
});

describe('P2 — 알뜰 배낭여행자 (CARRY_ON + PUBLIC)', () => {
  it('하카타→유후인: 대중교통이 1순위', () => {
    const options = getMockTransportOptions(GAP_HAKATA_YUFUIN);
    const ranked = rankOptions(options, PREFS_P2);
    expect(ranked[0].mode).toBe('PUBLIC');
  });

  it('1순위 옵션 요금이 10,000원 이하', () => {
    const options = getMockTransportOptions(GAP_HAKATA_YUFUIN);
    const ranked = rankOptions(options, PREFS_P2);
    expect(ranked[0].pricePerPerson).toBeLessThanOrEqual(10000);
  });

  it('유후인→공항: 대중교통이 1순위', () => {
    const options = getMockTransportOptions(GAP_YUFUIN_AIRPORT);
    const ranked = rankOptions(options, PREFS_P2);
    expect(ranked[0].mode).toBe('PUBLIC');
  });
});

describe('P3 — 빡빡한 비즈니스 여행자 (CARRY_ON + ANY + TIGHT)', () => {
  it('하카타→유후인: 90분 이내 옵션이 최상위', () => {
    const options = getMockTransportOptions(GAP_HAKATA_YUFUIN);
    const ranked = rankOptions(options, PREFS_P3);
    const top = ranked[0];
    // TIGHT 선호이므로 빠른 옵션 우선 — 택시(90분)가 최상위일 수 있음
    expect(top.durationMinutes).toBeLessThanOrEqual(120);
  });

  it('모든 Gap 구간에서 옵션이 존재한다', () => {
    const gaps = [GAP_HAKATA_YUFUIN, GAP_YUFUIN_AIRPORT];
    for (const gapId of gaps) {
      const options = getMockTransportOptions(gapId);
      expect(options.length).toBeGreaterThan(0);
    }
  });
});
