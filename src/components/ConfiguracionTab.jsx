import { useState, useEffect } from 'react';
import { Settings, Archive, BarChart3, Users, Save, CheckCircle } from 'lucide-react';
import UploadFoto from './UploadFoto';

const ConfiguracionTab = ({ supabase, products, sales, clients }) => {
  const [config, setConfig] = useState({
    nombre_negocio: '',
    tipo_documento: 'RUC',
    numero_documento: '',
    whatsapp: '',
    direccion: '',
    moneda: 'PEN',
    logo_url: ''
  });
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [configId, setConfigId] = useState(null);
  const [mostrarPlan, setMostrarPlan] = useState(false);

  useEffect(() => {
    cargarConfig();
  }, []);

  const cargarConfig = async () => {
    const { data } = await supabase
      .from('configuracion')
      .select('*')
      .limit(1)
      .single();
    if (data) {
      setConfig(data);
      setConfigId(data.id);
    }
  };

  const guardarConfig = async () => {
    setGuardando(true);
    const { error } = await supabase
      .from('configuracion')
      .update({
        ...config,
        updated_at: new Date().toISOString()
      })
      .eq('id', configId);

    setGuardando(false);
    if (!error) {
      setGuardado(true);
      setTimeout(() => setGuardado(false), 3000);
    }
  };

  return (
    <div className="space-y-6">

      {/* PERFIL DEL NEGOCIO */}
      <div className="bg-white p-6 rounded-2xl shadow-base border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Settings size={20} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Perfil del Negocio</h2>
            <p className="text-gray-500 text-lg">Información de tu empresa</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xl font-medium text-gray-700 mb-1 block">Nombre del Negocio</label>
            <input
              type="text"
              value={config.nombre_negocio || ''}
              onChange={(e) => setConfig({...config, nombre_negocio: e.target.value})}
              placeholder="Ej: Abermud"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-lg focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="text-xl font-medium text-gray-700 mb-1 block">Tipo de Documento</label>
            <div className="flex gap-2">
              <select
                value={config.tipo_documento || 'RUC'}
                onChange={(e) => setConfig({...config, tipo_documento: e.target.value})}
                className="border border-gray-200 rounded-lg px-3 py-2 text-lg focus:outline-none focus:border-blue-400"
              >
                <option value="RUC">RUC</option>
                <option value="DNI">DNI</option>
              </select>
              <input
                type="text"
                value={config.numero_documento || ''}
                onChange={(e) => setConfig({...config, numero_documento: e.target.value})}
                placeholder={config.tipo_documento === 'RUC' ? 'Ej: 20123456789' : 'Ej: 12345678'}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-lg focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xl font-medium text-gray-700 mb-1 block">WhatsApp</label>
            <input
              type="text"
              value={config.whatsapp || ''}
              onChange={(e) => setConfig({...config, whatsapp: e.target.value})}
              placeholder="Ej: +51 999 999 999"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-lg focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="text-xl font-medium text-gray-700 mb-1 block">Dirección</label>
            <input
              type="text"
              value={config.direccion || ''}
              onChange={(e) => setConfig({...config, direccion: e.target.value})}
              placeholder="Ej: Av. Principal 123, Lima"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-lg focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="text-xl font-medium text-gray-700 mb-1 block">País / Moneda</label>
            <select
              value={config.moneda || 'PEN'}
              onChange={(e) => setConfig({...config, moneda: e.target.value})}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-lg focus:outline-none focus:border-blue-400"
            >
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

        <button
          onClick={guardarConfig}
          disabled={guardando}
          className="mt-6 flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {guardado ? (
            <><CheckCircle size={16} /> ¡Guardado!</>
          ) : guardando ? (
            'Guardando...'
          ) : (
            <><Save size={16} /> Guardar Cambios</>
          )}
        </button>
      </div>

      {/* MI PLAN */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Archive size={20} className="text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Mi Plan</h2>
            <p className="text-gray-500 text-lg">Detalles de tu suscripción</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="bg-purple-600 text-white text-xl font-bold px-3 py-1 rounded-full">PLAN BÁSICO</span>
              <p className="text-gray-600 text-base mt-2">Activo hasta: <span className="font-semibold text-gray-800">31/12/2025</span></p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-purple-600">S/ 30</p>
              <p className="text-sm text-gray-500">/mes</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-base text-gray-600">
  <p>✅ Inventario completo</p>
  <p>✅ Registro de ventas</p>
  <p>✅ Backup de datos</p>
  <p>✅ Soporte básico</p>
  <p>❌ Múltiples usuarios</p>
  <p>❌ Logo personalizado</p>
</div>

<button
  onClick={() => setMostrarPlan(true)}
  className="mt-4 w-full bg-purple-600 text-white py-2 rounded-lg text-base font-medium hover:bg-purple-700 transition-colors"
>
  ⬆️ Mejorar Plan
</button>

{mostrarPlan && (
  <div className="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
    <p className="text-2xl mb-2">🚀</p>
    <p className="font-bold text-purple-800 text-base">¡Próximamente Plan Pro!</p>
    <p className="text-purple-600 text-sm mt-1">Estamos preparando algo increíble para ti.</p>
    <p className="text-purple-600 text-sm">Te avisamos muy pronto 🎉</p>
  </div>
)}

        </div>
      </div>

      {/* ESTADÍSTICAS */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <BarChart3 size={20} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Estadísticas del Sistema</h2>
            <p className="text-gray-500 text-lg">Resumen de uso</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{products?.length || 0}</p>
            <p className="text-base text-gray-500 mt-1">Productos</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{sales?.length || 0}</p>
            <p className="text-base text-gray-500 mt-1">Ventas</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{clients?.length || 0}</p>
            <p className="text-base text-gray-500 mt-1">Clientes</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">v1.0</p>
            <p className="text-base text-gray-500 mt-1">Versión</p>
          </div>
        </div>
      </div>

      {/* SOPORTE */}
<div className="bg-white p-6 rounded-xl shadow-sm border">
  <div className="flex items-center gap-3 mb-6">
    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
      <Users size={20} className="text-orange-600" />
    </div>
    <div>
      <h2 className="text-2xl font-bold">Soporte</h2>
      <p className="text-gray-500 text-lg">¿Necesitas ayuda?</p>
    </div>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    
      <a href="https://wa.me/51984933573"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 border border-green-200 rounded-xl p-4 hover:bg-green-50 transition-colors"
    >
      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-xl">💬</div>
      <div>
        <p className="font-semibold text-lg">WhatsApp</p>
        <p className="text-base text-gray-500">Respuesta rápida</p>
      </div>
    </a>
    
      <a href="mailto:qhapaqsystem@gmail.com"
      className="flex items-center gap-3 border border-blue-200 rounded-xl p-4 hover:bg-blue-50 transition-colors"
    >
      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">📧</div>
      <div>
        <p className="font-semibold text-lg">Email</p>
        <p className="text-base text-gray-500">qhapaqsystem@gmail.com</p>
      </div>
    </a>
    
      <a href="https://wa.me/51984933573?text=Hola%20Qhapaq%2C%20tengo%20un%20problema%20con%20el%20sistema%3A%20"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 border border-red-200 rounded-xl p-4 hover:bg-red-50 transition-colors"
    >
      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-xl">🐛</div>
      <div className="text-left">
        <p className="font-semibold text-lg">Reportar Problema</p>
        <p className="text-base text-gray-500">Te atendemos por WhatsApp</p>
      </div>
    </a>
  </div>
</div>

    </div>
  );
};

export default ConfiguracionTab;