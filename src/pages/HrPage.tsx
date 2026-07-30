import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';


interface Attendance {
    id : number,
    date : string,
    branch :string,
    name : string,
    status : string,
    note : string,
    checked : string,
}

 interface Certificate {
  id: number;              // 고유 번호 (PK)
  branch_name: string;      // 지점명 (예: '인천청라여성병원스파')
  request_type: string;     // 신청/제출 구분 (예: '재직증명서 신청')
  target_name: string;      // 대상자 이름 (예: '김담당')
  request_date: string;     // 요청일자 (YYYY-MM-DD 형식)
  attached_file: string;    // 지점 첨부파일 명 (예: '김담당_재직원신청사유서.docx')
  status: string;       // 상태 ('Y': 완료됨, 'N': 본사 확인중)
}

export default function HrPage() {

 const [activeTab, setActiveTab] = useState('attendance');

  

const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [attendancePage, setAttendancePage] = useState<number>(1);
  const [attendanceTotalPages, setAttendanceTotalPages] = useState<number>(1);



  const [certificatePage, setCertificatePage] = useState<number>(1);
  const [certificateTotalPages, setCertificateTotalPages] = useState<number>(1);


  const [certificateData, setCertificateData] = useState<Certificate[]>([]);


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


// 🟢 1번 탭 데이터 전용 함수 (출석 관리 목록)
const fetchAttendanceData = async (targetPage: number) => {
  try {
    const response = await axios.get(
      `https://info7qni.dothome.co.kr/attendancelist.php?page=${targetPage}&tab=attendance`
    );
    console.log("attendancelist 응답 전체:", response.data);

    // 정규식 기반 헬퍼 함수로 데이터 정제
    const responseData = parsePureJson(response.data);

    if (responseData) {
      // 데이터 누락 시 화면이 깨지지 않도록 기본값 처리
      setAttendance(responseData.data || []);
      setAttendanceTotalPages(responseData.total_pages || 1);
    }
  } catch (error) {
    console.error("출석 정보를 가져오는데 실패했습니다:", error); // 로그 문구 수정
  }
};

// 🔵 2번 탭 데이터 전용 함수 (자격증 파일 목록)
const fetchcertificateData = async (targetPage: number) => {
  try {
    const response = await axios.get(
      `https://info7qni.dothome.co.kr/certificationfile.php?page=${targetPage}&tab=certificate`
    );
    console.log("certificationfile 응답 전체:", response.data);

    // 정규식 기반 헬퍼 함수로 데이터 정제
    const responseData = parsePureJson(response.data);

    if (responseData) {
      // 데이터 누락 시 화면이 깨지지 않도록 기본값 처리
      setCertificateData(responseData.data || []);
      setCertificateTotalPages(responseData.total_pages || 1);
    }
  } catch (error) {
    console.error("자격증 파일 정보를 가져오는데 실패했습니다:", error); // 로그 문구 수정
  }
};

// 🟢 1번 탭 데이터용 감시자
useEffect(() => {
  fetchAttendanceData(attendancePage);
}, [attendancePage]); 

// 🔵 2번 탭 데이터용 감시자
useEffect(() => {
  fetchcertificateData(certificatePage);
}, [certificatePage]);



 // 1. 현재 수정 중인 줄(Row)의 인덱스 번호를 저장 (수정 중이 아니면 null)
    const [editRowIndex, setEditRowIndex] = useState<number | null>(null);

    // 2. 수정 중인 한 줄의 데이터들을 담아둘 임시 버퍼 상태
    const [editRowData, setEditRowData] = useState<any>({});

    // 3. [수정] 버튼 클릭 시 해당 줄의 데이터를 버퍼에 담고 인풋창으로 전환하는 함수
    const startRowEdit = (index: number, currentItem: any) => {
         setEditRowIndex(index);
        setEditRowData({ ...currentItem }); 
    };


    // 🔍 1. 출석 관리 행 수정 저장 함수
const saveRowEdit = async (index: number) => {
  try {
    // PHP 서버로 한 번에 한 줄 데이터 수정본 전송
    const response = await axios.post('https://info7qni.dothome.co.kr/updateAttendanceRow.php', {
      id: editRowData.id, 
      date: editRowData.date,
      branch: editRowData.branch,
      name: editRowData.name,
      status: editRowData.status,
      note: editRowData.note,
      checked: editRowData.checked
    });
    console.log("updateAttendanceRow 응답 전체:", response.data);

    // 정규식 기반 헬퍼 함수로 데이터 정제
    const responseData = parsePureJson(response.data);

    if (responseData && (responseData.success === true || responseData.success === "true")) {
      // 1. 화면에 반영할 새 배열 복사본 만들기
      const updated = [...attendance];
      updated[index] = { ...editRowData };

      setAttendance(updated);
      setEditRowIndex(null);
      fetchAttendanceData(attendancePage);
      alert('성공적으로 수정되었습니다.');
    } else {
      alert(responseData?.message || '수정에 실패했습니다.');
    }
  } catch (error) {
    console.error("출석 내역 수정 실패:", error); // 명확한 로그 문구로 수정
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

// 🔍 2. 자격증 파일 행 수정 저장 함수
// 💡 파라미터에 index와 id를 모두 받아내도록 규격을 명시합니다.
// 인자로 index(순서) 대신, 실제 row 데이터나 고유 id를 받도록 수정합니다.
const saveRowEdit2 = async (rowId: number) => {
  try {
    // 💡 안전장치: 현재 수정 중인 데이터가 비어있지 않은지 검증
if (!editRowData2.branch_name || !editRowData2.target_name) {
      alert("지점명과 대상자는 필수 입력 항목입니다.");
      return;
    }
    // PHP 서버로 수정본 전송 (방금 전 보여주신 모든 컬럼을 받는 PHP 파일용)
    const response = await axios.post('https://info7qni.dothome.co.kr/updateCertificatefile.php', {
        id: rowId, // 안전하게 받아온 데이터베이스 고유 ID 전달
      branch_name: editRowData2.branch_name,       // 👈 변수명 수정
      request_type: editRowData2.request_type,     // 👈 변수명 수정
      target_name: editRowData2.target_name,       // 👈 변수명 수정
      request_date: editRowData2.request_date,     // 👈 변수명 수정
      attached_file: editRowData2.attached_file,   // 👈 변수명 수정
      status: editRowData2.status                      
    });
    
    console.log("updateCertificatefile 응답 전체:", response.data);

    const responseData = parsePureJson(response.data);

    if (responseData && (responseData.success === true || responseData.success === "true")) {
      
      // 인풋창 수정 모드 끄기 (state 초기화)
      setEditRowIndex2(null);
      
      // ⭐ 서버에서 최신 데이터를 다시 읽어와 화면을 갱신합니다.
      fetchcertificateData(certificatePage);

      alert(responseData.message || '성공적으로 수정되었습니다.');
    } else {
      alert(responseData?.message || '수정에 실패했습니다.');
    }
  } catch (error) {
    console.error("자격증 파일 내역 수정 실패:", error);
    alert('서버 전송 중 네트워크 오류가 발생했습니다.');
  }
};



 const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // 파일이 선택되었을 때 실행되는 함수
    const handleFileChange = (e : any) => {
        // files[0]을 사용해 선택된 파일 리스트 중 '첫 번째 파일 객체' 딱 하나만 꺼내서 저장합니다.
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]); 
        }
    };

