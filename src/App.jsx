import React, { useState, useEffect } from 'react';
import { 
  Package, Users, ShoppingCart, TrendingUp, DollarSign, 
  AlertCircle, Plus, Edit2, Trash2, Search, X, Download,
  FileText, Share2, Eye, Menu, Home, ChevronRight, ChevronLeft,
  Calendar, Filter, Upload, BarChart3, FileDown,
  Settings,
  Archive,
  Layers,
  BarChart2,
  ClipboardList,
  Warehouse,
  ClipboardListIcon
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { supabase, getPeruDateTime } from './supabaseConfig';

// Logo placeholder (ajusta la ruta según tu proyecto)
import logoABermud from './logo_Abermud.jpg';

function App() {
  // Estados principales
  const [activeTab, setActiveTab] = useState(() => {
  // Recuperar pestaña guardada al cargar la app
  const savedTab = localStorage.getItem('abermud-active-tab');
  return savedTab || 'dashboard';
});
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [sales, setSales] = useState([]);
  const [stockTransactions, setStockTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showStockDetail, setShowStockDetail] = useState(false);
  const [stockDetailData, setStockDetailData] = useState(null);

  // Estados para modales
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddSale, setShowAddSale] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [viewingSale, setViewingSale] = useState(null);
  const [showAddStock, setShowAddStock] = useState(false);
  const [showStockModal, setShowStockModal] = useState(null);
  const [showSaleConfirm, setShowSaleConfirm] = useState(false);
  const [saleConfirmData, setSaleConfirmData] = useState(null);
  
  // Estados para modales de reportes
  const [showModalStockGeneral, setShowModalStockGeneral] = useState(false);
  const [showModalStockClientes, setShowModalStockClientes] = useState(false);
  const [showModalReporteVentas, setShowModalReporteVentas] = useState(false);
  const [showModalAnalisisVentas, setShowModalAnalisisVentas] = useState(false);
  const [vistaReporteVentas, setVistaReporteVentas] = useState('lista');
  const [fechaSeleccionadaVentas, setFechaSeleccionadaVentas] = useState(null);

  // Estados para productos
  const [newProduct, setNewProduct] = useState({
    modelo: '',
    precioVenta: '',
    precioCompra: '',
    imagen: '',
    colors: [],
    stock: {}
  });
  const [newColorInput, setNewColorInput] = useState('');

  // Estados para clientes
  const [newClient, setNewClient] = useState({
    nombre: '',
    dni: '',
    telefono: '',
    direccion: '',
    departamento: ''
  });

  // Estados para ventas
  const [cart, setCart] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSearch, setClientSearch] = useState('');
  const [showClientResults, setShowClientResults] = useState(false);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [saleDate, setSaleDate] = useState('');
  const [salesChannel, setSalesChannel] = useState('TIENDA');

  // Estados para selección de productos en ventas
  const [selectedProductModel, setSelectedProductModel] = useState(null);
  const [selectedTalla, setSelectedTalla] = useState(null);
  const [colorQuantities, setColorQuantities] = useState({});

  // Estados para agregar stock
  const [stockToAdd, setStockToAdd] = useState({
    modelo: '',
    colors: {}
  });

  // Estados para reportes
  const [reportFilter, setReportFilter] = useState('hoy');
  const [customDateRange, setCustomDateRange] = useState({
  start: '',
  end: ''
});

  // Inicializar fechas
useEffect(() => {
  const fechaHoy = getPeruDateTime().fecha;
  setSaleDate(fechaHoy);
  setCustomDateRange({ start: fechaHoy, end: fechaHoy });
}, []);

  // ============================================
  // FUNCIÓN PARA ABREVIAR NOMBRES DE PRODUCTOS
  // ============================================
  const abreviarNombreProducto = (nombreCompleto) => {
    if (!nombreCompleto) return '';
    
    const palabras = nombreCompleto.trim().split(' ');
    
    const abreviaciones = {
      'Jogger': 'J.',
      'Polos': 'P.',
      'Polo': 'P.',
      'Boca': '',
      'Recta': '',
      'French': 'F.',
      'Terry': 'T.',
      'Dama': 'Dama',
      'Varón': 'Varón',
      'Casual': 'Casual',
      'Clásico': 'Clás.',
      'Americano': 'Amer.',
      'Bolsillo': 'Bols.',
      'Afuera': 'Af.'
    };
    
    const resultado = palabras
      .map(palabra => {
        if (abreviaciones.hasOwnProperty(palabra)) {
          return abreviaciones[palabra];
        }
        if (palabra.length <= 5) {
          return palabra;
        }
        return palabra.charAt(0) + '.';
      })
      .filter(p => p !== '')
      .join(' ');
    
    return resultado;
  };

// ============================================
// FUNCIÓN HELPER: Encabezado PDF
// ============================================
const agregarEncabezadoPDF = (doc, titulo) => {
  const pageWidth = doc.internal.pageSize.width;

  // Logo más abajo
  doc.addImage(logoABermud, 'JPEG', 14, 24, 26, 26);

  // Nombre + slogan
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('ABermud', 45, 35);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'italic');
  doc.text('Lo bueno va contigo', 45, 40);

  // Título centrado debajo del logo
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(titulo, pageWidth / 2, 56, { align: 'center' });

  // Línea separadora
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(14, 58, pageWidth - 14, 58);

  return 66; // yPos inicial
};

  // ============================================
  // FUNCIÓN PARA DESCARGAR REPORTE EN PDF
  // ============================================
  const descargarReportePDF = (tipoReporte) => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const fecha = getPeruDateTime().fecha.split('-').reverse().join('/');
    const pageWidth = doc.internal.pageSize.getWidth();   // 297mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
    const margin = 15;

    // ── HEADER NEGRO ──────────────────────────────
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 30, pageWidth, 38, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont(undefined, 'bold');
    doc.text('ABermud', margin, 44);

    doc.setFontSize(14);
    doc.setFont(undefined, 'italic');
    doc.text('Lo bueno va contigo', margin, 52);

    doc.setFont(undefined, 'normal');
    doc.setFontSize(12);
    doc.text(`Fecha: ${fecha}`, margin, 60);

    // ── TÍTULO DEL REPORTE ────────────────────────
    let tituloReporte = '';
    // Calcular rango real desde los datos
const todasLasFechas = tipoReporte === 'movimientos'
  ? Object.keys(getIngresoStockReport())
  : tipoReporte === 'salidas'
  ? Object.keys(getSalidaVentasReport())
  : [fecha];

const fechasOrdenadas = todasLasFechas.sort();
const rangoTexto = fechasOrdenadas.length > 1
  ? `${fechasOrdenadas[0].split('-').reverse().join('/')} AL ${fechasOrdenadas[fechasOrdenadas.length - 1].split('-').reverse().join('/')}`
  : reportFilter === 'personalizado'
  ? `${customDateRange.start.split('-').reverse().join('/')} AL ${customDateRange.end.split('-').reverse().join('/')}`
  : fecha;

    if (tipoReporte === 'stock acumulado') tituloReporte = `STOCK ACUMULADO AL ${rangoTexto}`;
    if (tipoReporte === 'movimientos')     tituloReporte = `MOVIMIENTOS DE STOCK ${rangoTexto}`;
    if (tipoReporte === 'salidas')         tituloReporte = `SALIDA (VENTAS) ${rangoTexto}`;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(tituloReporte, margin, 80);

    // ── PREPARAR DATOS ────────────────────────────
    const stockData = getStockALaFechaReport();
const ingresoData = getIngresoStockReport();
const salidaData = getSalidaVentasReport();

const sortedProducts = [...products].filter(p => p.activo !== false).sort((a, b) => {
  if (tipoReporte === 'movimientos') {
    const totalA = Object.values(ingresoData).reduce((sum, m) => sum + (m[a.modelo]?.ingreso || 0), 0);
    const totalB = Object.values(ingresoData).reduce((sum, m) => sum + (m[b.modelo]?.ingreso || 0), 0);
    return totalB - totalA;
  }
  if (tipoReporte === 'salidas') {
    const totalA = Object.values(salidaData).reduce((sum, m) => sum + (Number(m[a.modelo]) || 0), 0);
    const totalB = Object.values(salidaData).reduce((sum, m) => sum + (Number(m[b.modelo]) || 0), 0);
    return totalB - totalA;
  }
  return (stockData[b.modelo] || 0) - (stockData[a.modelo] || 0);
});

    const headers = ['FECHA', ...sortedProducts.map(p => p.modelo)];
    let bodyData = [];

    if (tipoReporte === 'stock_fecha') {
      bodyData = [
        [fecha, ...sortedProducts.map(p => String(stockData[p.modelo] || 0))],
      ];
    } else if (tipoReporte === 'movimientos') {
  const ingresoData = getIngresoStockReport();
  if (Object.keys(ingresoData).length === 0) {
    bodyData = [['Sin ingresos en este período', ...sortedProducts.map(() => '')]];
  } else {
    bodyData = Object.entries(ingresoData).map(([f, modelos]) => [
      f.split('-').reverse().join('/'),
      ...sortedProducts.map(p => {
        const d = modelos[p.modelo];
        if (!d) return '-';
        let texto = '';
        if (d.ingreso !== 0) texto += d.ingreso;
        if (d.correccion !== 0) texto += (texto ? ' [C:' : '[C:') + d.correccion + ']';
        return texto || '-';
      })
    ]);
    bodyData.push([
      'TOTAL',
      ...sortedProducts.map(p => String(
        Object.values(ingresoData).reduce((sum, m) => 
          sum + (m[p.modelo]?.ingreso || 0) + (m[p.modelo]?.correccion || 0), 0
        )
      ))
    ]);
  }
    } else if (tipoReporte === 'salidas') {
      const salidaData = getSalidaVentasReport();
      if (Object.keys(salidaData).length === 0) {
        bodyData = [['Sin ventas en este período', ...sortedProducts.map(() => '')]];
      } else {
        bodyData = Object.entries(salidaData).map(([f, modelos]) => [
          f.split('-').reverse().join('/'),
          ...sortedProducts.map(p => String(modelos[p.modelo] || '0'))
        ]);
        bodyData.push([
          'TOTAL',
          ...sortedProducts.map(p => String(
            Object.values(salidaData).reduce((sum, m) => sum + (Number(m[p.modelo]) || 0), 0)
          ))
        ]);
      }
    }

    // ── CALCULAR ANCHO DE COLUMNAS ────────────────
    const tableWidth = pageWidth - margin * 2;             // ancho disponible
    const totalCols = headers.length;
    const fechaColWidth = 30;                              // columna FECHA fija
    const restWidth = tableWidth - fechaColWidth;
    const colWidth = restWidth / (totalCols - 1);          // resto dividido igual

    const columnStyles = { 0: { cellWidth: fechaColWidth, halign: 'left', fontStyle: 'bold' } };
    for (let i = 1; i < totalCols; i++) {
      columnStyles[i] = { cellWidth: colWidth, halign: 'center' };
    }

    // ── GENERAR TABLA ─────────────────────────────
    doc.autoTable({
      startY: 85,
      head: [headers],
      body: bodyData,
      margin: { left: margin, right: margin },
      tableWidth: tableWidth,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 8,
        cellPadding: 3,
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles,
      styles: {
        lineColor: [200, 200, 200],
        lineWidth: 0.3,
        overflow: 'linebreak',
      },
      // Fila TOTAL en negrita (solo stock_fecha)
      didParseCell: (data) => {
        if (tipoReporte === 'stock_fecha' && data.row.index === 1 && data.section === 'body') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [230, 230, 230];
        }
      }
    });

    // ── RESUMEN (solo Stock a la Fecha) ───────────
    if (tipoReporte === 'stock_fecha') {
      const finalY = doc.lastAutoTable.finalY + 8;
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('RESUMEN DE INVENTARIO', margin, finalY);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      const totalUnidades = Object.values(stockData).reduce((sum, qty) => sum + qty, 0);
      doc.text(`Total de productos: ${products.length}`, margin, finalY + 6);
      doc.text(`Total de unidades: ${totalUnidades}`, margin + 60, finalY + 6);
    }

    // ── GUARDAR ───────────────────────────────────
    doc.save(`${tituloReporte.replace(/[\s/()]/g, '_')}.pdf`);
  };

// ============================================
// FUNCIONES DE GENERACIÓN DE PDF - REPORTES
// ============================================

// PDF 1: STOCK GENERAL
const generarPDFStockGeneral = () => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPos = agregarEncabezadoPDF(doc, 'REPORTE DE STOCK - GENERAL');

  // Fecha
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const fecha = getPeruDateTime().fecha.split('-').reverse().join('/');
  doc.text(`FECHA: ${fecha}`, 14, yPos);
  yPos += 10;

  const reportData = getStockGeneralReport();

  reportData.forEach((productData) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    const totalProducto = Object.values(productData.stockByColor).reduce((sum, tallas) => 
      sum + Object.values(tallas).reduce((a, b) => a + b, 0), 0);

    doc.setFillColor(0, 0, 0);
    doc.rect(14, yPos, 167, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(productData.modelo, pageWidth / 2, yPos + 7, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`Total: ${totalProducto}`, 178, yPos + 7, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    yPos += 14;

    const tableData = Object.entries(productData.stockByColor).map(([color, tallas]) => [
  color,
  tallas.S || 0,
  tallas.M || 0,
  tallas.L || 0,
  tallas.XL || 0
]);

const totalRow = [
  'TOTAL',
  Object.values(productData.stockByColor).reduce((sum, t) => sum + (t.S || 0), 0),
  Object.values(productData.stockByColor).reduce((sum, t) => sum + (t.M || 0), 0),
  Object.values(productData.stockByColor).reduce((sum, t) => sum + (t.L || 0), 0),
  Object.values(productData.stockByColor).reduce((sum, t) => sum + (t.XL || 0), 0),
];

   doc.autoTable({
  startY: yPos,
  head: [['COLOR', 'S', 'M', 'L', 'XL']],  // ← AGREGAR XL
  body: tableData,
  theme: 'grid',
  headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' }, // ← halign center aquí
  styles: { fontSize: 10, cellPadding: 3, textColor: [0, 0, 0] },
  columnStyles: {
    0: { cellWidth: 55 },
    1: { halign: 'center', cellWidth: 28 },
    2: { halign: 'center', cellWidth: 28 },
    3: { halign: 'center', cellWidth: 28 },
    4: { halign: 'center', cellWidth: 28 }  // ← XL
  },
  margin: { left: 14, right: 14 }
});

    yPos = doc.lastAutoTable.finalY + 10;
  });

  doc.save(`Stock_General_${fecha.replace(/\//g, '-')}.pdf`);
};

// PDF 2: STOCK CLIENTES
const generarPDFStockClientes = () => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPos = agregarEncabezadoPDF(doc, 'REPORTE DE STOCK - CLIENTES');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const fecha = getPeruDateTime().fecha.split('-').reverse().join('/');
  doc.text(`FECHA: ${fecha}`, 14, yPos);
  doc.text('Colores disponibles (sin cantidades)', 14, yPos + 6);
  yPos += 16;

  const reportData = getStockClientesReport();

  reportData.forEach((productData) => {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(0, 0, 0);
    doc.rect(14, yPos, 167, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(productData.modelo, pageWidth / 2, yPos + 5.5, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    yPos += 12;

const tableData = [[
  productData.colorsByTalla.S?.join('\n') || '-',
  productData.colorsByTalla.M?.join('\n') || '-',
  productData.colorsByTalla.L?.join('\n') || '-',
  productData.colorsByTalla.XL?.join('\n') || '-'
]];

doc.autoTable({
  startY: yPos,
  head: [['S', 'M', 'L', 'XL']],
  body: tableData,
  theme: 'grid',
  headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
  styles: { fontSize: 9, cellPadding: 5, valign: 'top' },
  columnStyles: {
    0: { halign: 'left', cellWidth: 42 },
    1: { halign: 'left', cellWidth: 42 },
    2: { halign: 'left', cellWidth: 42 },
    3: { halign: 'left', cellWidth: 42 }
  },
  margin: { left: 14, right: 14 }
});

    yPos = doc.lastAutoTable.finalY + 10;
  });

  doc.save(`Stock_Clientes_${fecha.replace(/\//g, '-')}.pdf`);
};

// PDF 3: REPORTE DE VENTAS
const generarPDFReporteVentas = () => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPos = agregarEncabezadoPDF(doc, 'REPORTE DE VENTAS');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const fecha = getPeruDateTime().fecha.split('-').reverse().join('/');
  doc.text(`FECHA: ${fecha}`, 14, yPos);
  const periodoText = reportFilter === 'hoy' ? 'Hoy' : `${customDateRange.start} a ${customDateRange.end}`;
  doc.text(`Período: ${periodoText}`, 14, yPos + 6);
  yPos += 16;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('VENTAS POR MODELO', 14, yPos);
  yPos += 8;

  const { start, end } = getDateRangeForFilter(reportFilter);
  const filteredSales = sales.filter(s => s.fecha >= start && s.fecha <= end);

  const ventasPorFechaModelo = {};
  const modelosSet = new Set();
  products.filter(p => p.activo !== false).forEach(p => modelosSet.add(p.modelo));

  filteredSales.forEach(sale => {
    if (!ventasPorFechaModelo[sale.fecha]) ventasPorFechaModelo[sale.fecha] = {};
    sale.items.forEach(item => {
      if (!ventasPorFechaModelo[sale.fecha][item.modelo]) ventasPorFechaModelo[sale.fecha][item.modelo] = 0;
      ventasPorFechaModelo[sale.fecha][item.modelo] += item.quantity;
    });
  });

  const modelos = Array.from(modelosSet);
  const tableHead = [['FECHA', ...modelos.map(m => abreviarNombreProducto(m)), 'TOTAL']];
  const tableBody = [];
  const fechas = Object.keys(ventasPorFechaModelo).sort();
  const totalesPorModelo = {};
  modelos.forEach(m => totalesPorModelo[m] = 0);

  fechas.forEach(fecha => {
    const row = [fecha.split('-').reverse().join('/')];
    let totalFecha = 0;
    modelos.forEach(modelo => {
      const cantidad = ventasPorFechaModelo[fecha][modelo] || 0;
      row.push(cantidad);
      totalesPorModelo[modelo] += cantidad;
      totalFecha += cantidad;
    });
    row.push(totalFecha);
    tableBody.push(row);
  });

  const totalRow = ['TOTAL'];
  let granTotal = 0;
  modelos.forEach(modelo => {
    totalRow.push(totalesPorModelo[modelo]);
    granTotal += totalesPorModelo[modelo];
  });
  totalRow.push(granTotal);
  tableBody.push(totalRow);

  doc.autoTable({
    startY: yPos,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 25, fontStyle: 'bold' } },
    didParseCell: (data) => {
      if (data.row.index === tableBody.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 240, 240];
      }
    }
  });

  doc.save(`Reporte_Ventas_${fecha.replace(/\//g, '-')}.pdf`);
};

