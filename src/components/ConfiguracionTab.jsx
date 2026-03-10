import { useState, useEffect } from 'react';
import {
  Settings, Archive, BarChart3, Users, Save, CheckCircle,
  Eye, EyeOff, Lock, UserPlus, Trash2, ShieldCheck, KeyRound, LogOut
} from 'lucide-react';

const ConfiguracionTab = ({ supabase, products, sales, clients }) => {

  // ── Perfil del negocio ────────────────────────────────────────
  const [config,      setConfig]      = useState({ nombre_negocio: '', tipo_documento: 'RUC', numero_documento: '', whatsapp: '', direccion: '', moneda: 'PEN', pin_admin: '1111' });
  const [guardando,   setGuardando]   = useState(false);
  const [guardado,    setGuardado]    = useState(false);
  const [configId,    setConfigId]    = useState(null);
  const [mostrarPlan, setMostrarPlan] = useState(false);

  // ── PIN ───────────────────────────────────────────────────────
  const [showPinSection, setShowPinSection] = useState(false);
  const [pinActual,      setPinActual]      = useState('');
  const [pinNuevo,       setPinNuevo]       = useState('');
  const [pinConfirm,     setPinConfirm]     = useState('');
  const [showPinActual,  setShowPinActual]  = useState(false);
  const [showPinNuevo,   setShowPinNuevo]   = useState(false);
  const [pinMsg,         setPinMsg]         = useState(null);
  const [showOlvidePIN,  setShowOlvidePIN]  = useState(false);

  // ── Cambiar contraseña propia ─────────────────────────────────
  const [showPwdSection, setShowPwdSection] = useState(false);
  const [pwdNuevo,       setPwdNuevo]       = useState('');
  const [pwdConfirm,     setPwdConfirm]     = useState('');
  const [showPwdNuevo,   setShowPwdNuevo]   = useState(false);
  const [pwdMsg,         setPwdMsg]         = useState(null);

  // ── Usuarios ──────────────────────────────────────────────────
  const [usuarios,     setUsuarios]     = useState([]);
  const [showAddUser,  setShowAddUser]  = useState(false);
  const [nuevoUser,    setNuevoUser]    = useState({ email: '', password: '', rol: 'vendedor' });
  const [showNewPwd,   setShowNewPwd]   = useState(false);
  const [userMsg,      setUserMsg]      = useState(null);
  const [loadingUser,  setLoadingUser]  = useState(false);
  const [resetPwdUser, setResetPwdUser] = useState(null);
  const [resetMsg,     setResetMsg]     = useState(null);

  // ── Sesión ────────────────────────────────────────────────────
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    cargarConfig();
    cargarUsuarios();
    supabase.auth.getUser().then(({ data }) => setUserEmail(data?.user?.email || ''));
  }, []);

  const cargarConfig = async () => {
    const { data } = await supabase.from('configuracion').select('*').limit(1).single();
    if (data) { setConfig(data); setConfigId(data.id); }
  };

  const guardarConfig = async () => {
    setGuardando(true);
    const { error } = await supabase.from('configuracion').update({ ...config, updated_at: new Date().toISOString() }).eq('id', configId);
    setGuardando(false);
    if (!error) { setGuardado(true); setTimeout(() => setGuardado(false), 3000); }
  };

  const cargarUsuarios = async () => {
    const { data } = await supabase.from('usuarios_app').select('*').order('created_at', { ascending: true });
    if (data) setUsuarios(data);
  };

  const cambiarPin = async () => {
    setPinMsg(null);
    if (pinActual !== config.pin_admin) { setPinMsg({ tipo: 'error', texto: 'El PIN actual es incorrecto.' }); return; }
    if (pinNuevo.length < 4)            { setPinMsg({ tipo: 'error', texto: 'El PIN debe tener al menos 4 dígitos.' }); return; }
    if (pinNuevo !== pinConfirm)        { setPinMsg({ tipo: 'error', texto: 'Los PINs nuevos no coinciden.' }); return; }
    const { error } = await supabase.from('configuracion').update({ pin_admin: pinNuevo, updated_at: new Date().toISOString() }).eq('id', configId);
    if (!error) {
      setConfig({ ...config, pin_admin: pinNuevo });
      setPinActual(''); setPinNuevo(''); setPinConfirm('');
      setPinMsg({ tipo: 'ok', texto: '✅ PIN actualizado correctamente.' });
      setTimeout(() => { setPinMsg(null); setShowPinSection(false); }, 2500);
    } else {
      setPinMsg({ tipo: 'error', texto: 'Error al guardar. Intenta de nuevo.' });
    }
  };

  const cambiarPassword = async () => {
    setPwdMsg(null);
    if (pwdNuevo.length < 6)     { setPwdMsg({ tipo: 'error', texto: 'Mínimo 6 caracteres.' }); return; }
    if (pwdNuevo !== pwdConfirm) { setPwdMsg({ tipo: 'error', texto: 'Las contraseñas no coinciden.' }); return; }
    const { error } = await supabase.auth.updateUser({ password: pwdNuevo });
    if (!error) {
      setPwdNuevo(''); setPwdConfirm('');
      setPwdMsg({ tipo: 'ok', texto: '✅ Contraseña actualizada correctamente.' });
      setTimeout(() => { setPwdMsg(null); setShowPwdSection(false); }, 3000);
    } else {
      setPwdMsg({ tipo: 'error', texto: error.message });
    }
  };

  const crearUsuario = async () => {
    setUserMsg(null);
    if (usuarios.filter(u => u.activo).length >= 2) { setUserMsg({ tipo: 'error', texto: 'Límite de 2 usuarios activos alcanzado.' }); return; }
    if (!nuevoUser.email || !nuevoUser.password)     { setUserMsg({ tipo: 'error', texto: 'Email y contraseña son obligatorios.' }); return; }
    if (nuevoUser.password.length < 6)               { setUserMsg({ tipo: 'error', texto: 'Mínimo 6 caracteres en la contraseña.' }); return; }
    setLoadingUser(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email: nuevoUser.email, password: nuevoUser.password });
      if (authError) throw new Error(authError.message);
      const { error: dbError } = await supabase.from('usuarios_app').insert({ auth_id: authData.user?.id, email: nuevoUser.email, rol: nuevoUser.rol, activo: true, created_at: new Date().toISOString() });
      if (dbError) throw new Error(dbError.message);
      setNuevoUser({ email: '', password: '', rol: 'vendedor' }); setShowAddUser(false);
      setUserMsg({ tipo: 'ok', texto: '✅ Usuario creado. Recibirá un email de confirmación.' });
      await cargarUsuarios();
      setTimeout(() => setUserMsg(null), 4000);
    } catch (err) { setUserMsg({ tipo: 'error', texto: err.message }); }
    setLoadingUser(false);
  };

  const enviarRecuperacion = async (usuario) => {
    setResetMsg(null);
    const { error } = await supabase.auth.resetPasswordForEmail(usuario.email, { redirectTo: `${window.location.origin}/reset-password` });
    if (!error) {
      setResetMsg({ tipo: 'ok', texto: `✅ Email enviado a ${usuario.email}` });
      setTimeout(() => { setResetMsg(null); setResetPwdUser(null); }, 3500);
    } else {
      setResetMsg({ tipo: 'error', texto: error.message });
    }
  };

  const desactivarUsuario = async (userId) => {
    const pin = prompt('Ingresa tu PIN de administrador:');
    if (pin !== config.pin_admin) { alert('PIN incorrecto.'); return; }
    await supabase.from('usuarios_app').update({ activo: false }).eq('id', userId);
    await cargarUsuarios();
  };

  const cerrarSesion = async () => {
    if (!confirm('¿Cerrar sesión?')) return;
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const ROL_BADGE = {
    admin:    { label: 'Administrador', bg: 'bg-black text-white' },
    vendedor: { label: 'Vendedor',      bg: 'bg-gray-200 text-gray-700' },
  };
  const msgStyle = (tipo) => tipo === 'ok' ? 'text-green-600' : 'text-red-600';

  return (
    <div className="space-y-6">

      {/* ── SESIÓN ACTIVA ──────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center text-white font-bold text-sm">
            {userEmail?.[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <p className="font-semibold text-base text-gray-800">{userEmail}</p>
            <p className="text-xs text-green-600 font-medium">● Sesión activa</p>
          </div>
        </div>
        <button onClick={cerrarSesion}
          className="flex items-center gap-2 border border-red-200 text-red-500 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
          <LogOut size={15} /> Cerrar sesión
        </button>
      </div>

      {/* ── PERFIL DEL NEGOCIO ─────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"><Settings size={20} className="text-blue-600" /></div>
          <div><h2 className="text-2xl font-bold">Perfil del Negocio</h2><p className="text-gray-500 text-base">Información de tu empresa</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-base font-medium text-gray-700 mb-1 block">Nombre del Negocio</label>
            <input type="text" value={config.nombre_negocio || ''} onChange={(e) => setConfig({ ...config, nombre_negocio: e.target.value })} placeholder="Ej: Abermud" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-base font-medium text-gray-700 mb-1 block">Tipo de Documento</label>
            <div className="flex gap-2">
              <select value={config.tipo_documento || 'RUC'} onChange={(e) => setConfig({ ...config, tipo_documento: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:border-blue-400">
                <option value="RUC">RUC</option><option value="DNI">DNI</option>
              </select>
              <input type="text" value={config.numero_documento || ''} onChange={(e) => setConfig({ ...config, numero_documento: e.target.value })} placeholder={config.tipo_documento === 'RUC' ? '20123456789' : '12345678'} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:border-blue-400" />
            </div>
          </div>
          <div>
            <label className="text-base font-medium text-gray-700 mb-1 block">WhatsApp</label>
            <input type="text" value={config.whatsapp || ''} onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })} placeholder="+51 999 999 999" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-base font-medium text-gray-700 mb-1 block">Dirección</label>
            <input type="text" value={config.direccion || ''} onChange={(e) => setConfig({ ...config, direccion: e.target.value })} placeholder="Av. Principal 123, Lima" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-base font-medium text-gray-700 mb-1 block">País / Moneda</label>
            <select value={config.moneda || 'PEN'} onChange={(e) => setConfig({ ...config, moneda: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:border-blue-400">
              <option value="PEN">🇵🇪 Perú — S/ Sol</option>
              <option value="USD">🇺🇸 USA — $ Dólar</option>
              <option value="COP">🇨🇴 Colombia — $ Peso</option>
              <option value="ARS">🇦🇷 Argentina — $ Peso</option>
              <option value="MXN">🇲🇽 México — $ Peso</option>
              <option value="BOB">🇧🇴 Bolivia — Bs Boliviano</option>
              <option value="CLP">🇨🇱 Chile — $ Peso</option>
            </select>
          </div>
        </div>
        <button onClick={guardarConfig} disabled={guardando} className="mt-6 flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg text-base font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
          {guardado ? <><CheckCircle size={16} /> ¡Guardado!</> : guardando ? 'Guardando...' : <><Save size={16} /> Guardar Cambios</>}
        </button>
      </div>

      {/* ── MI CONTRASEÑA ──────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"><KeyRound size={20} className="text-blue-600" /></div>
            <div><h2 className="text-2xl font-bold">Mi Contraseña</h2><p className="text-gray-500 text-base">Contraseña para ingresar al sistema</p></div>
          </div>
          <button onClick={() => { setShowPwdSection(!showPwdSection); setPwdMsg(null); }} className="text-sm text-blue-600 hover:underline font-medium">
            {showPwdSection ? 'Cancelar' : 'Cambiar contraseña'}
          </button>
        </div>
        {showPwdSection && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Nueva contraseña</label>
                <div className="relative">
                  <input type={showPwdNuevo ? 'text' : 'password'} value={pwdNuevo} onChange={(e) => setPwdNuevo(e.target.value)} placeholder="Mínimo 6 caracteres" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:border-blue-400 pr-10" />
                  <button type="button" onClick={() => setShowPwdNuevo(!showPwdNuevo)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPwdNuevo ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Confirmar contraseña</label>
                <input type="password" value={pwdConfirm} onChange={(e) => setPwdConfirm(e.target.value)} placeholder="Repite la contraseña" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:border-blue-400" />
              </div>
            </div>
            {pwdMsg && <p className={`text-sm font-medium ${msgStyle(pwdMsg.tipo)}`}>{pwdMsg.texto}</p>}
            <button onClick={cambiarPassword} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-base font-medium hover:bg-blue-700 transition-colors">
              <KeyRound size={15} /> Actualizar contraseña
            </button>
          </div>
        )}
      </div>

      {/* ── PIN DE ADMINISTRADOR ───────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center"><Lock size={20} className="text-yellow-600" /></div>
            <div><h2 className="text-2xl font-bold">PIN de Administrador</h2><p className="text-gray-500 text-base">Protege acciones críticas: eliminar ventas, liquidar stock</p></div>
          </div>
          <button onClick={() => { setShowPinSection(!showPinSection); setPinMsg(null); setShowOlvidePIN(false); }} className="text-sm text-blue-600 hover:underline font-medium">
            {showPinSection ? 'Cancelar' : 'Cambiar PIN'}
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2 w-fit">
          <ShieldCheck size={16} className="text-green-600" />
          <span className="text-base font-mono text-gray-600">PIN: {'●'.repeat(config.pin_admin?.length || 4)}</span>
        </div>
        {showPinSection && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">PIN actual</label>
              <div className="relative w-48">
                <input type={showPinActual ? 'text' : 'password'} value={pinActual} onChange={(e) => setPinActual(e.target.value)} maxLength={8} placeholder="••••" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-base font-mono focus:outline-none focus:border-yellow-400 pr-10" />
                <button type="button" onClick={() => setShowPinActual(!showPinActual)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPinActual ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Nuevo PIN</label>
                <div className="relative">
                  <input type={showPinNuevo ? 'text' : 'password'} value={pinNuevo} onChange={(e) => setPinNuevo(e.target.value.replace(/\D/g, ''))} maxLength={8} placeholder="Mínimo 4 dígitos" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-base font-mono focus:outline-none focus:border-yellow-400 pr-10" />
                  <button type="button" onClick={() => setShowPinNuevo(!showPinNuevo)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPinNuevo ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Confirmar nuevo PIN</label>
                <input type="password" value={pinConfirm} onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))} maxLength={8} placeholder="Repite el PIN" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-base font-mono focus:outline-none focus:border-yellow-400" />
              </div>
            </div>
            {pinMsg && <p className={`text-sm font-medium ${msgStyle(pinMsg.tipo)}`}>{pinMsg.texto}</p>}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <button onClick={cambiarPin} className="flex items-center gap-2 bg-yellow-500 text-white px-5 py-2 rounded-lg text-base font-medium hover:bg-yellow-600 transition-colors">
                <Lock size={15} /> Actualizar PIN
              </button>
              <button onClick={() => setShowOlvidePIN(!showOlvidePIN)} className="text-sm text-gray-400 hover:text-gray-600 underline">
                ¿Olvidé mi PIN?
              </button>
            </div>
            {showOlvidePIN && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl">🔐</span>
                  <div>
                    <p className="font-bold text-orange-800 text-base">¿Olvidaste tu PIN?</p>
                    <p className="text-orange-700 text-sm mt-1">Tu asesor puede restablecerlo directamente. Contáctate por WhatsApp y en minutos lo resolvemos.</p>
                    <a href="https://wa.me/51984933573?text=Hola%2C%20olvid%C3%A9%20mi%20PIN%20de%20administrador%20en%20Abermud" target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-3 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
                      💬 Contactar a mi asesor
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── USUARIOS ───────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center"><Users size={20} className="text-indigo-600" /></div>
            <div><h2 className="text-2xl font-bold">Usuarios</h2><p className="text-gray-500 text-base">Máximo 2 usuarios en tu plan actual</p></div>
          </div>
          {usuarios.filter(u => u.activo).length < 2 && (
            <button onClick={() => { setShowAddUser(!showAddUser); setUserMsg(null); }} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              <UserPlus size={15} /> Agregar usuario
            </button>
          )}
        </div>

        <div className="space-y-3 mb-4">
          {usuarios.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No hay usuarios registrados aún.</p>}
          {usuarios.map((u) => {
            const badge = ROL_BADGE[u.rol] || ROL_BADGE.vendedor;
            return (
              <div key={u.id} className={`p-4 rounded-xl border ${u.activo ? 'bg-gray-50 border-gray-200' : 'bg-red-50 border-red-200 opacity-60'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 text-sm">{u.email?.[0]?.toUpperCase() || '?'}</div>
                    <div>
                      <p className="font-medium text-base">{u.email}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.bg}`}>{badge.label}</span>
                        {!u.activo && <span className="text-xs text-red-500 font-medium">Desactivado</span>}
                      </div>
                    </div>
                  </div>
                  {u.activo && (
                    <div className="flex items-center gap-2">
                      {u.rol === 'vendedor' && (
                        <button onClick={() => { setResetPwdUser(resetPwdUser?.id === u.id ? null : u); setResetMsg(null); }} title="Enviar recuperación de contraseña"
                          className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <KeyRound size={15} />
                        </button>
                      )}
                      {u.rol !== 'admin' && (
                        <button onClick={() => desactivarUsuario(u.id)} title="Desactivar usuario"
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {/* Panel recuperar contraseña vendedora */}
                {resetPwdUser?.id === u.id && (
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                    <p className="text-sm font-medium text-blue-800">Recuperación de contraseña</p>
                    <p className="text-xs text-blue-600">Se enviará un email a <strong>{u.email}</strong> con el enlace para crear una nueva contraseña.</p>
                    {resetMsg && <p className={`text-sm font-medium ${msgStyle(resetMsg.tipo)}`}>{resetMsg.texto}</p>}
                    <div className="flex gap-2">
                      <button onClick={() => enviarRecuperacion(u)} className="flex items-center gap-1 bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                        <KeyRound size={13} /> Enviar email de recuperación
                      </button>
                      <button onClick={() => { setResetPwdUser(null); setResetMsg(null); }} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50">Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {userMsg && <p className={`text-sm font-medium mb-3 ${msgStyle(userMsg.tipo)}`}>{userMsg.texto}</p>}

        {showAddUser && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
            <p className="font-semibold text-indigo-800 text-base">Nuevo usuario</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
                <input type="email" value={nuevoUser.email} onChange={(e) => setNuevoUser({ ...nuevoUser, email: e.target.value })} placeholder="correo@ejemplo.com" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Rol</label>
                <select value={nuevoUser.rol} onChange={(e) => setNuevoUser({ ...nuevoUser, rol: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:border-indigo-400">
                  <option value="vendedor">Vendedor — acceso básico</option>
                  <option value="admin">Administrador — acceso completo</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Contraseña inicial</label>
              <div className="relative w-full sm:w-72">
                <input type={showNewPwd ? 'text' : 'password'} value={nuevoUser.password} onChange={(e) => setNuevoUser({ ...nuevoUser, password: e.target.value })} placeholder="Mínimo 6 caracteres" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:border-indigo-400 pr-10" />
                <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                  {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={crearUsuario} disabled={loadingUser} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-lg text-base font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
                <UserPlus size={15} /> {loadingUser ? 'Creando...' : 'Crear usuario'}
              </button>
              <button onClick={() => { setShowAddUser(false); setNuevoUser({ email: '', password: '', rol: 'vendedor' }); }} className="px-4 py-2 border border-gray-200 rounded-lg text-base text-gray-600 hover:bg-gray-50">Cancelar</button>
            </div>
          </div>
        )}

        {usuarios.filter(u => u.activo).length >= 2 && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🚀</span>
              <div className="flex-1">
                <p className="font-bold text-purple-800 text-base">¿Necesitas más usuarios?</p>
                <p className="text-purple-700 text-sm mt-1">Tu plan incluye <strong>2 usuarios</strong>. Para agregar más, pasa al <strong>Plan Pro</strong> o contacta a tu asesor.</p>
                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  <a href="https://wa.me/51984933573?text=Hola%2C%20quiero%20agregar%20m%C3%A1s%20usuarios%20a%20mi%20plan" target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
                    💬 Contactar a mi asesor
                  </a>
                  <button onClick={() => setMostrarPlan(true)} className="flex items-center justify-center gap-2 border border-purple-300 text-purple-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors">
                    ⬆️ Ver Plan Pro
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MI PLAN ────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center"><Archive size={20} className="text-purple-600" /></div>
          <div><h2 className="text-2xl font-bold">Mi Plan</h2><p className="text-gray-500 text-base">Detalles de tu suscripción</p></div>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="bg-purple-600 text-white text-base font-bold px-3 py-1 rounded-full">PLAN BÁSICO</span>
              <p className="text-gray-600 text-sm mt-2">Activo hasta: <span className="font-semibold">31/12/2025</span></p>
            </div>
            <div className="text-right"><p className="text-3xl font-bold text-purple-600">S/ 30</p><p className="text-sm text-gray-500">/mes</p></div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <p>✅ Inventario completo</p><p>✅ Registro de ventas</p>
            <p>✅ Backup de datos</p><p>✅ 2 usuarios incluidos</p>
            <p>✅ PIN de administrador</p><p>✅ Soporte WhatsApp</p>
          </div>
          <button onClick={() => setMostrarPlan(true)} className="mt-4 w-full bg-purple-600 text-white py-2 rounded-lg text-base font-medium hover:bg-purple-700 transition-colors">⬆️ Mejorar Plan</button>
          {mostrarPlan && (
            <div className="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
              <p className="text-2xl mb-2">🚀</p>
              <p className="font-bold text-purple-800 text-base">¡Próximamente Plan Pro!</p>
              <p className="text-purple-600 text-sm mt-1">Estamos preparando algo increíble. Te avisamos muy pronto 🎉</p>
            </div>
          )}
        </div>
      </div>

      {/* ── ESTADÍSTICAS ───────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center"><BarChart3 size={20} className="text-green-600" /></div>
          <div><h2 className="text-2xl font-bold">Estadísticas del Sistema</h2><p className="text-gray-500 text-base">Resumen de uso</p></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-blue-600">{products?.length || 0}</p><p className="text-sm text-gray-500 mt-1">Productos</p></div>
          <div className="bg-gray-50 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-green-600">{sales?.length || 0}</p><p className="text-sm text-gray-500 mt-1">Ventas</p></div>
          <div className="bg-gray-50 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-purple-600">{clients?.length || 0}</p><p className="text-sm text-gray-500 mt-1">Clientes</p></div>
          <div className="bg-gray-50 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-orange-600">{usuarios.filter(u => u.activo).length}/2</p><p className="text-sm text-gray-500 mt-1">Usuarios</p></div>
        </div>
      </div>

      {/* ── SOPORTE ────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center"><Users size={20} className="text-orange-600" /></div>
          <div><h2 className="text-2xl font-bold">Soporte</h2><p className="text-gray-500 text-base">¿Necesitas ayuda?</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="https://wa.me/51984933573" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 border border-green-200 rounded-xl p-4 hover:bg-green-50 transition-colors">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">💬</div>
            <div><p className="font-semibold text-base">WhatsApp</p><p className="text-sm text-gray-500">Respuesta rápida</p></div>
          </a>
          <a href="mailto:qhapaqsystem@gmail.com" className="flex items-center gap-3 border border-blue-200 rounded-xl p-4 hover:bg-blue-50 transition-colors">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">📧</div>
            <div><p className="font-semibold text-base">Email</p><p className="text-sm text-gray-500">qhapaqsystem@gmail.com</p></div>
          </a>
          <a href="https://wa.me/51984933573?text=Hola%20Qhapaq%2C%20tengo%20un%20problema%3A%20" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 border border-red-200 rounded-xl p-4 hover:bg-red-50 transition-colors">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-xl">🐛</div>
            <div><p className="font-semibold text-base">Reportar Problema</p><p className="text-sm text-gray-500">Te atendemos por WhatsApp</p></div>
          </a>
        </div>
      </div>

    </div>
  );
};

export default ConfiguracionTab;
