# TripFrame 피드백 프로세스

**Version**: 1.0
**Created**: 2026-03-28

---

## 수집 방식

- **앱 내 피드백 버튼**: 설정 화면 하단 → 평점(⭐ 1~5) + 한줄 코멘트
- **저장**: Supabase `feedback` 테이블 (익명 제출 허용)

---

## 리뷰 주기

| 주기 | 담당 | 내용 |
|------|------|------|
| **매주 월요일** | 개발자 | 신규 피드백 검토 (Supabase Dashboard) |
| **월 1회** | 전체 | 피드백 트렌드 분석 → 우선순위 재조정 |

---

## 태스크 전환 기준

다음 조건을 **모두** 충족하면 tasks.md에 신규 태스크로 등록:

1. 평점 **≤ 3점** 피드백
2. **동일 문제** 언급이 **2건 이상**
3. 재현 가능한 문제

> 단순 칭찬/감사 피드백은 태스크로 전환하지 않음.

---

## 피드백 → 태스크 전환 흐름

```
피드백 수집 (앱)
  → Supabase feedback 테이블 저장
  → 매주 월요일 리뷰
  → 기준 충족 시 tasks.md에 TASK-XXX 추가
  → 다음 스프린트 구현
```

---

## 백오피스 조회 쿼리 (Supabase SQL Editor)

```sql
-- 이번 주 피드백 요약
SELECT
  rating,
  COUNT(*) as count,
  STRING_AGG(comment, ' | ' ORDER BY created_at DESC) as comments
FROM feedback
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY rating
ORDER BY rating;

-- 저평점 피드백 (개선 대상)
SELECT rating, comment, created_at
FROM feedback
WHERE rating <= 3
ORDER BY created_at DESC
LIMIT 20;
```