// PDF 4: ANÁLISIS DE VENTAS
const generarPDFAnalisisVentas = () => {
  const doc = new jsPDF();
  let yPos = agregarEncabezadoPDF(doc, 'ANÁLISIS DE VENTAS');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const fecha = getPeruDateTime().fecha.split('-').reverse().join('/');
  doc.text(`FECHA: ${fecha}`, 14, yPos);
  const periodoText = reportFilter === 'hoy' ? 'Hoy' : `${customDateRange.start} a ${customDateRange.end}`;
  doc.text(`Período: ${periodoText}`, 14, yPos + 6);
  yPos += 16;

  const analisis = getAnalisisVentasReport();

  // SECCIÓN 1: POR MEDIO DE VENTA
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('POR MEDIO DE VENTA', 14, yPos);
  yPos += 8;

  const tablaMedio = [
    ['TIENDA', analisis.porMedio.TIENDA?.toFixed(2) || '0.00'],
    ['LIVE', analisis.porMedio.LIVE?.toFixed(2) || '0.00']
  ];

  doc.autoTable({
    startY: yPos,
    head: [['MEDIO', 'MONTO']],
    body: tablaMedio,
    theme: 'grid',
    headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'right', cellWidth: 40 }
    },
    margin: { left: 14 }
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // SECCIÓN 2: TOP 10 CLIENTES
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOP 10 CLIENTES', 14, yPos);
  yPos += 8;

  const tablaClientes = analisis.topClientes.map((c, idx) => [
    `${idx + 1}`, c.nombre, c.total.toFixed(2)
  ]);

  doc.autoTable({
    startY: yPos,
    head: [['#', 'CLIENTE', 'MONTO']],
    body: tablaClientes.length > 0 ? tablaClientes : [['', 'No hay datos', '']],
    theme: 'grid',
    headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { cellWidth: 90 },
      2: { halign: 'right', cellWidth: 30 }
    },
    margin: { left: 14 }
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // SECCIÓN 3: POR DEPARTAMENTO
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('POR DEPARTAMENTO', 14, yPos);
  yPos += 8;

  const tablaDepartamento = Object.entries(analisis.porDepartamento)
    .sort((a, b) => b[1] - a[1])
    .map(([dept, monto]) => [dept, monto.toFixed(2)]);

  doc.autoTable({
    startY: yPos,
    head: [['DEPARTAMENTO', 'MONTO']],
    body: tablaDepartamento.length > 0 ? tablaDepartamento : [['No hay datos', '']],
    theme: 'grid',
    headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'right', cellWidth: 40 }
    },
    margin: { left: 14 }
  });

  doc.save(`Analisis_Ventas_${fecha.replace(/\//g, '-')}.pdf`);
};

  // ============================================
  // FUNCIONES DE CARGA DE DATOS DESDE SUPABASE
  // ============================================

  useEffect(() => {
    loadAllData();
    
    // Suscripciones en tiempo real
    const productsSubscription = supabase
      .channel('products_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        loadProducts();
      })
      .subscribe();

    const salesSubscription = supabase
      .channel('sales_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => {
        loadSales();
      })
      .subscribe();

    const stockSubscription = supabase
      .channel('stock_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_transactions' }, () => {
        loadStockTransactions();
      })
      .subscribe();

    return () => {
      productsSubscription.unsubscribe();
      salesSubscription.unsubscribe();
      stockSubscription.unsubscribe();
    };
  }, []);
  // Guardar pestaña activa en localStorage
useEffect(() => {
  localStorage.setItem('abermud-active-tab', activeTab);
}, [activeTab]);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadProducts(),
      loadClients(),
      loadSales(),
      loadStockTransactions()
    ]);
    setLoading(false);
  };

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error cargando productos:', error);
    } else {
      setProducts(data || []);
    }
  };

  const loadClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error cargando clientes:', error);
    } else {
      setClients(data || []);
    }
  };

  const loadSales = async () => {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error cargando ventas:', error);
    } else {
      setSales(data || []);
    }
  };

  const loadStockTransactions = async () => {
    const { data, error } = await supabase
      .from('stock_transactions')
      .select('*')
      .order('fecha', { ascending: false });
    
    if (error) {
      console.error('Error cargando transacciones de stock:', error);
    } else {
      setStockTransactions(data || []);
    }
  };

  // ============================================
  // FUNCIONES CRUD DE PRODUCTOS
  // ============================================

  const addProduct = async () => {
    if (!newProduct.modelo || !newProduct.precioVenta) {
      alert('Por favor completa el modelo y precio de venta');
      return;
    }

    const { data, error } = await supabase
      .from('products')
      .insert([{
        modelo: newProduct.modelo,
        precio_venta: parseFloat(newProduct.precioVenta),
        precio_compra: parseFloat(newProduct.precioCompra) || 0,
        imagen: newProduct.imagen || null,
        colors: newProduct.colors,
        stock: newProduct.stock
      }])
      .select();

    if (error) {
      console.error('Error agregando producto:', error);
      alert('Error al agregar producto');
    } else {
      setShowAddProduct(false);
      resetNewProduct();
    }
  };

  const updateProduct = async () => {
    if (!editingProduct) return;

    const { error } = await supabase
      .from('products')
      .update({
        modelo: editingProduct.modelo,
        precio_venta: parseFloat(editingProduct.precio_venta),
        precio_compra: parseFloat(editingProduct.precio_compra) || 0,
        imagen: editingProduct.imagen,
        colors: editingProduct.colors,
        stock: editingProduct.stock,
        updated_at: new Date().toISOString()
      })
      .eq('id', editingProduct.id);

    if (error) {
      console.error('Error actualizando producto:', error);
      alert('Error al actualizar producto');
    } else {
      setEditingProduct(null);
    }
  };

  const deleteProduct = async (productId) => {
  if (!confirm('¿Seguro que deseas eliminar este producto?')) return;

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) {
    console.error('Error eliminando producto:', error);
    alert('Error al eliminar producto');
  }
};

const toggleProductActive = async (id, currentStatus) => {
  const { error } = await supabase
    .from('products')
    .update({ activo: !currentStatus })
    .eq('id', id);

  if (error) {
    console.error('Error cambiando estado del producto:', error);
    alert('Error al cambiar estado del producto');
  } else {
    alert(`Producto ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`);
  }
};

const addColorToProduct = (productObj) => {
  if (!newColorInput.trim()) return;
  
  const updatedColors = [...(productObj.colors || []), newColorInput.trim()];
  const updatedStock = { ...(productObj.stock || {}) };
    
    // Inicializar stock del nuevo color en 0 para todas las tallas
    updatedStock[newColorInput.trim()] = { S: 0, M: 0, L: 0, XL: 0 };
    
    if (editingProduct) {
      setEditingProduct({
        ...editingProduct,
        colors: updatedColors,
        stock: updatedStock
      });
    } else {
      setNewProduct({
        ...newProduct,
        colors: updatedColors,
        stock: updatedStock
      });
    }
    
    setNewColorInput('');
  };

  const removeColorFromProduct = (productObj, colorToRemove) => {
    const updatedColors = productObj.colors.filter(c => c !== colorToRemove);
    const updatedStock = { ...productObj.stock };
    delete updatedStock[colorToRemove];
    
    if (editingProduct) {
      setEditingProduct({
        ...editingProduct,
        colors: updatedColors,
        stock: updatedStock
      });
    } else {
      setNewProduct({
        ...newProduct,
        colors: updatedColors,
        stock: updatedStock
      });
    }
  };

  const resetNewProduct = () => {
    setNewProduct({
      modelo: '',
      precioVenta: '',
      precioCompra: '',
      imagen: '',
      colors: [],
      stock: {}
    });
    setNewColorInput('');
  };

  // ============================================
  // FUNCIONES CRUD DE CLIENTES
  // ============================================

  const addClient = async () => {
    if (!newClient.nombre) {
      alert('Por favor ingresa el nombre del cliente');
      return;
    }

    const { data, error } = await supabase
      .from('clients')
      .insert([newClient])
      .select();

    if (error) {
      console.error('Error agregando cliente:', error);
      alert('Error al agregar cliente');
    } else {
      setShowAddClient(false);
      setShowCreateClient(false);
      if (data && data[0]) {
        setSelectedClient(data[0]);
      }
      setNewClient({
        nombre: '',
        dni: '',
        telefono: '',
        direccion: '',
        departamento: ''
      });
    }
  };

  const updateClient = async () => {
    if (!editingClient) return;

    const { error } = await supabase
      .from('clients')
      .update(editingClient)
      .eq('id', editingClient.id);

    if (error) {
      console.error('Error actualizando cliente:', error);
      alert('Error al actualizar cliente');
    } else {
      setEditingClient(null);
    }
  };

  const deleteClient = async (clientId) => {
    if (!confirm('¿Seguro que deseas eliminar este cliente?')) return;

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);

    if (error) {
      console.error('Error eliminando cliente:', error);
      alert('Error al eliminar cliente');
    }
  };

  // ============================================
  // FUNCIONES DE VENTAS
  // ============================================

  const completeSale = async () => {
  if (cart.length === 0) { alert('El carrito está vacío'); return; }
  if (!selectedClient) { alert('Por favor selecciona un cliente'); return; }
  if (isProcessing) return;

  setIsProcessing(true);

  try {
    const { fecha, hora } = getPeruDateTime();

    // Generar número de pedido
    const { data: lastSale } = await supabase
      .from('sales').select('order_number')
      .order('created_at', { ascending: false }).limit(1);

    let consecutivo = 101;
    if (lastSale && lastSale.length > 0) {
      const parts = lastSale[0].order_number.split('-');
      if (parts.length === 3) consecutivo = parseInt(parts[2]) + 1;
    }

    const year = fecha.split('-')[0];
    const month = fecha.split('-')[1];
    const day = fecha.split('-')[2];
    const orderNumber = `${year}-${day}${month}-${consecutivo.toString().padStart(3, '0')}`;
    const total = cart.reduce((sum, item) => sum + item.subtotal, 0);

    // 1. Crear la venta
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert([{
        order_number: orderNumber,
        fecha: saleDate,
        hora: hora,
        client_name: selectedClient.nombre,
        client_dni: selectedClient.dni,
        client_phone: selectedClient.telefono,
        client_address: selectedClient.direccion,
        client_department: selectedClient.departamento,
        sales_channel: salesChannel,
        items: cart,
        total: total
      }]).select();

    if (saleError) throw new Error('Error al crear la venta: ' + saleError.message);

    const saleId = saleData[0].id;

    // 2. Registrar transacciones de stock
    const stockTransactionsToInsert = [];
    const productUpdates = [];

    for (const item of cart) {
      stockTransactionsToInsert.push({
        fecha: saleDate,
        hora: hora,
        tipo: 'SALIDA',
        modelo: item.modelo,
        color: item.color,
        talla: item.talla,
        cantidad: item.quantity,
        sale_id: saleId,
        notes: `Venta #${orderNumber}`
      });

      const product = products.find(p => p.id === item.productoId);
      if (product) {
        const updatedStock = { ...product.stock };
        updatedStock[item.color][item.talla] -= item.quantity;
        productUpdates.push({ id: product.id, stock: updatedStock });
      }
    }

    const { error: transError } = await supabase
      .from('stock_transactions')
      .insert(stockTransactionsToInsert);

    if (transError) throw new Error('Error al registrar movimientos: ' + transError.message);

    for (const update of productUpdates) {
      const { error: stockError } = await supabase
        .from('products')
        .update({ stock: update.stock, updated_at: new Date().toISOString() })
        .eq('id', update.id);

      if (stockError) throw new Error('Error al actualizar stock: ' + stockError.message);
    }

    // 3. Actualizar estado local
    setProducts(products.map(p => {
      const update = productUpdates.find(u => u.id === p.id);
      return update ? { ...p, stock: update.stock } : p;
    }));

    // 4. Mostrar confirmación
    setSaleConfirmData({
      orderNumber,
      fecha: saleDate,
      cliente: selectedClient.nombre,
      canal: salesChannel,
      items: [...cart],
      total
    });

    // 5. Limpiar
    setCart([]);
    setSelectedClient(null);
    setShowAddSale(false);
    setClientSearch('');
    setSaleDate(getPeruDateTime().fecha);
    setSalesChannel('TIENDA');
    setShowSaleConfirm(true);

  } catch (error) {
    console.error(error);
    alert('❌ Error al completar la venta: ' + error.message + '\n\nIntenta de nuevo.');
  } finally {
    setIsProcessing(false);
  }
};

  // ============================================
  // FUNCIONES DE STOCK
  // ============================================

  const addStockToProduct = async () => {
  if (isProcessing) return; // Prevenir múltiples clicks
  
  if (!stockToAdd.modelo) {
    alert('Selecciona un producto');
    return;
  }

  const product = products.find(p => p.modelo === stockToAdd.modelo);
  if (!product) return;

  setIsProcessing(true); // ← NUEVO

  const { fecha, hora } = getPeruDateTime();
  const stockTransactionsToInsert = [];
  const updatedStock = { ...product.stock };
  const esCorreccion = false; // Ya no usamos toggle, detectamos por signo

  // PRIMERO: Validar que ninguna quedará negativa
for (const [color, tallas] of Object.entries(stockToAdd.colors)) {
  for (const [talla, cantidad] of Object.entries(tallas)) {
    const cantidadInt = parseInt(cantidad) || 0;
    if (cantidadInt !== 0) {
      const stockActual = product.stock?.[color]?.[talla] || 0;
      if (stockActual + cantidadInt < 0) {
        alert(`❌ ${color} ${talla}: Stock actual ${stockActual}, no puedes restar ${Math.abs(cantidadInt)}`);
        setIsProcessing(false);
        return;
      }
    }
  }
}

// SEGUNDO: Procesar (ya validado)
Object.entries(stockToAdd.colors).forEach(([color, tallas]) => {
  if (!updatedStock[color]) {
    updatedStock[color] = { S: 0, M: 0, L: 0, XL: 0 };
  }

  Object.entries(tallas).forEach(([talla, cantidad]) => {
    const cantidadInt = parseInt(cantidad) || 0;
    if (cantidadInt !== 0) {
      stockTransactionsToInsert.push({
        fecha: fecha,
        hora: hora,
        tipo: 'INGRESO',
        modelo: product.modelo,
        color: color,
        talla: talla,
        cantidad: cantidadInt,
        notes: cantidadInt < 0
          ? `⚠️ Corrección: ${cantidadInt}`
          : 'Ingreso manual de stock'
      });

      updatedStock[color][talla] = (updatedStock[color][talla] || 0) + cantidadInt;
    }
  });
});

  if (stockTransactionsToInsert.length === 0) {
    setIsProcessing(false); // ← NUEVO
    alert('No hay cantidades para agregar');
    return;
  }

  console.log('Transacciones a insertar:', stockTransactionsToInsert);

  try {
  // 1. Insertar movimientos
  const { error: errorInsert } = await supabase
    .from('stock_transactions')
    .insert(stockTransactionsToInsert);

  if (errorInsert) throw new Error('Error al guardar movimientos: ' + errorInsert.message);

  // 2. Actualizar stock del producto
  const { error: errorUpdate } = await supabase
    .from('products')
    .update({ stock: updatedStock, updated_at: new Date().toISOString() })
    .eq('id', product.id);

  if (errorUpdate) throw new Error('Error al actualizar stock: ' + errorUpdate.message);

  // 3. Actualizar estado local
  setProducts(products.map(p =>
    p.id === product.id ? { ...p, stock: updatedStock } : p
  ));

  // 4. Preparar modal de confirmación
  const detailItems = [];
  let total = 0;
  Object.entries(stockToAdd.colors).forEach(([color, tallas]) => {
    Object.entries(tallas).forEach(([talla, cantidad]) => {
      const cantidadInt = parseInt(cantidad) || 0;
      if (cantidadInt !== 0) {
        detailItems.push({ color, talla, cantidad: cantidadInt });
        total += cantidadInt;
      }
    });
  });

  setStockDetailData({ fecha, modelo: product.modelo, items: detailItems, total, esCorreccion });
  setShowAddStock(false);
  setStockToAdd({ modelo: '', colors: {}, esCorreccion: false });
  setShowStockDetail(true);

} catch (error) {
  console.error(error);
  alert('❌ Error al guardar: ' + error.message + '\n\nIntenta de nuevo.');
} finally {
  setIsProcessing(false);
}
};

  // ============================================
  // FUNCIONES DE REPORTES
  // ============================================

const getPeruDateTime = () => {
  const now = new Date();
  const peruTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
  
  const year = peruTime.getFullYear();
  const month = String(peruTime.getMonth() + 1).padStart(2, '0');
  const day = String(peruTime.getDate()).padStart(2, '0');
  const hours = String(peruTime.getHours()).padStart(2, '0');
  const minutes = String(peruTime.getMinutes()).padStart(2, '0');
  const seconds = String(peruTime.getSeconds()).padStart(2, '0');

  return {
    fecha: `${year}-${month}-${day}`,
    hora: `${hours}:${minutes}:${seconds}`
  };
};
  
  const getDateRangeForFilter = (filter) => {
    const today = getPeruDateTime().fecha;
    const todayDate = new Date(today);

    if (filter === 'hoy') {
      return { start: today, end: today };
    } else if (filter === 'mes') {
      const year = todayDate.getFullYear();
      const month = todayDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      return {
        start: firstDay.toISOString().split('T')[0],
        end: lastDay.toISOString().split('T')[0]
      };
    } else {
      return customDateRange;
    }
  };

    const getIngresoStockReport = () => {
  const { start, end } = getDateRangeForFilter(reportFilter);
  
  // Solo filtramos por tipo INGRESO (correcciones también son INGRESO pero con cantidad negativa)
  const filteredTransactions = stockTransactions.filter(t => 
    t.tipo === 'INGRESO' &&
    t.fecha >= start &&
    t.fecha <= end
  );


  const grouped = {};
  filteredTransactions.forEach(t => {
    if (!grouped[t.fecha]) grouped[t.fecha] = {};
    if (!grouped[t.fecha][t.modelo]) grouped[t.fecha][t.modelo] = { ingreso: 0, correccion: 0 };
    
    // Separar por signo de cantidad
    if (t.cantidad > 0) {
      grouped[t.fecha][t.modelo].ingreso += t.cantidad;
    } else if (t.cantidad < 0) {
      grouped[t.fecha][t.modelo].correccion += t.cantidad;
    }
  });

  return grouped;
};