const handleUploadDoc = async () => {
    // 1. 파일 선택 여부 검증
    if (!selectedFile) {
        alert('배포할 파일을 먼저 선택해주세요.');
        return;
    }
    
    try {
        // 2. 바이너리 파일 전송을 위한 FormData 객체 생성
        const formData = new FormData();
        
        // 'hq_file'이라는 키값으로 실제 파일 객체를 담습니다.
        formData.append('hq_file', selectedFile); 
        
        // 필요하다면 파일명이나 추가 데이터도 함께 보낼 수 있습니다.
        formData.append('file_name', selectedFile.name);

        // 3. 서버로 실제 파일 전송 (POST 요청)
        const response = await axios.post('https://info7qni.dothome.co.kr/uploadHqDoc.php', formData, {
            headers: {
                // 파일을 보낼 때 반드시 명시해야 하는 Content-Type 설정
                'Content-Type': 'multipart/form-data',
            },
        });

        console.log("uploadHqDoc 응답 전체:", response.data);

        // 4. 정규식 기반 헬퍼 함수로 데이터 정제 (불필요한 PHP 접두사 제거)
        const responseData = parsePureJson(response.data);

        // 5. 응답 데이터의 success 여부 검증 (불리언 및 문자열 상호 호환)
        if (responseData && (responseData.success === true || responseData.success === "true")) {
            alert(`🎉 ${selectedFile.name} 파일이 성공적으로 배포되었습니다!`);
            setSelectedFile(null); // 업로드 완료 후 선택된 파일 상태 초기화
        } else {
            // 서버가 success: false를 반환했거나 파싱에 실패한 경우
            alert(`업로드 실패: ${responseData?.message || '서버 오류가 발생했습니다.'}`);
        }

    } catch (error) {
        // 6. 네트워크 및 서버 에러 처리
        console.error('파일 업로드 중 에러 발생:', error);
        alert('서버 통신 중 에러가 발생했습니다. 주소나 네트워크를 확인해 주세요.');
    }
};


