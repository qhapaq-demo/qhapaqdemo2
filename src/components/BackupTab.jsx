import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Download, FileText, Package, Users, BarChart3, DollarSign } from 'lucide-react';

const BackupTab = ({ supabase }) => {
  const [descargando, setDescargando] = useState(false);
  const [progreso, setProgreso] = useState('');

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-PE');
  };

  const getNombreArchivo = () => {
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0');
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const anio = hoy.getFullYear();
    return `backup_abermud_${dia}-${mes}-${anio}.xlsx`;
  };

  const generarBackup = async () => {
    setDescargando(true);
    try {
      const wb = XLSX.utils.book_new();

      // ===== HOJA 1: VENTAS =====
      setProgreso('Cargando ventas...');
      const { data: ventas } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });

      const ventasData = (ventas || []).map(v => ({
        'Fecha': formatFecha(v.created_at),
        'Cliente': v.client_name || 'Sin nombre',
        'Producto': v.product_name || '',
        'Color': v.color || '',
        'Talla': v.size || '',
        'Cantidad': v.quantity || 0,
        'Precio Unit.': v.unit_price || 0,
        'Total': v.total || 0,
        'Método Pago': v.payment_method || '',
      }));
      const wsVentas = XLSX.utils.json_to_sheet(ventasData.length > 0 ? ventasData : [{ 'Sin datos': '' }]);
      XLSX.utils.book_append_sheet(wb, wsVentas, 'Ventas');

      // ===== HOJA 2: PRODUCTOS =====
      setProgreso('Cargando productos...');
      const { data: productos } = await supabase
        .from('products')
        .select('*')
        .order('name');

      const productosData = (productos || []).map(p => ({
        'Nombre': p.name || '',
        'Categoría': p.category || '',
        'Precio': p.price || 0,
        'Stock Total': p.stock || 0,
        'Activo': p.active ? 'Sí' : 'No',
        'Fecha Registro': formatFecha(p.created_at),
      }));
      const wsProductos = XLSX.utils.json_to_sheet(productosData.length > 0 ? productosData : [{ 'Sin datos': '' }]);
      XLSX.utils.book_append_sheet(wb, wsProductos, 'Productos');

      // ===== HOJA 3: MOVIMIENTOS DE STOCK =====
      setProgreso('Cargando movimientos de stock...');
      const { data: movimientos } = await supabase
        .from('stock_transactions')
        .select('*')
        .order('fecha', { ascending: false });

      const movData = (movimientos || []).map(m => ({
        'Fecha': formatFecha(m.fecha),
        'Producto': m.product_name || '',
        'Color': m.color || '',
        'Talla': m.size || '',
        'Tipo': m.type || '',
        'Cantidad': m.quantity || 0,
        'Notas': m.notes || '',
      }));
      const wsMovimientos = XLSX.utils.json_to_sheet(movData.length > 0 ? movData : [{ 'Sin datos': '' }]);
      XLSX.utils.book_append_sheet(wb, wsMovimientos, 'Movimientos Stock');

      // ===== HOJA 4: CLIENTES =====
      setProgreso('Cargando clientes...');
      const { data: clientes } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      const clientesData = (clientes || []).map(c => ({
        'Nombre': c.name || '',
        'Teléfono': c.phone || '',
        'Email': c.email || '',
        'Total Compras': c.total_purchases || 0,
        'Fecha Registro': formatFecha(c.created_at),
      }));
      const wsClientes = XLSX.utils.json_to_sheet(clientesData.length > 0 ? clientesData : [{ 'Sin datos': '' }]);
      XLSX.utils.book_append_sheet(wb, wsClientes, 'Clientes');

      // ===== HOJA 5: ANÁLISIS =====
      setProgreso('Generando análisis...');

      // Productos más vendidos
      const productosVentas = {};
      (ventas || []).forEach(v => {
        const key = v.product_name || 'Sin nombre';
        if (!productosVentas[key]) productosVentas[key] = { cantidad: 0, total: 0 };
        productosVentas[key].cantidad += v.quantity || 0;
        productosVentas[key].total += v.total || 0;
      });

      const analisisData = Object.entries(productosVentas)
        .sort((a, b) => b[1].cantidad - a[1].cantidad)
        .map(([nombre, data]) => ({
          'Producto': nombre,
          'Unidades Vendidas': data.cantidad,
          'Total Ingresos': data.total,
        }));

      const wsAnalisis = XLSX.utils.json_to_sheet(analisisData.length > 0 ? analisisData : [{ 'Sin datos': '' }]);
      XLSX.utils.book_append_sheet(wb, wsAnalisis, 'Análisis');

      // ===== HOJA 6: CAJA / FINANZAS =====
      setProgreso('Generando resumen financiero...');

      const hoy = new Date();
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

      const ventasMes = (ventas || []).filter(v => new Date(v.created_at) >= inicioMes);
      const totalMes = ventasMes.reduce((sum, v) => sum + (v.total || 0), 0);
      const totalGeneral = (ventas || []).reduce((sum, v) => sum + (v.total || 0), 0);

      const finanzasData = [
        { 'Concepto': 'Total Ventas Este Mes', 'Monto': totalMes },
        { 'Concepto': 'Cantidad Ventas Este Mes', 'Monto': ventasMes.length },
        { 'Concepto': '---', 'Monto': '' },
        { 'Concepto': 'Total Ventas Histórico', 'Monto': totalGeneral },
        { 'Concepto': 'Total Transacciones', 'Monto': (ventas || []).length },
        { 'Concepto': '---', 'Monto': '' },
        { 'Concepto': 'Total Productos Registrados', 'Monto': (productos || []).length },
        { 'Concepto': 'Total Clientes Registrados', 'Monto': (clientes || []).length },
        { 'Concepto': '---', 'Monto': '' },
        { 'Concepto': 'Fecha del Backup', 'Monto': new Date().toLocaleString('es-PE') },
      ];
      const wsFinanzas = XLSX.utils.json_to_sheet(finanzasData);
      XLSX.utils.book_append_sheet(wb, wsFinanzas, 'Caja y Finanzas');

      // ===== DESCARGAR =====
      setProgreso('Generando archivo...');
      XLSX.writeFile(wb, getNombreArchivo());
      setProgreso('');

    } catch (error) {
      console.error('Error generando backup:', error);
      setProgreso('Error al generar el backup');
    }
    setDescargando(false);
  };

  return (
    <div className="space-y-6">
      
      <div className="bg-white p-8 rounded-xl shadow-sm border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <Download size={24} className="text-orange-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Backup de Datos</h2>
            <p className="text-gray-500 text-base">Descarga tu información completa en Excel</p>
          </div>
        </div>

        {/* Contenido del backup */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="border border-gray-100 rounded-xl p-4 flex items-center gap-3 bg-green-50">
            <DollarSign size={20} className="text-green-600" />
            <div>
              <p className="font-semibold text-xl">Ventas</p>
              <p className="text-base text-gray-500">Historial y reporte por fecha</p>
            </div>
          </div>
          <div className="border border-gray-100 rounded-xl p-4 flex items-center gap-3 bg-blue-50">
            <Package size={20} className="text-blue-600" />
            <div>
              <p className="font-semibold text-xl">Productos y Stock</p>
              <p className="text-base text-gray-500">Lista y movimientos de stock</p>
            </div>
          </div>
          <div className="border border-gray-100 rounded-xl p-4 flex items-center gap-3 bg-purple-50">
            <Users size={20} className="text-purple-600" />
            <div>
              <p className="font-semibold text-xl">Clientes</p>
              <p className="text-base text-gray-500">Lista y clientes frecuentes</p>
            </div>
          </div>
          <div className="border border-gray-100 rounded-xl p-4 flex items-center gap-3 bg-yellow-50">
            <BarChart3 size={20} className="text-yellow-600" />
            <div>
              <p className="font-semibold text-xl">Análisis</p>
              <p className="text-base text-gray-500">Productos más vendidos</p>
            </div>
          </div>
          <div className="border border-gray-100 rounded-xl p-4 flex items-center gap-3 bg-red-50">
            <FileText size={20} className="text-red-600" />
            <div>
              <p className="font-semibold text-xl">Caja y Finanzas</p>
              <p className="text-base text-gray-500">Ingresos y resumen financiero</p>
            </div>
          </div>
        </div>

        {/* Nombre del archivo */}
        <div className="bg-gray-50 rounded-lg p-3 mb-6 flex items-center gap-2">
          <FileText size={16} className="text-gray-400" />
          <p className="text-lg text-gray-600 font-mono">{getNombreArchivo()}</p>
        </div>

        {/* Progreso */}
        {progreso && (
          <div className="mb-4 text-lg text-blue-600 font-medium animate-pulse">
            ⏳ {progreso}
          </div>
        )}

        {/* Botón */}
        <button
          onClick={generarBackup}
          disabled={descargando}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-orange-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 text-lg"
        >
          <Download size={18} />
          {descargando ? 'Generando backup...' : 'Descargar Backup Excel'}
        </button>

        <p className="text-lg text-gray-400 mt-3">
          💡 Se descargará directo a tu carpeta Descargas
        </p>
      </div>

      {/* Recomendación */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
        <p className="font-semibold text-orange-800 text-lg">📅 Recomendación</p>
        <p className="text-orange-700 text-sm mt-1">
          Realiza un backup semanal para proteger tu información. Guárdalo en un lugar seguro.
        </p>
      </div>
    </div>
  );
};

export default BackupTab;
