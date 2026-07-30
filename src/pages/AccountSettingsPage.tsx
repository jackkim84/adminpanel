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
// 1. 유효한 JSON 문자열만 추출하여 객체로 파싱하는 공통 헬퍼 함수
const parsePureJson = (rawResponse: any) => {
  let data = rawResponse;
  if (typeof data === 'string') {
    try {
      // { 로 시작하는 부분부터 추출하여 파싱 시도
      const jsonStartIndex = data.indexOf('{');
      if (jsonStartIndex !== -1) {
        const pureJsonString = data.substring(jsonStartIndex);
        data = JSON.parse(pureJsonString);
      } else {
        console.error("올바른 JSON 형태를 찾을 수 없습니다.");
      }
    } catch (parseError) {
      console.error("데이터 파싱 실패:", parseError);
    }
  }
  return data;
};

// 2. 회원 목록 가져오기 함수
const fetchUserData = async (targetPage: number) => {
  try {
    const response = await axios.get(`https://info7qni.dothome.co.kr/userlist.php?page=${targetPage}`);
    console.log("userlist 응답 전체:", response.data);

    // 데이터 정제
    const responseData = parsePureJson(response.data);

    if (responseData) {
      // 구조분해 할당으로 안전하게 데이터 주입 (백엔드 변수명에 맞춰 대응)
      const listData = responseData.data || responseData.users || [];
      const totalPages = responseData.total_pages || responseData.totalPages || 1;

      setUserInfo(listData);
      setTotalPages(totalPages);
    }
  } catch (error) {
    console.error("회원 정보를 가져오는데 실패했습니다:", error);
  }
};

// 3. 페이지 최초 진입 및 페이지 번호 변경 시 실행
useEffect(() => {
  fetchUserData(currentPage);
}, [currentPage]); 

// 4. 회원 상태 변경 함수 (승인/중지 등)
const changeAccountStatus = async (id: number, status: string) => {
  try {
    const response = await axios.post('https://info7qni.dothome.co.kr/update_user.php', {
      id: id,     
      status: status
    });
    console.log("update_user 응답 전체:", response.data);

    // 데이터 정제
    const responseData = parsePureJson(response.data);

    // success가 불리언 true 혹은 문자열 "true"인 경우 모두 통과
    if (responseData && (responseData.success === true || responseData.success === "true")) {
      alert(responseData.message || '상태가 성공적으로 변경되었습니다.');

      // UI 새로고침 로직: 현재 1페이지면 수동 호출, 아니면 1페이지로 이동하면서 자동으로 useEffect 실행
      if (currentPage === 1) {
        fetchUserData(1); 
      } else {
        setCurrentPage(1); 
      }
    } else {
      alert(responseData?.message || '상태 변경에 실패했습니다.');
    }
  } catch (error) {
    console.error("회원 상태 변경 실패:", error);
    alert('서버 전송 중 오류가 발생했습니다.');
  }
};

