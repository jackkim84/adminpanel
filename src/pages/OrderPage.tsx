import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import { ko } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css"; 



interface Aesthetic_order {

    id : number,
    branch : string,
    product_name : string,
    spec_unit :string,
    total_requested_qty : number,
    aggregation_status : string,
    procces_status : string
}

interface Branch_order_submission { 
 
     id : number,
    branch_name : string,
    submission_status : string,
    final_submitted_at	 :string,

}



export default function OrderPage() {

  const [aesthetic_order, setAesthetic_order] = useState<Aesthetic_order[]>([]); // 공지사항 목록 배열
  const [branch_order_submission, setBranch_order_submission] = useState<Branch_order_submission[]>([]); // 공지사항 목록 배열
  const [currentPage, setCurrentPage] = useState<number>(1); // 현재 선택된 페이지
  const [totalPages, setTotalPages] = useState<number>(1);   // 백엔드가 계산해 준 총 페이지 수
    const [currentPage2, setCurrentPage2] = useState<number>(1); // 현재 선택된 페이지  
  const [totalPages2, setTotalPages2] = useState<number>(1);   // 백엔드가 계산해 준 총 페이지 수
  const [branchlist, setBranchlist] = useState<Aesthetic_order[]>([]);
  const [total_branch, setTotal_branch] = useState<string>("");
  const [total_submit, setTotal_submit] = useState<string>("");
  const [branch, setBranch] = useState<string>("");
  const [product_name, setProduct_name] = useState<string>("");
  const [spec_unit, setSpec_unit] = useState<string>("");
  const [total_requested_qty, setTotal_requested_qty] = useState<string>("");
  const [startDate, setStartDate] = useState(new Date());
const [currentBranch, setCurrentBranch] = useState("");

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



// 🟢 1번 탭 데이터 전용 함수 (에스테틱 주문 관리 목록)
const fetchAesthetic_order = async (targetPage: number, selectedBranch: string = "") => {
  try {
    // 🌟 [요청 사항 반영] selectedBranch가 빈 문자열("")이거나 값이 없으면 "all"로 세팅
    let branchParam = selectedBranch;
    if (!selectedBranch || selectedBranch.trim() === "") {
      branchParam = "all";
    }

    // "all"로 정제된 변수를 URL에 실어서 보냅니다. (결과 주소: ...&branch=all)
    const response = await axios.get(
      `https://info7qni.dothome.co.kr/aestheticlist.php?page=${targetPage}&branch=${encodeURIComponent(branchParam)}`
    );
    console.log("aestheticlist 응답 전체:", response.data);

    // 정규식 기반 헬퍼 함수로 데이터 정제
    const responseData = parsePureJson(response.data);

    if (responseData && (responseData.success === true || responseData.success === "true")) {
      setAesthetic_order(responseData.data || []);
      setTotal_branch(responseData.total_rows || 0);
      setTotal_submit(responseData.submit_row || 0);
      setBranchlist(responseData.branch_list || []);
      setTotalPages(responseData.total_pages || 1);
    }
  } catch (error) {
    console.error("에스테틱 주문 목록 갱신 실패:", error);
  }
};


// 🔵 2번 탭 데이터 전용 함수 (지점 주문 제출 목록)
const fetchABranch_order_submission = async (targetPage2: number) => {
  try {
    const response = await axios.get(
      `https://info7qni.dothome.co.kr/branch_order_submission.php?page=${targetPage2}`
    );
    console.log("branch_order_submission 응답 전체:", response.data);

    // 정규식 기반 헬퍼 함수로 데이터 정제
    const responseData = parsePureJson(response.data);

    if (responseData && (responseData.success === true || responseData.success === "true")) {
      // 데이터 누락 시 화면 깨짐 방지를 위한 기본값 바인딩
      setBranch_order_submission(responseData.data || []);
      setTotalPages2(responseData.total_pages || 1);
    }
  } catch (error) {
    console.error("지점 주문 제출 목록 갱신 실패:", error); // 명확한 로그 문구로 수정
  }
};

// 🟢 1번 탭 데이터용 감시자
useEffect(() => {
  fetchAesthetic_order(currentPage);
}, [currentPage]);

// 🔵 2번 탭 데이터용 감시자
useEffect(() => {
  fetchABranch_order_submission(currentPage2);
}, [currentPage2]);



 // 1. 현재 수정 중인 줄(Row)의 인덱스 번호를 저장 (수정 중이 아니면 null)
    const [editRowIndex, setEditRowIndex] = useState<number | null>(null);

    // 2. 수정 중인 한 줄의 데이터들을 담아둘 임시 버퍼 상태
    const [editRowData, setEditRowData] = useState<any>({});

    // 3. [수정] 버튼 클릭 시 해당 줄의 데이터를 버퍼에 담고 인풋창으로 전환하는 함수
    const startRowEdit = (index: number, currentItem: any) => {
         setEditRowIndex(index);
        setEditRowData({ ...currentItem }); 
    };


// 🔍 1. 에스테틱 주문 관리 행 수정 저장 함수
const saveRowEdit = async (index: number) => {
  try {
    console.log("전송할 데이터:", editRowData); 
    // PHP 서버로 한 번에 한 줄 데이터 수정본 전송
    const response = await axios.post('https://info7qni.dothome.co.kr/updateAesthetic.php', {
      id: editRowData.id, 
      branch: editRowData.branch,
      product_name: editRowData.product_name,
      spec_unit: editRowData.spec_unit,
      total_requested_qty: editRowData.total_requested_qty,
      aggregation_status: editRowData.aggregation_status,
      procces_status: editRowData.procces_status
    });
    console.log("updateAesthetic 응답 전체:", response.data);

    // 정규식 기반 헬퍼 함수로 데이터 정제
    const responseData = parsePureJson(response.data);

    if (responseData && (responseData.success === true || responseData.success === "true")) {
      // 1. 화면에 반영할 새 배열 복본 만들기
      const updated = [...aesthetic_order];
      updated[index] = { ...editRowData };

      setAesthetic_order(updated);
      setEditRowIndex(null);
      fetchAesthetic_order(currentPage);
      alert('성공적으로 수정되었습니다.');
    } else {
      alert(responseData?.message || '수정에 실패했습니다.');
    }
  } catch (error) {
    console.error("에스테틱 주문 수정 실패:", error); // 명확한 로그 문구로 수정
    alert('서버 전송 중 네트워크 오류가 발생했습니다.');
  }
};

// 1. 현재 수정 중인 줄(Row)의 인덱스 번호를 저장 (수정 중이 아니면 null)
const [editRowIndex2, setEditRowIndex2] = useState<number | null>(null);

// 2. 수정 중인 한 줄의 데이터들을 담아둘 임시 버퍼 상태
const [editRowData2, setEditRowData2] = useState<any>({});

// 3. [수정] 버튼 클릭 시 해당 줄의 데이터를 버퍼에 담고 인풋창으로 전환하는 함수
const startRowEdit2 = (index: number, currentItem: any) => {
  setEditRowIndex2(index);
  setEditRowData2({ ...currentItem }); 
};

// 🔍 2. 지점 주문 제출 행 수정 저장 함수
// 💡 파라미터에 index와 id를 모두 받아내도록 규격을 명시합니다.
const saveRowEdit2 = async (index: number) => {
  try {
    // PHP 서버로 한 번에 한 줄 데이터 수정본 전송
    const response = await axios.post('https://info7qni.dothome.co.kr/updateCertificatefile.php', {
      id: index, // 파라미터로 안전하게 넘어온 진짜 고유 id값을 매핑
      branch_name: editRowData2.branchName,       // 지점명
      request_type: editRowData2.requestType,     // 신청/제출 구분
      target_name: editRowData2.targetName,       // 대상자
      request_date: editRowData2.requestDate,     // 요청일자
      attached_file: editRowData2.attachedFile,   // 지점 첨부파일
      status: editRowData2.status                 // 상태 ('Y' 또는 'N')
    });
    console.log("updateCertificatefile(지점주문) 응답 전체:", response.data);

    // 정규식 기반 헬퍼 함수로 데이터 정제
    const responseData = parsePureJson(response.data);

    if (responseData && (responseData.success === true || responseData.success === "true")) {
      // 1. 화면에 반영할 새 배열 복사본 만들기
      const updated = [...branch_order_submission];
      updated[index] = { ...editRowData2 };

      setBranch_order_submission(updated);
      
      // 3. 인풋창 수정 모드 끄기
      setEditRowIndex2(null);
      fetchABranch_order_submission(currentPage2); // 2번 탭에 맞게 currentPage2로 수정

      alert(responseData.message || '성공적으로 수정되었습니다.');
    } else {
      alert(responseData?.message || '수정에 실패했습니다.');
    }
  } catch (error) {
    console.error("지점 주문 제출 수정 실패:", error); // 명확한 로그 문구로 수정
    alert('서버 전송 중 네트워크 오류가 발생했습니다.');
  }
};



    function onDown() {


        const encodedBranch = encodeURIComponent(currentBranch || "");

          location.href = `https://info7qni.dothome.co.kr/aesthetic_pdf.php?branch=${encodedBranch}`;
    }


// 4. [저장] 버튼 클릭 시 백엔드 DB 전송 및 실시간 화면 동기화 함수
const onSave = async () => {
    try {
        // PHP 서버로 한 번에 한 줄 데이터 수정본 전송
        const response = await axios.post('https://info7qni.dothome.co.kr/insertAesthetic.php', {
            branch: branch,
            product_name: product_name,
            spec_unit: spec_unit,
            total_requested_qty: total_requested_qty
        });
        console.log("insertAesthetic 응답 전체:", response.data);

        // 정규식 기반 헬퍼 함수로 데이터 정제 (불필요한 PHP 접두사 제거)
        const responseData = parsePureJson(response.data);

        // 응답 데이터의 success 여부 검증 (불리언 및 문자열 상호 호환)
        if (responseData && (responseData.success === true || responseData.success === "true")) {
            // 성공 알림 및 입력 폼 초기화
            alert(responseData.message || '성공적으로 등록되었습니다.');
            setBranch("");
            setProduct_name("");
            setSpec_unit("");
            setTotal_requested_qty("");
            
            // 목록 새로고침
            fetchAesthetic_order(currentPage);
        } else {
            // 서버가 success: false를 반환했거나 파싱에 실패한 경우
            alert(responseData?.message || '등록에 실패했습니다.'); // 문구 정정
        }
    } catch (error) {
        console.error("주문 등록 실패:", error); // 명확한 로그 문구로 수정
        alert('서버 전송 중 네트워크 오류가 발생했습니다.');
    }
};

    
  return (
    <div className="page" id="pageOrder">
      {/* 1. [본사 전용] 취급 에스테틱 제품 품목 추가 관리 */}
      <div className="panel" style={{ border: '1px solid var(--primary)', background: 'var(--primary-tint)' }}>
        <div className="panel-header" style={{ background: 'none', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div className="panel-title" style={{ color: 'var(--primary-dark)' }}>[본사 전용] 취급 에스테틱 제품 품목 추가 관리</div>
            <div className="panel-title-sub" style={{ color: 'var(--text-muted)' }}>여기에 등록하거나 삭제하는 제품 목록은 즉시 각 지점의 발주 신청 시스템 양식에 동기화 반영됩니다.</div>
          </div>
        </div>
        <div className="panel-body" style={{ paddingTop: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input type="text" id="newProdCompany" value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="제조/업체명 (예: 써라코스)" style={{ flex: 1, minWidth: '140px', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', background: '#fff' }} />
            <input type="text" id="newProdName" value={product_name} onChange={(e) => setProduct_name(e.target.value)} placeholder="제품명 (예: 셀피아 인텐시브 앰플)" style={{ flex: 2, minWidth: '180px', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', background: '#fff' }} />
            <input type="text" id="newProdUnit" value={spec_unit} onChange={(e) => setSpec_unit(e.target.value)} placeholder="규격/단위 (예: 5ml x 10병 / 박스)" style={{ flex: 1, minWidth: '120px', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', background: '#fff' }} />
            <input type="number" id="newProdQuan" value={total_requested_qty} onChange={(e) => setTotal_requested_qty(e.target.value)}  placeholder="수량" style={{ flex: 1, minWidth: '120px', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '8px', background: '#fff' }} />
            <button className="primary-btn" id="addProdBtn" style={{ padding: '10px 24px' }} onClick={() => onSave()}>+ 마스터 품목 추가</button>
          </div>
        </div>
      </div>

      {/* 2. 이번 달 지점 에스테틱 재료 발주 취합 */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">이번 달 지점 에스테틱 재료 발주 취합</div>
            <div className="panel-title-sub">매월 20일 ~ 24일 접수분 실시간 집계 현황 (25일 일괄 발주)</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <select 
                className="table-edit-select" // 기존 사용하시는 스타일 클래스명
                value={currentBranch} 
                onChange={(e) => {
                    const branchValue = e.target.value;
                    setCurrentBranch(branchValue);     // 1. 선택한 지점 상태 저장
                    fetchAesthetic_order(1, branchValue); // 2. 해당 지점 조건으로 1페이지부터 다시 호출
                }}
            >
                {/* 전체 조회를 위한 기본 옵션 */}
                <option value="">전체 지점</option> 
                
                {branchlist.map((item, index) => {
                    return (
                        <option key={index} value={item.branch}>
                            {item.branch}
                        </option>
                    );
                })} 
            </select>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }} id="orderSubmittedLabel"> {total_submit} 개 - {total_branch} 개</span>
            <button className="primary-btn" id="generatePoBtn" onClick={() => onDown()}>업체 발주서(PO) 생성</button>
          </div>
        </div>
        <div className="panel-body">
          {/* 💡 margin-bottom -> marginBottom 으로 수정 */}
          <div style={{ marginBottom: '18px' }}>
            {/* 💡 margin-bottom -> marginBottom 으로 수정 */}
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>지점 발주 제출 진행률</div>
            {/* 💡 class -> className 으로 수정 */}
            <div className="progress-track"><div className="progress-fill" id="orderProgressFill" style={{ width: '0%' }}></div></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>업체명</th>
                <th>품목</th>
                <th>규격/단위</th>
                <th>전 지점 합계 요청 수량</th>
                <th>물류 상황</th>
                 <th>진척도</th>
                <th>작업</th>
                <th>관리</th>
              </tr>
            </thead>
                     <tbody id="attendTableBody">
                  {aesthetic_order.map((item, index) => {
                    // 현재 이 줄(index)이 사용자가 [수정] 버튼을 누른 줄인지 판별
                    const isEditing = editRowIndex === index;

                    return (
                        <tr key={`academy-row-${index}`}>
                          <td className="branch-cell">
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        className="table-edit-input"
                                        value={editRowData.branch || ''} 
                                        onChange={(e) => setEditRowData({ ...editRowData, branch: e.target.value })}
                                    />
                                ) : (
                                    item.branch
                                    
                                )}
                            </td>
                            {/* 1. 지점명 */}
                            <td className="branch-cell">
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        className="table-edit-input"
                                        value={editRowData.product_name || ''} 
                                        onChange={(e) => setEditRowData({ ...editRowData, product_name: e.target.value })}
                                    />
                                ) : (
                                    item.product_name
                                    
                                )}
                            </td>

            
                            <td>
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        className="table-edit-input"
                                        value={editRowData.spec_unit || ''} 
                                        onChange={(e) => setEditRowData({ ...editRowData, spec_unit: e.target.value })}
                                    />
                                ) : (
                                    item.spec_unit
                                )}
                            </td>

                   
                            <td>
                                {isEditing ? (
                                    <input 
                                        type="number" 
                                        className="table-edit-input"
                                        value={editRowData.total_requested_qty || ''} 
                                        onChange={(e) => setEditRowData({ ...editRowData, total_requested_qty: e.target.value })}
                                    />
                                ) : (
                                    item.total_requested_qty
                                )}
                            </td>

    


                            <td>
                                {isEditing ? (
                                    <select 
                                        className="table-edit-select"
                                        value={editRowData.aggregation_status || 'N'} 
                                        onChange={(e) => setEditRowData({ ...editRowData, aggregation_status: e.target.value })}
                                    >
                                        <option value="Y">완료</option>
                                        <option value="N">대기</option>
                                    </select>
                                ) : (
                                    item.aggregation_status === 'Y' ? (
                                        <span className="status-chip status-wait">취합중</span>
                                    ) : (
                                        <span className="status-chip status-wait">대기</span>
                                    )
                                )}
                            </td>
                            <td>
                                {isEditing ? (
                                    <select 
                                        className="table-edit-select"
                                        value={editRowData.procces_status || 'N'} 
                                        onChange={(e) => setEditRowData({ ...editRowData, procces_status: e.target.value })}
                                    >
                                        <option value="Y">제출완료</option>
                                        <option value="N">미제출</option>
                                    </select>
                                ) : (
                                    item.procces_status === 'Y' ? (
                                        <span className="status-chip status-done">제출완료</span>
                                    ) : (
                                        <span className="status-chip status-wait">미제출</span>
                                    )
                                )}
                            </td>
                            <td>
                              <button className="btn-sm danger" >품목삭제</button>
                            </td>

                           

                            {/* 7. 조작 버튼 구역 (제일 중요!) */}
                            <td>
                                {isEditing ? (
                                      <div style={{ display: 'flex', gap: '6px' }}>
                                          <button 
                                              className="primary-btn" 
                                              style={{ background: 'var(--success)', padding: '6px 12px', minWidth: 'fit-content' }} 
                                              onClick={() => saveRowEdit(item.id)}
                                          >
                                              저장
                                          </button>
                                          <button 
                                              className="primary-btn" 
                                              style={{ background: '#e2e8f0', color: '#333', padding: '6px 12px', minWidth: 'fit-content' }} 
                                              onClick={() => setEditRowIndex(null)}
                                          >
                                              취소
                                          </button>
                                      </div>
                                  ) : (
                                      <button className="primary-btn" style={{ width: '100px' }} onClick={() => startRowEdit(index, item)}>수정</button>
                                  )}
                            </td>
                        </tr>

                        
                    );
                })}


                  
                </tbody>
          </table>
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

      {/* 3. 각 지점별 발주 제출 완료 여부 */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">각 지점별 발주 제출 완료 여부</div>
        </div>
        <div className="panel-body">
          <table>
            <thead>
              <tr>
                <th style={{ width: '50%' }}>지점명</th>
                <th style={{ width: '18%' }}>제출 현황</th>
                <th style={{ width: '18%' }}>최종 제출 시간</th>
                <th style={{ width: '14%' }}>관리</th>
              </tr>
            </thead>
            <tbody id="orderBranchTableBody">
              {branch_order_submission.map((item, index) => {
                    // 현재 이 줄(index)이 사용자가 [수정] 버튼을 누른 줄인지 판별
                    const isEditing = editRowIndex2 === index;

                    return (
                        <tr key={`academy-row-${index}`}>
                          <td className="branch-cell">
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        className="table-edit-input"
                                        value={editRowData2.branch_name || ''} 
                                        onChange={(e) => setEditRowData2({ ...editRowData2, branch_name: e.target.value })}
                                    />
                                ) : (
                                    item.branch_name
                                    
                                )}
                            </td>
                            <td>
                                {isEditing ? (
                                    <select 
                                        className="table-edit-select"
                                        value={editRowData2.submission_status || 'N'} 
                                        onChange={(e) => setEditRowData2({ ...editRowData2, submission_status: e.target.value })}
                                    >
                                        <option value="Y">완료</option>
                                        <option value="N">미제출</option>
                                    </select>
                                ) : (
                                    item.submission_status === 'Y' ? (
                                        <span className="status-chip status-done">완료</span>
                                    ) : (
                                        <span className="status-chip status-wait">미제출</span>
                                    )
                                )}
                            </td>
                            <td className="branch-cell">
                              {isEditing ? (
                                  <DatePicker
                                      selected={editRowData2.final_submitted_at ? new Date(editRowData2.final_submitted_at) : null}
                                      onChange={(date:any) => {
                                          // ISO 문자열이나 원하는 날짜 포맷 문자열로 상태를 업데이트합니다.
                                          setEditRowData2({ 
                                              ...editRowData2, 
                                              final_submitted_at: date ? date.toISOString() : '' 
                                          });
                                      }}
                                      showTimeSelect
                                      timeFormat="HH:mm:ss"
                                      timeIntervals={1} // 초 단위 선택을 위해 유연하게 설정
                                      dateFormat="MM/dd HH:mm:ss"
                                      className="table-edit-input" // 기존 스타일 유지
                                      locale={ko}
                                  />
                              ) : (
                                  item.final_submitted_at
                              )}
                          </td>

         
                        

                            {/* 7. 조작 버튼 구역 (제일 중요!) */}
                            <td>
                                {isEditing ? (
                                      <div style={{ display: 'flex', gap: '6px' }}>
                                          <button 
                                              className="primary-btn" 
                                              style={{ background: 'var(--success)', padding: '6px 12px', minWidth: 'fit-content' }} 
                                              onClick={() => saveRowEdit2(item.id)}
                                          >
                                              저장
                                          </button>
                                          <button 
                                              className="primary-btn" 
                                              style={{ background: '#e2e8f0', color: '#333', padding: '6px 12px', minWidth: 'fit-content' }} 
                                              onClick={() => setEditRowIndex2(null)}
                                          >
                                              취소
                                          </button>
                                      </div>
                                  ) : (
                                      <button className="primary-btn" style={{ width: '100px' }} onClick={() => startRowEdit2(index, item)}>수정</button>
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
            onClick={() => setCurrentPage2(prev => Math.max(prev - 1, 1))}
          >
            이전
          </button>

          {/* 숫자 버튼들: 전체 페이지 수(totalPages)만큼 배열을 동적 생성하여 루프 */}
          {Array.from({ length: totalPages2 }, (_, index) => {
            const pageNum = index + 1;
            return (
              <button
                key={pageNum}
                className={`btn-sm ${currentPage === pageNum ? 'active' : ''}`}
                style={{
                  fontWeight: currentPage2 === pageNum ? 'bold' : 'normal',
                  backgroundColor: currentPage2 === pageNum ? 'var(--accent, #0076ff)' : '#fff',
                  color: currentPage2 === pageNum ? '#fff' : '#333',
                  border: '1px solid #ddd',
                  padding: '5px 10px',
                  cursor: 'pointer'
                }}
                onClick={() => setCurrentPage2(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}

          {/* [다음] 버튼: 마지막 페이지가 아닐 때만 작동 활성화 */}
          <button 
            className="btn-sm" 
            disabled={currentPage2 === totalPages2}
            onClick={() => setCurrentPage2(prev => Math.min(prev + 1, totalPages2))}
          >
            다음
          </button>
        </div>


    </div>
  );
}
