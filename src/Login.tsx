
import './App.css'; 
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
export const Login: React.FC = () => {



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

   
    const [name, setName] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const navigate = useNavigate();

    // 2. 로그인 버튼을 누르거나 폼을 제출했을 때 실행되는 함수 [1]
const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setErrorMessage(''); 

    if (!name.trim() || !password.trim()) {
        setErrorMessage('이름과 비밀번호를 모두 입력해 주세요.');
        return;
    }

    try {
        const response = await axios.post('https://info7qni.dothome.co.kr/login.php', {
            userId: name, 
            password: password,
        });

        // 1. Connected successfully... 문자열을 걷어내고 JSON 객체로 파싱합니다.
        const responseData = parsePureJson(response.data);

        console.log("실제 정제된 데이터 객체:", responseData);

        // 2. [핵심 수정] 서버 응답 성공 여부를 확실하게 판단합니다.
        if (responseData && (responseData.success === true || responseData.success === "true")) {
            
            // 3. [가장 중요] 콘솔에 찍힌 대로 토큰과 merid 값을 가져와 저장합니다.
            localStorage.setItem('token', responseData.token || '');
            
            // 서버가 userId가 아닌 merid로 보내주고 있으므로 responseData.merid를 꺼내야 합니다!
            const finalUserName = responseData.merid || responseData.userId || name;
            localStorage.setItem('userName', finalUserName);
            localStorage.setItem('userRole', '본사 최고관리자'); 
            
            // 대시보드로 즉시 리다이렉트
            navigate('/dashboard', { replace: true }); 
        } else {
            const failMessage = responseData?.message || '로그인에 실패했습니다.';
            setErrorMessage(failMessage);
        }
  
    } catch (error: any) {
        const rawErrData = error.response?.data;
        const cleanErrData = parsePureJson(rawErrData);
        const msg = cleanErrData?.message || '서버와의 통신에 실패했습니다.';
        setErrorMessage(msg);
    }
};
  
  return (
            <div id="loginScreen">
           <form onSubmit={handleLogin} >
            <div className="login-card">
                <div className="brand-mark">
                <div className="brand-leaf">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2C7 6 4 10.5 4 14.5C4 18.6 7.6 22 12 22C16.4 22 20 18.6 20 14.5C20 10.5 17 6 12 2Z" stroke="white" stroke-width="1.8"/></svg>
                </div>
                <div className="login-main-title">본사 통합 관리 시스템</div>
                </div>
                <div className="login-title">본사 계정으로 로그인</div>
                <div className="login-sub">이름과 비밀번호를 입력하세요</div>

                <div className="field-group">
                <label className="field-label" htmlFor="nameInput">이름</label>
                <input type="text" name="userId" id="nameInput" placeholder="예: 이수진 상무" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="field-group">
                <label className="field-label" htmlFor="pwInput">비밀번호</label>
                <input type="password" name="password" id="pwInput" placeholder="비밀번호 입력" value={password} onChange={(e) => setPassword(e.target.value)}/>
                </div>

                <button type="submit" className="login-btn" id="loginBtn">로그인</button>
                {errorMessage && <div className="login-error" id="loginError" style={{ color: 'red', marginTop: '10px', fontSize: '14px' }}>{errorMessage}</div>}
                <div className="login-hint">프로토타입 화면입니다 · 비밀번호는 아무 값이나 입력하세요</div>
            </div>
             </form>
            </div>

    );
}

export default Login; 