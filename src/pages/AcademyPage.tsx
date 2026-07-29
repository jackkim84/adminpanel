import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

interface Academy {
  idx: number;
  branchName: string;
  therapistName	: string;
  position	: string;
  courseName: string;
  status: string;
   issueDate: string;
}

interface Certification {
    id : number,
    c_name : string,
    t_idx : number,
}

interface Hq_course_history {
  id : number,
  h_name : string,
  rdate : string,
  evaluation : string,
  t_idx:number,
}


interface Hq_course_schedules {
  id : number,
  course_name : string,
  education_at : string,
  instructor_name : string,
  location : string,
  current_count:number,
  max_count:number,
  created_at:string,
}


export default function AcademyPage() {
  
    const [activeTab, setActiveTab] = useState('status');
    const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null);
    const [certification, setCertification] = useState<Certification[]>([]);
    const [hq_course_history, setHq_course_history] = useState<Hq_course_history[]>([]);
    // 🟢 1번 탭(지점 인력 교육 이수 현황) 전용 페이지 상태
    const [academyPage, setAcademyPage] = useState<number>(1);
    const [academyTotalPages, setAcademyTotalPages] = useState<number>(1);
    const [academy, setAcademy] = useState<Academy[]>([]); 

    // 🔵 2번 탭(본사 테크니컬 교육 일정) 전용 페이지 상태
    const [schedulePage, setSchedulePage] = useState<number>(1);
    const [scheduleTotalPages, setScheduleTotalPages] = useState<number>(1);
    const [hq_course_schedules, setHq_course_schedules] = useState<Hq_course_schedules[]>([]); // 

    const [isOpen, setIsOpen] = useState<boolean>(false);


    /*Hq_course_schedules 세팅*/


      const [course_name, setCourse_name] = useState<string>("");
      const [education_at, setEducation_at] = useState<string>("");
      const [instructor_name, setInstructor_name] = useState<string>("");
      const [location, setLocation] = useState<string>("");
      const [current_count, setCurrent_count] = useState<string>("");
      const [max_count, setMax_count] = useState<string>("");



  


    
      // ==========================================
  // ✨ [추가] 인라인 실시간 편집을 위한 상태 관리 변수
  // ==========================================
  const [editTarget, setEditTarget] = useState<{ type: string; index: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  // 1. 글자 클릭 시 인풋창 활성화 트리거
  const startEdit = (type: string, index: number, field: string, currentValue: string) => {
      setEditTarget({ type, index, field });
      setEditValue(currentValue || "");
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

       // 1. 현재 수정 중인 줄(Row)의 인덱스 번호를 저장 (수정 중이 아니면 null)
    const [editRowIndex2, setEditRowIndex2] = useState<number | null>(null);

    // 2. 수정 중인 한 줄의 데이터들을 담아둘 임시 버퍼 상태
    const [editRowData2, setEditRowData2] = useState<any>({});

    // 3. [수정] 버튼 클릭 시 해당 줄의 데이터를 버퍼에 담고 인풋창으로 전환하는 함수
    const startRowEdit2 = (index: number, currentItem: any) => {
          setEditRowIndex2(index);
          setEditRowData2({ ...currentItem }); 
    };




  const saveEdit = async () => {
      if (!editTarget) return;
      const { type, index, field } = editTarget;

      try {
          // 고유 식별자 키를 .idx 대신 정의된 .id 로 변경합니다.
          let targetIdx: number | null = null;
          if (type === 'certification') targetIdx = certification[index].id;
          if (type === 'hq_course_history') targetIdx = hq_course_history[index].id;

          // PHP 백엔드로 수정 내용 전송
          const response = await axios.post('http://info7qni.dothome.co.kr/updateAcademySpec.php', {
              type: type,         // 'certification' 또는 'hq_course_history'
              id: targetIdx,      // 👈 변수명을 데이터베이스와 일치하게 id로 변경
              field: field,       // 수정할 컬럼명 (c_name, h_name, rdate, evaluation)
              value: editValue    // 새로 입력한 텍스트
          });

          if (response.data && response.data.success) {
                if (type === 'certification') {
                    const updated = [...certification]; // 1) 기존 배열 복사 (불변성 유지)
                    updated[index] = { ...updated[index], [field]: editValue } as any; // 2) 해당 특정 컬럼만 입력값으로 교체
                    setCertification(updated); // 3) 리액트 상태 업데이트 -> 화면이 새로고침 없이 바로 바뀜
                } else if (type === 'hq_course_history') {
                    const updated = [...hq_course_history];
                    updated[index] = { ...updated[index], [field]: editValue } as any;
                    setHq_course_history(updated);
                }
            } else {
                alert(response.data.message || '수정에 실패했습니다.');
            }
      } catch (error) {
          console.error("데이터 수정 통신 실패:", error);
          alert('서버 전송 중 네트워크 에러가 발생했습니다.');
      } finally {
          setEditTarget(null);
      }
  };


      // 🟢 1번 탭 데이터 전용 함수
      const fetchAcademyData = async (targetPage: number) => {
        try {
          const response = await axios.get(
              `http://info7qni.dothome.co.kr/academylist.php?page=${targetPage}&tab=status`
          );
          if (response.data) {
            setAcademy(response.data.data);
            setAcademyTotalPages(response.data.total_pages);
          }
        } catch (error) {
          console.error("아카데미 정보를 가져오는데 실패했습니다:", error);
        }
      };

      // 🔵 2번 탭 데이터 전용 함수
      const fetchCourseschedulesData = async (targetPage: number) => {
        try {
          const response = await axios.get(
              `http://info7qni.dothome.co.kr/courseslist.php?page=${targetPage}&tab=schedule`
          );
          if (response.data) {
            setHq_course_schedules(response.data.data);
            setScheduleTotalPages(response.data.total_pages);
          }
        } catch (error) {
          console.error("교육 일정 정보를 가져오는데 실패했습니다:", error);
        }
      };


     useEffect(() => {
      fetchAcademyData(academyPage);
        }, [academyPage]); 

        // 🔵 2번 탭 데이터용 감시자
        useEffect(() => {
            fetchCourseschedulesData(schedulePage);
        }, [schedulePage]);

      const detailAcademy = async (idx : number) => {


        console.log("함수로 전달된 idx 값:", idx); 

          try {
            const response = await axios.post('http://info7qni.dothome.co.kr/detailacademy.php', {
              idx: idx
            });

            setCertification(response.data.certification);
            setHq_course_history(response.data.hq_course_history);

            
          if (response.data && response.data.success) {

              console.log(response.data);
              setCertification(response.data.certification);
              setHq_course_history(response.data.hq_course_history);
              setSelectedEmpId(1);
          
          }

          } catch (error) {
            console.error("공지 등록 실패:", error);
            alert('서버 전송 중 오류가 발생했습니다.');
          }

      }



      
   

    // 4. [저장] 버튼 클릭 시 백엔드 DB 전송 및 실시간 화면 동기화 함수
    const saveRowEdit = async (index: number) => {
        try {

     
            // PHP 서버로 한 번에 한 줄 데이터 수정본 전송
            const response = await axios.post('http://info7qni.dothome.co.kr/updateAcademyRow.php', {
                idx: editRowData.idx, 
                branchName: editRowData.branchName,
                position: editRowData.position,
                courseName: editRowData.courseName,
                status: editRowData.status,
                issueDate: editRowData.issueDate
            });
            if (response.data && response.data.success) {
                  // 1. 화면에 반영할 새 배열 복본 만들기
                  const updated = [...academy];
                  updated[index] = { ...editRowData };

                  setAcademy(updated);
                  setEditRowIndex(null);
                  fetchAcademyData(academyPage);
                  alert('성공적으로 수정되었습니다.');

              } else {
                  alert(response.data.message || '수정에 실패했습니다.');
              }
        } catch (error) {
            console.error("테이블 수정 실패:", error);
            alert('서버 전송 중 네트워크 오류가 발생했습니다.');
        }
    };

// 💡 파라미터에 index와 id를 모두 받아내도록 규격을 명시합니다.
const saveRowEdit2 = async (index: number) => {
    try {
        // PHP 서버로 한 번에 한 줄 데이터 수정본 전송
        const response = await axios.post('http://info7qni.dothome.co.kr/updateSchdule.php', {
            id: index, // 👈 파라미터로 안전하게 넘어온 진짜 고유 id값을 매핑합니다.
            course_name: editRowData2.course_name,
            education_at: editRowData2.education_at,
            instructor_name: editRowData2.instructor_name,
            location: editRowData2.location,
            current_count: editRowData2.current_count,
            max_count: editRowData2.max_count
        });

        if (response.data && response.data.success) {
            // 1. 화면에 반영할 새 배열 복사본 만들기
            const updated = [...hq_course_schedules];
            updated[index] = { ...editRowData2 };

           

            // 2. 리액트 상태 배열을 먼저 교체하여 0.01초 만에 화면 갱신
            setHq_course_schedules(updated);
            
            // 3. 인풋창 수정 모드 끄기
            setEditRowIndex2(null);
            fetchCourseschedulesData(schedulePage);

             alert(response.data.message);

            // 4. [제거] fetchCourseschedulesData(schedulePage); 
            // 💡 리액트 state를 직접 갈아끼웠으므로 백엔드에서 다시 다운로드할 필요가 없습니다!

            // 5. 모든 처리가 완료된 후 최종 알림창 띄우기
            // alert('성공적으로 수정되었습니다.');

        } else {
            alert(response.data.message || '수정에 실패했습니다.');
        }
    } catch (error) {
        console.error("테이블 수정 실패:", error);
        alert('서버 전송 중 네트워크 오류가 발생했습니다.');
    }
};


const onInsertData = async () => {

  try {
        // PHP 서버로 한 번에 한 줄 데이터 수정본 전송
        const response = await axios.post('http://info7qni.dothome.co.kr/insertSchdule.php', {
            course_name: course_name,
            education_at: education_at,
            instructor_name: instructor_name,
            location: location,
            current_count: current_count,
            max_count: max_count
        });

        if (response.data && response.data.success) {
           



            fetchCourseschedulesData(schedulePage);


            setIsOpen(false);
            alert(response.data.message);



        } else {
            alert(response.data.message || '등록에 실패했습니다.');
        }
    } catch (error) {
        console.error("테이블 수정 실패:", error);
        alert('서버 전송 중 네트워크 오류가 발생했습니다.');
    }
}




      
      

    return (

     <div className="page" id="pageAcademy">
      {/* 🧭 상단 탭 버튼 구역 */}
      <div className="sub-tab-row">
        <button 
          className={`sub-tab-btn ${activeTab === 'status' ? 'active' : ''}`} // 상태에 따라 active 클래스 동적 부여
          onClick={() => setActiveTab('status')} // 클릭 시 상태를 'status'로 변경
        >
          지점 인력 교육 이수 현황
        </button>
        <button 
          className={`sub-tab-btn ${activeTab === 'schedule' ? 'active' : ''}`} 
          onClick={() => setActiveTab('schedule')} // 클릭 시 상태를 'schedule'로 변경
        >
          본사 테크니컬 교육 일정
        </button>
      </div>


      {/* 📊 1번 블록: 지점 인력 교육 이수 현황 (activeTab이 'status'일 때만 화면에 렌더링) */}
      {activeTab === 'status' && (

        <div id="academySubBlock-status">
          <div className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">지점별 테라피스트 아카데미 이수 명단 관리</div>
                <div className="panel-title-sub">직원 이름을 누르면 참여했던 모든 교육과정, 자격 면허, 테크니컬 스펙 상세 팝업이 노출됩니다.</div>
              </div>
            </div>
            <div className="panel-body">
              <table>
                <thead>
                  <tr>
                    <th>지점명</th>
                    <th>테라피스트명 (클릭 가능)</th>
                    <th>직급</th>
                    <th>대표 참여과정</th>
                    <th>이수 상태</th>
                    <th>최근 발급일자</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody id="academyTableBody">
                {academy.map((academylist, index) => {
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
                                        value={editRowData.branchName || ''} 
                                        onChange={(e) => setEditRowData({ ...editRowData, branchName: e.target.value })}
                                    />
                                ) : (
                                    academylist.branchName
                                    
                                )}
                            </td>

                            {/* 2. 테라피스트명 (수정 모드여도 이름은 클릭 팝업 전용이므로 유지하거나 텍스트 처리 가능) */}
                            <td>
                                <span className="clickable-name" onClick={() => detailAcademy(academylist.idx)}>
                                    {academylist.therapistName}
                                </span>
                            </td>

                            {/* 3. 직급 */}
                            <td>
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        className="table-edit-input"
                                        value={editRowData.position || ''} 
                                        onChange={(e) => setEditRowData({ ...editRowData, position: e.target.value })}
                                    />
                                ) : (
                                    academylist.position
                                )}
                            </td>

                            {/* 4. 대표 참여과정 */}
                            <td>
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        className="table-edit-input"
                                        value={editRowData.courseName || ''} 
                                        onChange={(e) => setEditRowData({ ...editRowData, courseName: e.target.value })}
                                    />
                                ) : (
                                    academylist.courseName
                                )}
                            </td>

                            {/* 5. 이수 상태 (수정 모드일 때는 셀렉트 박스로 선택 가능하게 구현) */}
                            <td>
                                {isEditing ? (
                                    <select 
                                        className="table-edit-select"
                                        value={editRowData.status || 'N'} 
                                        onChange={(e) => setEditRowData({ ...editRowData, status: e.target.value })}
                                    >
                                        <option value="Y">이수완료</option>
                                        <option value="N">교육과정 진행중</option>
                                    </select>
                                ) : (
                                    academylist.status === 'Y' ? (
                                        <span className="status-chip status-done">이수완료</span>
                                    ) : (
                                        <span className="status-chip status-wait">교육과정 진행중</span>
                                    )
                                )}
                            </td>

                            {/* 6. 최근 발급일자 (날짜 인풋) */}
                            <td style={{ color: 'var(--text-muted)' }}>
                                {isEditing ? (
                                    <input 
                                        type="date" 
                                        className="table-edit-input"
                                        value={editRowData.issueDate || ''} 
                                        disabled={editRowData.status !== 'Y'} // 이수완료 일때만 날짜 입력 가능 처리
                                        onChange={(e) => setEditRowData({ ...editRowData, issueDate: e.target.value })}
                                    />
                                ) : (
                                    academylist.status === 'Y' ? academylist.issueDate : '-'
                                )}
                            </td>

                            {/* 7. 조작 버튼 구역 (제일 중요!) */}
                            <td>
                                {isEditing ? (
                                      <div style={{ display: 'flex', gap: '6px' }}>
                                          <button 
                                              className="primary-btn" 
                                              style={{ background: 'var(--success)', padding: '6px 12px', minWidth: 'fit-content' }} 
                                              onClick={() => saveRowEdit(academylist.idx)}
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
                                      <button className="primary-btn" style={{ width: '100px' }} onClick={() => startRowEdit(index, academylist)}>수정</button>
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


 {/* 🛡️ 상세/수정 통합 모달 구역 */}
<div className={`modal-overlay ${selectedEmpId !== null ? 'show' : ''}`} id="empSpecModal">
    <div className="modal-box" style={{ maxWidth: '600px' }}>
        <div className="modal-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span>테라피스트 상세 교육/자격 스펙</span>
            <span id="specEmpBranch" style={{ fontSize: '14px', fontWeight: '600', color: 'var(--accent)' }}>인천청라여성병원스파</span>
        </div>
        
        <div className="profile-badge-box">
            <div>
                <span id="specEmpName" style={{ fontSize: '22px', fontWeight: '800', color: 'var(--primary-dark)' }}>오현아</span>
                <span id="specEmpRank" style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', marginLeft: '6px' }}>실장</span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--success)', background: '#fff', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                본사 인증 테라피스트
            </div>
        </div>

        {/* 🛡️ 1. 취득 면허 및 자격 보유현황 구역 */}
        <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', color: 'var(--primary)' }}>🛡️ 취득 면허 및 자격 보유현황</h4>
            <div style={{ background: 'var(--bg)', borderRadius: '10px', padding: '6px 16px' }} id="specLicensesBlock">
                {certification.map((c, index) => {
                    const isEditing = editTarget?.type === 'certification' && editTarget?.index === index && editTarget?.field === 'c_name';
                    return (
                        <div className="spec-list-item" key={`cert-${index}`}>
                            <span className="spec-label">📜 자격/면허</span>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={saveEdit}
                                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                                    autoFocus
                                    className="inline-edit-input"
                                />
                            ) : (
                                <span 
                                    className="spec-value inline-editable"
                                    onClick={() => startEdit('certification', index, 'c_name', c.c_name)}
                                    title="클릭하여 바로 수정"
                                >
                                    {c.c_name}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>

        {/* 📚 2. 본사 교육 이수 히스토리 구역 */}
          <div style={{ marginBottom: '24px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', color: 'var(--primary)' }}>📚 본사 교육 이수 히스토리 (전체)</h4>
              <div style={{ background: 'var(--bg)', borderRadius: '10px', padding: '6px 16px' }} id="specCoursesBlock">
                  {hq_course_history.map((h, index) => {
                      const isEditingName = editTarget?.type === 'hq_course_history' && editTarget?.index === index && editTarget?.field === 'h_name';
                      const isEditingDate = editTarget?.type === 'hq_course_history' && editTarget?.index === index && editTarget?.field === 'rdate';
                      const isEditingEval = editTarget?.type === 'hq_course_history' && editTarget?.index === index && editTarget?.field === 'evaluation';

                      return (
                          <div className="spec-list-item" key={`history-${index}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              {/* 과정명 수정 구역 */}
                              {isEditingName ? (
                                  <input
                                      type="text"
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      onBlur={saveEdit}
                                      onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                                      autoFocus
                                      className="inline-edit-input"
                                      style={{ maxWidth: '240px' }}
                                  />
                              ) : (
                                  <span 
                                      className="spec-label inline-editable" 
                                      style={{ maxWidth: '280px', textAlign: 'left' }}
                                      onClick={() => startEdit('hq_course_history', index, 'h_name', h.h_name)}
                                      title="과정명 수정"
                                  >
                                      • {h.h_name}
                                  </span>
                              )}

                              {/* 일자 및 평가 등급 통합 우측 정렬 라인 */}
                              <span className="spec-value" style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                                  {/* 이수 날짜 수정 구역 */}
                                  {isEditingDate ? (
                                      <input
                                          type="text"
                                          value={editValue}
                                          onChange={(e) => setEditValue(e.target.value)}
                                          onBlur={saveEdit}
                                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                                          autoFocus
                                          className="inline-edit-input-sm"
                                      />
                                  ) : (
                                      <span 
                                          className="inline-editable" 
                                          onClick={() => startEdit('hq_course_history', index, 'rdate', h.rdate)}
                                          title="날짜 수정"
                                      >
                                          {h.rdate}
                                      </span>
                                  )}

                                  <span> | 평가: </span>

                                  {/* 평가 결과 등급 수정 구역 */}
                                  {isEditingEval ? (
                                      <input
                                          type="text"
                                          value={editValue}
                                          onChange={(e) => setEditValue(e.target.value)}
                                          onBlur={saveEdit}
                                          onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                                          autoFocus
                                          className="inline-edit-input-sm"
                                          style={{ width: '60px', fontWeight: 'bold' }}
                                      />
                                  ) : (
                                      <b 
                                          className="inline-editable" 
                                          style={{ color: 'var(--primary)' }}
                                          onClick={() => startEdit('hq_course_history', index, 'evaluation', h.evaluation)}
                                          title="평가결과 수정"
                                      >
                                          {h.evaluation}
                                      </b>
                                  )}
                              </span>
                          </div>
                      );
                  })}
              </div>
          </div>

          {/* 하단 닫기 구역 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="primary-btn" id="empSpecCloseBtn" style={{ width: '100px' }} onClick={() => setSelectedEmpId(null)}>확인</button>
          </div>
      </div>
  </div>

      {/* 📅 2번 블록: 본사 테크니컬 교육 일정 (activeTab이 'schedule'일 때만 화면에 렌더링) */}
      {activeTab === 'schedule' && (
        <div id="academySubBlock-schedule">
          <div className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">본사 교육 개설 및 일정 관리</div>
                <div className="panel-title-sub">개설된 교육 일정은 지점 대시보드 아카데미 공지 영역에 실시간 표시됩니다.</div>
              </div>
              <button className="primary-btn" id="addAcademyScheduleBtn" onClick={() => setIsOpen(true)}>+ 신규 교육 일정 등록</button>
            </div>
            <div className="panel-body">
              <table>
                <thead>
                  <tr>
                    <th>교육과정명</th>
                    <th>교육 일시</th>
                    <th>강사</th>
                    <th>교육 장소</th>
                    <th>정원 현황</th>
                    <th>상태</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody id="academyTableBody">
                {hq_course_schedules.map((hq_course_schedules, index) => {
                    // 현재 이 줄(index)이 사용자가 [수정] 버튼을 누른 줄인지 판별
                    const isEditing2 = editRowIndex2 === index;
                    const isFull = hq_course_schedules.current_count >= hq_course_schedules.max_count;

                    return (
                        <tr key={`academy-row-${index}`}>
                            {/* 1. 지점명 */}
                            <td className="branch-cell">
                                {isEditing2 ? (
                                    <input 
                                        type="text" 
                                        className="table-edit-input"
                                        value={editRowData2.course_name || ''} 
                                        onChange={(e) => setEditRowData2({ ...editRowData2, course_name: e.target.value })}
                                    />
                                ) : (
                                    hq_course_schedules.course_name
                                    
                                )}
                            </td>

                            <td >
                                {isEditing2 ? (
                                    <input 
                                        type="text" 
                                        className="table-edit-input"
                                        value={editRowData2.education_at || ''} 
                                        onChange={(e) => setEditRowData2({ ...editRowData2, education_at: e.target.value })}
                                    />
                                ) : (
                                    hq_course_schedules.education_at
                                    
                                )}
                            </td>

                            <td >
                                {isEditing2 ? (
                                    <input 
                                        type="text" 
                                        className="table-edit-input"
                                        value={editRowData2.instructor_name || ''} 
                                        onChange={(e) => setEditRowData2({ ...editRowData2, instructor_name: e.target.value })}
                                    />
                                ) : (
                                    hq_course_schedules.instructor_name
                                    
                                )}
                            </td>

                            <td>
                                {isEditing2 ? (
                                    <input 
                                        type="text" 
                                        className="table-edit-input"
                                        value={editRowData2.location || ''} 
                                        onChange={(e) => setEditRowData2({ ...editRowData2, location: e.target.value })}
                                    />
                                ) : (
                                    hq_course_schedules.location
                                    
                                )}
                            </td>


                            <td >
                                      {isEditing2 ? (
                                          // 1. [수정 모드] 사용자가 고치는 중일 때는 보관함(editRowData)의 값을 보여주고 실시간 저장합니다.
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                              <input 
                                                  type="text" 
                                                  className="table-edit-input"
                                                  style={{ width: '45px', textAlign: 'center' }}
                                                  value={editRowData2.current_count || ''} 
                                                  onChange={(e) => setEditRowData2({ ...editRowData2, current_count: e.target.value })}
                                              />
                                              <span>/</span>
                                              <input 
                                                  type="text" 
                                                  className="table-edit-input"
                                                  style={{ width: '45px', textAlign: 'center' }}
                                                  value={editRowData2.max_count || ''} 
                                                  onChange={(e) => setEditRowData2({ ...editRowData2, max_count: e.target.value })}
                                              />
                                          </div>
                                      ) : (
                                          
                                          <>
                                              <b style={{ color: 'var(--primary)' }}>{hq_course_schedules.current_count}</b> / {' '}
                                              <b style={{ color: 'var(--primary)' }}>{hq_course_schedules.max_count}</b>명
                                          </>
                                      )}
                                  </td>
                            
                             <td>
                                {isFull ? (
                                    <span className="status-chip status-none">마감</span>
                                ) : (
                                    <span className="status-chip status-done">접수중</span>
                                )}
                            </td>
                        
                            
                            {/* 7. 조작 버튼 구역 (제일 중요!) */}
                            <td>
                                {isEditing2 ? (
                                      <div style={{ display: 'flex', gap: '6px' }}>
                                          <button 
                                              className="primary-btn" 
                                              style={{ background: 'var(--success)', padding: '6px 12px', minWidth: 'fit-content' }} 
                                              onClick={() => saveRowEdit2(hq_course_schedules.id)}
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
                                      <button className="primary-btn" style={{ width: '100px' }} onClick={() => startRowEdit2(index, hq_course_schedules)}>수정</button>
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
          
          const currentTabPage = isStatusTab ? academyPage : schedulePage;
          const currentTabTotalPages = isStatusTab ? academyTotalPages : scheduleTotalPages;
          const currentTabSetPage = isStatusTab ? setAcademyPage : setSchedulePage;

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


    {/* 📊 모달창 출력 구역 (기존 CSS display:none 차단을 위해 인라인 스타일 보강) */}
    {isOpen && (      
    <div className="modal-overlay" id="academyModal" style={{ display: 'flex'}}>
      <div className="modal-box">
        <div className="modal-title">신규 아카데미 교육 과정 등록</div>
        <div className="form-row">
          <label>교육과정명</label>
          <input type="text" id="acaFormTitle" value={course_name || ''}   onChange={(e) => setCourse_name(e.target.value)} placeholder="예: [심화] 프리미엄 산후 골반 체형 테라피" />
        </div>
        <div className="form-row">
          <label>교육 일시</label>
          <input type="text" id="acaFormDate" value={education_at || ''}   onChange={(e) => setEducation_at(e.target.value)} placeholder="예: 2026-08-12 14:00" />
        </div>
        <div className="form-row">
          <label>강사</label>
          <input type="text" id="acaFormTeacher" value={instructor_name || ''}   onChange={(e) => setInstructor_name(e.target.value)}  placeholder="예: 최진희 수석 교육관" />
        </div>
        <div className="form-row">
          <label>교육 장소</label>
          <input type="text" id="acaFormPlace" value={location || ''}   onChange={(e) => setLocation(e.target.value)}  placeholder="예: 본사 제1 트레이닝 센터" />
        </div>
        <div className="form-row">
          <label>정원 현황</label>
          <input type="text" id="aca" value={current_count || ''}   onChange={(e) => setCurrent_count(e.target.value)}  placeholder="예: 0"  style={{width:'47%' , float :'left'}}/>
          &nbsp;&nbsp;-&nbsp;&nbsp; 
          <input type="text" id="aca" value={max_count || ''}   onChange={(e) => setMax_count(e.target.value)} placeholder="예: 20"  style={{width:'47%'}}/> 
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button className="ghost-btn" id="acaFormCancel" onClick={() => setIsOpen(false)}>취소</button>
          <button className="primary-btn" id="acaFormSave"  onClick={() => onInsertData()}>일정 배포</button>
        </div>
      </div>
    </div>
    )}
    </div>

    );

}