// 5. 신규 회원 등록 함수
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!userId.trim() || !password.trim()) {
    alert('아이디와 비밀번호를 모두 입력해 주세요.'); 
    return;
  }

  try {
    const response = await axios.post('https://info7qni.dothome.co.kr/insert_user.php', {
      userId: userId,
      password: password,
      type: type,
      name: name
    });
    console.log("insert_user 응답 전체:", response.data);

    // 데이터 정제
    const responseData = parsePureJson(response.data);

    if (responseData && (responseData.success === true || responseData.success === "true")) {
      alert(responseData.message || '회원 등록이 완료되었습니다.');

      // 폼 초기화
      setUserId('');
      setPassword('');
      setType('');
      setName('');

      // 목록 새로고침
      if (currentPage === 1) {
        fetchUserData(1); 
      } else {
        setCurrentPage(1); 
      }
    } else {
      alert(responseData?.message || '회원 등록에 실패했습니다.');
    }
  } catch (error) {
    console.error("회원 등록 실패:", error);
    alert('서버 전송 중 오류가 발생했습니다.');
  }
};


   // 1. 현재 수정 중인 줄(Row)의 인덱스 번호를 저장 (수정 중이 아니면 null)
    const [editRowIndex, setEditRowIndex] = useState<number | null>(null);

    // 2. 수정 중인 한 줄의 데이터들을 담아둘 임시 버퍼 상태
    const [editRowData, setEditRowData] = useState<any>({});

    // 3. [수정] 버튼 클릭 시 해당 줄의 데이터를 버퍼에 담고 인풋창으로 전환하는 함수
    const startRowEdit = (index: number, currentItem: any) => {
         setEditRowIndex(index);
          setEditRowData({ ...currentItem }); 
    };


  // [저장] 버튼 클릭 시 호출 (PHP 서버 연동)
  const handleSaveClick = async (index: number) => {
      try {
        // PHP 서버로 한 번에 한 줄 데이터 수정본 전송
        const response = await axios.post('https://info7qni.dothome.co.kr/update_userlist.php', {
          id: index, 
          userId: editRowData.userId,
          name: editRowData.name,
          password: editRowData.password
        });
        console.log("회원수정 응답 전체:", response.data);

        // 정규식 기반 헬퍼 함수로 데이터 정제
        const responseData = parsePureJson(response.data);

        if (responseData && (responseData.success === true || responseData.success === "true")) {
          // 화면에 반영할 새 배열 복사본 만들기
          const updated = [...userInfo];
          updated[index] = { ...editRowData };

          setUserInfo(updated);
          setEditRowIndex(null);
          fetchUserData(currentPage);
          alert('성공적으로 수정되었습니다.');
        } else {
          alert(responseData?.message || '수정에 실패했습니다.');
        }
      } catch (error) {
        console.error("테이블 수정 실패:", error);
        alert('서버 전송 중 네트워크 오류가 발생했습니다.');
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
                <th>비밀번호</th>
                <th>사용자 명 / 지점 코드명</th>
                <th>계정 상태</th>
                <th>발급일자</th>
                <th>원격 제어 액션 (데이터 보존형)</th>
                      <th>관리</th>
              </tr>
            </thead>
            <tbody id="accountSystemTableBody">
            {userInfo.map((users, index) => {
            // 현재 이 줄(index)이 사용자가 [수정] 버튼을 누른 줄인지 판별
            const isEditing = editRowIndex === index;

            return (
              <tr key={`academy-row-${index}`}>
                {/* 1. 구분 열 */}
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

                {/* 2. 아이디 열 */}
                <td className="branch-cell">
                  {isEditing ? (
                    <input
                      type="text"
                      name="userId"
                      // 'N' 대신 빈 문자열 ''을 주어야 기존 값을 지웠을 때도 에러가 나지 않습니다.
                      value={editRowData.userId || ''} 
                      onChange={(e) => setEditRowData({ ...editRowData, userId: e.target.value })}
                      className="edit-input"
                    />
                  ) : (
                    users.userId
                  )}
                </td>

                {/* 비밀번호 열 */}
                <td>
                  {isEditing ? (
                    <input
                      type="password"
                      name="password"
                      // 비밀번호는 기본 마스킹 점(.)이나 'N'이 안 뜨도록 비워둡니다.
                      value={editRowData.password || ''} 
                      onChange={(e) => setEditRowData({ ...editRowData, password: e.target.value })}
                      placeholder="변경 시에만 입력"
                      className="edit-input"
                    />
                  ) : (
                    '********'
                  )}
                </td>

                {/* 3. 이름 열 */}
                <td className="branch-cell">
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={editRowData.name || ''} 
                      onChange={(e) => setEditRowData({ ...editRowData, name: e.target.value })}
                      className="edit-input"
                    />
                  ) : (
                    users.name
                  )}
                </td>

                {/* 4. 상태 열 */}
                <td>
                  {users.status === 'Y' || users.status === 'M' ? (
                    <span className="status-chip status-done">정상 승인됨</span>
                  ) : (
                    <span className="status-chip status-none">로그인 차단됨 (권한회수)</span>
                  )}
                </td>

                {/* 5. 등록일 열 */}
                <td className="accountDate">{users.rdate || '2025-01-10'}</td>

                {/* 6. 권한 관리 버튼 열 */}
                <td>
                  {users.status === 'M' ? (
                    '-'
                  ) : users.status === 'Y' ? (
                    <button
                      className="btn-sm danger btnStatusRed"
                      onClick={() => changeAccountStatus(users.id, 'N')}
                    >
                      원격 권한 회수 (중지)
                    </button>
                  ) : users.status === 'N' ? (
                    <button
                      className="btn-sm btnStatusGreen"
                      onClick={() => changeAccountStatus(users.id, 'Y')}
                    >
                      계정 다시 복구 (활성)
                    </button>
                  ) : (
                    '-'
                  )}
                </td>

                {/* 7. 정보 수정 버튼 열 */}
                <td>
                  {isEditing ? (
                    <>
                      <button className="btn-sm btn-save" onClick={() => handleSaveClick(users.id)}>
                        저장
                      </button>
                      <button className="btn-sm btn-cancel" onClick={() => setEditRowIndex(null)}>
                        취소
                      </button>
                    </>
                  ) : (
                    // [핵심 변경]: userInfo 전체 배열이 아니라 현재 행의 단일 유저 객체인 'users'를 통째로 넘겨줍니다.
                    <button className="btn-sm btn-edit" onClick={() => startRowEdit(index, users)}>
                      수정
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
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