// Función para obtener detalle de ingresos/correcciones de un día específico
const getStockDetailByDate = (fecha, modelo) => {
  const transactions = stockTransactions.filter(t => 
    t.tipo === 'INGRESO' &&
    t.fecha === fecha &&
    t.modelo === modelo
  );

  // Agrupar por hora (cada operación)
  const operacionesPorHora = {};
  transactions.forEach(t => {
    if (!operacionesPorHora[t.hora]) {
      operacionesPorHora[t.hora] = [];
    }
    operacionesPorHora[t.hora].push({
      color: t.color,
      talla: t.talla,
      cantidad: t.cantidad
    });
  });

  // Convertir a array ordenado
  const operaciones = Object.entries(operacionesPorHora)
    .sort(([horaA], [horaB]) => horaA.localeCompare(horaB))
    .map(([hora, items]) => ({ hora, items }));

  const total = transactions.reduce((sum, t) => sum + t.cantidad, 0);
  const esCorreccion = transactions.some(t => t.cantidad < 0);

  return {
    fecha: fecha,
    modelo: modelo,
    operaciones: operaciones,
    total: total,
    esCorreccion: esCorreccion
  };
};

  const getSalidaVentasReport = () => {
    const { start, end } = getDateRangeForFilter(reportFilter);
    
    const filteredSales = sales.filter(s => 
      s.fecha >= start &&
      s.fecha <= end
    );

    // Agrupar por fecha y modelo
    const grouped = {};
    filteredSales.forEach(sale => {
      if (!grouped[sale.fecha]) grouped[sale.fecha] = {};
      
      sale.items.forEach(item => {
        if (!grouped[sale.fecha][item.modelo]) grouped[sale.fecha][item.modelo] = 0;
        grouped[sale.fecha][item.modelo] += item.quantity;
      });
    });

    return grouped;
  };

  const getStockALaFechaReport = () => {
    const stockByModel = {};
    
    products.filter(p => p.activo !== false).forEach(product => {
      let total = 0;
      Object.values(product.stock || {}).forEach(tallas => {
        Object.values(tallas).forEach(cantidad => {
          total += cantidad;
        });
      });
      stockByModel[product.modelo] = total;
    });

    return stockByModel;
  };
  
// ============================================
// FUNCIONES AUXILIARES
// ============================================
const downloadOrderNote = (sale) => {
  const doc = new jsPDF();
  
  // Logo
  try {
    doc.addImage(logoABermud, 'JPEG', 15, 10, 30, 30);
  } catch (e) {
    console.log('Logo no disponible');
  }

  // Encabezado CENTRADO debajo del logo
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('ABermud', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Lo bueno va contigo', 105, 27, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('NOTA DE PEDIDO', 105, 40, { align: 'center' });

  // Información del pedido
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text(`Pedido N° ${sale.order_number}`, 15, 50);
  doc.setFont(undefined, 'normal');
  doc.text(`Fecha: ${sale.fecha.split('-').reverse().join('/')}`, 15, 57);
  
  // Información del cliente
  doc.setFont(undefined, 'bold');
  doc.text('CLIENTE:', 15, 67);
  doc.setFont(undefined, 'normal');
  doc.text(sale.client_name, 15, 74);
  
  const clientData = clients.find(c => c.nombre === sale.client_name);
  let currentY = 81;
  
  if (clientData) {
    if (clientData.dni) {
      doc.text(`DNI: ${clientData.dni}`, 15, currentY);
      currentY += 7;
    }
    if (clientData.telefono) {
      doc.text(`Tel: ${clientData.telefono}`, 15, currentY);
      currentY += 7;
    }
    if (clientData.direccion) {
      doc.text(`Dir: ${clientData.direccion}`, 15, currentY);
      currentY += 7;
    } else if (clientData.departamento) {
      doc.text(`Dpto: ${clientData.departamento}`, 15, currentY);
      currentY += 7;
    }
  }

  // Agrupar items por modelo
  const groupedItems = {};
  sale.items.forEach(item => {
    if (groupedItems[item.modelo]) {
      groupedItems[item.modelo].quantity += item.quantity;
      groupedItems[item.modelo].subtotal += item.subtotal;
    } else {
      groupedItems[item.modelo] = {
        modelo: item.modelo,
        quantity: item.quantity,
        precioUnit: item.subtotal / item.quantity,
        subtotal: item.subtotal
      };
    }
  });

  const tableData = Object.values(groupedItems).map(item => [
    item.modelo,
    item.quantity,
    `S/ ${item.precioUnit.toFixed(2)}`,
    `S/ ${item.subtotal.toFixed(2)}`
  ]);

  doc.autoTable({
    startY: currentY + 5,
    head: [['Modelo', 'Cant.', 'P. Unit.', 'Subtotal']],
    body: [...tableData, totalRow],
    footStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    theme: 'grid',
    headStyles: { 
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 10
    }
  });

  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(`TOTAL: S/ ${sale.total.toFixed(2)}`, 140, finalY);

  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text('Gracias por su compra', 105, pageHeight - 50, { align: 'center' });
  doc.text('ABermud - Lo bueno va contigo', 105, pageHeight - 15, { align: 'center' });

  doc.save(`Pedido-${sale.order_number}.pdf`);
};

const shareOrderViaWhatsApp = (sale) => {
  const groupedItems = {};
  sale.items.forEach(item => {
    if (groupedItems[item.modelo]) {
      groupedItems[item.modelo] += item.quantity;
    } else {
      groupedItems[item.modelo] = item.quantity;
    }
  });

  let mensaje = `*NOTA DE PEDIDO*\n`;
  mensaje += `*ABermud - Lo bueno va contigo*\n\n`;
  mensaje += `*Pedido N° ${sale.order_number}*\n`;
  mensaje += `📅 Fecha: ${sale.fecha.split('-').reverse().join('/')}\n\n`;
  
  mensaje += `👤 *CLIENTE:*\n`;
  mensaje += `${sale.client_name}\n`;
  
  const clientData = clients.find(c => c.nombre === sale.client_name);
  if (clientData) {
    if (clientData.dni) {
      mensaje += `🆔 DNI: ${clientData.dni}\n`;
    }
    if (clientData.telefono) {
      mensaje += `📱 Tel: ${clientData.telefono}\n`;
    }
    if (clientData.direccion) {
      mensaje += `📍 Dir: ${clientData.direccion}\n`;
    } else if (clientData.departamento) {
      mensaje += `📍 Dpto: ${clientData.departamento}\n`;
    }
  }
  
  mensaje += `\n🛍️ *PRODUCTOS:*\n`;
  
  Object.entries(groupedItems).forEach(([modelo, cantidad]) => {
    mensaje += `• ${modelo} x${cantidad}\n`;
  });
  
  mensaje += `\n💰 *TOTAL: S/ ${sale.total.toFixed(2)}*\n\n`;
  mensaje += `Gracias por su compra\n`;
  mensaje += `ABermud - Lo bueno va contigo`;
  
  const encodedMessage = encodeURIComponent(mensaje);
  const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
  window.open(whatsappUrl, '_blank');
};

  // ============================================
  // CÁLCULOS PARA DASHBOARD
  // ============================================

  const totalInventoryValue = products.reduce((sum, product) => {
    let totalUnits = 0;
    Object.values(product.stock || {}).forEach(tallas => {
      Object.values(tallas).forEach(cantidad => totalUnits += cantidad);
    });
    return sum + (totalUnits * product.precio_venta);
  }, 0);

  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);

  const topSellingProducts = () => {
    const productSales = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSales[item.modelo]) {
          productSales[item.modelo] = 0;
        }
        productSales[item.modelo] += item.quantity;
      });
    });

    return Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  const lowStockProducts = products.filter(product => {
    let total = 0;
    Object.values(product.stock || {}).forEach(tallas => {
      Object.values(tallas).forEach(cantidad => total += cantidad);
    });
    return total < 10;
  });

  // Filtros
  const filteredProducts = products.filter(product =>
    product.modelo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClients = clients.filter(client =>
    client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.dni && client.dni.includes(searchTerm))
  );

  const filteredClientSearch = clients.filter(client =>
    client.nombre.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (client.dni && client.dni.includes(clientSearch))
  );

  // ============================================
  // CÁLCULOS PARA REPORTES
  // ============================================

  const getStockGeneralReport = () => {
  return products
    .filter(product => product.activo !== false)
    .map(product => {
      const stockByColor = {};
      let totalProduct = 0;
      
      product.colors?.forEach(color => {
        stockByColor[color] = {};
        ['S', 'M', 'L', 'XL'].forEach(talla => {
          const cantidad = product.stock?.[color]?.[talla] || 0;
          stockByColor[color][talla] = cantidad;
          totalProduct += cantidad;
        });
      });
      
      return {
        modelo: product.modelo,
        stockByColor,
        total: totalProduct
      };
    })
    .sort((a, b) => b.total - a.total); // Ordenar de mayor a menor stock
};

