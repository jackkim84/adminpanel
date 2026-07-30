import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// 로그인과 대시보드 레이아웃은 첫 화면 노출을 위해 기본 import 유지
import Login from './Login';
import DashboardLayout from './DashboardLayout';

// 대시보드 하위 페이지들은 필요할 때만 불러오도록 lazy 로딩 처리
const NoticePage = lazy(() => import('./pages/NoticePage'));
const HrPage = lazy(() => import('./pages/HrPage'));
const AcctPage = lazy(() => import('./pages/AcctPage'));
const OrderPage = lazy(() => import('./pages/OrderPage'));
const AccountSettingsPage = lazy(() => import('./pages/AccountSettingsPage'));
const AcademyPage = lazy(() => import('./pages/AcademyPage'));

function App() {
  // 브라우저 저장소에서 토큰 존재 여부를 boolean 값(true/false)으로 판별합니다.
  const hasToken = !!localStorage.getItem('token');

  return (
    <Router>
      <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>화면을 불러오는 중입니다...</div>}>
        <Routes>
          {/* 
            [변경 완료] 
            루트 주소('/')로 들어오면 Home 컴포넌트를 거치지 않고 바로 목적지로 순간 이동합니다.
          */}
          <Route 
            path="/" 
            element={hasToken ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} 
          />
          
          {/* 로그인 페이지 경로 */}
          <Route path="/login" element={<Login />} />
          
          {/* 대시보드 레이아웃 및 하위 메뉴 경로 */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Navigate to="notice" replace />} />
            <Route path="notice" element={<NoticePage />} />
            <Route path="hr" element={<HrPage />} />
            <Route path="acct" element={<AcctPage />} />
            <Route path="order" element={<OrderPage />} /> 
            <Route path="academy" element={<AcademyPage />} />  
            <Route path="account-settings" element={<AccountSettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard/notice" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
