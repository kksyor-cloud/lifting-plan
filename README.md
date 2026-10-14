# 양중노트 (LIFTNOTE)

크레인 양중 사전 검토 앱. Expo SDK 57, React Native, TypeScript, Expo Router.

> 장비 데이터(`src/lib/cranes.ts`)는 개발용 **샘플**입니다. 실제 제조사 하중표로 바꾸기 전에는 현장 검토에 쓰면 안 됩니다.

## 실행

```bash
npm install
npx expo start        # Expo Go 앱으로 QR 스캔, 또는 w 키로 웹
npm test              # 계산 로직 테스트
npm run typecheck
```

## 구조

```
src/
  app/                 화면 (Expo Router)
    index.tsx          홈
    review/input.tsx   1. 조건 입력
    review/select.tsx  2. 장비 선택 (후보 비교 + 측면도)
    review/result.tsx  3. 검토 결과 (검토서)
    history.tsx        검토 기록
    equipment.tsx      장비 제원표
  lib/
    calc.ts            양중 계산 (순수 함수, 테스트 대상)
    cranes.ts          장비 제원·하중표 (샘플)
    review-context.tsx 검토 한 건의 단일 상태
    history.ts         기록 저장 (AsyncStorage)
  components/          공용 UI, 측면도, 크레인 마크
  theme.ts             브랜드 토큰 (노랑·차콜)
```

## 계산 방식

- 작업반경 R = 건물 이격거리 + 도달거리
- 필요 Tip 높이 = 건물 높이 + 1.0m + (자재 높이 + 줄걸이 높이, 미입력 시 2.5m) + 2.0m
- 장비마다 조건(붐 각도 범위, Tip 높이, 건물 모서리와 1.0m 이상 이격)을 만족하는 가장 짧은 붐 길이를 0.1m 단위로 찾음
- 정격하중은 하중표에서 같거나 긴 붐, 같거나 먼 반경 칸을 적용 (보수적)
- 하중률 = (자재 + 줄걸이 용구 + 훅 블록) / 정격하중. 80% 이하 가능, 100% 이하 주의, 초과 불가
- 슬링: 2가닥 기준, 1가닥 장력 = 하중 / (2·sin 각도)
- 결과는 저장하지 않고 입력만 저장하며, 열 때마다 같은 로직으로 다시 계산

## 다음 할 일

- 실제 하중표 데이터와 출처·버전 입력
- 검토서 PDF 내보내기
- 이동타워 크레인, 아웃리거 반력·지반 검토
