import { useState } from 'react';
import { Download, FileText, Package, Users, BarChart3, DollarSign, TrendingUp, Layers, CheckCircle } from 'lucide-react';
import ExcelJS from 'exceljs';

// ── Helpers ────────────────────────────────────────────────────────
const fmtFecha = (f) => {
  if (!f) return '';
  if (typeof f === 'string' && f.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [y, m, d] = f.split('-'); return `${d}/${m}/${y}`;
  }
  try { return new Date(f).toLocaleDateString('es-PE'); } catch { return f; }
};
const fmtSol = (n) => `S/ ${Number(n || 0).toFixed(2)}`;
const altBg  = (i) => i % 2 === 0 ? 'FFFFFFFF' : 'FFF5F5F5';

const BORDER = {
  top:    { style: 'thin', color: { argb: 'FFD0D0D0' } },
  left:   { style: 'thin', color: { argb: 'FFD0D0D0' } },
  bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
  right:  { style: 'thin', color: { argb: 'FFD0D0D0' } },
};

const applyHeader = (cell, argb) => {
  cell.font      = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Arial', size: 10 };
  cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${argb}` } };
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  cell.border    = BORDER;
};

const applyData = (cell, rowIdx, bold = false, colorArgb = '1A1A1A', center = false) => {
  cell.font      = { name: 'Arial', size: 9, bold, color: { argb: `FF${colorArgb}` } };
  cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: altBg(rowIdx) } };
  cell.alignment = { horizontal: center ? 'center' : 'left', vertical: 'middle' };
  cell.border    = BORDER;
};

const addTitle = (ws, title, subtitle, argb, cols) => {
  ws.mergeCells(1, 1, 1, cols);
  const t = ws.getCell(1, 1);
  t.value = title;
  t.font  = { bold: true, size: 13, color: { argb: 'FFFFFFFF' }, name: 'Arial' };
  t.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${argb}` } };
  t.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 30;

  ws.mergeCells(2, 1, 2, cols);
  const s = ws.getCell(2, 1);
  s.value = subtitle;
  s.font  = { italic: true, size: 9, color: { argb: 'FF555555' }, name: 'Arial' };
  s.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } };
  s.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 16;
};

const addHeaders = (ws, headers, argb) => {
  const row = ws.getRow(3);
  row.height = 22;
  headers.forEach((h, i) => applyHeader(row.getCell(i + 1), argb));
  row.values = ['', '', ...headers]; // offset por título
  // Re-apply header styles after setting values
  headers.forEach((h, i) => {
    const cell = row.getCell(i + 1);
    cell.value = h;
    applyHeader(cell, argb);
  });
};

const addDataRows = (ws, rows, styleFn) => {
  rows.forEach((rowData, ri) => {
    const row = ws.getRow(4 + ri);
    row.height = 18;
    rowData.forEach((val, ci) => {
      const cell = row.getCell(ci + 1);
      cell.value = val ?? '';
      styleFn(cell, ri, ci, val);
    });
  });
};

const setWidths = (ws, widths) => {
  widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });
};

