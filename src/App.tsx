import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate,Navigate  } from 'react-router-dom';
import Login from './Login';
import DashboardLayout from './DashboardLayout';
import NoticePage from './pages/NoticePage';

import HrPage from './pages/HrPage';
import AcctPage from './pages/AcctPage';
import OrderPage from './pages/OrderPage';
import AccountSettingsPage from "./pages/AccountSettingsPage";
import AcademyPage from './pages/AcademyPage';


function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      alert('로그인이 필요한 서비스입니다.');
      navigate('/login'); 
    } else {
      navigate('/dashboard'); 
    }
  }, [navigate]);

  return <div style={{ padding: '20px' }}>로딩 중...</div>;
}





function App() {
  return (
    <Router>
      <Routes>
        {/* 기본 주소일 때 Home 컴포넌트 실행 */}
        <Route path="/" element={<Home />} />
        
        {/* 로그인 페이지 경로 */}
        <Route path="/login" element={<Login />} />
        
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
    </Router>



  );
}

export default App;