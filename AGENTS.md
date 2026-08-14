# HAEON-APP Codex Instructions

- 사용자가 구현, 수정, 구축을 요청하면 필요한 합리적 가정을 스스로 하고 바로 작업한다.
- 사소한 UI, 패키지, 폴더 구조, 네이밍 선택 때문에 사용자에게 질문하지 않는다.
- 명백히 막히는 비밀키, 외부 계정 권한, 파괴적 작업이 아니면 확인을 요청하지 않는다.
- 필요한 npm 패키지는 직접 설치한다.
- 구현 후 TypeScript, lint, tests, build 또는 Expo doctor 등 가능한 검증을 자동 실행한다.
- 한 기능만 조금 만들고 멈추지 말고 요청 범위 전체를 end-to-end로 완료한다.
- 기존 HAEON 웹 프로젝트의 API, Supabase schema, naming conventions를 최대한 재사용한다.
- 실제 secret key를 코드에 하드코딩하거나 Git에 커밋하지 않는다.
- 막히는 부분이 있으면 가능한 부분을 모두 끝낸 뒤 마지막 보고에서 남은 blocker만 정리한다.
- 매 단계마다 사용자에게 승인이나 다음 지시를 요구하지 않는다.