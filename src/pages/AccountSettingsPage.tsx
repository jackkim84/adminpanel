import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';


interface UserData {
  name: string;
  rdate : string;
  status : string;
  type : string;
  password : string;
  userId : string;
  level : string;
  id : number;
}

export default function NoticePage() {



  const [userInfo, setUserInfo] = useState<UserData[]>([]); 
  const [currentPage, setCurrentPage] = useState<number>(1); // 현재 선택된 페이지
  const [totalPages, setTotalPages] = useState<number>(1);   // 백엔드가 계산해 준 총 페이지 수
  const [name, setName] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [password, setPassword] = useState<string>("");
    const [status, setStatus] = useState<string>("");

    const fetchUserData = async (targetPage: number) => {
      try {
        // 로그인 성공 시 저장해둔 토큰이 있다면 헤더에 실어 보냅니다.
    
        const response = await axios.get(`http://info7qni.dothome.co.kr/userlist.php?page=${targetPage}`);
     
        if (response.data) {
          setUserInfo(response.data.data);
         
          setTotalPages(response.data.total_pages);
        }
      } catch (error) {
        console.error("회원 정보를 가져오는데 실패했습니다:", error);
      }
    };


    // 3. 페이지가 처음 켜질 때 PHP 서버에서 회원 정보 가져오기
  useEffect(() => {


     fetchUserData(currentPage);
  }, [currentPage]); // 빈 배열: 최초 렌더링 시 1회만 실행


  const changeAccountStatus = async (id:number, status:string) => {

    try {
      const response = await axios.post('http://info7qni.dothome.co.kr/update_user.php', {
        id: id,     
        status: status
      });

      if (response.data && response.data.success) {
  
        setStatus(status);
        if (currentPage === 1) {
          fetchUserData(1); 
        } else {
          setCurrentPage(1); 
        }
      }

    } catch (error) {
      console.error("공지 등록 실패:", error);
      alert('서버 전송 중 오류가 발생했습니다.');
    }

  }


  const handleSubmit = async (e: React.FormEvent) => {

     e.preventDefault();

    if (!userId.trim() || !password.trim()) {
      alert('아이디와 비밀번호를 모두 입력해 주세요.'); return;
    }



    try {
      const response = await axios.post('http://info7qni.dothome.co.kr/insert_user.php', {
        userId: userId,
        password: password,
        type: type,
        name: name
      });

      if (response.data && response.data.success) {
  
        alert(response.data.message);
  
        setUserId('');
        setPassword('');
        setType('');
        setName('');


        if (currentPage === 1) {
          fetchUserData(1); 
        } else {
          setCurrentPage(1); 
        }
      }
    } catch (error) {
      console.error("공지 등록 실패:", error);
      alert('서버 전송 중 오류가 발생했습니다.');
    }
  }
    
      return (

    <div className="page" id="pageAccountSettings">
         <form 
                onSubmit={handleSubmit}
                
                >
    <div style={{ border: '1px solid var(--accent)', background: 'var(--accent-tint)' }}>
        <div style={{ background: 'none', borderBottom: '1px solid var(--border)', padding: '16px' }}>
        <div>
            <div style={{ color: 'var(--text)', fontSize: '16px', fontWeight: 'bold' }}>
            [최고관리자 전용] 본사 직원 및 전국 지점 계정 신규 발급
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            본사 소속 마케팅/물류/인사 담당 직원 계정 또는 신규 에스테틱 가맹 지점의 접근 계정을 생성하고 권한을 매깁니다.
            </div>
        </div>
        </div>
        <div style={{ padding: '16px 24px 24px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
           
            <select 
            id="newAccountRole"
            value={type}
            onChange={(e) => setType(e.target.value)}   
            style={{ flex: '1', minWidth: '140px', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', background: '#fff' }}
            >
           <option value="">선택하세요</option>
            <option value="2">본사 소속 직원 계정</option>
            <option value="3">지점(모유센터) 스파 계정</option>
            </select>
            <input 
            type="text" 
            id="newAccountName"
            value={name}
            onChange={(e) => setName(e.target.value)}  
            placeholder="계정 사용자 이름 (예: 이물류 과장 / 인천청라점)" 
            style={{ flex: '2', minWidth: '180px', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', background: '#fff' }} 
            />
            <input 
            type="text" 
            id="newAccountUserId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}   
            placeholder="계정 사용자 아이디" 
            style={{ flex: '2', minWidth: '180px', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', background: '#fff' }} 
            />
            <input 
            type="password" 
            id="newAccountPw" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}   
            placeholder="초기 접속 비밀번호 설정" 
            style={{ flex: '1.5', minWidth: '150px', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', background: '#fff' }} 
            />
            
            <button
            type='submit' 
            className="primary-btn" 
            id="createAccountBtn" 
            style={{ padding: '10px 24px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
            + 새 권한 계정 생성
            </button>
           
        </div>
     
        </div>
        
    </div>
    </form>

      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">전체 시스템 연동 계정 권한 제어함</div>
            <div className="panel-title-sub">데이터 무결성을 위해 퇴사 및 계약 해지 시 완전 삭제를 지양하고, [사용 중지] 전환을 통해 로그인 권한만 즉각 차단합니다.</div>
          </div>
        </div>
        <div className="panel-body">
          <table>
            <thead>
              <tr>
                <th>계정 구분</th>
                <th>아이디</th>
                <th>사용자 명 / 지점 코드명</th>
                <th>계정 상태</th>
                <th>발급일자</th>
                <th>원격 제어 액션 (데이터 보존형)</th>
              </tr>
            </thead>
            <tbody id="accountSystemTableBody">
            {userInfo.map((users) => (
                    // 리액트 map 안의 가장 바깥 태그에는 고유한 key 속성이 필수입니다.
                    <tr > 
                        <td>
                        {users.type === '1' ? (
                            <span className="status-chip master-status">마스터 최고관리자</span>
                        ) : users.type === '2' ? (
                            <span className="status-chip main-status">본사 직원</span>
                        ) : users.type === '3' ? (
                            <span className="status-chip serve-status">가맹 지점</span>
                        ) : (
                            '-'
                        )}
                        </td>
                        <td className="branch-cell">{users.userId}</td>
                        <td className="branch-cell">{users.name}</td>
                        <td>
                        {users.status === 'Y' ? (
                            <span className="status-chip status-done">
                            정상 승인됨
                            </span>
                        ) : users.status === 'N' ? (
                            <span className="status-chip status-none">
                            로그인 차단됨 (권한회수)
                            </span>
                        ) : users.status === 'M' ? (
                            <span className="status-chip status-done">
                            정상 승인됨
                            </span>
                         
                        ) : (
                            <span className="status-chip status-none">
                            로그인 차단됨 (권한회수)
                            </span>
                        )}
                        </td>
                        <td className="accountDate">{users.rdate || '2025-01-10'}</td>
                        <td>
                           {users.status === 'M' ? (
                            '-'
                        ) : users.status === 'Y' ? (
                            // [타입 2] 본사 직원 전용 버튼 위치
                            <button className="btn-sm danger btnStatusRed" onClick={() => changeAccountStatus(users.id, 'N')}>
                            원격 권한 회수 (중지)
                            </button>
                        ) : users.status === 'N' ? (
                            // [타입 3] 가맹 지점 전용 버튼 위치
                            <button className="btn-sm btnStatusGreen" onClick={() => changeAccountStatus(users.id, 'Y')}>
                            계정 다시 복구 (활성)
                            </button>
                        ) : (
                            '-'
                        )} 
                        </td>
                    </tr>
                    ))}
                {/* <tr>
                    <td><span className="status-chip main-status" >본사 직원</span></td>
                    <td className="branch-cell">진상훈 상무 (인사재무)</td>
                    <td>
                        <span className="status-chip status-done">
                        정상 승인됨
                        </span>
                    </td>
                    <td className="accountDate">2025-03-14</td>
                    <td>
                        <button className="btn-sm danger btnStatusRed" >
                        원격 권한 회수 (중지)
                        </button>
                    </td>
                </tr>
                <tr>
                    <td><span className="status-chip serve-status" >가맹 지점</span></td>
                    <td className="branch-cell">양주 모유센터 계정</td>
                    <td>
                        <span className="status-chip status-none">
                        로그인 차단됨 (권한회수)
                        </span>
                    </td>
                    <td className="accountDate">2025-04-01</td>
                    <td>
                        <button className="btn-sm btnStatusGreen" >
                        계정 다시 복구 (활성)
                        </button>
                    </td>
                </tr> */}
            </tbody>
          </table>
        </div>
      </div>

        {/* 🧭 [신규 추가] 하단 페이징 제어 버튼 컴포넌트 구역 */}
        <div className="pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', marginTop: '25px' , marginBottom: '25px' }}>
          {/* [이전] 버튼: 1페이지가 아닐 때만 작동 활성화 */}
          <button 
            className="btn-sm" 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          >
            이전
          </button>

          {/* 숫자 버튼들: 전체 페이지 수(totalPages)만큼 배열을 동적 생성하여 루프 */}
          {Array.from({ length: totalPages }, (_, index) => {
            const pageNum = index + 1;
            return (
              <button
                key={pageNum}
                className={`btn-sm ${currentPage === pageNum ? 'active' : ''}`}
                style={{
                  fontWeight: currentPage === pageNum ? 'bold' : 'normal',
                  backgroundColor: currentPage === pageNum ? 'var(--accent, #0076ff)' : '#fff',
                  color: currentPage === pageNum ? '#fff' : '#333',
                  border: '1px solid #ddd',
                  padding: '5px 10px',
                  cursor: 'pointer'
                }}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}

          {/* [다음] 버튼: 마지막 페이지가 아닐 때만 작동 활성화 */}
          <button 
            className="btn-sm" 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          >
            다음
          </button>
        </div>

   

    </div>

    

      );

}