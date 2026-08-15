import type { Product, Subscription } from '@/types/domain';
export const products: Product[] = [{ id: 'taewak', name: '해온 스마트 태왁', price: 198000, category: 'taewak' }, { id: 'band', name: '스마트 방수 밴드', price: 89000, category: 'iot' }, { id: 'care', name: '귀환 안전 패키지', price: 129000, category: 'accessory' }];
export const premiumSubscription: Subscription = { id: 'premium', name: 'HAEON SAFE 프리미엄', description: ['AI 위험 예측, 보호자 알림,', '데이터 리포트 무제한 제공'], monthlyPrice: 9900 };
export const storeSlides = [{ kicker: '해온 태왁', title: 'HAEON TAEWAK', description: 'AI 위치 추적 및 위험 감지 스마트 부표' }, { kicker: '해녀 안전 웨어러블', title: 'SAFE BAND', description: '심박·활동 상태와 긴급 신호 연동' }, { kicker: '안전 서비스', title: 'HAEON CARE', description: '보호자·어촌계 공동 대응 프리미엄 서비스' }] as const;