const getStockClientesReport = () => {
  return products
    .filter(product => product.activo !== false)
    .map(product => {
      const colorsByTalla = {};
      ['S', 'M', 'L', 'XL'].forEach(talla => {
        colorsByTalla[talla] = [];
        product.colors?.forEach(color => {
          const cantidad = product.stock?.[color]?.[talla] || 0;
          if (cantidad > 0) {
            colorsByTalla[talla].push(color);
          }
        });
      });

      // Calcular total para ordenar igual que Stock General
      let totalProduct = 0;
      product.colors?.forEach(color => {
        ['S', 'M', 'L', 'XL'].forEach(talla => {
          totalProduct += product.stock?.[color]?.[talla] || 0;
        });
      });

      return {
        modelo: product.modelo,
        colorsByTalla,
        total: totalProduct
      };
    })
    .filter(p => p.total > 0) // Solo mostrar productos con stock disponible
    .sort((a, b) => b.total - a.total);
};

  const getVentasReport = () => {
    const { start, end } = getDateRangeForFilter(reportFilter);
    
    const filteredSales = sales.filter(s => s.fecha >= start && s.fecha <= end);
    
    // TOP 3
    const productSales = {};
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSales[item.modelo]) {
          productSales[item.modelo] = { cantidad: 0, total: 0 };
        }
        productSales[item.modelo].cantidad += item.quantity;
        productSales[item.modelo].total += item.subtotal;
      });
    });
    
    const top3 = Object.entries(productSales)
      .sort((a, b) => b[1].cantidad - a[1].cantidad)
      .slice(0, 3)
      .map(([modelo, data]) => ({ modelo, ...data }));
    
    // Ventas por fecha
    const ventasPorFecha = {};
    filteredSales.forEach(sale => {
      if (!ventasPorFecha[sale.fecha]) {
        ventasPorFecha[sale.fecha] = { ventas: 0, ganancia: 0 };
      }
      ventasPorFecha[sale.fecha].ventas += sale.total;
      
      // Calcular ganancia
      sale.items.forEach(item => {
        const producto = products.find(p => p.modelo === item.modelo);
        if (producto && producto.precio_compra) {
          const ganancia = (item.precioVenta - producto.precio_compra) * item.quantity;
          ventasPorFecha[sale.fecha].ganancia += ganancia;
        }
      });
    });
    
    return {
      top3,
      ventasPorFecha,
      totalVentas: filteredSales.length,
      totalMonto: filteredSales.reduce((sum, s) => sum + s.total, 0)
    };
  };

  const getVariantesReport = () => {
    const { start, end } = getDateRangeForFilter(reportFilter);
    const filteredSales = sales.filter(s => s.fecha >= start && s.fecha <= end);
    
    const variantes = [];
    const resumenModelos = {};
    
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        // Resumen por modelo
        if (!resumenModelos[item.modelo]) {
          resumenModelos[item.modelo] = 0;
        }
        resumenModelos[item.modelo] += item.quantity;
        
        // Detalle por variante
        const existing = variantes.find(v => 
          v.modelo === item.modelo && v.color === item.color && v.talla === item.talla
        );
        
        if (existing) {
          existing.vendido += item.quantity;
        } else {
          const producto = products.find(p => p.modelo === item.modelo);
          const stockActual = producto?.stock?.[item.color]?.[item.talla] || 0;
          
          variantes.push({
            modelo: item.modelo,
            color: item.color,
            talla: item.talla,
            stockActual,
            vendido: item.quantity
          });
        }
      });
    });
    
    return { variantes, resumenModelos };
  };

  const getAnalisisVentasReport = () => {
    const { start, end } = getDateRangeForFilter(reportFilter);
    const filteredSales = sales.filter(s => s.fecha >= start && s.fecha <= end);
    
    // Por medio
    const porMedio = { LIVE: 0, TIENDA: 0 };
    filteredSales.forEach(sale => {
      const medio = sale.sales_channel || 'TIENDA';
      porMedio[medio] += sale.total;
    });
    
    // Top clientes
    const porCliente = {};
    filteredSales.forEach(sale => {
      if (!porCliente[sale.client_name]) {
        porCliente[sale.client_name] = 0;
      }
      porCliente[sale.client_name] += sale.total;
    });
    
    const topClientes = Object.entries(porCliente)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([nombre, total]) => ({ nombre, total }));
    
    // Por departamento
    const porDepartamento = {};
    filteredSales.forEach(sale => {
      const cliente = clients.find(c => c.nombre === sale.client_name);
      const depto = cliente?.departamento || 'Sin especificar';
      if (!porDepartamento[depto]) {
        porDepartamento[depto] = 0;
      }
      porDepartamento[depto] += sale.total;
    });
    
    return {
      porMedio,
      topClientes,
      porDepartamento,
      totalVentas: filteredSales.reduce((sum, s) => sum + s.total, 0)
    };
  };

  const DetalleVentas = ({ fechaSeleccionada, sales, products, onVolver, onCerrar }) => {
    const [filtroDetalle, setFiltroDetalle] = React.useState('dia');
    const [rangoPersonalizado, setRangoPersonalizado] = React.useState({
      start: fechaSeleccionada,
      end: fechaSeleccionada
    });

    const ventasFiltradas = filtroDetalle === 'dia'
      ? sales.filter(s => s.fecha === fechaSeleccionada)
      : sales.filter(s => s.fecha >= rangoPersonalizado.start && s.fecha <= rangoPersonalizado.end);

    const totalGeneral = ventasFiltradas.reduce((sum, s) => sum + s.total, 0);
    const modelosActivos = products.filter(p => p.activo !== false).map(p => p.modelo);
    const fechasEnRango = [...new Set(ventasFiltradas.map(s => s.fecha))].sort((a, b) => b.localeCompare(a));

    const ventasPorFechaModelo = {};
    fechasEnRango.forEach(f => { ventasPorFechaModelo[f] = {}; });
    ventasFiltradas.forEach(sale => {
      sale.items.forEach(item => {
        ventasPorFechaModelo[sale.fecha][item.modelo] =
          (ventasPorFechaModelo[sale.fecha][item.modelo] || 0) + item.quantity;
      });
    });

    const totalPorModelo = {};
    modelosActivos.forEach(m => { totalPorModelo[m] = 0; });
    ventasFiltradas.forEach(sale => {
      sale.items.forEach(item => {
        totalPorModelo[item.modelo] = (totalPorModelo[item.modelo] || 0) + item.quantity;
      });
    });

    const modelosOrdenados = [...modelosActivos].sort((a, b) => (totalPorModelo[b] || 0) - (totalPorModelo[a] || 0));
    const masVendido = modelosOrdenados.find(m => totalPorModelo[m] > 0);

    return (
      <>
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <button onClick={onVolver} className="flex items-center gap-1 text-gray-600 hover:text-black font-medium">
            ‹ Volver a fechas
          </button>
          <h3 className="text-lg font-bold">Reporte de Ventas</h3>
          <button onClick={onCerrar}><X size={24} /></button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-lg capitalize">
                {new Date(fechaSeleccionada + 'T12:00:00').toLocaleDateString('es-PE', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                })}
              </p>
              <p className="text-sm text-gray-500">
                {ventasFiltradas.length} {ventasFiltradas.length === 1 ? 'venta' : 'ventas'} · Total:
                <span className="font-bold text-emerald-600"> S/ {totalGeneral.toFixed(2)}</span>
              </p>
            </div>
            {masVendido && (
              <div className="bg-orange-500 text-white text-xs px-3 py-2 rounded-lg text-right">
                🔥 Más vendido<br />
                <span className="font-bold">{masVendido}</span>
              </div>
            )}
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-800 text-white p-3 flex items-center justify-between">
              <span className="font-bold text-sm">📊 VENTAS POR MODELO</span>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-300">Filtrar por:</span>
                <button
                  onClick={() => setFiltroDetalle('dia')}
                  className={`px-2 py-1 rounded ${filtroDetalle === 'dia' ? 'bg-white text-black' : 'bg-gray-600 text-white'}`}
                >
                  Hoy
                </button>
                <button
                  onClick={() => setFiltroDetalle('personalizado')}
                  className={`px-2 py-1 rounded ${filtroDetalle === 'personalizado' ? 'bg-white text-black' : 'bg-gray-600 text-white'}`}
                >
                  Personalizado
                </button>
              </div>
            </div>

            {filtroDetalle === 'personalizado' && (
              <div className="bg-gray-50 p-3 flex gap-3 items-center text-sm border-b flex-wrap">
                <span className="text-gray-600">Desde:</span>
                <input type="date" value={rangoPersonalizado.start}
                  onChange={e => setRangoPersonalizado(r => ({ ...r, start: e.target.value }))}
                  className="border rounded px-2 py-1 text-sm" />
                <span className="text-gray-600">Hasta:</span>
                <input type="date" value={rangoPersonalizado.end}
                  onChange={e => setRangoPersonalizado(r => ({ ...r, end: e.target.value }))}
                  className="border rounded px-2 py-1 text-sm" />
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-3 text-left border-r font-bold">FECHA</th>
                    {modelosOrdenados.map(m => (
                      // DESPUÉS
                      <th key={m} className="p-3 text-center font-bold">
                        {abreviarNombreProducto(m)}
                      </th>
                    ))}
                    <th className="p-3 text-center font-bold bg-gray-200">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {fechasEnRango.length === 0 ? (
                    <tr>
                      <td colSpan={modelosOrdenados.length + 2} className="p-6 text-center text-gray-400">
                        Sin ventas en este período
                      </td>
                    </tr>
                  ) : (
                    <>
                      {fechasEnRango.map((fecha, idx) => {
                        const filaTotal = modelosOrdenados.reduce((sum, m) =>
                          sum + (ventasPorFechaModelo[fecha]?.[m] || 0), 0);
                        return (
                          <tr key={fecha} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="p-3 border-r font-medium whitespace-nowrap">
                              {new Date(fecha + 'T12:00:00').toLocaleDateString('es-PE', {
                                weekday: 'short', day: '2-digit', month: '2-digit'
                              })}
                            </td>
                            {modelosOrdenados.map(m => {
                              const cant = ventasPorFechaModelo[fecha]?.[m] || 0;
                              return (
                                <td key={m} className={`p-3 text-center ${cant > 0 ? 'font-bold text-emerald-600' : 'text-gray-300'}`}>
                                  {cant}
                                </td>
                              );
                            })}
                            <td className="p-3 text-center font-bold bg-gray-100">{filaTotal}</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-black text-white">
                        <td className="p-3 font-bold border-r">TOTAL</td>
                        {modelosOrdenados.map(m => (
                          <td key={m} className="p-3 text-center font-bold">{totalPorModelo[m] || 0}</td>
                        ))}
                        <td className="p-3 text-center font-bold">
                          {modelosOrdenados.reduce((sum, m) => sum + (totalPorModelo[m] || 0), 0)}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </>
    );
  };

 const AnalisisVentas = ({ sales, clients, onCerrar }) => {
  const [filtroAnalisis, setFiltroAnalisis] = React.useState('hoy');
  const [rangoAnalisis, setRangoAnalisis] = React.useState({
    start: getPeruDateTime().fecha,
    end: getPeruDateTime().fecha
  });

  const ventasFiltradas = filtroAnalisis === 'hoy'
    ? sales.filter(s => s.fecha === getPeruDateTime().fecha)
    : sales.filter(s => s.fecha >= rangoAnalisis.start && s.fecha <= rangoAnalisis.end);

  const medios = [...new Set(sales.map(s => s.sales_channel || 'TIENDA'))].sort();
  const fechasOrdenadas = [...new Set(ventasFiltradas.map(s => s.fecha))].sort((a, b) => b.localeCompare(a));

  // Por fecha × medio
  const porFechaMedia = {};
  fechasOrdenadas.forEach(f => { porFechaMedia[f] = {}; });
  ventasFiltradas.forEach(sale => {
    const medio = sale.sales_channel || 'TIENDA';
    if (!porFechaMedia[sale.fecha][medio]) porFechaMedia[sale.fecha][medio] = { cantidad: 0, monto: 0 };
    porFechaMedia[sale.fecha][medio].cantidad += 1;
    porFechaMedia[sale.fecha][medio].monto += sale.total;
  });

  const totalPorMedio = {};
  medios.forEach(m => {
    const ventas = ventasFiltradas.filter(s => (s.sales_channel || 'TIENDA') === m);
    totalPorMedio[m] = {
      cantidad: ventas.length,
      monto: ventas.reduce((s, v) => s + v.total, 0)
    };
  });

  // Clientes completos
  const porCliente = {};
  ventasFiltradas.forEach(sale => {
    if (!porCliente[sale.client_name]) porCliente[sale.client_name] = { cantidad: 0, monto: 0 };
    porCliente[sale.client_name].cantidad += sale.items.reduce((s, i) => s + i.quantity, 0);
    porCliente[sale.client_name].monto += sale.total;
  });
  const clientesOrdenados = Object.entries(porCliente).sort((a, b) => b[1].monto - a[1].monto);

  // Por departamento simple
  const porDepto = {};
  ventasFiltradas.forEach(sale => {
    const cliente = clients.find(c => c.nombre === sale.client_name);
    const depto = cliente?.departamento || 'Sin especificar';
    if (!porDepto[depto]) porDepto[depto] = { cantidad: 0, monto: 0 };
    porDepto[depto].cantidad += 1;
    porDepto[depto].monto += sale.total;
  });
  const deptosOrdenados = Object.entries(porDepto).sort((a, b) => b[1].monto - a[1].monto);

  const formatFecha = (fecha) => new Date(fecha + 'T12:00:00').toLocaleDateString('es-PE', {
    weekday: 'short', day: '2-digit', month: '2-digit'
  });

  return (
    <div className="p-4 space-y-4">

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500">Filtrar por:</span>
        <button onClick={() => setFiltroAnalisis('hoy')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filtroAnalisis === 'hoy' ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
          Hoy
        </button>
        <button onClick={() => setFiltroAnalisis('personalizado')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filtroAnalisis === 'personalizado' ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
          Personalizado
        </button>
      </div>

      {filtroAnalisis === 'personalizado' && (
        <div className="flex gap-3 items-center text-sm flex-wrap bg-gray-50 p-3 rounded-lg">
          <span className="text-gray-600">Desde:</span>
          <input type="date" value={rangoAnalisis.start}
            onChange={e => setRangoAnalisis(r => ({ ...r, start: e.target.value }))}
            className="border rounded px-2 py-1 text-sm" />
          <span className="text-gray-600">Hasta:</span>
          <input type="date" value={rangoAnalisis.end}
            onChange={e => setRangoAnalisis(r => ({ ...r, end: e.target.value }))}
            className="border rounded px-2 py-1 text-sm" />
        </div>
      )}

      {/* TABLA 1: Ventas por Medio con fechas */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-800 text-white p-3">
          <span className="font-bold text-sm">📊 VENTAS POR MEDIO</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left font-bold border-r">FECHA</th>
                {medios.map(m => (
                  <th key={m} colSpan={2} className="p-3 text-center font-bold border-r">{m}</th>
                ))}
                <th className="p-3 text-center font-bold bg-gray-200">TOTAL</th>
              </tr>
              <tr className="bg-gray-50 text-xs text-gray-500">
                <th className="p-2 border-r"></th>
                {medios.map(m => (
                  <React.Fragment key={m}>
                    <th className="p-2 text-center">Ventas</th>
                    <th className="p-2 text-center border-r">Monto</th>
                  </React.Fragment>
                ))}
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {fechasOrdenadas.length === 0 ? (
                <tr><td colSpan={medios.length * 2 + 2} className="p-4 text-center text-gray-400">Sin ventas en este período</td></tr>
              ) : (
                <>
                  {fechasOrdenadas.map((fecha, idx) => {
                    const filaTotal = medios.reduce((s, m) => s + (porFechaMedia[fecha][m]?.cantidad || 0), 0);
                    return (
                      <tr key={fecha} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="p-3 font-medium whitespace-nowrap border-r">{formatFecha(fecha)}</td>
                        {medios.map(m => {
                          const data = porFechaMedia[fecha][m];
                          return (
                            <React.Fragment key={m}>
                              <td className={`p-3 text-center ${data?.cantidad > 0 ? 'font-bold text-emerald-600' : 'text-gray-300'}`}>
                                {data?.cantidad || 0}
                              </td>
                              <td className={`p-3 text-center border-r ${data?.monto > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>
                                {data?.monto ? `S/ ${data.monto.toFixed(2)}` : '-'}
                              </td>
                            </React.Fragment>
                          );
                        })}
                        <td className="p-3 text-center font-bold bg-gray-100">{filaTotal}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-black text-white">
                    <td className="p-3 font-bold border-r">TOTAL</td>
                    {medios.map(m => (
                      <React.Fragment key={m}>
                        <td className="p-3 text-center font-bold">{totalPorMedio[m]?.cantidad || 0}</td>
                        <td className="p-3 text-center font-bold border-r">S/ {(totalPorMedio[m]?.monto || 0).toFixed(2)}</td>
                      </React.Fragment>
                    ))}
                    <td className="p-3 text-center font-bold">{ventasFiltradas.length}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLA 2: Clientes completos */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-800 text-white p-3 flex justify-between items-center">
          <span className="font-bold text-sm">👥 CLIENTES</span>
          <span className="text-xs text-gray-400">{clientesOrdenados.length} clientes</span>
        </div>
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0">
              <tr className="bg-gray-100">
                <th className="p-3 text-center font-bold">#</th>
                <th className="p-3 text-left font-bold">CLIENTE</th>
                <th className="p-3 text-center font-bold">UNIDADES</th>
                <th className="p-3 text-center font-bold">MONTO</th>
              </tr>
            </thead>
            <tbody>
              {clientesOrdenados.length === 0 ? (
                <tr><td colSpan={4} className="p-4 text-center text-gray-400">Sin ventas en este período</td></tr>
              ) : (
                clientesOrdenados.map(([nombre, data], idx) => (
                  <tr key={nombre} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-3 text-center text-gray-500">{idx + 1}</td>
                    <td className="p-3 font-medium">{nombre}</td>
                    <td className="p-3 text-center">{data.cantidad}</td>
                    <td className="p-3 text-center text-emerald-600 font-bold">S/ {data.monto.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLA 3: Por departamento simple */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-800 text-white p-3">
          <span className="font-bold text-sm">📍 POR DEPARTAMENTO</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left font-bold">DEPARTAMENTO</th>
              <th className="p-3 text-center font-bold">VENTAS</th>
              <th className="p-3 text-center font-bold">MONTO</th>
            </tr>
          </thead>
          <tbody>
            {deptosOrdenados.length === 0 ? (
              <tr><td colSpan={3} className="p-4 text-center text-gray-400">Sin ventas en este período</td></tr>
            ) : (
              <>
                {deptosOrdenados.map(([depto, data], idx) => (
                  <tr key={depto} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-3 font-medium">{depto}</td>
                    <td className="p-3 text-center">{data.cantidad}</td>
                    <td className="p-3 text-center text-emerald-600 font-bold">S/ {data.monto.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="bg-black text-white">
                  <td className="p-3 font-bold">TOTAL</td>
                  <td className="p-3 text-center font-bold">{ventasFiltradas.length}</td>
                  <td className="p-3 text-center font-bold">
                    S/ {ventasFiltradas.reduce((s, v) => s + v.total, 0).toFixed(2)}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-black text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-5 md:py-4">
          <div className="flex items-center justify-between">
            {/* Logo clickeable - vuelve al Dashboard */}
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              {/* Logo con imagen MÁS GRANDE */}
              <img 
                src={logoABermud} 
                alt="ABermud Logo" 
                className="w-16 h-16 md:w-14 md:h-14 rounded-full object-cover"
              />
              <div className="text-left">
                <h1 className="text-3xl md:text-2xl font-bold">ABermud</h1>
                <p className="text-base md:text-sm text-gray-300 italic">Lo bueno va contigo</p>
              </div>
            </button>

            <div className="hidden md:flex items-center gap-2">
              <div className="text-right mr-4">
                <p className="text-sm font-medium">Ingresos del día</p>
                <p className="text-xl font-bold text-emerald-400">
                  S/ {sales
                    .filter(s => s.fecha === getPeruDateTime().fecha)
                    .reduce((sum, s) => sum + s.total, 0)
                    .toFixed(2)}
                </p>
              </div>
            </div>

            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-white/10 rounded-lg"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* NAVIGATION */}
      <nav className={`
        ${mobileMenuOpen ? 'block' : 'hidden'} 
        md:block bg-white border-b sticky top-18 z-30 shadow-sm
      `}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-2 md:gap-0 py-2">
            {[
              { id: 'dashboard', icon: Home, label: 'Dashboard' },
              { id: 'productos', icon: Package, label: 'Productos' },
              { id: 'inventario', icon: ClipboardListIcon, label: 'Inventario' },
              { id: 'clientes', icon: Users, label: 'Clientes' },
              { id: 'ventas', icon: ShoppingCart, label: 'Ventas' },
              { id: 'reportes', icon: TrendingUp, label: 'Reportes' },
              { id: 'backup', icon: Download, label: 'Backup' },
              { id: 'configuracion', icon: Settings, label: 'Configuración' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileMenuOpen(false);
                }}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all
                  ${activeTab === tab.id 
                    ? 'bg-black text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                <tab.icon size={20} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 py-6 text-xl md:text-base">
        
       {/* TAB: DASHBOARD */}
{activeTab === 'dashboard' && (
  <div className="space-y-6">

    {/* 4 MÉTRICAS */}
<div className="grid grid-cols-4 gap-4">
  {(() => {
    const hoy = getPeruDateTime().fecha;
    const ayer = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    })();
    const mesActual = hoy.slice(0, 7);
    const mesAnterior = (() => {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    })();

    const ventasHoy = sales.filter(s => s.fecha === hoy).length;
    const ventasAyer = sales.filter(s => s.fecha === ayer).length;
    const pctVentas = ventasAyer === 0 ? 100 : Math.round(((ventasHoy - ventasAyer) / ventasAyer) * 100);

    const ingresosHoy = sales.filter(s => s.fecha === hoy).reduce((sum, s) => sum + s.total, 0);
    const ingresosAyer = sales.filter(s => s.fecha === ayer).reduce((sum, s) => sum + s.total, 0);
    const pctIngresos = ingresosAyer === 0 ? 100 : Math.round(((ingresosHoy - ingresosAyer) / ingresosAyer) * 100);

    const pedidosMes = sales.filter(s => s.fecha?.slice(0,7) === mesActual).length;
    const pedidosMesAnt = sales.filter(s => s.fecha?.slice(0,7) === mesAnterior).length;
    const pctPedidos = pedidosMesAnt === 0 ? 100 : Math.round(((pedidosMes - pedidosMesAnt) / pedidosMesAnt) * 100);

    const ventasMes = sales.filter(s => s.fecha?.slice(0,7) === mesActual).reduce((sum, s) => sum + s.total, 0);
    const ventasMesAnt = sales.filter(s => s.fecha?.slice(0,7) === mesAnterior).reduce((sum, s) => sum + s.total, 0);
    const pctVentasMes = ventasMesAnt === 0 ? 100 : parseFloat(((ventasMes - ventasMesAnt) / ventasMesAnt) * 100).toFixed(2);

    return (
      <>
        <div className="bg-white p-2 md:p-3 rounded-xl shadow-sm border">
          <p className="text-sm md:text-m text-gray-600 mb-1">Ventas hoy</p>
          <p className="text-xl md:text-2xl font-bold mt-1.5 mb-1.5">{ventasHoy}</p>
          <p className={`text-xs md:text-sm mt-0.5 font-medium ${pctVentas >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {pctVentas >= 0 ? '↑' : '↓'} {pctVentas >= 0 ? '+' : ''}{pctVentas}% vs ayer
          </p>
        </div>

        <div className="bg-white p-2 md:p-3 rounded-xl shadow-sm border">
          <p className="text-sm md:text-m text-gray-600 mb-1">Ingresos hoy</p>
          <p className="text-xl md:text-2xl font-bold mt-1.5 mb-1.5">S/{ingresosHoy.toFixed(0)}</p>
          <p className={`text-xs md:text-sm mt-0.5 font-medium ${pctIngresos >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {pctIngresos >= 0 ? '↑' : '↓'} {pctIngresos >= 0 ? '+' : ''}{pctIngresos}% vs ayer
          </p>
        </div>

        <div className="bg-white p-2 md:p-3 rounded-xl shadow-sm border">
          <p className="text-sm md:text-m text-gray-600 mb-1">Pedidos mes</p>
          <p className="text-xl md:text-2xl font-bold mt-1.5 mb-1.5">{pedidosMes}</p>
          <p className={`text-xs md:text-sm mt-0.5 font-medium ${pctPedidos >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {pctPedidos >= 0 ? '↑' : '↓'} {pctPedidos >= 0 ? '+' : ''}{pctPedidos}% vs anterior
          </p>
        </div>

        <div className="bg-white p-2 md:p-3 rounded-xl shadow-sm border">
          <p className="text-sm md:text-m text-gray-600 mb-1">Ventas mes</p>
          <p className="text-xl md:text-2xl font-bold mt-1.5 mb-1.5">S/{ventasMes.toFixed(0)}</p>
          <p className={`text-xs md:text-sm mt-0.5 font-medium ${pctVentasMes >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {pctVentasMes >= 0 ? '↑' : '↓'} {pctVentasMes >= 0 ? '+' : ''}{pctVentasMes}% vs anterior
          </p>
        </div>
      </>
    );
  })()}
</div>

    {/* VENTAS 7 DÍAS + EVOLUCIÓN MENSUAL */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* Ventas últimos 7 días */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-bold text-lg mb-4">📈 Ventas últimos 7 días</h3>
        {(() => {
          const dias = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const fechaStr = `${yyyy}-${mm}-${dd}`;
            const total = sales.filter(s => s.fecha === fechaStr).reduce((sum, s) => sum + s.total, 0);
            const label = i === 0 ? 'Hoy' : ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d.getDay()];
            dias.push({ label, total, esHoy: i === 0 });
          }
          const maxTotal = Math.max(...dias.map(d => d.total), 1);
          return (
            <div className="flex items-end gap-1 md:gap-2 h-28">
              {dias.map((dia, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <span className="text-xs md:text-xs text-gray-600 font-bold">
                    {dia.total > 0 ? `S/${Math.round(dia.total)}` : ''}
                  </span>
                  <div className="w-full rounded-t-md transition-all"
                    style={{ height: `${Math.max((dia.total / maxTotal) * 100, dia.total > 0 ? 5 : 2)}%`, background: dia.esHoy ? '#10b981' : '#2d2d2d' }}
                  />
                  <span className={`text-sm md:text-xs font-medium ${dia.esHoy ? 'text-emerald-700' : 'text-gray-500'}`}>
                    {dia.label}
                  </span>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

     {/* Evolución ventas mensuales */}
<div className="bg-white rounded-xl shadow-sm border p-2">
  <h3 className="font-bold text-lg mb-2">📊 Evolución de ventas mensuales</h3>
  {(() => {
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Set','Oct','Nov','Dic'];
    const anio = new Date().getFullYear();
    const mesActual = new Date().getMonth();
    const datos = meses.map((mes, idx) => {
      const mesStr = `${anio}-${String(idx+1).padStart(2,'0')}`;
      const total = sales.filter(s => s.fecha?.slice(0,7) === mesStr).reduce((sum, s) => sum + s.total, 0);
      return { mes, total, esActual: idx === mesActual };
    });
    const maxTotal = Math.max(...datos.map(d => d.total), 1);
    return (
      <div className="relative">
        <svg viewBox="0 0 300 100" className="w-full" style={{height:'130px'}}>
          {datos.map((d, idx) => {
            const x = (idx / 11) * 264 + 18;
            const y = 60 - (d.total / maxTotal) * 48;
            return (
              <g key={idx}>
                {idx < 11 && (
                  <line
                    x1={x} y1={y}
                    x2={((idx+1) / 11) * 264 + 18}
                    y2={60 - (datos[idx+1].total / maxTotal) * 48}
                    stroke="#2d2d2d" strokeWidth="1.5"
                  />
                )}
                <circle cx={x} cy={y} r="2"
                  fill={d.esActual ? '#f97316' : '#fff'}
                  stroke={d.esActual ? '#f97316' : '#2d2d2d'}
                  strokeWidth="1.5"
                />
                {d.total > 0 && (
                  <text x={x} y={y - 7} textAnchor="middle"
                    fontSize="8"
                    fill={d.esActual ? '#10b981' : '#555'}
                    fontWeight="bold">
                    S/{Math.round(d.total).toLocaleString()}
                  </text>
                )}
                <text x={x} y={88} textAnchor="middle" fontSize="9"
                  fill={d.esActual ? '#059669' : '#999'}
                  fontWeight={d.esActual ? 'bold' : 'normal'}>
                  {d.mes}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  })()}
</div>
</div>

    {/* PRODUCTOS + CANAL + DEPARTAMENTO */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {/* Top productos más vendidos */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-bold text-lg mb-4">🏆 Productos más vendidos · Este mes</h3>
        {(() => {
          const mesActual = getPeruDateTime().fecha.slice(0,7);
          const conteo = {};
          sales.filter(s => s.fecha?.slice(0,7) === mesActual).forEach(s => {
            (s.items || []).forEach(item => {
              conteo[item.modelo] = (conteo[item.modelo] || 0) + item.quantity;
            });
          });
          const sorted = Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 5);
          const maxVal = sorted[0]?.[1] || 1;
          return sorted.length > 0 ? (
            <div className="space-y-3">
              {sorted.map(([modelo, qty]) => (
                <div key={modelo}>
                  <div className="flex justify-between text-base text-gray-700 mb-1">
                    <span className="truncate mr-2">{modelo}</span>
                    <span className="font-bold text-base text-gray-900 flex-shrink-0">{qty} und</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(qty / maxVal) * 100}%`, background: '#2d2d2d' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">Sin ventas este mes</p>
          );
        })()}
      </div>

      {/* Canal LIVE vs TIENDA */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-bold text-lg mb-4">🛒 Ventas por canal · Este mes</h3>
        {(() => {
          const mesActual = getPeruDateTime().fecha.slice(0,7);
          const live = sales.filter(s => s.fecha?.slice(0,7) === mesActual && s.sales_channel === 'LIVE').reduce((sum, s) => sum + s.total, 0);
          const tienda = sales.filter(s => s.fecha?.slice(0,7) === mesActual && s.sales_channel === 'TIENDA').reduce((sum, s) => sum + s.total, 0);
          const total = live + tienda || 1;
          const livePct = Math.round((live / total) * 100);
          const tiendaPct = 100 - livePct;
          return (
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1 bg-gray-900 text-white rounded-lg p-3 text-center">
                  <p className="text-sm opacity-70">LIVE</p>
                  <p className="text-xl font-bold">{livePct}%</p>
                  <p className="text-sm opacity-60">S/{Math.round(live)}</p>
                </div>
                <div className="flex-1 bg-emerald-500 text-white rounded-lg p-3 text-center">
                  <p className="text-sm opacity-80">TIENDA</p>
                  <p className="text-xl font-bold">{tiendaPct}%</p>
                  <p className="text-sm opacity-70">S/{Math.round(tienda)}</p>
                </div>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
                <div className="h-full transition-all" style={{ width: `${livePct}%`, background: '#2d2d2d' }} />
                <div className="h-full transition-all" style={{ width: `${tiendaPct}%`, background: '#10b981' }} />
              </div>
            </div>
          );
        })()}
      </div>

      {/* Ventas por departamento */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-bold text-lg mb-4">📍 Ventas por departamento · Este mes</h3>
        {(() => {
          const mesActual = getPeruDateTime().fecha.slice(0,7);
          const deptMap = {};
          sales.filter(s => s.fecha?.slice(0,7) === mesActual).forEach(s => {
            const dept = s.client_department || 'Sin depto.';
            deptMap[dept] = (deptMap[dept] || 0) + s.total;
          });
          const sorted = Object.entries(deptMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
          const maxVal = sorted[0]?.[1] || 1;
          return sorted.length > 0 ? (
            <div className="space-y-2.5">
              {sorted.map(([dept, total]) => (
                <div key={dept} className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 w-20 flex-shrink-0 truncate">{dept}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(total / maxVal) * 100}%`, background: '#2d2d2d' }} />
                  </div>
                  <span className="text-sm font-bold text-gray-800 w-16 text-right flex-shrink-0">S/{Math.round(total)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">Sin datos este mes</p>
          );
        })()}
      </div>
    </div>

    {/* FOOTER */}
    <div className="mt-4 bg-black text-white text-center text-sm py-6 rounded-xl">
      <p className="font-medium text-white">© 2026 Qhapaq</p>
      <p className="mt-0.5 text-gray-400">Sistema de gestión de inventario y ventas</p>
      <p className="mt-0.5 text-gray-400">Parte de <span className="font-semibold text-white">InteliGest</span></p>
      <p className="text-xs mt-0.5 text-gray-500">Desarrollado en Perú {'\u{1F1F5}\u{1F1EA}'}</p>
    </div>

  </div>
)}

        {/* TAB: PRODUCTOS */}
{activeTab === 'productos' && (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row justify-between gap-3">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
          />
        </div>
      </div>
      <button
        onClick={() => setShowAddProduct(true)}
        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2 font-medium"
      >
        <Plus size={20} />
        Agregar Producto
      </button>
    </div>

    {/* Products Grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {[...filteredProducts]
  .sort((a, b) => {
    const getTotalStock = (product) => {
      let total = 0;
      Object.values(product.stock || {}).forEach(tallas => {
        Object.values(tallas).forEach(cantidad => total += cantidad);
        });
      return total;
    };

    // 1️⃣ Activos primero
    if (a.activo !== b.activo) {
      return a.activo ? -1 : 1;
    }

    // 2️⃣ Mayor stock primero
    return getTotalStock(b) - getTotalStock(a);
  })
  .map(product => {
    let totalStock = 0;
    Object.values(product.stock || {}).forEach(tallas => {
      Object.values(tallas).forEach(cantidad => totalStock += cantidad);
    });

    return (
      <div key={product.id} className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
        {/* NUEVO: Flex container para imagen izquierda + contenido derecha */}
        <div className="flex gap-2 mb-2">
          {/* Imagen a la izquierda */}
          {product.imagen && (
            <img 
              src={product.imagen} 
              alt={product.modelo} 
              className="w-20 h-20 object-contain rounded flex-shrink-0 bg-gray-50"
            />
          )}
          
          {/* Contenido principal */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg mb-1">{product.modelo}</h3>
                <p className="text-emerald-600 font-bold text-lg">S/ {product.precio_venta}</p>
                {product.precio_compra > 0 && (
                  <p className="text-xs text-gray-500">Compra: S/ {product.precio_compra}</p>
                )}
              </div>
              
              {/* Botones de acción */}
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => setEditingProduct(product)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="Editar"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => deleteProduct(product.id)}
                  className="p-2 hover:bg-red-50 text-red-600 rounded-lg"
                  title="Eliminar"
                >
                  <Trash2 size={18} />
                </button>
                <button
                  onClick={() => toggleProductActive(product.id, product.activo)}
                  className={`p-3 rounded-lg ${
                    product.activo 
                      ? 'hover:bg-green-100 text-green-600 font-bold bg-green-50' 
                      : 'hover:bg-gray-100 text-gray-800 font-bold bg-gray-100'
                  }`}
                  title={product.activo ? 'Producto Activo - Click para desactivar' : 'Producto Inactivo - Click para activar'}
                >
                  {product.activo ? '✓' : 'X'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stock y colores */}
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Stock Total:</span>
            <span className={`font-bold ${totalStock < 10 ? 'text-orange-600' : 'text-emerald-600'}`}>
              {totalStock} unidades
            </span>
          </div>

          {product.colors && product.colors.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Colores:</p>
              <div className="flex flex-wrap gap-1">
                {product.colors.map(color => (
                  <span key={color} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                    {color}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  })}
</div>

{filteredProducts.length === 0 && (
  <div className="text-center py-12 bg-white rounded-xl border">
    <Package className="mx-auto text-gray-400 mb-4" size={48} />
    <p className="text-gray-600">No se encontraron productos</p>
  </div>
)}

      </div>
    )}
   
      {/* TAB: INVENTARIO */}
{activeTab === 'inventario' && (
  <div className="space-y-6">

    {/* Header */}
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
      <h2 className="text-2xl font-bold text-gray-900">Inventario</h2>
      <button
        onClick={() => setShowAddStock(true)}
        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2 font-medium"
      >
        <Plus size={20} />
        Agregar Stock
      </button>
    </div>

    {/* REPORTES DE INVENTARIO */}
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="font-bold text-m">Filtrar reportes:</h3>
          <button onClick={() => setReportFilter('hoy')}
            className={`px-3 py-1.5 rounded-lg font-medium text-m ${reportFilter === 'hoy' ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
            Hoy
          </button>
          <button onClick={() => setReportFilter('personalizado')}
            className={`px-3 py-1.5 rounded-lg font-medium text-m ${reportFilter === 'personalizado' ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
            Personalizado
          </button>
          {reportFilter === 'personalizado' && (
            <div className="flex gap-2 items-center">
              <input type="date" value={customDateRange.start}
                onChange={(e) => setCustomDateRange({...customDateRange, start: e.target.value})}
                className="px-2 py-1.5 border rounded-lg text-sm" />
              <span className="text-sm">a</span>
              <input type="date" value={customDateRange.end}
                onChange={(e) => setCustomDateRange({...customDateRange, end: e.target.value})}
                className="px-2 py-1.5 border rounded-lg text-sm" />
            </div>
          )}
        </div>
      </div>  

  {/* Reporte 1: STOCK ACUMULADO - orden: más stock a la izquierda */}
  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
    <button className="w-full p-4 bg-blue-50 border-l-4 border-blue-500 flex items-center justify-between hover:bg-blue-100 transition-colors">
      <div className="flex items-center gap-2 flex-1">
        <BarChart3 size={20} className="text-blue-600" />
        <span className="font-bold text-left text-sm md:text-base">STOCK ACUMULADO AL {getPeruDateTime().fecha.split('-').reverse().join('/')}</span>
      </div>
      <button onClick={() => setShowStockModal('stock_fecha')} className="p-2 hover:bg-blue-200 rounded-lg transition-colors" title="Ver reporte">
        <Eye size={20} className="text-gray-600" />
      </button>
    </button>
    <div className="p-2 overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-1.5 text-left font-bold min-w-[60px]">FECHA</th>
            {(() => {
              const stockData = getStockALaFechaReport();
              const sortedProducts = [...products].filter(p => p.activo !== false).sort((a, b) => (stockData[b.modelo] || 0) - (stockData[a.modelo] || 0));
              return sortedProducts.map(p => (
                <th key={p.id} className="border p-1.5 font-bold min-w-[55px] md:min-w-[90px] text-[10px] md:text-sm text-center">
                  <span className="md:hidden">{abreviarNombreProducto(p.modelo)}</span>
                  <span className="hidden md:block">{p.modelo}</span>
                </th>
              ));
            })()}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border p-1 font-medium">{getPeruDateTime().fecha.split('-').reverse().join('/')}</td>
            {(() => {
              const stockData = getStockALaFechaReport();
              const sortedProducts = [...products].filter(p => p.activo !== false).sort((a, b) => (stockData[b.modelo] || 0) - (stockData[a.modelo] || 0));
              return sortedProducts.map(p => (
                <td key={p.id} className="border p-2 text-center">{stockData[p.modelo] || 0}</td>
              ));
            })()}
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  {/* Reporte 2: MOVIMIENTOS DE STOCK - orden: más ingresos a la izquierda */}
  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
    <button className="w-full p-4 bg-green-50 border-l-4 border-green-500 flex items-center justify-between hover:bg-green-100 transition-colors">
      <div className="flex items-center gap-2 flex-1">
        <Package size={20} className="text-green-600" />
        <span className="font-bold text-left text-sm md:text-base">MOVIMIENTOS DE STOCK AL {getPeruDateTime().fecha.split('-').reverse().join('/')}</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => descargarReportePDF('movimientos')} className="p-2 hover:bg-green-200 rounded-lg transition-colors" title="Descargar PDF">
          <FileDown size={20} className="text-red-600" />
        </button>
        <button onClick={() => setShowStockModal('movimientos')} className="p-2 hover:bg-green-200 rounded-lg transition-colors" title="Ver reporte">
          <Eye size={20} className="text-gray-600" />
        </button>
      </div>
    </button>
    <div className="p-2 overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-1.5 text-left font-bold min-w-[60px]">FECHA</th>
            {(() => {
              const ingresoData = getIngresoStockReport();
              const sortedProducts = [...products].filter(p => p.activo !== false).sort((a, b) => {
                const totalA = Object.values(ingresoData).reduce((sum, m) => sum + (m[a.modelo]?.ingreso || 0), 0);
                const totalB = Object.values(ingresoData).reduce((sum, m) => sum + (m[b.modelo]?.ingreso || 0), 0);
                return totalB - totalA;
              });
              return sortedProducts.map(p => (
                <th key={p.id} className="border p-1.5 font-bold min-w-[55px] md:min-w-[90px] text-[10px] md:text-sm text-center">
                  <span className="md:hidden">{abreviarNombreProducto(p.modelo)}</span>
                  <span className="hidden md:block">{p.modelo}</span>
                </th>
              ));
            })()}
          </tr>
        </thead>
        <tbody>
          {(() => {
            const ingresoData = getIngresoStockReport();
            const sortedProducts = [...products].filter(p => p.activo !== false).sort((a, b) => {
              const totalA = Object.values(ingresoData).reduce((sum, m) => sum + (m[a.modelo]?.ingreso || 0), 0);
              const totalB = Object.values(ingresoData).reduce((sum, m) => sum + (m[b.modelo]?.ingreso || 0), 0);
              return totalB - totalA;
            });
            return Object.keys(ingresoData).length > 0 ? (
              <>
                {Object.entries(ingresoData).map(([fecha, modelos]) => (
                  <tr key={fecha}>
                    <td className="border p-1 font-medium">{fecha.split('-').reverse().join('/')}</td>
                    {sortedProducts.map(p => (
                      <td key={p.id} className="border p-1.5 text-center cursor-pointer hover:bg-blue-50"
                        onClick={() => {
                          if (modelos[p.modelo] && (modelos[p.modelo].ingreso !== 0 || modelos[p.modelo].correccion !== 0)) {
                            const detail = getStockDetailByDate(fecha, p.modelo);
                            setStockDetailData(detail);
                            setShowStockDetail(true);
                          }
                        }}>
                        {modelos[p.modelo] ? (
                          <div className="flex items-center justify-center gap-1">
                            {modelos[p.modelo].ingreso !== 0 && <span className="text-sm">{modelos[p.modelo].ingreso}</span>}
                            {modelos[p.modelo].correccion !== 0 && <span className="text-red-600 font-bold text-xs">⚠️{modelos[p.modelo].correccion}</span>}
                            {modelos[p.modelo].ingreso === 0 && modelos[p.modelo].correccion === 0 && '-'}
                          </div>
                        ) : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold">
                  <td className="border p-2">TOTAL</td>
                  {sortedProducts.map(p => (
                    <td key={p.id} className="border p-2 text-center">
                      {Object.values(ingresoData).reduce((sum, m) => sum + (m[p.modelo]?.ingreso || 0) + (m[p.modelo]?.correccion || 0), 0)}
                    </td>
                  ))}
                </tr>
              </>
            ) : (
              <tr>
                <td colSpan={products.filter(p => p.activo !== false).length + 1} className="border p-4 text-center text-gray-500">
                  No hay ingresos en este período
                </td>
              </tr>
            );
          })()}
        </tbody>
      </table>
    </div>
  </div>

  {/* Reporte 3: SALIDA - VENTAS - orden: más vendidos a la izquierda */}
  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
    <button className="w-full p-4 bg-red-50 border-l-4 border-red-500 flex items-center justify-between hover:bg-red-100 transition-colors">
      <div className="flex items-center gap-2 flex-1">
        <ShoppingCart size={20} className="text-red-600" />
        <span className="font-bold text-left text-sm md:text-base">SALIDA - VENTAS AL {getPeruDateTime().fecha.split('-').reverse().join('/')}</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => descargarReportePDF('salidas')} className="p-2 hover:bg-red-200 rounded-lg transition-colors" title="Descargar PDF">
          <FileDown size={20} className="text-red-600" />
        </button>
        <button onClick={() => setShowStockModal('salidas')} className="p-2 hover:bg-red-200 rounded-lg transition-colors" title="Ver reporte">
          <Eye size={20} className="text-gray-600" />
        </button>
      </div>
    </button>
    <div className="p-2 overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-1.5 text-left font-bold min-w-[60px]">FECHA</th>
            {(() => {
              const salidaData = getSalidaVentasReport();
              const sortedProducts = [...products].filter(p => p.activo !== false).sort((a, b) => {
                const totalA = Object.values(salidaData).reduce((sum, m) => sum + (Number(m[a.modelo]) || 0), 0);
                const totalB = Object.values(salidaData).reduce((sum, m) => sum + (Number(m[b.modelo]) || 0), 0);
                return totalB - totalA;
              });
              return sortedProducts.map(p => (
                <th key={p.id} className="border p-1.5 font-bold min-w-[55px] md:min-w-[90px] text-[10px] md:text-sm text-center">
                  <span className="md:hidden">{abreviarNombreProducto(p.modelo)}</span>
                  <span className="hidden md:block">{p.modelo}</span>
                </th>
              ));
            })()}
          </tr>
        </thead>
        <tbody>
          {(() => {
            const salidaData = getSalidaVentasReport();
            const sortedProducts = [...products].filter(p => p.activo !== false).sort((a, b) => {
              const totalA = Object.values(salidaData).reduce((sum, m) => sum + (Number(m[a.modelo]) || 0), 0);
              const totalB = Object.values(salidaData).reduce((sum, m) => sum + (Number(m[b.modelo]) || 0), 0);
              return totalB - totalA;
            });
            return Object.keys(salidaData).length > 0 ? (
              <>
                {Object.entries(salidaData).map(([fecha, modelos]) => (
                  <tr key={fecha}>
                    <td className="border p-1 font-medium">{fecha.split('-').reverse().join('/')}</td>
                    {sortedProducts.map(p => (
                      <td key={p.id} className="border p-1.5 text-center">{modelos[p.modelo] || '0'}</td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold">
                  <td className="border p-2">TOTAL</td>
                  {sortedProducts.map(p => (
                    <td key={p.id} className="border p-2 text-center">
                      {Object.values(salidaData).reduce((sum, m) => sum + (Number(m[p.modelo]) || 0), 0)}
                    </td>
                  ))}
                </tr>
              </>
            ) : (
              <tr>
                <td colSpan={products.filter(p => p.activo !== false).length + 1} className="border p-4 text-center text-gray-500">
                  No hay ventas en este período
                </td>
              </tr>
            );
          })()}
        </tbody>
      </table>
    </div>
  </div>
</div>

{/* MODAL: Vista ampliada de reportes - FORMATO PROFESIONAL RESPONSIVE */}
{showStockModal && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 md:p-4 z-50">
    <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
      
      {/* HEADER DEL DOCUMENTO */}
      <div className="bg-black text-white p-3 md:p-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg md:text-2xl font-bold">ABermud</h1>
            <p className="text-xs md:text-sm italic">Lo bueno va contigo</p>
            <p className="text-[10px] md:text-xs mt-1 md:mt-2 opacity-90">
              {showStockModal === 'stock_fecha' && 'Reporte de Stock Acumulado'}
              {showStockModal === 'movimientos' && 'Reporte de Movimientos de Stock'}
              {showStockModal === 'salidas' && 'Reporte de Salida (Ventas)'}
            </p>
          </div>
          <button 
            onClick={() => setShowStockModal(null)} 
            className="p-1.5 md:p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="md:hidden" />
            <X size={24} className="hidden md:block" />
          </button>
        </div>
      </div>

      {/* CONTENIDO DEL DOCUMENTO */}
      <div className="flex-1 overflow-auto p-3 md:p-6 bg-gray-50">
        <div className="bg-white rounded-lg p-3 md:p-6 shadow-sm">
          {/* Fecha del reporte */}
          <div className="mb-3 md:mb-4 pb-2 md:pb-3 border-b">
            <p className="text-xs md:text-sm text-gray-600">
              <span className="font-semibold">Fecha:</span> {getPeruDateTime().fecha.split('-').reverse().join('/')}
            </p>
          </div>

          {/* TÍTULO DEL REPORTE */}
<div className="mb-3 md:mb-4">
  <h2 className="text-sm md:text-xl font-bold uppercase">
    {showStockModal === 'stock_fecha' && 
      `Stock Acumulado al ${getPeruDateTime().fecha.split('-').reverse().join('/')}`
    }

    {showStockModal === 'movimientos' && (() => {
  const datos = getIngresoStockReport();
  const fechas = Object.keys(datos).sort();
  const rango = fechas.length > 1
    ? `${fechas[0].split('-').reverse().join('/')} AL ${fechas[fechas.length-1].split('-').reverse().join('/')}`
    : getPeruDateTime().fecha.split('-').reverse().join('/');
  return `Movimientos de Stock ${rango}`;
})()}

{showStockModal === 'salidas' && (() => {
  const datos = getSalidaVentasReport();
  const fechas = Object.keys(datos).sort();
  const rango = fechas.length > 1
    ? `${fechas[0].split('-').reverse().join('/')} AL ${fechas[fechas.length-1].split('-').reverse().join('/')}`
    : getPeruDateTime().fecha.split('-').reverse().join('/');
  return `Salida (Ventas) ${rango}`;
})()}
  </h2>

  {reportFilter === 'personalizado' && showStockModal !== 'stock_fecha' && (
    <p className="text-xs md:text-sm text-gray-600 mt-1">
      Filtrado: {customDateRange.start.split('-').reverse().join('/')} - {customDateRange.end.split('-').reverse().join('/')}
    </p>
  )}
</div>

          {/* TABLA DEL REPORTE */}
          <div className="overflow-x-auto -mx-3 md:mx-0">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-black text-white">
                  <th className="border border-gray-300 p-1 md:p-2 text-left font-bold sticky left-0 bg-black z-10 text-[8px] md:text-sm min-w-[60px] md:min-w-[80px]">
                    FECHA
                  </th>
                  {(() => {
                    const stockData = getStockALaFechaReport();
                    const sortedProducts = [...products].filter(p => p.activo !== false).sort((a, b) => {
                      const stockA = stockData[a.modelo] || 0;
                      const stockB = stockData[b.modelo] || 0;
                      return stockB - stockA;
                    });
                    return sortedProducts.map(p => (
                      <th key={p.id} className="border border-gray-300 p-1 md:p-2 text-center font-bold min-w-[50px] md:min-w-[100px] text-[9px] md:text-sm">
                        <span className="md:hidden">{abreviarNombreProducto(p.modelo)}</span>
                        <span className="hidden md:block">{p.modelo}</span>
                      </th>
                    ));
                  })()}
                </tr>
              </thead>
              <tbody>

                {/* STOCK ACUMULADO */}
{showStockModal === 'stock_fecha' && (
  <>
    <tr className="even:bg-gray-50">
      <td className="border border-gray-300 p-1 md:p-2 font-medium sticky left-0 bg-white z-10 text-[10px] md:text-sm">
        {getPeruDateTime().fecha.split('-').reverse().join('/')}
      </td>
      {(() => {
        const stockData = getStockALaFechaReport();
        const sortedProducts = [...products].filter(p => p.activo !== false).sort((a, b) => {
          const stockA = stockData[a.modelo] || 0;
          const stockB = stockData[b.modelo] || 0;
          return stockB - stockA;
        });
        return sortedProducts.map(p => (
          <td
            key={p.id}
            className="border border-gray-300 p-1 md:p-2 text-center font-bold text-sm md:text-sm"
          >
            {stockData[p.modelo] || 0}
          </td>
        ));
      })()}
    </tr>
  </>
)}

                {/* MOVIMIENTOS DE STOCK */}
{showStockModal === 'movimientos' && (
  (() => {
    const ingresoData = getIngresoStockReport();
    const sortedProducts = [...products].filter(p => p.activo !== false).sort((a, b) => {
      const totalA = Object.values(ingresoData).reduce((sum, m) => sum + (m[a.modelo]?.ingreso || 0), 0);
      const totalB = Object.values(ingresoData).reduce((sum, m) => sum + (m[b.modelo]?.ingreso || 0), 0);
      return totalB - totalA;
    });
    
    return Object.keys(ingresoData).length > 0 ? (
      Object.entries(ingresoData).map(([fecha, modelos]) => (
        <tr key={fecha} className="even:bg-gray-50">
          <td className="border border-gray-300 p-1 md:p-2 font-medium sticky left-0 bg-white z-10 text-[10px] md:text-sm">
            {fecha.split('-').reverse().join('/')}
          </td>
          {sortedProducts.map(p => (
            <td 
              key={p.id} 
              className="border p-1.5 text-center cursor-pointer hover:bg-blue-50"
              onClick={() => {
                if (modelos[p.modelo] && (modelos[p.modelo].ingreso !== 0 || modelos[p.modelo].correccion !== 0)) {
                  const detail = getStockDetailByDate(fecha, p.modelo);
                  setStockDetailData(detail);
                  setShowStockDetail(true);
                }
              }}
            >
    {modelos[p.modelo] ? (
      <div className="flex items-center justify-center gap-1">
                 {modelos[p.modelo].ingreso !== 0 && (
                   <span className="text-sm">{modelos[p.modelo].ingreso}</span>
                 )}
                 {modelos[p.modelo].correccion !== 0 && (
                   <span className="text-red-600 font-bold text-xs">⚠️{modelos[p.modelo].correccion}</span>
                )}
                {modelos[p.modelo].ingreso === 0 && modelos[p.modelo].correccion === 0 && '-'}
              </div>
            ) : '-'}
          </td>
        ))}
        </tr>
      ))
    ) : (
      <tr>
        <td colSpan={products.length + 1} className="border border-gray-300 p-4 md:p-8 text-center text-gray-500 text-xs md:text-sm">
          No hay ingresos en este período
        </td>
      </tr>
    );
  })()
)}
{showStockModal === 'movimientos' && (
  <tr className="bg-gray-200 font-bold">
    <td className="border border-gray-300 p-1 md:p-2 sticky left-0 bg-gray-200 z-10 text-[10px] md:text-sm">TOTAL</td>
    {(() => {
      const ingresoData = getIngresoStockReport();
      const stockData = getStockALaFechaReport();
      const sortedProducts = [...products].sort((a, b) => (stockData[b.modelo] || 0) - (stockData[a.modelo] || 0));
      return sortedProducts.map(p => (
        <td key={p.id} className="border border-gray-300 p-1 md:p-2 text-center text-xs md:text-sm">
          {Object.values(ingresoData).reduce((sum, m) => 
            sum + (m[p.modelo]?.ingreso || 0) + (m[p.modelo]?.correccion || 0), 0
          )}
        </td>
      ));
    })()}
  </tr>
)}

                {/* SALIDA - VENTAS */}
                {showStockModal === 'salidas' && (
  (() => {
    const salidaData = getSalidaVentasReport(); // ← FALTABA ESTO
    const sortedProducts = [...products].filter(p => p.activo !== false).sort((a, b) => {
      const totalA = Object.values(salidaData).reduce((sum, m) => sum + (Number(m[a.modelo]) || 0), 0);
      const totalB = Object.values(salidaData).reduce((sum, m) => sum + (Number(m[b.modelo]) || 0), 0);
      return totalB - totalA;
    });

    return Object.keys(salidaData).length > 0 ? (
      Object.entries(salidaData).map(([fecha, modelos]) => (
        <tr key={fecha} className="even:bg-gray-50">
          <td className="border border-gray-300 p-1 md:p-2 font-medium sticky left-0 bg-white z-10 text-[10px] md:text-sm">
            {fecha.split('-').reverse().join('/')}
          </td>
          {sortedProducts.map(p => (
            <td key={p.id} className="border border-gray-300 p-1 md:p-2 text-center text-xs md:text-sm">
              {modelos[p.modelo] || '-'}
            </td>
          ))}
        </tr>
      ))
    ) : (
      <tr>
        <td colSpan={products.length + 1} className="border border-gray-300 p-4 md:p-8 text-center text-gray-500 text-xs md:text-sm">
          No hay ventas en este período
        </td>
      </tr>
    );
  })()
)}
                {showStockModal === 'salidas' && (() => {
                  const salidaData = getSalidaVentasReport();
                  const stockData = getStockALaFechaReport();
                  const sortedProducts = [...products].sort((a, b) => (stockData[b.modelo] || 0) - (stockData[a.modelo] || 0));
                  return Object.keys(salidaData).length > 0 ? (
                    <tr className="bg-gray-200 font-bold">
                      <td className="border border-gray-300 p-1 md:p-2 sticky left-0 bg-gray-200 z-10 text-[10px] md:text-sm">TOTAL</td>
                      {sortedProducts.map(p => (
                        <td key={p.id} className="border border-gray-300 p-1 md:p-2 text-center text-xs md:text-sm">
                          {Object.values(salidaData).reduce((sum, m) => sum + (Number(m[p.modelo]) || 0), 0)}
                        </td>
                      ))}
                    </tr>
                  ) : null;
                })()}
              </tbody>
            </table>
          </div>

          {/* RESUMEN (solo para Stock a la Fecha) */}
          {showStockModal === 'stock_fecha' && (
            <div className="mt-4 md:mt-6 p-3 md:p-4 bg-gray-100 rounded-lg">
              <h3 className="font-bold text-xs md:text-sm uppercase mb-2">Resumen de Inventario</h3>
              <div className="grid grid-cols-2 gap-2 md:gap-4 text-xs md:text-sm">
                <div>
                  <span className="text-gray-600">Total de productos:</span>
                  <span className="ml-2 font-bold">{products.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total de unidades:</span>
                  <span className="ml-2 font-bold">
                    {(() => {
                      const stockData = getStockALaFechaReport();
                      return Object.values(stockData).reduce((sum, qty) => sum + qty, 0);
                    })()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
)}
</div>
)}

{/* ============================================ */}
{/* TAB: CLIENTES */}
{/* ============================================ */}
        {activeTab === 'clientes' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar clientes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
                  />
                </div>
              </div>
              <button
                onClick={() => setShowAddClient(true)}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2 font-medium"
              >
                <Plus size={20} />
                Agregar Cliente
              </button>
            </div>

            {/* Clients Table */}
            <div className="bg-white rounded-m shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                      <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">DNI</th>
                      <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                      <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Departamento</th>
                      <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredClients.map(client => (
                      <tr key={client.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="font-medium">{client.nombre}</div>
                          {client.direccion && (
                            <div className="text-sm text-gray-500">{client.direccion}</div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">{client.dni || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">{client.telefono || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">{client.departamento || '-'}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingClient(client)}
                              className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => deleteClient(client.id)}
                              className="p-2 hover:bg-red-50 text-red-600 rounded-lg"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredClients.length === 0 && (
                <div className="text-center py-12">
                  <Users className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">No se encontraron clientes</p>
                </div>
              )}
            </div>
          </div>
        )}

{/* ============================================ */}
{/* TAB: VENTAS */}
{/* ============================================ */}
{activeTab === 'ventas' && (
  <div className="space-y-4">
    {/* Header con filtros */}
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Ventas</h2>
        <button
          onClick={() => setShowAddSale(true)}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2 font-medium text-sm"
        >
          <Plus size={18} />
          Nueva Venta
        </button>
      </div>
      
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setReportFilter('hoy')}
          className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${
            reportFilter === 'hoy'
              ? 'bg-black text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          Hoy
        </button>
        <button
          onClick={() => setReportFilter('personalizado')}
          className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${
            reportFilter === 'personalizado'
              ? 'bg-black text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          Personalizado
        </button>
        
        {reportFilter === 'personalizado' && (
          <>
            <input
              type="date"
              value={customDateRange.start}
              onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
              className="px-2 py-1.5 border rounded-lg text-sm"
            />
            <span className="text-gray-500 text-sm">-</span>
            <input
              type="date"
              value={customDateRange.end}
              onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
              className="px-2 py-1.5 border rounded-lg text-sm"
            />
          </>
        )}
      </div>
    </div>

    {/* Sales List - MÁS COMPACTO */}
    <div className="space-y-2">
      {(() => {
        const { start, end } = getDateRangeForFilter(reportFilter);
        const filteredSales = sales.filter(s => s.fecha >= start && s.fecha <= end);
        
        return filteredSales.length > 0 ? (
          filteredSales.map(sale => (
            <div key={sale.id} className="bg-white p-2.5 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between gap-2">
                {/* Icono + Info */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="p-1.5 bg-emerald-50 rounded-lg flex-shrink-0">
                    <ShoppingCart className="text-emerald-600" size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-xs truncate">Pedido #{sale.order_number}</h3>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
                        sale.sales_channel === 'LIVE' 
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {sale.sales_channel}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 truncate">{sale.client_name}</p>
                    <p className="text-xs text-gray-500">{sale.fecha.split('-').reverse().join('/')}</p>
                  </div>
                </div>
                
                {/* Total + Botón */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Total</p>
                    <p className="text-base font-bold text-emerald-600">S/ {sale.total.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => setViewingSale(sale)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg"
                    title="Ver detalle"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border">
            <ShoppingCart className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 text-sm">
              {sales.length === 0 
                ? 'No hay ventas registradas' 
                : 'No hay ventas en el rango seleccionado'}
            </p>
          </div>
        );
      })()}
    </div>
  </div>
)}

{/* ============================================ */}
{/* TAB: REPORTES - PANEL SIMPLE */}
{activeTab === 'reportes' && (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">Reportes y Análisis</h2>
    
    {/* Filtros Compartidos */}
    <div className="bg-white p-4 rounded-xl shadow-sm border">
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setReportFilter('hoy')}
          className={`px-4 py-2 rounded-lg font-medium ${
            reportFilter === 'hoy' ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Hoy
        </button>
        <button
          onClick={() => setReportFilter('personalizado')}
          className={`px-4 py-2 rounded-lg font-medium ${
            reportFilter === 'personalizado' ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Personalizado
        </button>

        {reportFilter === 'personalizado' && (
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={customDateRange.start}
              onChange={(e) => setCustomDateRange({...customDateRange, start: e.target.value})}
              className="px-3 py-2 border rounded-lg"
            />
            <span>a</span>
            <input
              type="date"
              value={customDateRange.end}
              onChange={(e) => setCustomDateRange({...customDateRange, end: e.target.value})}
              className="px-3 py-2 border rounded-lg"
            />
          </div>
        )}
      </div>
    </div>

    {/* Panel de Reportes - 4 Tarjetas */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* Tarjeta 1: Stock General */}
      <div className="bg-gradient-to-br from-blue-100 to-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold mb-1">Stock General</h3>
            <p className="text-sm text-gray-600">Vista matricial con semaforización</p>
          </div>
          <FileText className="text-gray-400" size={24} />
        </div>
        <button
          onClick={generarPDFStockGeneral}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 font-medium transition-colors"
        >
          <FileDown size={18} />
          Exportar PDF
        </button>
        <button
          onClick={() => setShowModalStockGeneral(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 text-black rounded-lg hover:bg-gray-300 font-medium transition-colors mt-2"
        >
          <Eye size={18} />
          Ver Vista Previa
        </button>
      </div>

      {/* Tarjeta 2: Stock para Clientes */}
      <div className="bg-gradient-to-br from-purple-100 to-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold mb-1">Stock para Clientes</h3>
            <p className="text-sm text-gray-600">Sin cantidades, solo colores</p>
          </div>
          <FileText className="text-gray-400" size={24} />
        </div>
        <button
          onClick={generarPDFStockClientes}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 font-medium transition-colors"
        >
          <FileDown size={18} />
          Exportar PDF
        </button>
        <button
          onClick={() => setShowModalStockClientes(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 text-black rounded-lg hover:bg-gray-300 font-medium transition-colors mt-2"
        >
          <Eye size={18} />
          Ver Vista Previa
        </button>
      </div>

      {/* Tarjeta 3: Reporte de Ventas */}
      <div className="p-6 rounded-xl shadow-sm border bg-gradient-to-br from-emerald-100 to-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold mb-1">Reporte de Ventas</h3>
            <p className="text-sm text-gray-600">Por modelo</p>
          </div>
          <FileText className="text-emerald-600" size={24} />
        </div>
        <button
          onClick={generarPDFReporteVentas}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 font-medium transition-colors"
        >
          <FileDown size={18} />
          Exportar PDF
        </button>
        <button
          onClick={() => setShowModalReporteVentas(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 text-black rounded-lg hover:bg-gray-300 font-medium transition-colors mt-2"
        >
          <Eye size={18} />
          Ver Vista Previa
        </button>
      </div>

      {/* Tarjeta 4: Análisis de Ventas */}
      <div className="p-6 rounded-xl shadow-sm border bg-gradient-to-br from-slate-100 to-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold mb-1">Análisis de Ventas</h3>
            <p className="text-sm text-gray-600">Medio, clientes y departamento</p>
          </div>
          <FileText className="text-slate-600" size={24} />
        </div>
        <button
          onClick={generarPDFAnalisisVentas}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 font-medium transition-colors"
        >
          <FileDown size={18} />
          Exportar PDF
        </button>
        <button
          onClick={() => setShowModalAnalisisVentas(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 text-black rounded-lg hover:bg-gray-300 font-medium transition-colors mt-2"
        >
          <Eye size={18} />
          Ver Vista Previa
        </button>
      </div>

    </div>
  </div>
)}

{/* MODAL: Stock General */}
{showModalStockGeneral && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
        <h3 className="text-xl font-bold">📦 Stock General</h3>
        <button
          onClick={() => setShowModalStockGeneral(false)}
          className="text-gray-500 hover:text-black"
        >
          <X size={24} />
        </button>
      </div>
      
      <div className="p-4 space-y-3">
        {getStockGeneralReport().map((productData, idx) => (
          <div key={idx} className="border rounded-lg p-4">
            <h4 className="font-bold mb-3 bg-black text-white p-2 rounded flex justify-between items-center">
              <span>{productData.modelo}</span>
              <span className="text-emerald-400">
                {Object.values(productData.stockByColor).reduce((sum, tallas) => 
                  sum + Object.values(tallas).reduce((a, b) => a + b, 0), 0)}
              </span>
            </h4>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-black text-white">
                  <th className="border border-white p-1 text-left">COLOR</th>
                  <th className="border border-white p-1 text-center">S</th>
                  <th className="border border-white p-1 text-center">M</th>
                  <th className="border border-white p-1 text-center">L</th>
                  <th className="border border-white p-1 text-center">XL</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(productData.stockByColor).map(([color, tallas]) => (
                  <tr key={color}>
                    <td className="border p-1 text-sm">{color}</td>
                    {['S', 'M', 'L', 'XL'].map(talla => {
                      const cantidad = tallas[talla] || 0;
                      const bgColor = cantidad > 10 ? 'bg-green-100' : cantidad >= 6 ? 'bg-yellow-100' : cantidad > 0 ? 'bg-red-100' : 'bg-gray-50';
                      return (
                        <td key={talla} className={`border p-1 text-center text-sm ${bgColor}`}>
                          {cantidad}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  </div>
)}
  
{/* MODAL: Stock para Clientes */}
{showModalStockClientes && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
        <h3 className="text-xl font-bold">👥 Stock para Clientes</h3>
        <button
          onClick={() => setShowModalStockClientes(false)}
          className="text-gray-500 hover:text-black"
        >
          <X size={24} />
        </button>
      </div>
      
      <div className="p-4 space-y-3">
        <p className="text-sm text-gray-600 italic">Colores disponibles (sin cantidades)</p>
        
        {getStockClientesReport().map((productData, idx) => (
          <div key={idx} className="border rounded-lg p-3">
            <h4 className="font-bold mb-2 text-center bg-black text-white p-2 rounded text-sm">
              {productData.modelo}
            </h4>
            <table className="w-full text-xs md:text-sm border-collapse">
              <thead>
                <tr className="bg-black text-white">
                  <th className="border border-white p-1 text-center text-xs">S</th>
                  <th className="border border-white p-1 text-center text-xs">M</th>
                  <th className="border border-white p-1 text-center text-xs">L</th>
                  <th className="border border-white p-1 text-center text-xs">XL</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {['S', 'M', 'L', 'XL'].map(talla => (
                    <td key={talla} className="border p-2 align-top w-1/4">
                      {productData.colorsByTalla[talla]?.length > 0 ? (
                        <div className="space-y-2">
                          {productData.colorsByTalla[talla].map((color, i) => (
                            <div key={i} className="bg-gray-100 border rounded px-1.5 py-0.5 text-xs md:text-sm break-words">
                              {color}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-400">-</div>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  </div>
)}

{/* MODAL: Reporte de Ventas */}
{showModalReporteVentas && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">

      {/* PANTALLA 1 */}
      {vistaReporteVentas === 'lista' && (
        <>
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
            <h3 className="text-xl font-bold">📊 Reporte de Ventas</h3>
            <button onClick={() => setShowModalReporteVentas(false)}><X size={24} /></button>
          </div>
          <div className="p-4 space-y-3">
            <p className="text-sm text-gray-500">Ventas por Fecha · Haz clic en una fecha para ver el detalle</p>
            {Object.entries(
              sales.reduce((acc, sale) => {
                if (!acc[sale.fecha]) acc[sale.fecha] = { ventas: 0, total: 0 };
                acc[sale.fecha].ventas += 1;
                acc[sale.fecha].total += sale.total;
                return acc;
              }, {})
            )
              .sort((a, b) => b[0].localeCompare(a[0]))
              .map(([fecha, data]) => (
                <button key={fecha}
                  onClick={() => { setFechaSeleccionadaVentas(fecha); setVistaReporteVentas('detalle'); }}
                  className="w-full text-left border rounded-lg p-4 hover:bg-gray-50 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">
                      📅 {new Date(fecha + 'T12:00:00').toLocaleDateString('es-PE', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                    <p className="text-sm text-gray-500">{data.ventas} {data.ventas === 1 ? 'venta' : 'ventas'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-emerald-600">S/ {data.total.toFixed(2)}</span>
                    <span className="text-gray-400">›</span>
                  </div>
                </button>
              ))}
          </div>
        </>
      )}

      {/* PANTALLA 2 */}
      {vistaReporteVentas === 'detalle' && fechaSeleccionadaVentas && (
        <DetalleVentas
          fechaSeleccionada={fechaSeleccionadaVentas}
          sales={sales}
          products={products}
          onVolver={() => setVistaReporteVentas('lista')}
          onCerrar={() => setShowModalReporteVentas(false)}
        />
      )}

    </div>
  </div>
)}

{/* MODAL: Análisis de Ventas */}
{showModalAnalisisVentas && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
        <h3 className="text-xl font-bold">📈 Análisis de Ventas</h3>
        <button onClick={() => setShowModalAnalisisVentas(false)}><X size={24} /></button>
      </div>
      <AnalisisVentas
        sales={sales}
        clients={clients}
        onCerrar={() => setShowModalAnalisisVentas(false)}
      />
    </div>
  </div>
)}

        {/* ============================================ */}
        {/* TAB: BACKUP */}
        {/* ============================================ */}
        {activeTab === 'backup' && (
          <div className="space-y-6">
            {/* Botón Volver - Solo Móvil */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className="md:hidden flex items-center gap-2 text-gray-600 hover:text-black font-medium"
            >
              <ChevronLeft size={20} />
              <span>Volver al Dashboard</span>
            </button>

            <div className="bg-white p-8 rounded-xl shadow-sm border text-center">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download size={40} className="text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Backup de Datos</h2>
                <p className="text-gray-600 mb-4">
                  Esta funcionalidad está en desarrollo
                </p>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm text-orange-800">
                    Próximamente podrás descargar un backup completo de tus datos en formato Excel
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* TAB: CONFIGURACIÓN */}
        {/* ============================================ */}
        {activeTab === 'configuracion' && (
          <div className="space-y-6">
            {/* Botón Volver - Solo Móvil */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className="md:hidden flex items-center gap-2 text-gray-600 hover:text-black font-medium"
            >
              <ChevronLeft size={20} />
              <span>Volver al Dashboard</span>
            </button>

            <div className="bg-white p-8 rounded-xl shadow-sm border text-center">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M12 1v6m0 6v6"></path>
                    <path d="m4.2 4.2 4.3 4.3m5 5 4.3 4.3"></path>
                    <path d="M1 12h6m6 0h6"></path>
                    <path d="m4.2 19.8 4.3-4.3m5-5 4.3-4.3"></path>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">Configuración</h2>
                <p className="text-gray-600 mb-4">
                  Esta funcionalidad está en desarrollo
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-800">
                    Próximamente podrás configurar usuarios, claves y ajustes del sistema
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        </main>

      {/* ============================================ */}
      {/* MODALES */}
      {/* ============================================ */}

      {/* MODAL: Agregar/Editar Producto */}
      {(showAddProduct || editingProduct) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingProduct ? 'Editar Producto' : 'Agregar Producto'}
              </h2>
              <button 
                onClick={() => {
                  setShowAddProduct(false);
                  setEditingProduct(null);
                  resetNewProduct();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Modelo *</label>
                <input
                  type="text"
                  value={editingProduct ? editingProduct.modelo : newProduct.modelo}
                  onChange={(e) => editingProduct 
                    ? setEditingProduct({...editingProduct, modelo: e.target.value})
                    : setNewProduct({...newProduct, modelo: e.target.value})
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
                  placeholder="Ej: Jogger Casual"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Precio Venta *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct ? editingProduct.precio_venta : newProduct.precioVenta}
                    onChange={(e) => editingProduct
                      ? setEditingProduct({...editingProduct, precio_venta: e.target.value})
                      : setNewProduct({...newProduct, precioVenta: e.target.value})
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
                    placeholder="25.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Precio Compra</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct ? editingProduct.precio_compra : newProduct.precioCompra}
                    onChange={(e) => editingProduct
                      ? setEditingProduct({...editingProduct, precio_compra: e.target.value})
                      : setNewProduct({...newProduct, precioCompra: e.target.value})
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
                    placeholder="15.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">URL de Imagen</label>
                <input
                  type="text"
                  value={editingProduct ? editingProduct.imagen : newProduct.imagen}
                  onChange={(e) => editingProduct
                    ? setEditingProduct({...editingProduct, imagen: e.target.value})
                    : setNewProduct({...newProduct, imagen: e.target.value})
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Colores Disponibles</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newColorInput}
                    onChange={(e) => setNewColorInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addColorToProduct(editingProduct || newProduct);
                      }
                    }}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
                    placeholder="Ej: Negro, Azul..."
                  />
                  <button
                    onClick={() => addColorToProduct(editingProduct || newProduct)}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(editingProduct ? editingProduct.colors : newProduct.colors).map(color => (
                    <span key={color} className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      {color}
                      <button
                        onClick={() => removeColorFromProduct(editingProduct || newProduct, color)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowAddProduct(false);
                    setEditingProduct(null);
                    resetNewProduct();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={editingProduct ? updateProduct : addProduct}
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-medium"
                >
                  {editingProduct ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Agregar Stock - SIMPLIFICADO V2 */}
{showAddStock && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-2xl p-6 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Agregar Stock</h2>
        <button 
          onClick={() => {
            setShowAddStock(false);
            setStockToAdd({ modelo: '', colors: {} });
          }}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4">

        {/* Instrucciones */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
          <p className="text-sm text-blue-900">
            💡 <strong>Tip:</strong> Escribe números positivos para ingresar (+14) o negativos para corregir (-10)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Seleccionar Producto</label>
          <select
            value={stockToAdd.modelo}
            onChange={(e) => setStockToAdd({ ...stockToAdd, modelo: e.target.value, colors: {} })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
          >
            <option value="">-- Seleccionar --</option>
            {products.filter(p => p.activo !== false).map(p => (
              <option key={p.id} value={p.modelo}>{p.modelo}</option>
            ))}
          </select>
        </div>

        {/* Input unificado para todas las tallas */}
        {stockToAdd.modelo && (
          <div className="border-2 rounded-lg p-4 border-gray-200">
            {products.find(p => p.modelo === stockToAdd.modelo)?.colors.map(color => (
              <div key={color} className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium mb-2">{color}</p>
                <div className="grid grid-cols-4 gap-2 md:gap-4">
                  {['S', 'M', 'L', 'XL'].map(talla => {
                    const val = parseInt(stockToAdd.colors[color]?.[talla]) || 0;
                    const stockActual = products.find(p => p.modelo === stockToAdd.modelo)?.stock?.[color]?.[talla] || 0;
                    
                    return (
                      <div key={talla} className="flex flex-col items-center gap-1">
                        <label className={`text-xs font-medium px-2 py-1 rounded ${
                          stockActual >= 10
                            ? 'bg-green-100 text-green-800'     // Verde: stock alto
                            : stockActual >= 6
                              ? 'bg-yellow-100 text-yellow-800' // Amarillo: stock medio
                              : stockActual > 0
                                ? 'bg-red-100 text-red-800'     // Rojo: stock bajo
                                : 'bg-gray-100 text-gray-500'   // Gris: sin stock
                      }`}>
                        {talla} ({stockActual})
                      </label>
                        
                        {/* Input unificado - acepta positivos y negativos */}
                        <input
                          type="text"
                          inputMode="text"
                          placeholder="0"
                          value={stockToAdd.colors[color]?.[talla] || ''}
                          onChange={(e) => {
                            const newColors = { ...stockToAdd.colors };
                            if (!newColors[color]) newColors[color] = {};
                            newColors[color][talla] = e.target.value;
                            setStockToAdd({ ...stockToAdd, colors: newColors });
                          }}
                          className={`w-full px-2 py-2 border rounded text-center text-sm ${
                            val !== 0
                              ? val > 0
                                ? 'font-bold border-2 border-green-600 bg-lime-300 text-black'  // Positivo: verde
                                : 'font-bold border-2 border-red-600 bg-red-100 text-red-800'   // Negativo: rojo
                              : 'border-gray-300'  // Vacío: normal
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowAddStock(false);
              setStockToAdd({ modelo: '', colors: {} });
            }}
            className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={addStockToProduct}
            disabled={isProcessing}
            className={`flex-1 px-4 py-2 text-white rounded-lg font-medium ${
              isProcessing 
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >  
            {isProcessing ? '⏳ Procesando...' : '📦 Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

{/* MODAL: Confirmación de Stock Agregado */}
{showStockDetail && stockDetailData && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {stockDetailData.esCorreccion ? (
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
          ) : (
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          )}
          <h2 className="text-lg font-bold">
            {stockDetailData.esCorreccion ? 'Corrección Guardada' : 'Stock Agregado'}
          </h2>
        </div>
        <button 
          onClick={() => setShowStockDetail(false)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <X size={20} />
        </button>
      </div>

      {/* Fecha y Modelo */}
      <div className="mb-4 pb-3 border-b">
        <p className="text-sm text-gray-600">
          {stockDetailData.fecha.split('-').reverse().join('/')} - {stockDetailData.modelo}
        </p>
      </div>

      {/* Detalle cronológico por operación */}
<div className="mb-4 space-y-3 max-h-60 overflow-y-auto">
  {stockDetailData.operaciones ? (
    // Mostrar por operaciones (cuando se hace clic en tabla)
    stockDetailData.operaciones.map((operacion, idx) => {
      const grouped = {};
      operacion.items.forEach(item => {
        if (!grouped[item.color]) grouped[item.color] = [];
        grouped[item.color].push(item);
      });

      return (
        <div key={idx} className="pb-2 border-b border-gray-200 last:border-0">
          <p className="text-xs text-gray-500 mb-1">{operacion.hora}</p>
          {Object.entries(grouped).map(([color, items]) => (
            <div key={color} className="text-sm">
              <span className="font-medium">{color}:</span>{' '}
              {items.map((item, i) => (
                <span key={i}>
                  {item.talla}({item.cantidad > 0 ? '+' : ''}{item.cantidad})
                  {i < items.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
          ))}
        </div>
      );
    })
  ) : (
    // Mostrar simple (modal de confirmación)
    (() => {
      const grouped = {};
      stockDetailData.items.forEach(item => {
        if (!grouped[item.color]) grouped[item.color] = [];
        grouped[item.color].push(item);
      });

      return Object.entries(grouped).map(([color, items]) => (
        <div key={color} className="text-sm">
          <span className="font-medium">{color}:</span>{' '}
          {items.map((item, idx) => (
            <span key={idx}>
              {item.talla}({item.cantidad > 0 ? '+' : ''}{item.cantidad})
              {idx < items.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
      ));
    })()
  )}
</div>

      {/* Total */}
      <div className="pt-3 border-t">
        <div className="flex justify-between items-center">
          <span className="font-bold">TOTAL:</span>
          <span className="font-bold text-lg">
            {stockDetailData.total > 0 ? '+' : ''}{stockDetailData.total}
          </span>
        </div>
      </div>

      {/* Botón Cerrar */}
      <button
        onClick={() => setShowStockDetail(false)}
        className="w-full mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-medium"
      >
        Cerrar
      </button>
    </div>
  </div>
)}

      {/* MODAL: Agregar Cliente */}
      {showAddClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Agregar Cliente</h2>
              <button onClick={() => setShowAddClient(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nombre *"
                value={newClient.nombre}
                onChange={(e) => setNewClient({...newClient, nombre: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
              />
              <input
                type="text"
                placeholder="DNI"
                value={newClient.dni}
                onChange={(e) => setNewClient({...newClient, dni: e.target.value})}
                maxLength="8"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
              />
              <input
                type="tel"
                placeholder="Teléfono"
                value={newClient.telefono}
                onChange={(e) => setNewClient({...newClient, telefono: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
              />
              <input
                type="text"
                placeholder="Dirección"
                value={newClient.direccion}
                onChange={(e) => setNewClient({...newClient, direccion: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
              />
              <input
                type="text"
                placeholder="Departamento"
                value={newClient.departamento}
                onChange={(e) => setNewClient({...newClient, departamento: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddClient(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={addClient}
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-medium"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Editar Cliente */}
      {editingClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Editar Cliente</h2>
              <button onClick={() => setEditingClient(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nombre *"
                value={editingClient.nombre}
                onChange={(e) => setEditingClient({...editingClient, nombre: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
              />
              <input
                type="text"
                placeholder="DNI"
                value={editingClient.dni}
                onChange={(e) => setEditingClient({...editingClient, dni: e.target.value})}
                maxLength="8"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
              />
              <input
                type="tel"
                placeholder="Teléfono"
                value={editingClient.telefono}
                onChange={(e) => setEditingClient({...editingClient, telefono: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
              />
              <input
                type="text"
                placeholder="Dirección"
                value={editingClient.direccion}
                onChange={(e) => setEditingClient({...editingClient, direccion: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
              />
              <input
                type="text"
                placeholder="Departamento"
                value={editingClient.departamento}
                onChange={(e) => setEditingClient({...editingClient, departamento: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingClient(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={updateClient}
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-medium"
                >
                  Actualizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Nueva Venta - OPTIMIZADO PARA MAYORISTAS */}
{showAddSale && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
    <div className="bg-white rounded-2xl p-6 max-w-6xl w-full shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-2 sticky top-0 bg-white z-10 py-1 md:py-3 border-b">
        <h2 className="text-2xl md:text-xl font-bold">Nueva Venta</h2>
        <button onClick={() => {
          setShowAddSale(false);
          setSelectedProductModel(null);
          setProductSearchTerm('');
        }} className="p-2 hover:bg-gray-100 rounded-lg">
          <X size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Product Selection */}
        <div>
          <h3 className="hidden md:block font-bold mb-3 text-lg md:text-base">Productos</h3>
          
          {/* Buscador de productos */}
          <div className="mb-3 hidden md:block">
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
    <input
      type="text"
      placeholder="Buscar modelo..."
      value={productSearchTerm}
      onChange={(e) => setProductSearchTerm(e.target.value)}
      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none text-sm"
    />
  </div>
</div>

          {/* Si NO hay producto seleccionado: Mostrar lista */}
{!selectedProductModel && (
  <div className="space-y-3 max-h-96 overflow-y-auto">
    {[...products]
      .filter(product => {
        // Buscar por modelo
        const matchesSearch = product.modelo
          .toLowerCase()
          .includes(productSearchTerm.toLowerCase());

        // Calcular stock total
        let totalStock = 0;
        Object.values(product.stock || {}).forEach(tallas => {
          Object.values(tallas).forEach(cantidad => {
            totalStock += cantidad;
          });
        });

        return product.activo && matchesSearch && totalStock > 0;
      })
      .sort((a, b) => {
        const getTotalStock = (product) => {
          let total = 0;
          Object.values(product.stock || {}).forEach(tallas => {
            Object.values(tallas).forEach(cantidad => {
              total += cantidad;
            });
          });
          return total;
        };

        return getTotalStock(b) - getTotalStock(a);
      })
      .map(product => {
        // Calcular stock total nuevamente para mostrar
        let totalStock = 0;
        Object.values(product.stock || {}).forEach(tallas => {
          Object.values(tallas).forEach(cantidad => {
            totalStock += cantidad;
          });
        });

        return (
          <div
            key={product.id}
            className="border rounded-lg p-3 hover:border-black transition-colors cursor-pointer"
            onClick={() => {
              setSelectedProductModel(product.modelo);
              setProductSearchTerm('');
            }}
          >
            <div className="flex items-center gap-3">
              {product.imagen && (
                <img
                  src={product.imagen}
                  alt={product.modelo}
                  className="w-14 h-14 object-contain rounded flex-shrink-0 bg-gray-50"
                />
              )}

              <div className="text-left flex-1">
                <p className="text-lg md:text-base font-medium">{product.modelo}</p>
                <p className="text-base md:text-sm text-emerald-600">
                  S/ {product.precio_venta} - Stock: {totalStock}
                </p>
              </div>

              <ChevronRight size={20} className="text-gray-400" />
            </div>
          </div>
        );
      })}
  </div>
)}

          {/* Si HAY producto seleccionado: Mostrar tabla de colores/tallas */}
          {selectedProductModel && (() => {
            const product = products.find(p => p.modelo === selectedProductModel);
            if (!product) return null;

            // Función para obtener color del stock
            const getStockColor = (stock) => {
              if (stock >= 10) return 'text-green-600 font-bold';
              if (stock >= 6) return 'text-yellow-500 font-bold';
              return 'text-red-700 font-bold';
            };

            // Calcular si hay al menos una cantidad ingresada
            const hasQuantity = Object.values(colorQuantities).some(qty => qty && parseInt(qty) > 0);

            return (
              <div className="space-y-3">
                {/* Header del producto seleccionado */}
                <div className="bg-black text-white rounded-lg p-3 border">
                  <div className="flex items-center gap-3">
                    {product.imagen && (
                      <img 
                        src={product.imagen} 
                        alt={product.modelo} 
                        className="w-12 h-12 object-contain rounded flex-shrink-0 bg-white"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-bold text-xl md:text-lg">{product.modelo}</p>
                      <p className="text-base md:text-sm text-emerald-400">S/ {product.precio_venta}</p>
                    </div>
                  </div>
                </div>

                {/* Tabla compacta de stock y cantidades */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                     <thead className="bg-gray-100">
                       <tr>
                         <th className="border p-2 text-left font-bold sticky left-0 bg-gray-100 text-xs md:text-sm">Color/Talla</th>
                         <th className="border p-2 text-center font-bold text-base md:text-base">S</th>
                         <th className="border p-2 text-center font-bold text-base md:text-base">M</th>
                         <th className="border p-2 text-center font-bold text-base md:text-base">L</th>
                         <th className="border p-2 text-center font-bold text-base md:text-base">XL</th>
                       </tr>
                     </thead>
                      <tbody>
                        {product.colors && product.colors
                          .filter(color =>
                            ['S', 'M', 'L', 'XL'].some(talla => (product.stock?.[color]?.[talla] || 0) > 0)
                          )
                          .map(color => (
                          <tr key={color} className="hover:bg-gray-50">
                            <td className="border p-2 md:p-2 font-medium sticky left-0 bg-white text-base md:text-xs w-20 md:w-auto">{color}</td>
                            {['S', 'M', 'L', 'XL'].map(talla => {
                              const stockDisponible = product.stock?.[color]?.[talla] || 0;
                              const key = `${color}-${talla}`;
                              return (
                                <td key={talla} className="border p-2 md:p-2">
                                  <div className="flex flex-col items-center gap-2 md:gap-1">
                                    {/* Stock semaforizado */}
                                    <span className={`text-base md:text-xs font-bold px-3 py-1.5 md:py-0.5 rounded-full ${
                                      stockDisponible >= 10 ? 'bg-green-100 text-green-700' :
                                      stockDisponible >= 6  ? 'bg-yellow-100 text-yellow-700' :
                                      stockDisponible > 0   ? 'bg-red-100 text-red-700' :
                                      'bg-gray-100 text-gray-400'
                                    }`}>
                                      {stockDisponible}
                                    </span>
                                    {/* Input de cantidad */}
                                    <input
                                      type="number"
                                      min="0"
                                      max={stockDisponible}
                                      placeholder="0"
                                      value={colorQuantities[key] || ''}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= stockDisponible)) {
                                          setColorQuantities({
                                            ...colorQuantities,
                                            [key]: value
                                          });
                                        }
                                      }}
                                      disabled={stockDisponible === 0}
                                      className={`w-full px-1 py-3 md:py-1 border rounded text-center text-base md:text-xs disabled:bg-gray-100 disabled:cursor-not-allowed ${
                                        colorQuantities[key] && parseInt(colorQuantities[key]) > 0 
                                          ? 'font-bold border-2 border-green-500 bg-lime-300 text-black'
                                          : ''
                                         }`}
                                    />
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedProductModel(null);
                      setColorQuantities({});
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm flex items-center justify-center gap-2"
                  >
                    <Plus size={18} />
                    Agregar Más
                  </button>
                  <button
  onClick={() => {
    const updatedCart = [...cart];
    Object.entries(colorQuantities).forEach(([key, qty]) => {
      if (qty && parseInt(qty) > 0) {
        const [color, talla] = key.split('-');
        const stockDisponible = product.stock?.[color]?.[talla] || 0;
        if (parseInt(qty) <= stockDisponible) {
          const existingIndex = updatedCart.findIndex(
            item => item.productoId === product.id && item.color === color && item.talla === talla
          );
          if (existingIndex >= 0) {
            updatedCart[existingIndex] = {
              ...updatedCart[existingIndex],
              quantity: updatedCart[existingIndex].quantity + parseInt(qty),
              subtotal: product.precio_venta * (updatedCart[existingIndex].quantity + parseInt(qty))
            };
          } else {
            updatedCart.push({
              productoId: product.id,
              modelo: product.modelo,
              color,
              talla,
              quantity: parseInt(qty),
              precioVenta: product.precio_venta,
              subtotal: product.precio_venta * parseInt(qty)
            });
          }
        }
      }
    });
    setCart(updatedCart);
    setColorQuantities({});
    setSelectedProductModel(null);
  }}
  disabled={!hasQuantity}
  className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm ${
    hasQuantity
      ? 'bg-black text-white hover:bg-gray-800'
      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
  }`}
>
  Agregar al Carrito
</button>
                </div>
              </div>
            );
          })()}
        </div>

        {/* RIGHT: Cart & Checkout */}
        <div>
          <h3 className="font-bold mb-3 text-lg md:text-base">Resumen de Compra</h3>

          {/* Client Selection */}
          <div className="mb-4">
            <label className="block text-base md:text-sm font-medium mb-1">Cliente *</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar o crear cliente..."
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setShowClientResults(true);
                }}
                onFocus={() => setShowClientResults(true)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none text-sm"
              />

              {showClientResults && clientSearch && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredClientSearch.length > 0 ? (
                    filteredClientSearch.map(client => (
                      <button
                        key={client.id}
                        onClick={() => {
                          setSelectedClient(client);
                          setClientSearch(client.nombre);
                          setShowClientResults(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50"
                      >
                        <p className="font-medium text-sm">{client.nombre}</p>
                        {client.dni && <p className="text-xs text-gray-500">DNI: {client.dni}</p>}
                      </button>
                    ))
                  ) : (
                    <button
                      onClick={() => {
                        setShowCreateClient(true);
                        setShowClientResults(false);
                        setNewClient({ ...newClient, nombre: clientSearch });
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 text-blue-600 text-sm"
                    >
                      + Crear nuevo cliente "{clientSearch}"
                    </button>
                  )}
                </div>
              )}
            </div>

            {selectedClient && (
              <div className="mt-2 p-2 bg-emerald-50 rounded-lg text-sm">
                <p className="font-medium">{selectedClient.nombre}</p>
                {selectedClient.telefono && <p className="text-xs">Tel: {selectedClient.telefono}</p>}
              </div>
            )}
          </div>

          {showCreateClient && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-medium mb-3 text-sm">Crear Nuevo Cliente</h4>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Nombre *"
                  value={newClient.nombre}
                  onChange={(e) => setNewClient({...newClient, nombre: e.target.value})}
                  className="w-full px-3 py-2 border rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="DNI *"
                  value={newClient.dni}
                  onChange={(e) => setNewClient({...newClient, dni: e.target.value})}
                  className="w-full px-3 py-2 border rounded text-sm"
                  maxLength="8"
                />
                <input
                  type="tel"
                  placeholder="Teléfono"
                  value={newClient.telefono}
                  onChange={(e) => setNewClient({...newClient, telefono: e.target.value})}
                  className="w-full px-3 py-2 border rounded text-sm"
                />
                <input
                  type="text"
                  placeholder="Departamento"
                  value={newClient.departamento}
                  onChange={(e) => setNewClient({...newClient, departamento: e.target.value})}
                  className="w-full px-3 py-2 border rounded text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreateClient(false)}
                    className="flex-1 px-3 py-2 bg-gray-200 rounded text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={addClient}
                    className="flex-1 px-3 py-2 bg-black text-white rounded text-sm"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Medio de Captación</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSalesChannel('LIVE')}
                className={`flex-1 py-3 md:py-2 rounded-lg font-medium text-base md:text-sm ${
                  salesChannel === 'LIVE'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                LIVE
              </button>
              <button
                onClick={() => setSalesChannel('TIENDA')}
                className={`flex-1 py-3 md:py-2 rounded-lg font-medium text-base md:text-sm ${
                  salesChannel === 'TIENDA'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                TIENDA
              </button>
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Fecha</label>
            <input
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none text-sm"
            />
          </div>

            <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
  {(() => {
    // Agrupar carrito por modelo
    const grouped = {};
    cart.forEach((item, index) => {
      if (!grouped[item.modelo]) grouped[item.modelo] = [];
      grouped[item.modelo].push({ ...item, index });
    });

    return Object.entries(grouped).map(([modelo, items]) => (
      <div key={modelo} className="border rounded-lg overflow-hidden text-sm">
        {/* Header producto */}
        <div className="bg-gray-200 px-3 py-1.5">
          <p className="font-bold text-xs">{modelo}</p>
        </div>
        {/* Filas color-talla */}
        {items.map((item) => (
          <div key={item.index} className="flex items-center justify-between px-3 py-1.5 border-t">
            <div className="flex-1">
              <span className="font-bold text-xs bg-black text-white px-1.5 py-0.5 rounded mr-1">{item.talla}</span>
              <span className="text-gray-700 text-xs">{item.color} x{item.quantity}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs">S/ {(item.precioVenta * item.quantity).toFixed(2)}</span>
              <button
                onClick={() => removeFromCart(item.index)}
                className="text-red-500 hover:bg-red-50 rounded p-0.5"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    ));
  })()}
</div>

          {cart.length > 0 ? (
            <>
              <div className="bg-black text-white p-3 rounded-lg mb-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">TOTAL:</span>
                  <span className="font-bold text-xl">
                    S/ {cart.reduce((sum, item) => sum + (item.precioVenta * item.quantity), 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <button
  onClick={completeSale}
  disabled={isProcessing}
  className={`w-full px-4 py-4 md:py-3 rounded-lg font-medium text-base md:text-sm text-white ${
    isProcessing
      ? 'bg-gray-400 cursor-not-allowed'
      : 'bg-emerald-600 hover:bg-emerald-700'
  }`}
>
  {isProcessing ? '⏳ Procesando...' : 'Completar Venta'}
</button>
            </>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border">
              <p className="text-gray-500 text-sm">Carrito vacío</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
)}

{/* MODAL: Confirmación de Venta */}
{showSaleConfirm && saleConfirmData && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-2xl">✅</span>
        </div>
        <div>
          <h2 className="text-lg font-bold">Venta Completada</h2>
          <p className="text-xs text-gray-500">#{saleConfirmData.orderNumber}</p>
        </div>
      </div>

      {/* Info */}
      <div className="mb-4 pb-3 border-b space-y-1">
        <p className="text-sm"><span className="font-medium">Cliente:</span> {saleConfirmData.cliente}</p>
        <p className="text-sm"><span className="font-medium">Fecha:</span> {saleConfirmData.fecha.split('-').reverse().join('/')}</p>
        <p className="text-sm"><span className="font-medium">Canal:</span> {saleConfirmData.canal}</p>
      </div>

      {/* Items */}
      <div className="mb-4 space-y-1 max-h-48 overflow-y-auto">
        {(() => {
          const grouped = {};
          saleConfirmData.items.forEach(item => {
            if (!grouped[item.modelo]) grouped[item.modelo] = [];
            grouped[item.modelo].push(item);
          });
          return Object.entries(grouped).map(([modelo, items]) => (
            <div key={modelo} className="border rounded-lg overflow-hidden text-sm">
              <div className="bg-gray-100 px-3 py-1">
                <p className="font-bold text-xs">{modelo}</p>
              </div>
              {items.map((item, i) => (
                <div key={i} className="flex justify-between px-3 py-1 border-t text-xs">
                  <span>{item.color} - {item.talla} x{item.quantity}</span>
                  <span className="font-medium">S/ {(item.precioVenta * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          ));
        })()}
      </div>

      {/* Total */}
      <div className="pt-3 border-t flex justify-between items-center mb-4">
        <span className="font-bold">TOTAL:</span>
        <span className="font-bold text-xl">S/ {saleConfirmData.total.toFixed(2)}</span>
      </div>

      <button
        onClick={() => setShowSaleConfirm(false)}
        className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-medium"
      >
        Cerrar
      </button>
    </div>
  </div>
)}

{/* MODAL: Ver Venta */}
{viewingSale && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-2xl p-4 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Detalle de Venta</h2>
        <button onClick={() => setViewingSale(null)} className="p-2 hover:bg-gray-100 rounded-lg">
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4 border">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-1">Pedido #</p>
              <p className="font-bold font-mono">{viewingSale.order_number}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Fecha</p>
              <p className="font-bold">{viewingSale.fecha.split('-').reverse().join('/')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Cliente</p>
              <p className="font-bold">{viewingSale.client_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Medio</p>
              <p className="font-bold">{viewingSale.sales_channel || 'TIENDA'}</p>
            </div>
          </div>
        </div>

        <div>
  <h3 className="font-bold mb-2 text-sm">Productos</h3>
  <div className="space-y-3">
    {(() => {
      // Agrupar por modelo y talla
      const grouped = {};
      viewingSale.items.forEach(item => {
        const modelKey = item.modelo;
        if (!grouped[modelKey]) grouped[modelKey] = {};
        if (!grouped[modelKey][item.talla]) grouped[modelKey][item.talla] = [];
        grouped[modelKey][item.talla].push({ color: item.color, quantity: item.quantity, subtotal: item.subtotal });
      });

      return Object.entries(grouped).map(([modelo, tallas]) => (
        <div key={modelo} className="border rounded-lg overflow-hidden">
          {/* Header del modelo */}
          <div className="bg-gray-100 px-3 py-2">
            <p className="font-bold text-sm">{modelo}</p>
          </div>
          {/* Filas por talla */}
          {['S', 'M', 'L', 'XL'].filter(t => tallas[t]).map(talla => {
            const colores = tallas[talla];
            const subtotalTalla = colores.reduce((sum, c) => sum + c.subtotal, 0);
            return (
              <div key={talla} className="flex items-center justify-between px-3 py-2 border-t text-sm">
                <div className="flex-1">
                  <span className="font-bold text-xs bg-black text-white px-2 py-0.5 rounded mr-2">{talla}</span>
                  <span className="text-gray-700">
                    {colores.map((c, i) => (
                      <span key={i}>
                        {i > 0 && ', '}
                        {c.color}{c.quantity > 1 ? ` x${c.quantity}` : ''}
                      </span>
                    ))}
                  </span>
                </div>
                <p className="font-bold">S/ {subtotalTalla.toFixed(2)}</p>
              </div>
            );
          })}
        </div>
      ));
    })()}
  </div>
</div>

        <div className="bg-black text-white p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-bold">TOTAL:</span>
            <span className="font-bold text-2xl">S/ {viewingSale.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Botón Eliminar - solo si es venta de hoy */}
        {(() => {
          const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
          const esDeHoy = viewingSale.fecha === hoy;
          if (!esDeHoy) return null;
          return (
            <button
              onClick={() => {
                const pin = prompt('Ingresa el PIN de administrador:');
                if (pin !== '1111') {
                  alert('PIN incorrecto.');
                  return;
                }
                if (!confirm(`¿Eliminar venta ${viewingSale.order_number}?`)) return;
                const productUpdates = [];
                viewingSale.items.forEach(item => {
                  const product = products.find(p => p.modelo === item.modelo);
                  if (product) {
                    const updatedStock = { ...product.stock };
                    if (!updatedStock[item.color]) updatedStock[item.color] = {};
                    updatedStock[item.color][item.talla] = (updatedStock[item.color][item.talla] || 0) + item.quantity;
                    productUpdates.push({ id: product.id, stock: updatedStock });
                  }
                });
                Promise.all([
                  supabase.from('sales').delete().eq('id', viewingSale.id),
                  ...productUpdates.map(u => supabase.from('products').update({ stock: u.stock }).eq('id', u.id))
                ]).then(() => {
                  setSales(sales.filter(s => s.id !== viewingSale.id));
                  setProducts(products.map(p => {
                    const update = productUpdates.find(u => u.id === p.id);
                    return update ? { ...p, stock: update.stock } : p;
                  }));
                  setViewingSale(null);
                  alert('Venta eliminada y stock revertido.');
                });
              }}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 flex items-center justify-center gap-2 text-sm"
            >
              <Trash2 size={16} />
              Eliminar Venta
            </button>
          );
        })()}

        <div className="flex gap-2">
          <button
            onClick={() => downloadOrderNote(viewingSale)}
            className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-900 flex items-center justify-center gap-2 text-sm"
          >
            <Download size={16} />
            PDF
          </button>
          <button
            onClick={() => shareOrderViaWhatsApp(viewingSale)}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 flex items-center justify-center gap-2 text-sm"
          >
            <Share2 size={16} />
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  </div>
)}

    </div>
  );
}

export default App;