// ── Generador principal ────────────────────────────────────────────
const generarExcel = async (supabase, setProgreso, setPct, fechaDesde, fechaHasta) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Qhapaq System';

  // 1. Fetch datos
  setProgreso('Cargando ventas...'); setPct(8);
  const { data: ventasTodas = [] } = await supabase.from('sales').select('*').order('fecha', { ascending: false });
  const ventas = fechaDesde && fechaHasta
    ? ventasTodas.filter(v => v.fecha >= fechaDesde && v.fecha <= fechaHasta)
    : ventasTodas;

  setProgreso('Cargando productos...'); setPct(22);
  const { data: productos = [] } = await supabase.from('products').select('*').order('modelo');

  setProgreso('Cargando movimientos...'); setPct(38);
  const { data: movTodos = [] } = await supabase.from('stock_transactions').select('*').order('fecha', { ascending: false });
  const movimientos = fechaDesde && fechaHasta
    ? movTodos.filter(m => m.fecha >= fechaDesde && m.fecha <= fechaHasta)
    : movTodos;

  setProgreso('Cargando clientes...'); setPct(52);
  const { data: clientes = [] } = await supabase.from('qhapaq_clientes').select('*').order('nombre');

  // 2. Datos auxiliares
  const comprasPorCliente = {};
  ventasTodas.forEach(v => {
    if (!v.client_name) return;
    if (!comprasPorCliente[v.client_name]) comprasPorCliente[v.client_name] = { n: 0, total: 0 };
    comprasPorCliente[v.client_name].n++;
    comprasPorCliente[v.client_name].total += v.total || 0;
  });

  const modeloStats = {};
  ventas.forEach(v => {
    (v.items || []).forEach(item => {
      const k = item.modelo || 'Sin modelo';
      if (!modeloStats[k]) modeloStats[k] = { unidades: 0, ingresos: 0, pedidos: new Set() };
      modeloStats[k].unidades += item.quantity || 0;
      modeloStats[k].ingresos += item.subtotal || (item.precioVenta || 0) * (item.quantity || 0);
      modeloStats[k].pedidos.add(v.order_number);
    });
  });

  const stockDetalle = [];
  productos.forEach(p => {
    if (!p.stock || typeof p.stock !== 'object') return;
    Object.entries(p.stock).forEach(([color, tallas]) => {
      if (typeof tallas !== 'object') return;
      Object.entries(tallas).forEach(([talla, qty]) => {
        stockDetalle.push([p.modelo || '', color, talla, Number(qty) || 0, fmtSol(p.precio), fmtSol((Number(qty)||0)*(p.precio||0))]);
      });
    });
  });

  const hoyStr    = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
  const inicioMes = hoyStr.substring(0, 7);
  const ventasHoy = ventasTodas.filter(v => v.fecha === hoyStr);
  const ventasMes = ventasTodas.filter(v => (v.fecha || '').startsWith(inicioMes));
  const totalHoy  = ventasHoy.reduce((s, v) => s + (v.total || 0), 0);
  const totalMes  = ventasMes.reduce((s, v) => s + (v.total || 0), 0);
  const totalHist = ventasTodas.reduce((s, v) => s + (v.total || 0), 0);
  const totalDesc = ventasTodas.reduce((s, v) => s + (v.descuento || 0), 0);
  const artHoy    = ventasHoy.reduce((s, v) => s + (v.items || []).reduce((a, i) => a + (i.quantity || 0), 0), 0);
  const ticketProm = ventasMes.length ? totalMes / ventasMes.length : 0;
  const valorStock = stockDetalle.reduce((s, r) => {
    const p = productos.find(p => p.modelo === r[0]);
    return s + (r[3] * (p?.precio || 0));
  }, 0);
  const totalUnid = stockDetalle.reduce((s, r) => s + r[3], 0);

  // ── HOJA 1: VENTAS ─────────────────────────────────────────────
  setProgreso('Generando Ventas...'); setPct(60);
  {
    const ws = wb.addWorksheet('Ventas');
    const headers = ['N° Pedido','Fecha','Hora','Cliente','DNI','Teléfono','Departamento','Canal','Artículos','Total S/','Descuento S/','Cobrado S/'];
    addTitle(ws, '📦  ABERMUD — Historial de Ventas', `Período: ${fmtFecha(fechaDesde)} al ${fmtFecha(fechaHasta)}`, '1D4ED8', headers.length);
    addHeaders(ws, headers, '1D4ED8');
    const rows = ventas.map(v => [
      v.order_number || '', fmtFecha(v.fecha), v.hora || '', v.client_name || '',
      v.client_dni || '', v.client_phone || '', v.client_department || '',
      v.sales_channel || 'TIENDA',
      (v.items || []).reduce((s, i) => s + (i.quantity || 0), 0),
      fmtSol(v.total), fmtSol(v.descuento),
      fmtSol((v.total || 0) - (v.descuento || 0)),
    ]);
    addDataRows(ws, rows, (cell, ri, ci, val) => {
      const isDesc = ci === 10 && val !== 'S/ 0.00';
      applyData(cell, ri, ci === 0 || ci === 9 || ci === 11, isDesc ? 'DC2626' : (ci === 0 ? '1D4ED8' : '1A1A1A'), ci >= 8);
    });
    setWidths(ws, [13,12,8,20,12,13,13,12,10,12,13,12]);
  }

  // ── HOJA 2: DETALLE VENTAS ─────────────────────────────────────
  {
    const ws = wb.addWorksheet('Detalle Ventas');
    const headers = ['N° Pedido','Fecha','Cliente','Canal','Modelo','Color','Talla','Cantidad','Precio Unit. S/','Subtotal S/'];
    addTitle(ws, '🔍  ABERMUD — Detalle por Producto', 'Cada ítem de cada pedido expandido', '1D4ED8', headers.length);
    addHeaders(ws, headers, '1D4ED8');
    const rows = [];
    ventas.forEach(v => {
      (v.items || []).forEach(item => {
        rows.push([v.order_number||'', fmtFecha(v.fecha), v.client_name||'', v.sales_channel||'TIENDA',
          item.modelo||'', item.color||'', item.talla||'', item.quantity||0,
          fmtSol(item.precioVenta), fmtSol(item.subtotal||(item.precioVenta||0)*(item.quantity||0))]);
      });
    });
    addDataRows(ws, rows, (cell, ri, ci) => applyData(cell, ri, ci===0||ci===9, ci===0?'1D4ED8':'1A1A1A', ci>=7||ci===1||ci===3));
    setWidths(ws, [13,12,20,12,26,14,8,10,14,12]);
  }

  // ── HOJA 3: PRODUCTOS ──────────────────────────────────────────
  setProgreso('Generando Productos...'); setPct(68);
  {
    const ws = wb.addWorksheet('Productos');
    const headers = ['Modelo','Precio Venta S/','Precio Compra S/','Colores','Tallas','Activo','Stock Total Unid.','Valor Stock S/'];
    addTitle(ws, '🏷️  ABERMUD — Catálogo de Productos', 'Modelos con precios y stock total', '1A1A1A', headers.length);
    addHeaders(ws, headers, '1A1A1A');
    const rows = productos.map(p => {
      const tot = Object.values(p.stock||{}).reduce((t, tallas) =>
        t + (typeof tallas==='object' ? Object.values(tallas).reduce((s,q)=>s+(Number(q)||0),0) : 0), 0);
      return [p.modelo||'', fmtSol(p.precio), fmtSol(p.precioCompra), (p.colors||[]).join(', '), (p.tallas||[]).join(', '), p.activo?'✅ Sí':'❌ No', tot, fmtSol(tot*(p.precio||0))];
    });
    addDataRows(ws, rows, (cell, ri, ci, val) => {
      const color = ci===5 ? (String(val).includes('Sí')?'16A34A':'DC2626') : '1A1A1A';
      applyData(cell, ri, ci===0||ci===6||ci===7, color, ci>=1&&ci!==3&&ci!==4);
    });
    setWidths(ws, [28,16,16,32,22,10,18,16]);
  }

  // ── HOJA 4: STOCK DETALLADO ────────────────────────────────────
  {
    const ws = wb.addWorksheet('Stock Detallado');
    const headers = ['Modelo','Color','Talla','Cantidad','Precio Venta S/','Valor Stock S/'];
    addTitle(ws, '📊  ABERMUD — Stock por Color y Talla', 'Desglose completo de inventario', '1A1A1A', headers.length);
    addHeaders(ws, headers, '1A1A1A');
    addDataRows(ws, stockDetalle, (cell, ri, ci) => applyData(cell, ri, ci>=3, '1A1A1A', ci>=2));
    setWidths(ws, [28,14,8,12,16,16]);
  }

  // ── HOJA 5: MOVIMIENTOS ────────────────────────────────────────
  setProgreso('Generando Movimientos...'); setPct(76);
  {
    const ws = wb.addWorksheet('Movimientos Stock');
    const TIPO_COLOR = { INGRESO: '16A34A', SALIDA: 'DC2626', LIQUIDACION: 'EA580C' };
    const headers = ['Fecha','Hora','Tipo','Modelo','Color','Talla','Cantidad','N° Venta','Notas'];
    addTitle(ws, '🔄  ABERMUD — Movimientos de Stock', 'Ingresos, salidas y liquidaciones', '1A1A1A', headers.length);
    addHeaders(ws, headers, '1A1A1A');
    const rows = movimientos.map(m => [fmtFecha(m.fecha), m.hora||'', m.tipo||'', m.modelo||'', m.color||'', m.talla||'', m.cantidad||0, m.sale_id||'', m.notes||'']);
    addDataRows(ws, rows, (cell, ri, ci, val) => applyData(cell, ri, ci===2||ci===6, ci===2?(TIPO_COLOR[val]||'1A1A1A'):'1A1A1A', ci!==8&&ci!==3));
    setWidths(ws, [12,8,13,28,14,8,10,12,26]);
  }

  // ── HOJA 6: CLIENTES ───────────────────────────────────────────
  setProgreso('Generando Clientes...'); setPct(82);
  {
    const ws = wb.addWorksheet('Clientes');
    const headers = ['Nombre','DNI','Teléfono','Dirección','Departamento','N° Compras','Total Compras S/'];
    addTitle(ws, '👥  ABERMUD — Clientes', 'Lista completa con historial de compras', '7C3AED', headers.length);
    addHeaders(ws, headers, '7C3AED');
    const rows = clientes.map(c => [c.nombre||'', c.dni||'', c.telefono||'', c.direccion||'', c.departamento||'', comprasPorCliente[c.nombre]?.n||0, fmtSol(comprasPorCliente[c.nombre]?.total||0)]);
    addDataRows(ws, rows, (cell, ri, ci) => applyData(cell, ri, ci===6, '1A1A1A', ci>=4));
    setWidths(ws, [22,12,13,26,14,12,16]);
  }

  // ── HOJA 7: ANÁLISIS ───────────────────────────────────────────
  setProgreso('Generando Análisis...'); setPct(88);
  {
    const ws = wb.addWorksheet('Análisis Ventas');
    const headers = ['#','Modelo','Unidades Vendidas','N° Pedidos','Ingresos S/'];
    addTitle(ws, '📈  ABERMUD — Análisis de Ventas', 'Modelos más vendidos por ingresos', '7C3AED', headers.length);
    addHeaders(ws, headers, '7C3AED');
    const rows = Object.entries(modeloStats)
      .sort((a,b) => b[1].ingresos - a[1].ingresos)
      .map(([modelo, d], i) => [i+1, modelo, d.unidades, d.pedidos.size, fmtSol(d.ingresos)]);
    addDataRows(ws, rows, (cell, ri, ci) => {
      cell.font = { name:'Arial', size:9, bold: ri===0||ci>=2, color:{ argb:'FF1A1A1A' } };
      cell.fill = { type:'pattern', pattern:'solid', fgColor:{ argb: ri===0?'FFFFF9E6':altBg(ri) } };
      cell.alignment = { horizontal: ci!==1?'center':'left', vertical:'middle' };
      cell.border = BORDER;
    });
    setWidths(ws, [5,28,18,12,14]);
  }

  // ── HOJA 8: RESUMEN FINANCIERO ─────────────────────────────────
  setProgreso('Generando Resumen Financiero...'); setPct(94);
  {
    const ws = wb.addWorksheet('Resumen Financiero');
    ws.getColumn(1).width = 30;
    ws.getColumn(2).width = 20;

    // Título
    ws.mergeCells(1,1,1,2);
    const t = ws.getCell(1,1);
    t.value = '💰  ABERMUD — Resumen Financiero';
    t.font  = { bold:true, size:13, color:{argb:'FFFFFFFF'}, name:'Arial' };
    t.fill  = { type:'pattern', pattern:'solid', fgColor:{argb:'FFEA580C'} };
    t.alignment = { horizontal:'center', vertical:'middle' };
    ws.getRow(1).height = 30;

    ws.mergeCells(2,1,2,2);
    const s = ws.getCell(2,1);
    s.value = `Indicadores clave · ${fmtFecha(fechaDesde)} al ${fmtFecha(fechaHasta)}`;
    s.font  = { italic:true, size:9, color:{argb:'FF555555'}, name:'Arial' };
    s.fill  = { type:'pattern', pattern:'solid', fgColor:{argb:'FFF5F5F5'} };
    s.alignment = { horizontal:'center', vertical:'middle' };
    ws.getRow(2).height = 16;

    const secciones = [
      ['📅 VENTAS HOY',      'FFEA580C', [['Total recaudado hoy', fmtSol(totalHoy)], ['Pedidos del día', String(ventasHoy.length)], ['Artículos vendidos', String(artHoy)]]],
      ['📆 VENTAS ESTE MES', 'FF1D4ED8', [['Total del mes', fmtSol(totalMes)], ['Pedidos del mes', String(ventasMes.length)], ['Ticket promedio', fmtSol(ticketProm)]]],
      ['📊 HISTÓRICO TOTAL', 'FF1A1A1A', [['Total histórico', fmtSol(totalHist)], ['Total pedidos', String(ventasTodas.length)], ['Total descuentos', fmtSol(totalDesc)]]],
      ['🏬 INVENTARIO',      'FF16A34A', [['Modelos registrados', String(productos.length)], ['Unidades en stock', String(totalUnid)], ['Valor del stock', fmtSol(valorStock)]]],
      ['👥 CLIENTES',        'FF7C3AED', [['Clientes registrados', String(clientes.length)], ['Con compras', String(Object.keys(comprasPorCliente).length)]]],
    ];

    let rowIdx = 3;
    secciones.forEach(([titulo, argb, items]) => {
      ws.mergeCells(rowIdx, 1, rowIdx, 2);
      const hCell = ws.getCell(rowIdx, 1);
      hCell.value = titulo;
      hCell.font  = { bold:true, size:10, color:{argb:'FFFFFFFF'}, name:'Arial' };
      hCell.fill  = { type:'pattern', pattern:'solid', fgColor:{argb} };
      hCell.alignment = { horizontal:'left', vertical:'middle', indent:1 };
      hCell.border = BORDER;
      ws.getRow(rowIdx).height = 22;
      rowIdx++;

      items.forEach(([concepto, valor], i) => {
        const bg = i%2===0 ? 'FFFFFFFF' : 'FFF5F5F5';
        const c1 = ws.getCell(rowIdx, 1);
        const c2 = ws.getCell(rowIdx, 2);
        c1.value = concepto; c1.font = {name:'Arial',size:9}; c1.fill={type:'pattern',pattern:'solid',fgColor:{argb:bg}}; c1.border=BORDER; c1.alignment={vertical:'middle'};
        c2.value = valor;    c2.font = {name:'Arial',size:9,bold:true,color:{argb}}; c2.fill={type:'pattern',pattern:'solid',fgColor:{argb:bg}}; c2.border=BORDER; c2.alignment={horizontal:'center',vertical:'middle'};
        ws.getRow(rowIdx).height = 18;
        rowIdx++;
      });
      rowIdx++; // espacio
    });

    // Timestamp
    ws.mergeCells(rowIdx, 1, rowIdx, 2);
    const ts = ws.getCell(rowIdx, 1);
    ts.value = `🕐 Backup generado: ${new Date().toLocaleString('es-PE', {timeZone:'America/Lima'})}`;
    ts.font  = { italic:true, size:9, color:{argb:'FF888888'}, name:'Arial' };
    ts.alignment = { horizontal:'center' };
  }

  // ── Descargar ──────────────────────────────────────────────────
  setProgreso('Generando archivo...'); setPct(99);
  const hoy  = new Date();
  const dia  = String(hoy.getDate()).padStart(2,'0');
  const mes  = String(hoy.getMonth()+1).padStart(2,'0');
  const anio = hoy.getFullYear();
  const hora = String(hoy.getHours()).padStart(2,'0');
  const min  = String(hoy.getMinutes()).padStart(2,'0');
  const rango = fechaDesde && fechaHasta
    ? `_${fechaDesde.split('-').reverse().join('')}-${fechaHasta.split('-').reverse().join('')}`
    : '';
  const fname = `backup_abermud${rango}_${dia}-${mes}-${anio}_${hora}${min}.xlsx`;

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = fname; a.click();
  URL.revokeObjectURL(url);
};