const  onStatus = async (id : number) => {
  try {
    // PHP 서버로 한 번에 한 줄 데이터 수정본 전송
    const response = await axios.post('https://info7qni.dothome.co.kr/updateCertificatestatus.php', {
      id: id, 
      status: 'Y',       
    });
    console.log("updateCertificatefile 응답 전체:", response.data);

    // 정규식 기반 헬퍼 함수로 데이터 정제
    const responseData = parsePureJson(response.data);

    if (responseData && (responseData.success === true || responseData.success === "true")) {

      fetchcertificateData(certificatePage);

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



    <div>
      {/* 탭 버튼 영역 */}
      <div className="sub-tab-row">
        <button 
          className={`sub-tab-btn ${activeTab === 'attendance' ? 'active' : ''}`} 
          onClick={() => setActiveTab('attendance')}
        >
          실시간 당일 근태 현황
        </button>
        <button 
          className={`sub-tab-btn ${activeTab === 'certificate' ? 'active' : ''}`} 
          onClick={() => setActiveTab('certificate')}
        >
          증명서 신청 및 서류 처리함
        </button>
      </div>

      {/* 1. 실시간 당일 근태 현황 블록 */}
      {activeTab === 'attendance' && (
        <div id="hrSubBlock-attendance">
          <div className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">오늘의 지점별 근태 보고 현황</div>
                <div className="panel-title-sub">지점 점장 및 매니저가 보고한 소속 직원 근태 목록</div>
              </div>
            </div>
            <div className="panel-body">
              <table>
                <thead>
                  <tr>
                    <th>보고일자</th>
                    <th>지점명</th>
                    <th>직원 성명</th>
                    <th>근태 상태</th>
                    <th>특이사항 / 비고</th>
                    <th>본사 확인</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody id="attendTableBody">
                  {attendance.map((item, index) => {
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
                                        value={editRowData.date || ''} 
                                        onChange={(e) => setEditRowData({ ...editRowData, date: e.target.value })}
                                    />
                                ) : (
                                    item.date
                                    
                                )}
                            </td>

            
                            <td>
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

                   
                            <td>
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        className="table-edit-input"
                                        value={editRowData.name || ''} 
                                        onChange={(e) => setEditRowData({ ...editRowData, name: e.target.value })}
                                    />
                                ) : (
                                    item.name
                                )}
                            </td>

    
                            <td>
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        className="table-edit-input"
                                        value={editRowData.status || ''} 
                                        onChange={(e) => setEditRowData({ ...editRowData, status: e.target.value })}
                                    />
                                ) : (
                                    item.status
                                )}
                            </td>

                            <td>
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        className="table-edit-input"
                                        value={editRowData.note || ''} 
                                        onChange={(e) => setEditRowData({ ...editRowData, note: e.target.value })}
                                    />
                                ) : (
                                    item.note
                                )}
                            </td>


                            <td>
                                {isEditing ? (
                                    <select 
                                        className="table-edit-select"
                                        value={editRowData.checked || 'N'} 
                                        onChange={(e) => setEditRowData({ ...editRowData, checked: e.target.value })}
                                    >
                                        <option value="Y">완료</option>
                                        <option value="N">대기</option>
                                    </select>
                                ) : (
                                    item.checked === 'Y' ? (
                                        <span className="status-chip status-done">완료</span>
                                    ) : (
                                        <span className="status-chip status-wait">대기</span>
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
      )}

      

      {/* 2. 증명서 신청 및 서류 처리함 블록 */}
      {activeTab === 'certificate' && (
        <div id="hrSubBlock-certificate">
          {/* 본사 기능: 표준 서식 등록함 */}
          <div className="panel" style={{ border: '2px dashed var(--accent)', background: '#FAF8F5', marginBottom: '18px' }}>
            <div className="panel-header" style={{ background: 'none', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div className="panel-title" style={{ color: 'var(--accent)' }}>[본사 기능] 지점 배포용 표준 서식 등록함</div>
                <div className="panel-title-sub">여기에 파일 서식을 업로드하면 전 지점 대시보드에서 실시간으로 직접 다운로드 가능해집니다.</div>
              </div>
            </div>
             <div className="panel-body" style={{ paddingTop: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    
                    {/* 1. 디자인을 담당하는 가짜 입력창 (label) */}
                    <label 
                    htmlFor="hqFormDocName" 
                    style={{ 
                        flex: 1, 
                        padding: '10px 14px', 
                        border: '1px solid var(--border)', 
                        borderRadius: '8px',
                        backgroundColor: '#fff',
                        color: selectedFile ? '#212529' : '#999', // 파일 선택 여부에 따른 글자색 변경
                        fontSize: '14px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block'
                    }}
                    >
                    {selectedFile ? `📎 ${selectedFile.name}` : '예: [서식] 2026 하반기 전직원 사직서 양식.docx'}
                    </label>

                    {/* 2. 실제로 작동하지만 화면에는 숨겨지는 진짜 파일 인풋 */}
                    <input 
                    type="file" 
                    id="hqFormDocName" 
                    onChange={handleFileChange}
                    style={{ display: 'none' }} // 화면에서 숨김 처리
                    />

                    {/* 3. 배포 버튼 */}
                    <button 
                    className="primary-btn" 
                    id="uploadHqDocBtn" 
                    onClick={handleUploadDoc}
                    style={{ padding: '10px 20px', height: '100%', cursor: 'pointer' }}
                    >
                    서식 배포하기
                    </button>

                </div>
                </div>
                        
          </div>

          {/* 지점 신청 서류 / 증명서 처리함 */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">지점 신청 서류 / 증명서 처리함</div>
                <div className="panel-title-sub">지점에서 첨부하여 올린 증빙서류 파일을 실시간 확인 및 다운로드하고 승인합니다</div>
              </div>
            </div>
            <div className="panel-body">
              <table>
                <thead>
                  <tr>
                    <th>지점명</th>
                    <th>신청/제출 구분</th>
                    <th>대상자</th>
                    <th>요청일자</th>
                    <th>지점 첨부파일</th>
                    <th>상태</th>
                    <th>본사 액션</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody id="certTableBody">
                   {certificateData.map((item, index) => {

                        // 현재 이 줄(index)이 사용자가 [수정] 버튼을 누른 줄인지 판별
                        const isEditing = editRowIndex2 === index;

                        return (
                            <tr key={`certificate-row-${index}`}>
                                {/* 1. 지점명 */}
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

                                {/* 2. 신청/제출 구분 */}
                                <td>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            className="table-edit-input"
                                            value={editRowData2.request_type || ''}
                                            onChange={(e) => setEditRowData2({ ...editRowData2, request_type: e.target.value })}
                                        />
                                    ) : (
                                        item.request_type
                                    )}
                                </td>

                                {/* 3. 대상자 */}
                                <td>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            className="table-edit-input"
                                            value={editRowData2.target_name || ''}
                                            onChange={(e) => setEditRowData2({ ...editRowData2, target_name: e.target.value })}
                                        />
                                    ) : (
                                        item.target_name
                                    )}
                                </td>

                                {/* 4. 요청일자 */}
                                <td>
                                    {isEditing ? (
                                        <input
                                            type="date"
                                            className="table-edit-input"
                                            value={editRowData2.request_date || ''}
                                            onChange={(e) => setEditRowData2({ ...editRowData2, request_date: e.target.value })}
                                        />
                                    ) : (
                                        item.request_date
                                    )}
                                </td>

                                {/* 5. 지점 첨부파일 */}
                                <td>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            className="table-edit-input"
                                            value={editRowData2.attached_file || ''}
                                            onChange={(e) => setEditRowData2({ ...editRowData2, attached_file: e.target.value })}
                                        />
                                    ) : (
                                        <a 
                                            href="#file" 
                                            style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '13px' }} 
                                            
                                        >
                                            💾 {item.attached_file}
                                        </a>
                                    )}
                                </td>

                                {/* 6. 상태 (Y/N에 따른 셀렉트 박스 및 배지) */}
                                <td>
                                    {isEditing ? (
                                        <select
                                            value={editRowData2.status || 'N'}
                                            onChange={(e) => setEditRowData2({ ...editRowData2, status: e.target.value })}
                                        >
                                            <option value="N">본사 확인중</option>
                                            <option value="Y">완료됨</option>
                                        </select>
                                    ) : (
                                        <span className={`status-chip ${item.status === 'Y' ? 'status-done' : 'status-info'}`}>
                                            {item.status === 'Y' ? '완료됨' : '본사 확인중'}
                                        </span>
                                    )}
                                </td>

                                {/* 7. 본사 액션 (수정 모드에 따른 버튼 변경) */}
                                <td>
                                  
                                    {item.status === 'Y' ? (
                                        '확인완료'
                                    ) : (
                                        <button className="btn-sm" onClick={() => onStatus(item.id)}>
                                            확인 및 서류 승인
                                        </button>
                                    )
                                    }
                                   
                                </td>
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
        </div>
      )}


      {/* 🧭 [신규 추가] 하단 페이징 제어 버튼 컴포넌트 구역 */}
      {(() => {
          // 💡 [핵심 로직] 현재 활성화된 탭에 맞춰 어떤 상태값을 사용할지 동적으로 변수에 대입합니다.
          const isStatusTab = activeTab === 'status';
          
          const currentTabPage = isStatusTab ? attendancePage : certificatePage;
          const currentTabTotalPages = isStatusTab ? attendanceTotalPages : certificateTotalPages;
          const currentTabSetPage = isStatusTab ? setAttendancePage : setCertificatePage;

          return (
              <div className="pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', marginTop: '25px', marginBottom: '25px' }}>
                  {/* [이전] 버튼: 현재 탭의 페이지가 1페이지가 아닐 때만 작동 활성화 */}
                  <button 
                      className="btn-sm" 
                      disabled={currentTabPage === 1}
                      onClick={() => currentTabSetPage(prev => Math.max(prev - 1, 1))}
                  >
                      이전
                  </button>

                  {/* 숫자 버튼들: 현재 탭의 전체 페이지 수(currentTabTotalPages)만큼 배열을 동적 생성하여 루프 */}
                  {Array.from({ length: currentTabTotalPages }, (_, index) => {
                      const pageNum = index + 1;
                      return (
                          <button
                              key={pageNum}
                              className={`btn-sm ${currentTabPage === pageNum ? 'active' : ''}`}
                              style={{
                                  fontWeight: currentTabPage === pageNum ? 'bold' : 'normal',
                                  backgroundColor: currentTabPage === pageNum ? 'var(--accent, #0076ff)' : '#fff',
                                  color: currentTabPage === pageNum ? '#fff' : '#333',
                                  border: '1px solid #ddd',
                                  padding: '5px 10px',
                                  cursor: 'pointer'
                              }}
                              onClick={() => currentTabSetPage(pageNum)}
                          >
                              {pageNum}
                          </button>
                      );
                  })}

                  {/* [다음] 버튼: 현재 탭의 마지막 페이지가 아닐 때만 작동 활성화 */}
                  <button 
                      className="btn-sm" 
                      disabled={currentTabPage === currentTabTotalPages}
                      onClick={() => currentTabSetPage(prev => Math.min(prev + 1, currentTabTotalPages))}
                  >
                      다음
                  </button>
              </div>
          );
      })()}

    </div>

  );

}