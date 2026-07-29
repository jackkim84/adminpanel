import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

interface NoticeItem {
  id: number;
  type: string;
  title: string;
  rdate: string;
  content: string;
}

export default function NoticePage() {


  const [notices, setNotices] = useState<NoticeItem[]>([]); // 공지사항 목록 배열
  const [currentPage, setCurrentPage] = useState<number>(1); // 현재 선택된 페이지
  const [totalPages, setTotalPages] = useState<number>(1);   // 백엔드가 계산해 준 총 페이지 수
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isOpen2, setIsOpen2] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>(''); // 컬럼명 맞춤 완료
  const [type, setType] =  useState<boolean>(false); 
  const [modifyNotices, setModifyNotices] = useState<NoticeItem[]>([]); // 공지사항 목록 배열
  const [editingId, setEditingId] = useState<number>(1);
  const [rdate, setRdate] = useState<string>('');


  // 1. 공지사항 목록 조회 및 페이지네이션
  const fetchNotices = async (targetPage: number) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`https://info7qni.dothome.co.kr/board.php?page=${targetPage}`);
      
      // [서버 데이터 정제]
      let responseData = response.data;
      if (typeof responseData === 'string') {
        const jsonStartIndex = responseData.indexOf('{');
        if (jsonStartIndex !== -1) {
          responseData = JSON.parse(responseData.substring(jsonStartIndex));
        }
      }

      // [성공 여부 검증]
      if (responseData && (responseData.success === true || responseData.success === "true")) {
        setNotices(responseData.data || []);
        setTotalPages(responseData.total_pages || 1);
      }
    } catch (error) {
      console.error("공지 목록 갱신 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. 수정 폼을 열기 위한 단건 데이터 조회 (Modal 1)
  const fetchModifyNotices = async (id: number) => {
    setIsLoading(true);
    try {
      const response = await axios.post('https://info7qni.dothome.co.kr/modify_noticelist.php', {
        id: id
      });
      
      // [서버 데이터 정제]
      let responseData = response.data;
      if (typeof responseData === 'string') {
        const jsonStartIndex = responseData.indexOf('{');
        if (jsonStartIndex !== -1) {
          responseData = JSON.parse(responseData.substring(jsonStartIndex));
        }
      }

      // [성공 여부 검증]
      if (responseData && (responseData.success === true || responseData.success === "true")) {
        const item = responseData.data;
        if (item) {
          setTitle(item.title || '');
          setContent(item.content || '');
          setType(item.type === 'Y');
          setEditingId(id);  
          setIsOpen(true);
        }
      }
    } catch (error) {
      console.error("공지 목록 갱신 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. 상세 보기 폼을 열기 위한 단건 데이터 조회 (Modal 2)
  const fetchModifyNoticesDetail = async (id: number) => {
    setIsLoading(true);
    try {
      const response = await axios.post('https://info7qni.dothome.co.kr/modify_noticelist.php', {
        id: id
      });
      
      // [서버 데이터 정제]
      let responseData = response.data;
      if (typeof responseData === 'string') {
        const jsonStartIndex = responseData.indexOf('{');
        if (jsonStartIndex !== -1) {
          responseData = JSON.parse(responseData.substring(jsonStartIndex));
        }
      }

      // [성공 여부 검증]
      if (responseData && (responseData.success === true || responseData.success === "true")) {
        const item = responseData.data;
        if (item) {
          setTitle(item.title || '');
          setContent(item.content || '');
          setRdate(item.rdate || ''); 
          setType(item.type === 'Y');
          setEditingId(id);  
          setIsOpen2(true);
        }
      }
    } catch (error) {
      console.error("공지 목록 갱신 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. 상태 감지용 이펙트
  useEffect(() => {
    fetchNotices(currentPage);
  }, [currentPage]);

  // 5. 공지사항 작성 및 수정 제출 (Submit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해 주세요.');      
      return;
    }

    const actionUrl = editingId === null 
      ? 'https://info7qni.dothome.co.kr/insert_notice.php'  // Create URL
      : 'https://info7qni.dothome.co.kr/update_notice.php';  // Edit URL

    try {
      const response = await axios.post(actionUrl, {
        title: title,
        content: content,
        type: type ? 'Y' : 'N',
        id: editingId
      });

      // [서버 데이터 정제]
      let responseData = response.data;
      if (typeof responseData === 'string') {
        const jsonStartIndex = responseData.indexOf('{');
        if (jsonStartIndex !== -1) {
          responseData = JSON.parse(responseData.substring(jsonStartIndex));
        }
      }

      // [성공 여부 검증]
      if (responseData && (responseData.success === true || responseData.success === "true")) {
        alert(editingId === null ? '등록되었습니다!' : '수정되었습니다!');
        
        setTitle('');
        setContent('');
        setType(false);
        setIsOpen(false); 

        if (currentPage === 1) {
          fetchNotices(1); 
        } else {
          setCurrentPage(1); 
        }
      } else {
        alert(responseData?.message || '처리에 실패했습니다.');
      }
    } catch (error) {
      console.error("공지 등록 실패:", error);
      alert('서버 전송 중 오류가 발생했습니다.');
    }
  };

  // 6. 클릭 이벤트 핸들러들
  const handleOpenNoticeForm = (id: number) => {
    fetchModifyNotices(id);
  };

  const onShowDetail = (id: number) => {
    fetchModifyNoticesDetail(id);
  };

  // 7. 공지사항 삭제 처리
  const handleDeleteNotice = async (id: number) => {
    if (window.confirm("이 공지사항을 정말로 삭제하시겠습니까?")) {
      try {
        const response = await axios.post('https://info7qni.dothome.co.kr/deleteNotice.php', {
          id: id,
        });

        // [서버 데이터 정제]
        let responseData = response.data;
        if (typeof responseData === 'string') {
          const jsonStartIndex = responseData.indexOf('{');
          if (jsonStartIndex !== -1) {
            responseData = JSON.parse(responseData.substring(jsonStartIndex));
          }
        }

        // [성공 여부 검증]
        if (responseData && (responseData.success === true || responseData.success === "true")) {
          alert('공지사항이 성공적으로 삭제되었습니다!');

          if (currentPage === 1) {
            fetchNotices(1); 
          } else {
            setCurrentPage(1); 
          }
        } else {
          alert(responseData?.message || '삭제 처리에 실패했습니다.');
        }
      } catch (error) {
        console.error("공지 삭제 실패:", error);
        alert('서버 전송 중 오류가 발생했습니다.');
      }
    }
  };



  return (
    <div className="page active" id="pageNotice">
      <div className="panel">
        

        <div className="panel-header">
          <div style={{ textAlign: 'left' }}>
            <div className="panel-title">지점 연동 공지사항 관리</div>
            <div className="panel-title-sub">본사에서 등록한 중요 소식이 지점 대시보드 메인 화면에 즉시 노출됩니다</div>
          </div>
          <button type="button" className="primary-btn" id="newNoticeBtn" onClick={() => setIsOpen(true)}>+ 새 공지 작성</button>
        </div>


        {isLoading && <div style={{ padding: '20px', color: '#666' }}>로딩 중입니다...</div>}


        <div id="noticeManageList">
          {!isLoading && notices.length === 0 ? (
            <div style={{ padding: '4px 0', color: '#888' }}>등록된 공지사항이 없습니다.</div>
          ) : (
            notices.map((notice) => (
              <div key={notice.id} className="notice-manage-item">
                <div style={{ textAlign: 'left' }}>
                  <div className="notice-manage-title">


                    {(notice.type === "Y" || notice.type === "y") && <span className="notice-pin">중요</span>}
                    <Link to={""} onClick={() => onShowDetail(notice.id)}>{notice.title}</Link>
                  </div>
                  <div className="notice-manage-date">{notice.rdate}</div>
                  <div className="notice-manage-preview">{notice.content}</div>
                </div>
                
                <div className="notice-manage-actions">
                  <button className="btn-sm" onClick={() => handleOpenNoticeForm(notice.id)}>수정</button>
                  <button className="btn-sm danger" onClick={() => handleDeleteNotice(notice.id)}>삭제</button>
                </div>
              </div>
            ))
          )}
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

    {/* 📊 모달창 출력 구역 (기존 CSS display:none 차단을 위해 인라인 스타일 보강) */}
      {isOpen2 && (      
        <div 
          className="modal-overlay" 
          id="noticeModal"
          style={{

           display: 'flex',
          }}
        >

            <div className="modal-box" >
              <div className="modal-title" id="noticeModalTitle" >
                 공지사항
              </div>
              {/* 제목 */}

              <div className="form-row" >
                <label style={{ display: 'block', marginBottom: '4px' }}>날짜</label>
                 <p>{rdate}</p>
              </div>
    
              <div className="form-row" >
                <label style={{ display: 'block', marginBottom: '4px' }}>제목</label>
                <p>{title}</p>
              </div>
              
              {/* 내용 */}
              <div className="form-row">
                <label style={{ display: 'block', marginBottom: '4px' }}>내용</label>
                <p>{content}</p>
              </div>
            
              </div>
        </div>
      )}


     {/* 📊 모달창 출력 구역 (기존 CSS display:none 차단을 위해 인라인 스타일 보강) */}
      {isOpen && (      
        <div 
          className="modal-overlay" 
          id="noticeModal"
          style={{

           display: 'flex',
          }}
        >

            <div className="modal-box" >
              <div className="modal-title" id="noticeModalTitle" >
                 {editingId === null ? '새 공지' : '수정 공지'} 작성
              </div>
              <form 
                onSubmit={handleSubmit}
                style={{
                    display: 'block',    // form 내부는 기존 block 계층 유지
                    width: 'auto',       // 내부에 들어있는 modal-box의 크기를 온전히 반영
                    flexShrink: 0        // 부모 flex에 의해 절대로 가로가 압착되지 않도록 보호!
                }}
                >
              {/* 제목 */}
              <input 
                  type="hidden" 
                  value={editingId} 
                />
              <div className="form-row" >
                <label style={{ display: 'block', marginBottom: '4px' }}>제목</label>
                <input 
                  type="text" 
                  placeholder="공지 제목을 입력하세요" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)} 
                />
              </div>
              
              {/* 내용 */}
              <div className="form-row">
                <label style={{ display: 'block', marginBottom: '4px' }}>내용</label>
                <textarea 
                  rows={5} 
                  placeholder="공지 내용을 입력하세요"
                  value={content}
                  onChange={(e) => setContent(e.target.value)} 
                ></textarea>
              </div>
              
              {/* 체크박스 */}
              <div className="checkbox-row" >
                <input 
                  type="checkbox" 
                  id="noticeFormPin" 
                  style={{ width: '18px', height: '18px' }} 
                  checked={type}
                  onChange={(e) => setType(e.target.checked)} 
                />
                <label htmlFor="noticeFormPin" style={{ margin: 0 }}>중요 공지로 상단 고정</label>
              </div>
              
              {/* 액션 버튼 그룹 */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="ghost-btn" 
                  onClick={() => setIsOpen(false)}
                >
                  취소
                </button>
                <button 
                  type="submit" 
                  className="primary-btn"
                >
                  {editingId === null ? '등록' : '수정'}
                </button>
           
              </div>
            </form>
            </div>
       
        </div>
      )}
    </div>

    
  );
}