// ═══════════════════════════════════════════════════════════════════
//  COMPONENTE
// ═══════════════════════════════════════════════════════════════════
const BackupTab = ({ supabase }) => {
  const [descargando, setDescargando] = useState(false);
  const [progreso,    setProgreso]    = useState('');
  const [pct,         setPct]         = useState(0);
  const [listo,       setListo]       = useState(false);

  const hoyISO       = new Date().toISOString().split('T')[0];
  const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const [fechaDesde, setFechaDesde] = useState(primerDiaMes);
  const [fechaHasta, setFechaHasta] = useState(hoyISO);

  const handleBackup = async () => {
    setDescargando(true); setListo(false); setPct(0);
    try {
      await generarExcel(supabase, setProgreso, setPct, fechaDesde, fechaHasta);
      setListo(true); setProgreso(''); setPct(100);
      setTimeout(() => { setListo(false); setPct(0); }, 4000);
    } catch (err) {
      console.error('Error en backup:', err);
      setProgreso(`❌ Error: ${err.message}`);
    }
    setDescargando(false);
  };

  const hojas = [
    { icon: <DollarSign size={18} className="text-blue-600"/>,   bg:'bg-blue-50',   label:'Ventas',             desc:'Historial completo de pedidos' },
    { icon: <FileText   size={18} className="text-indigo-600"/>, bg:'bg-indigo-50', label:'Detalle Ventas',      desc:'Ítems expandidos por pedido' },
    { icon: <Package    size={18} className="text-gray-700"/>,   bg:'bg-gray-50',   label:'Productos',          desc:'Catálogo con precios y stock' },
    { icon: <Layers     size={18} className="text-gray-700"/>,   bg:'bg-gray-100',  label:'Stock Detallado',    desc:'Por color y talla' },
    { icon: <TrendingUp size={18} className="text-green-600"/>,  bg:'bg-green-50',  label:'Movimientos Stock',  desc:'Ingresos, salidas, liquidaciones' },
    { icon: <Users      size={18} className="text-purple-600"/>, bg:'bg-purple-50', label:'Clientes',           desc:'Lista con historial de compras' },
    { icon: <BarChart3  size={18} className="text-purple-600"/>, bg:'bg-purple-50', label:'Análisis Ventas',    desc:'Ranking de modelos' },
    { icon: <DollarSign size={18} className="text-orange-600"/>, bg:'bg-orange-50', label:'Resumen Financiero', desc:'Indicadores clave del negocio' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-xl shadow-sm border">

        {/* Título + filtro */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Download size={24} className="text-orange-600"/>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Backup de Datos</h2>
              <p className="text-gray-500 text-base">Descarga tu información completa en Excel profesional</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <FileText size={15} className="text-gray-400 shrink-0"/>
            <span className="text-sm text-gray-500 font-medium">Período:</span>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-orange-400"/>
            <span className="text-sm text-gray-400">→</span>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-orange-400"/>
          </div>
        </div>

        {/* 8 hojas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {hojas.map((h, i) => (
            <div key={i} className={`border border-gray-100 rounded-xl p-4 flex items-center gap-3 ${h.bg}`}>
              {h.icon}
              <div>
                <p className="font-semibold text-base">{h.label}</p>
                <p className="text-xs text-gray-500">{h.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Nombre archivo */}
        <div className="bg-gray-50 rounded-lg p-3 mb-5 flex items-center gap-2">
          <FileText size={15} className="text-gray-400"/>
          <p className="text-sm text-gray-600 font-mono">
            backup_abermud_{fechaDesde.split('-').reverse().join('')}-{fechaHasta.split('-').reverse().join('')}.xlsx
          </p>
        </div>

        {/* Barra de progreso */}
        {descargando && (
          <div className="mb-5">
            <div className="flex justify-between text-sm text-blue-600 font-medium mb-1">
              <span>⏳ {progreso}</span><span>{pct}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width:`${pct}%` }}/>
            </div>
          </div>
        )}

        {listo && (
          <div className="mb-4 flex items-center gap-2 text-green-600 font-medium">
            <CheckCircle size={18}/><span>¡Backup descargado exitosamente!</span>
          </div>
        )}

        {!descargando && progreso.startsWith('❌') && (
          <div className="mb-4 text-red-600 text-sm font-medium">{progreso}</div>
        )}

        <button onClick={handleBackup} disabled={descargando}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-orange-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 text-base">
          <Download size={18}/>
          {descargando ? 'Generando backup...' : 'Descargar Backup Excel'}
        </button>

        <p className="text-sm text-gray-400 mt-3">💡 Se descargará directo a tu carpeta Descargas con 8 hojas y colores</p>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
        <p className="font-semibold text-orange-800 text-base">📅 Recomendación</p>
        <p className="text-orange-700 text-sm mt-1">Realiza un backup semanal. Guárdalo en Google Drive o en un disco externo.</p>
      </div>
    </div>
  );
};

export default BackupTab;
