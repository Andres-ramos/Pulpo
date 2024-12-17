import React, { useState } from 'react';
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";


function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e:any) => {
    e.preventDefault();
    
    await login({ username });
    navigate("/graph")
  };

  return (
    <div className='login'>
      <form className="form" onSubmit={handleSubmit}>
        <label className='label'>
          Username:
          <input className="input" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label className='label'>
          Password:
          <input className="input" type="password" value={password}  
          onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button className="button" type="submit">Login</button>
      </form>
    </div>
    
  );
}

export default Login;