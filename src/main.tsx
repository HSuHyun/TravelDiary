import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css'; // ✅ 이 줄이 있어야 Tailwind 적용
import { registerSW } from 'virtual:pwa-register'

registerSW({ immediate: true })
// 필요하면 아래처럼 업데이트 토스트도 구현 가능해요:
// const updateSW = registerSW({
//   onNeedRefresh() { if (confirm('새 버전이 있어요. 새로고침할까요?')) updateSW(true) },
//   onOfflineReady() { console.log('오프라인 준비 완료') },
// })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);