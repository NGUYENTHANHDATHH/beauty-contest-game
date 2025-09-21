
import React, { useState } from 'react';

interface LoginProps {
  onLogin: (name: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name.trim());
    }
  };

  return (
    <div className="min-h-screen bg-kod-bg flex items-center justify-center text-center p-4 animate-fade-in">
      <div className="w-full max-w-md">
        <h1 className="text-5xl lg:text-7xl font-bold text-kod-cyan mb-8">King of Diamonds</h1>
        <form onSubmit={handleSubmit} className="bg-kod-gray p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-kod-text">Enter Your Name</h2>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
            maxLength={20}
            className="w-full bg-kod-light-gray text-kod-text p-4 rounded text-lg text-center focus:outline-none focus:ring-2 focus:ring-kod-cyan mb-6"
            required
          />
          <button
            type="submit"
            className="bg-kod-cyan text-black font-bold py-3 px-10 rounded text-xl w-full hover:bg-white hover:shadow-cyan-glow transition-all duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
            disabled={!name.trim()}
          >
            Enter Game
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
