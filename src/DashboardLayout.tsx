import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';


interface UserData {
  name: string;
  role: string;
}


export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;

   const today = new Date();

   const formattedDate = today.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  const handleLogout = () => {
    localStorage.clear();
    alert('로그아웃 되었습니다.');
    navigate('/login');
  };

  const [userInfo, setUserInfo] = useState<UserData>({
    name: '-',
    role: '본사 최고관리자'
  });


  // 3. 페이지가 처음 켜질 때 PHP 서버에서 회원 정보 가져오기
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // 로그인 성공 시 저장해둔 토큰이 있다면 헤더에 실어 보냅니다.
        const token = localStorage.getItem('token');
        
        const response = await axios.get('https://info7qni.dothome.co.kr/user2.php', {
          headers: {
            Authorization: token ? `Bearer ${token}` : ''
          }
        });

        console.log("받아온 원본 데이터:", response.data);

        // [서버 데이터 정제] 텍스트 접두사를 지우고 JSON 객체로 파싱
        let responseData = response.data;
        if (typeof responseData === 'string') {
          const jsonStartIndex = responseData.indexOf('{');
          if (jsonStartIndex !== -1) {
            try {
              responseData = JSON.parse(responseData.substring(jsonStartIndex));
            } catch (parseError) {
              console.error("회원 데이터 JSON 파싱 실패:", parseError);
            }
          }
        }

        console.log("정제된 회원 데이터 객체:", responseData);

        // [데이터 반영] 검사 대상을 response.data에서 responseData로 변경
        if (responseData && responseData.name) {
          setUserInfo({
            name: responseData.name,
            role: responseData.role || '본사 최고관리자'
          });
        } else {
          console.warn("회원 정보 데이터에 name 필드가 없습니다:", responseData);
        }
      } catch (error) {
        console.error("회원 정보를 가져오는데 실패했습니다:", error);
      }
    };

    fetchUserData();
  }, []); // 빈 배열: 최초 렌더링 시 1회만 실행


  
  return (
    <div id="appScreen">
      {/* ============ TOPBAR ============ */}
      <div className="topbar">
        <div className="topbar-left">
          <div className="topbar-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C7 6 4 10.5 4 14.5C4 18.6 7.6 22 12 22C16.4 22 20 18.6 20 14.5C20 10.5 17 6 12 2Z" stroke="white" strokeWidth="1.8"/>
            </svg>
          </div>
          <div>
            <div className="topbar-name" id="topbarName">{userInfo.name}</div>
            <div className="topbar-role">{userInfo.role}</div>
          </div>
        </div>
        <div className="topbar-right">
          <div className="topbar-date" id="topbarDate">{today.getFullYear()}년 {today.getMonth() + 1}월 {today.getDate()}일 ({today.toLocaleDateString('ko-KR', { weekday: 'short' })})</div>
          <button className="logout-btn" id="logoutBtn" onClick={handleLogout}>로그아웃</button>
        </div>
      </div>

      {/* ============ TAB NAVIGATION (원본 HTML 태그 완전 동일 매핑) ============ */}
      <div className="tab-nav">
        <button 
          className={`tab-item ${currentPath.includes('/dashboard/notice') ? 'active' : ''}`} 
          onClick={() => navigate('/dashboard/notice')}
        >
          공지사항 관리
        </button>
        <button 
          className={`tab-item ${currentPath.includes('/dashboard/hr') ? 'active' : ''}`} 
          onClick={() => navigate('/dashboard/hr')}
        >
          통합 인사 현황
        </button>
        <button 
          className={`tab-item ${currentPath.includes('/dashboard/acct') ? 'active' : ''}`} 
          onClick={() => navigate('/dashboard/acct')}
        >
          일일결산현황
        </button>
        <button 
          className={`tab-item ${currentPath.includes('/dashboard/order') ? 'active' : ''}`} 
          onClick={() => navigate('/dashboard/order')}
        >
          발주 취합 관리
        </button>
        <button 
          className={`tab-item ${currentPath.includes('/dashboard/academy') ? 'active' : ''}`} 
          onClick={() => navigate('/dashboard/academy')}
        >
          아카데미 관리
        </button>
        <button 
          className={`tab-item ${currentPath.includes('/dashboard/account-settings') ? 'active' : ''}`} 
          style={{ color: 'var(--accent)' }}
          onClick={() => navigate('/dashboard/account-settings')}
        >
          마스터 계정 관리
        </button>
      </div>

      {/* ============ CONTENT AREA ============ */}
      <div className="content">
        <Outlet />
      </div>
    </div>
  );
}
