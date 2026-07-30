
import './App.css'; 
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
<link rel="stylesheet" as="style" 
  href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css" />
export const Login: React.FC = () => {


   
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
       
        const response = await axios.post('http://info7qni.dothome.co.kr/login.php', {
            userId: name, 
            password: password,
        });
    
         if (response.data && response.data.success === true) {
            console.log("서버로부터 받은 응답 전체:", response); 
            navigate('/dashboard'); 
         }else{
            setErrorMessage(response.data.message || '로그인에 실패했습니다.');
             console.log("서버로부터 받은 응답 전체:", response); 
         }
      
        } catch (error: any) {
  
        const msg = error.response?.data?.message || '서버와의 통신에 실패했습니다.';
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