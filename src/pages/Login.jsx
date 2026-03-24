import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseConfig';
import logoQhapaq from '../logo_Qhapaq_login.png';

const Login = () => {
  const navigate = useNavigate();
  const [usuario,      setUsuario]      = useState('');
  const [password,     setPassword]     = useState('');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Recuperar contraseña
  const [showRecuperar,    setShowRecuperar]    = useState(false);
  const [emailRecuperar,   setEmailRecuperar]   = useState('');
  const [recuperarMsg,     setRecuperarMsg]     = useState(null);
  const [loadingRecuperar, setLoadingRecuperar] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Buscar email por nombre de usuario
    const { data: usuarioApp, error: buscarError } = await supabase
      .from('usuarios_app')
      .select('email, activo')
      .eq('nombre', usuario.trim())
      .single();

    if (buscarError || !usuarioApp) {
      setError('Usuario no encontrado');
      setLoading(false);
      return;
    }

    if (!usuarioApp.activo) {
      setError('Usuario desactivado. Contacta al administrador.');
      setLoading(false);
      return;
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: usuarioApp.email,
      password
    });

    if (loginError) {
      setError('Contraseña incorrecta');
      setLoading(false);
      return;
    }

    navigate('/');
    setLoading(false);
  };

  const handleRecuperar = async (e) => {
    e.preventDefault();
    setLoadingRecuperar(true);
    setRecuperarMsg(null);

    const { error } = await supabase.auth.resetPasswordForEmail(emailRecuperar, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoadingRecuperar(false);
    if (error) {
      setRecuperarMsg({ tipo: 'error', texto: 'No se pudo enviar el correo. Verifica el email.' });
    } else {
      setRecuperarMsg({ tipo: 'ok', texto: '✅ Revisa tu correo — te enviamos el enlace de recuperación.' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{backgroundColor: '#F3F4F6'}}>
      <div className="bg-white rounded-2xl shadow-sm border p-8 w-full max-w-md">

        {/* LOGO */}
        <div className="text-center mb-8">
          <img src={logoQhapaq} alt="Qhapaq" className="w-90 h-90
          object-contain mx-auto mb-3" />
        </div>

        {/* ── FORMULARIO LOGIN ── */}
        {!showRecuperar ? (
          <>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-2xl font-semibold text-gray-700 mb-1 block">Usuario</label>
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="Ej: Admin, Vendedor 1"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-4 text-xl focus:outline-none focus:border-gray-400"
                />
              </div>

              <div>
                <label className="text-2xl font-semibold text-gray-700 mb-1 block">Contraseña</label>
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
                className="w-full bg-blue-900 text-white py-4 rounded-xl font-medium text-2xl hover:bg-blue-800 transition-colors disabled:opacity-50"
              >
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>

            <button
              onClick={() => { setShowRecuperar(true); setError(''); }}
              className="w-full text-center text-xl text-gray-400 hover:text-gray-600 mt-4 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </>
        ) : (
          <>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800">Recuperar contraseña</h2>
              <p className="text-base text-gray-500 mt-1">Ingresa tu email y te enviaremos un enlace para restablecerla.</p>
            </div>

            <form onSubmit={handleRecuperar} className="space-y-4">
              <div>
                <label className="text-2xl font-semibold text-gray-700 mb-1 block">Email</label>
                <input
                  type="email"
                  value={emailRecuperar}
                  onChange={(e) => setEmailRecuperar(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-gray-400"
                />
              </div>

              {recuperarMsg && (
                <div className={`rounded-xl p-3 border ${recuperarMsg.tipo === 'ok' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <p className={`text-sm text-center ${recuperarMsg.tipo === 'ok' ? 'text-green-700' : 'text-red-600'}`}>{recuperarMsg.texto}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loadingRecuperar}
                className="w-full bg-blue-900 text-white py-3 rounded-xl font-medium text-xl hover:bg-blue-800 transition-colors disabled:opacity-50"
              >
                {loadingRecuperar ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </button>
            </form>

            <button
              onClick={() => { setShowRecuperar(false); setRecuperarMsg(null); setEmailRecuperar(''); }}
              className="w-full text-center text-xl text-gray-400 hover:text-gray-600 mt-4 transition-colors"
            >
              ← Volver al login
            </button>
          </>
        )}

        <p className="text-center text-lg text-gray-300 mt-6 tracking-widest">Powered by QHAPAQ</p>
      </div>
    </div>
  );
};

export default Login;