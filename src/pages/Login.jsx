import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseConfig';
import logoAbermud from '../logo_Abermud.jpg';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setError('Email o contraseña incorrectos');
      setLoading(false);
      return;
    }

    navigate('/');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border p-8 w-full max-w-sm">

        {/* LOGO */}
        <div className="text-center mb-8">
          <img
            src={logoAbermud}
            alt="Abermud"
            className="w-60 h-60 object-contain mx-auto mb-3"
          />
          <h1 className="text-4xl font-bold text-gray-900">Abermud</h1>
          <p className="text-base text-gray-400 mt-1 tracking-widest">QHAPAQ</p>
        </div>

        {/* FORM */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-2xl font-medium text-gray-700 mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-4 text-xl focus:outline-none focus:border-gray-400"
            />
          </div>

          <div>
            <label className="text-2xl font-medium text-gray-700 mb-1 block">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-4 text-xl focus:outline-none focus:border-gray-400 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 text-base text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-xl font-medium text-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center text-base text-gray-300 mt-6 tracking-widest">
          Powered by QHAPAQ
        </p>
      </div>
    </div>
  );
};

export default Login;
