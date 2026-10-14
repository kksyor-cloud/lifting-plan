# 리프팅 플랜 (LIFTING PLAN)

크레인 양중 사전 검토 앱. Expo SDK 57, React Native, TypeScript, Expo Router.

> 장비 제원표는 5개 제조사(KATO·LIEBHERR·TADANO·GROVE·KOBELCO) 200t 이하 292개 기종의 실제 제원입니다(`src/data/catalog.json`).
> 검토 계산은 하중표가 등록된 Tadano GR-N 5개 기종만 쓰며, 하중표는 공식 PDF 추출본이라 **원본 대조 전**입니다. 대조를 마치기 전에는 현장 검토에 쓰면 안 됩니다.

## 장비 데이터 갱신

```bash
python3 scripts/sync-catalog.py   # /mnt/project-files/catalog/cranes.json -> src/data/catalog.json
```

하중표가 있는 기종을 검토 계산에 넣으려면 카탈로그의 `chart` 에 하중표를 넣으면 자동으로 검토 계산 장비가 됩니다(`src/lib/cranes.ts` 의 `toCrane`). 붐 피벗 높이는 등급으로 어림한 가정값입니다.

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
    equipment/         장비 제원표 (목록 필터·검색, 기종 상세)
  lib/
    calc.ts            양중 계산 (순수 함수, 테스트 대상)
    catalog.ts         장비 카탈로그 (292종 제원, 필터)
    cranes.ts          검토 계산용 장비 (하중표 등록 기종)
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
- 아웃리거 반력(간이): 최대 반력 = 75% × (장비 중량 + 인양 하중), 접지압 = 반력 / 받침판 면적, 허용 지지력 대비 80% 초과 주의
- 검토서 PDF: 결과 화면 "PDF 내보내기" (앱은 공유 창, 웹은 인쇄 창)
- 결과는 저장하지 않고 입력만 저장하며, 열 때마다 같은 로직으로 다시 계산

## 다음 할 일

- 하중표 원본 대조 (Tadano GR-N 5종), 다른 기종 하중표 등록

- 이동타워 크레인
- 아웃리거 반력: 제조사 반력표 기반 계산 (현재는 75% 간이 추정)
