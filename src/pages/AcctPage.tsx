import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';


interface Deposit_management {
    id : number,
    branch_name : string,
    deposit_date :string,
    manager_name : string,
    depositor_name : string,
    deposit_amount : number,
    status : string,
}


interface Refund {

    id : number,
    branch_name : string,
    request_date :string,
    branch_manager : string,
    customer_name : string,
    refund_amount : number,
    reason_and_account : string,
    approval_status : string
}



export default function AcctPage() {

      const [activeTab, setActiveTab] = useState('billing');

      const [deposit_management, setDeposit_management] = useState<Deposit_management[]>([]);
      const [deposit_managementPage, setDeposit_managementPage] = useState<number>(1);
      const [deposit_managementTotalPages, setDeposit_managementTotalPages] = useState<number>(1);



      const [refundData, setRefundData] = useState<Refund[]>([]);
      const [refundPage, setRefundPage] = useState<number>(1);
      const [refundTotalPages, setRefundTotalPages] = useState<number>(1);

      const [total_branch, setTotal_branch] = useState<string>("");
      const [total_amount, setTotal_amount] = useState<string>("");
      const [total_nonreport, setTotal_nonreport] = useState<string>("");
      const [total_nonrows, setTotal_nonrows] = useState<string>("");

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


        // 1. 한국 시간(KST) 기준 오늘 날짜('YYYY-MM-DD')를 생성하여 초기값으로 입력
        const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
            .toISOString()
            .split('T')[0];

        // 상태값 선언
        const [selectedDate, setSelectedDate] = useState(today); // 기본값이 오늘 날짜로 세팅됨!

 // 🟢 1번 탭 데이터 전용 함수 (입금 관리)
const fetchDeposit_managementData = async (targetPage: number, targetDate: string) => {
  try {
    const response = await axios.get(
      `https://info7qni.dothome.co.kr/deposit_management.php?page=${targetPage}&tab=billing&date=${targetDate}`
    );
    console.log("deposit_management 응답 전체:", response.data);

    // 정규식 기반 헬퍼 함수로 데이터 정제
    const responseData = parsePureJson(response.data);

    if (responseData) {
      // 목록 데이터 안전하게 바인딩
      setDeposit_management(responseData.data || []);
      
      // 각종 통계 수치 및 페이지네이션 데이터 바인딩 (데이터 누락 시 기본값 0 또는 1 처리)
      setTotal_branch(responseData.total_rows || 0);
      setTotal_amount(responseData.total_amount || 0);
      setTotal_nonreport(responseData.non_report || 0);
      setTotal_nonrows(responseData.total_nonrows || 0);
      setDeposit_managementTotalPages(responseData.total_pages || 1);

      console.log("정제된 통계 수치:", {
        total_rows: responseData.total_rows,
        total_amount: responseData.total_amount,
        non_report: responseData.non_report,
        total_nonrows: responseData.total_nonrows
      });
    }
  } catch (error) {
    console.error("입금 관리 정보를 가져오는데 실패했습니다:", error); // 로그 문구 수정
  }
};

// 🔵 2번 탭 데이터 전용 함수 (환불 목록)
const fetchRefundData = async (targetPage: number) => {
  try {
    const response = await axios.get(
      `https://info7qni.dothome.co.kr/refundlist.php?page=${targetPage}&tab=refund`
    );
    console.log("refundlist 응답 전체:", response.data);

    // 정규식 기반 헬퍼 함수로 데이터 정제
    const responseData = parsePureJson(response.data);

    if (responseData) {
      setRefundData(responseData.data || []);
      setRefundTotalPages(responseData.total_pages || 1);
    }
  } catch (error) {
    console.error("환불 목록 정보를 가져오는데 실패했습니다:", error); // 로그 문구 수정
  }
};

// 🟢 1번 탭 데이터용 감시자 (페이지 또는 선택 날짜 변경 시 호출)
useEffect(() => {
  fetchDeposit_managementData(deposit_managementPage, selectedDate);
}, [deposit_managementPage, selectedDate]); 

// 🔵 2번 탭 데이터용 감시자 (페이지 변경 시 호출)
useEffect(() => {
  fetchRefundData(refundPage);
}, [refundPage]);



     // 1. 현재 수정 중인 줄(Row)의 인덱스 번호를 저장 (수정 중이 아니면 null)
    const [editRowIndex, setEditRowIndex] = useState<number | null>(null);

    // 2. 수정 중인 한 줄의 데이터들을 담아둘 임시 버퍼 상태
    const [editRowData, setEditRowData] = useState<any>({});

    // 3. [수정] 버튼 클릭 시 해당 줄의 데이터를 버퍼에 담고 인풋창으로 전환하는 함수
    const startRowEdit = (index: number, currentItem: any) => {
         setEditRowIndex(index);
        setEditRowData({ ...currentItem }); 
    };


  // 🔍 1. 입금 관리 행 수정 저장 함수
const saveRowEdit = async (index: number) => {
  try {
    // PHP 서버로 한 번에 한 줄 데이터 수정본 전송
    const response = await axios.post('https://info7qni.dothome.co.kr/updateDepositRow.php', {
      id: editRowData.id, 
      branch_name: editRowData.branch_name,
      deposit_date: editRowData.deposit_date,
      manager_name: editRowData.manager_name,
      depositor_name: editRowData.depositor_name,
      deposit_amount: editRowData.deposit_amount,
      status: editRowData.status
    });
    console.log("updateDepositRow 응답 전체:", response.data);

    // 정규식 기반 헬퍼 함수로 데이터 정제
    const responseData = parsePureJson(response.data);

    if (responseData && (responseData.success === true || responseData.success === "true")) {
      // 1. 화면에 반영할 새 배열 복사본 만들기
      const updated = [...deposit_management];
      updated[index] = { ...editRowData };

      setDeposit_management(updated);
      setEditRowIndex(null);
      fetchDeposit_managementData(deposit_managementPage, selectedDate);
      alert('성공적으로 수정되었습니다.');
    } else {
      alert(responseData?.message || '수정에 실패했습니다.');
    }
  } catch (error) {
    console.error("입금 내역 수정 실패:", error); // 명확한 로그 문구로 수정
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

// 🔍 2. 환불 목록 행 수정 저장 함수
// 💡 파라미터에 index와 id를 모두 받아내도록 규격을 명시합니다.
const saveRowEdit2 = async (index: number) => {
  try {
    // PHP 서버로 한 번에 한 줄 데이터 수정본 전송
    const response = await axios.post('https://info7qni.dothome.co.kr/updateRefund.php', {
      id: index, // 파라미터로 안전하게 넘어온 진짜 고유 id값을 매핑
      branch_name: editRowData2.branch_name, 
      request_date: editRowData2.request_date,    
      branch_manager: editRowData2.branch_manager,
      customer_name: editRowData2.customer_name,    
      refund_amount: editRowData2.refund_amount,  
      reason_and_account: editRowData2.reason_and_account,   
      approval_status: editRowData2.approval_status
    });
    console.log("updateRefund 응답 전체:", response.data);

    // 정규식 기반 헬퍼 함수로 데이터 정제
    const responseData = parsePureJson(response.data);

    if (responseData && (responseData.success === true || responseData.success === "true")) {
      // 1. 화면에 반영할 새 배열 복사본 만들기
      const updated = [...refundData];
      updated[index] = { ...editRowData2 };

      setRefundData(updated);
      
      // 3. 인풋창 수정 모드 끄기
      setEditRowIndex2(null);
      fetchRefundData(refundPage);

      alert(responseData.message || '성공적으로 수정되었습니다.');
    } else {
      alert(responseData?.message || '수정에 실패했습니다.');
    }
  } catch (error) {
    console.error("환불 내역 수정 실패:", error); // 명확한 로그 문구로 수정
    alert('서버 전송 중 네트워크 오류가 발생했습니다.');
  }
};



const  onStatus = async (id : number) => {
  try {
    // PHP 서버로 한 번에 한 줄 데이터 수정본 전송
    const response = await axios.post('https://info7qni.dothome.co.kr/updateRefundStatus.php', {
      id: id, 
      approval_status: 'Y',       
    });
    console.log("updateCertificatefile 응답 전체:", response.data);

    // 정규식 기반 헬퍼 함수로 데이터 정제
    const responseData = parsePureJson(response.data);

    if (responseData && (responseData.success === true || responseData.success === "true")) {

      fetchRefundData(refundPage);

      alert(responseData.message || '성공적으로 수정되었습니다.');
    } else {
      alert(responseData?.message || '수정에 실패했습니다.');
    }
  } catch (error) {
    console.error("자격증 파일 내역 수정 실패:", error); // 명확한 로그 문구로 수정
    alert('서버 전송 중 네트워크 오류가 발생했습니다.');
  }


}


      

     return (
    <div className="page" id="pageAcct">
      <div className="sub-tab-row">
        <button 
          className={`sub-tab-btn ${activeTab === 'billing' ? 'active' : ''}`} 
          data-acctsub="billing"
          onClick={() => setActiveTab('billing')}
        >
          일일 결산 보고 리스트
        </button>
        <button 
          className={`sub-tab-btn ${activeTab === 'refund' ? 'active' : ''}`} 
          data-acctsub="refund"
          onClick={() => setActiveTab('refund')}
        >
          지점 환불 신청서 관리
        </button>
      </div>

      {/* 일일 결산 보고 리스트 블록 */}
      <div id="acctSubBlock-billing" style={{ display: activeTab === 'billing' ? 'block' : 'none' }}>
        <div className="summary-row">
          <div className="summary-card">
            <div className="summary-card">
            <div className="summary-label">결산 완료 지점</div>
            <div className="summary-value" id="acctSubmittedCount">{total_nonrows} / {total_branch}</div>
            <div className="summary-sub">전체 {total_branch}개 지점 기준</div>
          </div>
          </div>
          <div className="summary-card">
            <div className="summary-label">총 계좌이체 결제분 합계</div>
            <div className="summary-value accent" id="acctTransferTotal">{Number(total_amount).toLocaleString()}원</div>
            <div className="summary-sub">본사 통장 직접입금 기준</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">미보고 지점 수</div>
            <div className="summary-value" id="acctMissingCount" style={{ color: 'var(--danger)' }}>{total_nonreport}개 지점</div>
            <div className="summary-sub">오늘 기준</div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">지점별 일일 결산 보고 현황</div>
              <div className="panel-title-sub">지점에서 등록한 본사 계좌이체 결제 내역 확인 채널</div>
            </div>
            <input 
                type="date" 
                className="date-picker" 
                id="acctDatePicker" 
                value={selectedDate} // 상태값 연결
                onChange={(e) => setSelectedDate(e.target.value)} // 날짜 변경 시 상태 업데이트
                />
          </div>
          <div className="panel-body">
            <table>
              <thead>
                <tr>
                  <th>지점명</th>
                  <th>입금일자</th>
                  <th>담당자</th>
                  <th>입금자명</th>
                  <th>입금액(계좌이체)</th>
                  <th>상태</th>
                  <th>관리</th>
                </tr>
              </thead>
               <tbody id="attendTableBody">
                  {deposit_management.map((item, index) => {
                    // 현재 이 줄(index)이 사용자가 [수정] 버튼을 누른 줄인지 판별
                    const isEditing = editRowIndex === index;

                    return (
                        <tr key={`academy-row-${index}`}>
                            {/* 1. 지점명 */}
                            <td className="branch-cell">
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        className="table-edit-input"
                                        value={editRowData.branch_name || ''} 
                                        onChange={(e) => setEditRowData({ ...editRowData, branch_name: e.target.value })}
                                    />
                                ) : (
                                    item.branch_name
                                    
                                )}
                            </td>

            
                            <td>
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        className="table-edit-input"
                                        value={editRowData.deposit_date || ''} 
                                        onChange={(e) => setEditRowData({ ...editRowData, deposit_date: e.target.value })}
                                    />
                                ) : (
                                    item.deposit_date
                                )}
                            </td>

                   
                            <td>
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        className="table-edit-input"
                                        value={editRowData.manager_name || ''} 
                                        onChange={(e) => setEditRowData({ ...editRowData, manager_name: e.target.value })}
                                    />
                                ) : (
                                    item.manager_name
                                )}
                            </td>

                             <td>
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        className="table-edit-input"
                                        value={editRowData.depositor_name	 || ''} 
                                        onChange={(e) => setEditRowData({ ...editRowData, depositor_name	: e.target.value })}
                                    />
                                ) : (
                                    item.depositor_name	
                                )}
                            </td>

                             <td>
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        className="table-edit-input"
                                        value={editRowData.deposit_amount	 || ''} 
                                        onChange={(e) => setEditRowData({ ...editRowData, deposit_amount	: e.target.value })}
                                    />
                                ) : (
                                    <span style={{ color: 'var(--success)', fontWeight: 700 }}>{Number(item.deposit_amount).toLocaleString()}원</span>	
                                )}
                            </td>



                            <td>
                                {isEditing ? (
                                    <select 
                                        className="table-edit-select"
                                        value={editRowData.status || 'N'} 
                                        onChange={(e) => setEditRowData({ ...editRowData, status: e.target.value })}
                                    >
                                        <option value="Y">완료</option>
                                        <option value="N">미제출</option>
                                    </select>
                                ) : (
                                    item.status === 'Y' ? (
                                        <span className="status-chip status-done">완료</span>
                                    ) : (
                                        <span className="status-chip status-none">미제출</span>
                                    )
                                )}
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
        </div>
      </div>

      {/* 지점 환불 신청서 관리 블록 */}
      <div id="acctSubBlock-refund" style={{ display: activeTab === 'refund' ? 'block' : 'none' }}>
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">지점 접수 환불 신청서 목록</div>
              <div className="panel-title-sub">각 지점에서 올린 중도해지 및 환불 요청건을 심사 후 지급 완료 처리합니다</div>
            </div>
          </div>
          <div className="panel-body">


            <table style={{ width: '100%', tableLayout: 'fixed' }}> {/* 테이블이 부모를 벗어나지 않도록 고정 */}
                <thead>
                    <tr>
                    <th style={{ width: '12%' }}>지점명</th>
                    <th style={{ width: '12%' }}>요청일자</th>
                    <th style={{ width: '10%' }}>지점담당자</th>
                    <th style={{ width: '10%' }}>고객명</th>
                    <th style={{ width: '12%' }}>환불금액</th>
                    <th style={{ width: '24%' }}>사유 및 계좌정보</th>
                    <th style={{ width: '10%' }}>승인상태</th>
                    <th style={{ width: '10%' }}>액션</th>
                    <th style={{ width: '10%' }}>관리</th>
                    </tr>
                </thead>
                <tbody id="refundTableBody">
                    {refundData && refundData.map((item, index) => {
                        const isEditing = editRowIndex2 === index;
                        
                        // 상태값 변수 안전하게 관리 ('Y', '지급완료' 체크)
                        const isApproved = item.approval_status === 'Y' || item.approval_status === '지급완료';

                        return (
                            <tr key={`certificate-row-${index}`}>
                                {/* 1. 지점명 */}
                                <td className="branch-cell">
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            className="table-edit-input"
                                            style={{ width: '100%' }}
                                            value={editRowData2.branch_name || ''}
                                            onChange={(e) => setEditRowData2({ ...editRowData2, branch_name: e.target.value })}
                                        />
                                    ) : (
                                        item.branch_name || '-'
                                    )}
                                </td>

                                {/* 2. 요청일자 */}
                                <td>
                                    {isEditing ? (
                                        <input
                                            type="date"
                                            className="table-edit-input"
                                            style={{ width: '100%' }}
                                            value={editRowData2.request_date || ''}
                                            onChange={(e) => setEditRowData2({ ...editRowData2, request_date: e.target.value })}
                                        />
                                    ) : (
                                        item.request_date || '-'
                                    )}
                                </td>

                                {/* 3. 지점담당자 */}
                                <td>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            className="table-edit-input"
                                            style={{ width: '100%' }}
                                            value={editRowData2.branch_manager || ''}
                                            onChange={(e) => setEditRowData2({ ...editRowData2, branch_manager: e.target.value })}
                                        />
                                    ) : (
                                        item.branch_manager || '-'
                                    )}
                                </td>

                                {/* 4. 고객명 */}
                                <td>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            className="table-edit-input"
                                            style={{ width: '100%' }}
                                            value={editRowData2.customer_name || ''}
                                            onChange={(e) => setEditRowData2({ ...editRowData2, customer_name: e.target.value })}
                                        />
                                    ) : (
                                        item.customer_name || '-'
                                    )}
                                </td>

                                {/* 5. 환불금액 */}
                                <td>
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            className="table-edit-input"
                                            style={{ width: '100%' }}
                                            value={editRowData2.refund_amount || ''}
                                            onChange={(e) => setEditRowData2({ ...editRowData2, refund_amount: e.target.value })}
                                        />
                                    ) : (
                                        <span style={{ color: 'var(--success)', fontWeight: 700 }}>
                                            {Number(item.refund_amount || 0).toLocaleString()}원
                                        </span>
                                    )}
                                </td>

                                {/* 6. 사유 및 계좌정보 */}
                                <td>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            className="table-edit-input"
                                            style={{ width: '100%' }}
                                            value={editRowData2.reason_and_account || ''}
                                            onChange={(e) => setEditRowData2({ ...editRowData2, reason_and_account: e.target.value })}
                                        />
                                    ) : (
                                        item.reason_and_account || '-'
                                    )}
                                </td>

                                {/* 7. 승인상태 (데이터가 없어도 무조건 td 영역 확보) */}
                                <td>
                                    <span className={`status-chip ${isApproved ? 'status-done' : 'status-wait'}`}>
                                        {isApproved ? '지급완료' : '대기중'}
                                    </span>
                                </td>

                                {/* 8. 지급 승인 버튼 액션 (데이터가 없어도 무조건 td 영역 확보) */}
                                <td>
                                    {isApproved ? (
                                        <span>완료</span>
                                    ) : (
                                        <button className="btn-sm" onClick={() => { onStatus(item.id)}}>지급 승인</button>
                                    )}
                                </td>

                                {/* 9. 수정 / 저장·취소 버튼 제어 */}
                                <td>
                                    {isEditing ? (
                                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                            <button
                                                className="primary-btn"
                                                style={{ background: 'var(--success)', padding: '6px 12px', minWidth: 'ec-content', color: '#fff' }}
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
                                        <button className="primary-btn" style={{ width: '100%' }} onClick={() => startRowEdit2(index, item)}>
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
      </div>
    </div>
  );
    
}