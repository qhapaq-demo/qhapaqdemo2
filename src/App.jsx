import React, { useState, useEffect } from 'react';
import { 
  Package, Users, ShoppingCart, TrendingUp, DollarSign, 
  AlertCircle, Plus, Edit2, Trash2, Search, X, Download,
  FileText, Share2, Eye, Menu, Home, ChevronRight, ChevronLeft,
  Calendar, Filter, Upload, BarChart3, FileDown
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

  // Estados para modales
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddSale, setShowAddSale] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [viewingSale, setViewingSale] = useState(null);
  const [showAddStock, setShowAddStock] = useState(false);
  const [showStockModal, setShowStockModal] = useState(null);

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
  const [saleDate, setSaleDate] = useState(getPeruDateTime().fecha);
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
    start: getPeruDateTime().fecha,
    end: getPeruDateTime().fecha
  });

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
    if (tipoReporte === 'stock acumulado')  tituloReporte = `STOCK ACUMULADO AL ${fecha}`;
    if (tipoReporte === 'movimientos')     tituloReporte = `MOVIMIENTOS DE STOCK AL ${fecha}`;
    if (tipoReporte === 'salidas')      tituloReporte = `SALIDA - VENTAS AL ${fecha}`;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(tituloReporte, margin, 80);

    // ── PREPARAR DATOS ────────────────────────────
    const stockData = getStockALaFechaReport();
    const sortedProducts = [...products].sort((a, b) => {
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
          ...sortedProducts.map(p => String(modelos[p.modelo] || '-'))
        ]);
        bodyData.push([
          'TOTAL',
          ...sortedProducts.map(p => String(
            Object.values(ingresoData).reduce((sum, m) => sum + (Number(m[p.modelo]) || 0), 0)
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

  const addToCart = (producto, color, talla, quantity) => {
    if (quantity <= 0) return;

    // Verificar stock disponible
    const stockDisponible = producto.stock?.[color]?.[talla] || 0;
    if (quantity > stockDisponible) {
      alert(`Solo hay ${stockDisponible} unidades disponibles de ${color} - ${talla}`);
      return;
    }

    const newItem = {
      productoId: producto.id,
      modelo: producto.modelo,
      color,
      talla,
      quantity,
      precioVenta: producto.precio_venta,
      subtotal: producto.precio_venta * quantity
    };

    setCart([...cart, newItem]);
    setColorQuantities({});
  };

  const removeFromCart = (index) => {
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
  };

  const completeSale = async () => {
  if (cart.length === 0) {
    alert('El carrito está vacío');
    return;
  }

  if (!selectedClient) {
    alert('Por favor selecciona un cliente');
    return;
  }

  const { fecha, hora } = getPeruDateTime();
  
  // Generar número de pedido con formato: 2026-1302-101
  const { data: lastSale } = await supabase
    .from('sales')
    .select('order_number')
    .order('created_at', { ascending: false })
    .limit(1);
  
  let consecutivo = 101;
  if (lastSale && lastSale.length > 0) {
    const lastNumber = lastSale[0].order_number;
    const parts = lastNumber.split('-');
    if (parts.length === 3) {
      consecutivo = parseInt(parts[2]) + 1;
    }
  }
  
  // Formato: YYYY-DDMM-XXX
  const year = fecha.split('-')[0];
  const month = fecha.split('-')[1];
  const day = fecha.split('-')[2];
  const orderNumber = `${year}-${day}${month}-${consecutivo.toString().padStart(3, '0')}`;
  
  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);

  // Crear la venta
  const { data: saleData, error: saleError } = await supabase
    .from('sales')
    .insert([{
      order_number: orderNumber,
      fecha: fecha,
      hora: hora,
      client_name: selectedClient.nombre,
      client_dni: selectedClient.dni,
      client_phone: selectedClient.telefono,
      client_address: selectedClient.direccion,
      client_department: selectedClient.departamento,
      sales_channel: salesChannel,
      items: cart,
      total: total
    }])
    .select();

  if (saleError) {
    console.error('Error creando venta:', saleError);
    alert('Error al completar la venta');
    return;
  }

  const saleId = saleData[0].id;

  // Registrar transacciones de stock (SALIDA)
  const stockTransactionsToInsert = [];
  const productUpdates = [];

  for (const item of cart) {
    stockTransactionsToInsert.push({
      fecha: fecha,
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
      productUpdates.push({
        id: product.id,
        stock: updatedStock
      });
    }
  }

  await supabase.from('stock_transactions').insert(stockTransactionsToInsert);

  for (const update of productUpdates) {
    await supabase
      .from('products')
      .update({ stock: update.stock, updated_at: new Date().toISOString() })
      .eq('id', update.id);
  }

  setCart([]);
  setSelectedClient(null);
  setShowAddSale(false);
  setClientSearch('');
  setSaleDate(getPeruDateTime().fecha);
  setSalesChannel('TIENDA');

  alert('¡Venta completada exitosamente!');
};

  // ============================================
  // FUNCIONES DE STOCK
  // ============================================

  const addStockToProduct = async () => {
    if (!stockToAdd.modelo) {
      alert('Selecciona un producto');
      return;
    }

    const product = products.find(p => p.modelo === stockToAdd.modelo);
    if (!product) return;

    const { fecha, hora } = getPeruDateTime();
    const stockTransactionsToInsert = [];
    const updatedStock = { ...product.stock };

    // Procesar cada color y talla
    Object.entries(stockToAdd.colors).forEach(([color, tallas]) => {
      if (!updatedStock[color]) {
        updatedStock[color] = { S: 0, M: 0, L: 0, XL: 0 };
      }

      Object.entries(tallas).forEach(([talla, cantidad]) => {
        if (cantidad && cantidad > 0) {
          // Registrar transacción
          stockTransactionsToInsert.push({
            fecha: fecha,
            hora: hora,
            tipo: 'INGRESO',
            modelo: product.modelo,
            color: color,
            talla: talla,
            cantidad: parseInt(cantidad),
            notes: 'Ingreso manual de stock'
          });

          // Actualizar stock local
          updatedStock[color][talla] = (updatedStock[color][talla] || 0) + parseInt(cantidad);
        }
      });
    });

    if (stockTransactionsToInsert.length === 0) {
      alert('No hay cantidades para agregar');
      return;
    }

    // Insertar transacciones
    await supabase.from('stock_transactions').insert(stockTransactionsToInsert);

    // Actualizar producto
    await supabase
      .from('products')
      .update({ stock: updatedStock, updated_at: new Date().toISOString() })
      .eq('id', product.id);

    setShowAddStock(false);
    setStockToAdd({ modelo: '', colors: {} });
    alert('Stock agregado exitosamente');
  };

  // ============================================
  // FUNCIONES DE REPORTES
  // ============================================

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
    
    const filteredTransactions = stockTransactions.filter(t => 
      t.tipo === 'INGRESO' &&
      t.fecha >= start &&
      t.fecha <= end
    );

    // Agrupar por fecha y modelo
    const grouped = {};
    filteredTransactions.forEach(t => {
      if (!grouped[t.fecha]) grouped[t.fecha] = {};
      if (!grouped[t.fecha][t.modelo]) grouped[t.fecha][t.modelo] = 0;
      grouped[t.fecha][t.modelo] += t.cantidad;
    });

    return grouped;
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
    
    products.forEach(product => {
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
    body: tableData,
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
    return products.map(product => {
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
    });
  };

  const getStockClientesReport = () => {
    return products.map(product => {
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
      
      return {
        modelo: product.modelo,
        colorsByTalla
      };
    });
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
      .slice(0, 5)
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
        md:block bg-white border-b sticky top-16 z-30 shadow-sm
      `}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-2 md:gap-0 py-2">
            {[
              { id: 'dashboard', icon: Home, label: 'Dashboard' },
              { id: 'inventario', icon: Package, label: 'Inventario' },
              { id: 'clientes', icon: Users, label: 'Clientes' },
              { id: 'ventas', icon: ShoppingCart, label: 'Ventas' },
              { id: 'reportes', icon: TrendingUp, label: 'Reportes' },
              { id: 'backup', icon: Download, label: 'Backup' },
              { id: 'configuracion', icon: TrendingUp, label: 'Configuración' }
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
        
        {/* ============================================ */}
        {/* TAB: DASHBOARD */}
        {/* ============================================ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-4 md:grid-cols-4 gap-2 md:gap-4">
              {/* CARD 1: PRODUCTOS */}
              <div className="bg-white p-2 md:p-4 rounded-m shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-blue-50 rounded-m">
                    <Package className="text-blue-500" size={24} />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Productos</p>
                <p className="text-1xl font-bold">{products.length}</p>
              </div>

              {/* CARD 2: CLIENTES */}
              <div className="bg-white p-2 md:p-4 rounded-m shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-purple-50 rounded-m">
                    <Users className="text-purple-500" size={24} />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Clientes</p>
                <p className="text-1xl font-bold">{clients.length}</p>
              </div>

              {/* CARD 3: VENTAS DEL DÍA */}
              <div className="bg-white p-2 md:p-4 rounded-m shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-emerald-50 rounded-m">
                    <ShoppingCart className="text-emerald-500" size={24} />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Ventas del Día</p>
                <p className="text-1xl font-bold">
                  {sales.filter(s => s.fecha === getPeruDateTime().fecha).length}
                </p>
              </div>

              {/* CARD 4: INGRESOS DEL DÍA */}
              <div className="bg-white p-2 md:p-4 rounded-m shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-orange-50 rounded-m">
                    <DollarSign className="text-orange-500" size={24} />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Ingresos del Día</p>
                <p className="text-1xl font-bold">
                  S/ {sales
                    .filter(s => s.fecha === getPeruDateTime().fecha)
                    .reduce((sum, s) => sum + s.total, 0)
                    .toFixed(2)}
                </p>
              </div>
            </div>

            {/* 6 BOTONES PRINCIPALES - Estilo KeyFacil */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
              {/* BOTÓN: INVENTARIO */}
              <button
                onClick={() => setActiveTab('inventario')}
                className="group relative bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-white/20 rounded-full group-hover:bg-white/30 transition-all">
                    <Package size={40} strokeWidth={2} />
                  </div>
                  <span className="font-bold text-xl">Inventario</span>
                </div>
              </button>

              {/* BOTÓN: CLIENTES */}
              <button
                onClick={() => setActiveTab('clientes')}
                className="group relative bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-white/20 rounded-full group-hover:bg-white/30 transition-all">
                    <Users size={40} strokeWidth={2} />
                  </div>
                  <span className="font-bold text-xl">Clientes</span>
                </div>
              </button>

              {/* BOTÓN: VENTAS */}
              <button
                onClick={() => setActiveTab('ventas')}
                className="group relative bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-white/20 rounded-full group-hover:bg-white/30 transition-all">
                    <ShoppingCart size={40} strokeWidth={2} />
                  </div>
                  <span className="font-bold text-xl">Ventas</span>
                </div>
              </button>

              {/* BOTÓN: REPORTES */}
              <button
                onClick={() => setActiveTab('reportes')}
                className="group relative bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-white/20 rounded-full group-hover:bg-white/30 transition-all">
                    <BarChart3 size={40} strokeWidth={2} />
                  </div>
                  <span className="font-bold text-xl">Reportes</span>
                </div>
              </button>

              {/* BOTÓN: BACKUP */}
              <button
                onClick={() => setActiveTab('backup')}
                className="group relative bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-white/20 rounded-full group-hover:bg-white/30 transition-all">
                    <Download size={40} strokeWidth={2} />
                  </div>
                  <span className="font-bold text-xl">Backup</span>
                </div>
              </button>

              {/* BOTÓN: CONFIGURACIÓN */}
              <button
                onClick={() => setActiveTab('configuracion')}
                className="group relative bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-white/20 rounded-full group-hover:bg-white/30 transition-all">
                    <div className="w-10 h-10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M12 1v6m0 6v6"></path>
                        <path d="m4.2 4.2 4.3 4.3m5 5 4.3 4.3"></path>
                        <path d="M1 12h6m6 0h6"></path>
                        <path d="m4.2 19.8 4.3-4.3m5-5 4.3-4.3"></path>
                      </svg>
                    </div>
                  </div>
                  <span className="font-bold text-xl">Configuración</span>
                </div>
              </button>
            </div>

            {/* FOOTER */}
            <div className="mt-12 pt-8 border-t text-center text-sm text-gray-600">
              <p className="font-medium">© 2026 Qhapaq</p>
              <p className="mt-1">Sistema de gestión de inventario y ventas</p>
              <p className="mt-1">Parte de <span className="font-semibold">InteliGest</span></p>
              <p className="text-xs mt-1 text-gray-500">Desarrollado en Perú 🇵🇪</p>
            </div>
          </div>
        )}
   
        {/* ============================================ */}
        {/* TAB: INVENTARIO */}
        {/* ============================================ */}
        {activeTab === 'inventario' && (
          <div className="space-y-6">
            {/* Actions Bar */}
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
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2 font-medium"
                >
                  <Plus size={20} />
                  Agregar Producto
                </button>
                <button
                  onClick={() => setShowAddStock(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
                >
                  <Plus size={20} />
                  Agregar Stock
                </button>
              </div>
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
      <div key={product.id} className="bg-white rounded-lg shadow-sm border p-2 hover:shadow-md transition-shadow">
        {/* NUEVO: Flex container para imagen izquierda + contenido derecha */}
        <div className="flex gap-2 mb-2">
          {/* Imagen a la izquierda */}
          {product.imagen && (
            <img 
              src={product.imagen} 
              alt={product.modelo} 
              className="w-16 h-16 object-contain rounded flex-shrink-0 bg-gray-50"
            />
          )}
          
          {/* Contenido principal */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm mb-0">{product.modelo}</h3>
                <p className="text-emerald-600 font-bold text-base">S/ {product.precio_venta}</p>
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
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => deleteProduct(product.id)}
                  className="p-2 hover:bg-red-50 text-red-600 rounded-lg"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => toggleProductActive(product.id, product.activo)}
                  className={`p-2 rounded-lg ${
                    product.activo 
                      ? 'hover:bg-green-50 text-green-600' 
                      : 'hover:bg-gray-100 text-red-600'
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

      {/* REPORTES DE INVENTARIO */}
<div className="mt-8 space-y-4">
  {/* Filtros */}
  <div className="bg-white rounded-xl shadow-sm border p-4">
    <div className="flex flex-wrap items-center gap-3">
      <h3 className="font-bold text-sm">Filtrar reportes:</h3>
      <button
        onClick={() => setReportFilter('hoy')}
        className={`px-3 py-1.5 rounded-lg font-medium text-sm ${
          reportFilter === 'hoy' ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'
        }`}
      >
        Hoy
      </button>
      <button
        onClick={() => setReportFilter('personalizado')}
        className={`px-3 py-1.5 rounded-lg font-medium text-sm ${
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
            className="px-2 py-1.5 border rounded-lg text-sm"
          />
          <span className="text-sm">a</span>
          <input
            type="date"
            value={customDateRange.end}
            onChange={(e) => setCustomDateRange({...customDateRange, end: e.target.value})}
            className="px-2 py-1.5 border rounded-lg text-sm"
          />
        </div>
      )}
    </div>
  </div>

  {/* Reporte 1: STOCK ACUMULADO */}
  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
    <button
  className="w-full p-4 bg-blue-50 border-l-4 border-blue-500 flex items-center justify-between hover:bg-blue-100 transition-colors"
>
  <div className="flex items-center gap-2 flex-1">
    <BarChart3 size={20} className="text-blue-600" />
    <span className="font-bold text-left text-sm md:text-base">STOCK ACUMULADO AL {getPeruDateTime().fecha.split('-').reverse().join('/')}</span>
  </div>
  <div className="flex items-center gap-2">
    <button
      onClick={() => descargarReportePDF('stock_fecha')}
      className="p-2 hover:bg-blue-200 rounded-lg transition-colors"
      title="Descargar PDF"
    >
      <FileDown size={20} className="text-red-600" />
    </button>
    <button
      onClick={() => setShowStockModal('stock_fecha')}
      className="p-2 hover:bg-blue-200 rounded-lg transition-colors"
      title="Ver reporte"
    >
      <Eye size={20} className="text-gray-600" />
    </button>
  </div>
</button>
    
    <div className="p-2 overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-1.5 text-left font-bold min-w-[80px]">FECHA</th>
            {(() => {
              const stockData = getStockALaFechaReport();
              const sortedProducts = [...products].sort((a, b) => {
                const stockA = stockData[a.modelo] || 0;
                const stockB = stockData[b.modelo] || 0;
                return stockB - stockA; // Orden descendente
              });
              return sortedProducts.map(p => (
                <th key={p.id} className="border p-1.5 text-left font-bold min-w-[55px] md:min-w-[90px] text-[8px] md:text-xs">
                  <span className="md:hidden">{abreviarNombreProducto(p.modelo)}</span>
                  <span className="hidden md:block">{p.modelo}</span>
                 </th>
              ));
            })()}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border p-1.5 font-medium">{getPeruDateTime().fecha.split('-').reverse().join('/')}</td>
            {(() => {
              const stockData = getStockALaFechaReport();
              const sortedProducts = [...products].sort((a, b) => {
                const stockA = stockData[a.modelo] || 0;
                const stockB = stockData[b.modelo] || 0;
                return stockB - stockA;
              });
              return sortedProducts.map(p => (
                <td key={p.id} className="border p-2 text-center">
                  {stockData[p.modelo] || 0}
                </td>
              ));
            })()}
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  {/* Reporte 2: MOVIMIENTOS DE STOCK */}
  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
    <button
  className="w-full p-4 bg-green-50 border-l-4 border-green-500 flex items-center justify-between hover:bg-green-100 transition-colors"
>
  <div className="flex items-center gap-2 flex-1">
    <Package size={20} className="text-green-600" />
    <span className="font-bold text-left text-sm md:text-base">MOVIMIENTOS DE STOCK AL {getPeruDateTime().fecha.split('-').reverse().join('/')}</span>
  </div>
  <div className="flex items-center gap-2">
    <button
      onClick={() => descargarReportePDF('movimientos')}
      className="p-2 hover:bg-green-200 rounded-lg transition-colors"
      title="Descargar PDF"
    >
      <FileDown size={20} className="text-red-600" />
    </button>
    <button
      onClick={() => setShowStockModal('movimientos')}
      className="p-2 hover:bg-green-200 rounded-lg transition-colors"
      title="Ver reporte"
    >
      <Eye size={20} className="text-gray-600" />
    </button>
  </div>
</button>
    
    <div className="p-2 overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-1.5 text-left font-bold min-w-[80px]">FECHA</th>
            {(() => {
              const stockData = getStockALaFechaReport();
              const sortedProducts = [...products].sort((a, b) => {
                const stockA = stockData[a.modelo] || 0;
                const stockB = stockData[b.modelo] || 0;
                return stockB - stockA;
              });
              return sortedProducts.map(p => (
                <th key={p.id} className="border p-1.5 text-left font-bold min-w-[55px] md:min-w-[90px] text-[8px] md:text-xs">
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
            const stockData = getStockALaFechaReport();
            const sortedProducts = [...products].sort((a, b) => {
              const stockA = stockData[a.modelo] || 0;
              const stockB = stockData[b.modelo] || 0;
              return stockB - stockA;
            });
            
            return Object.keys(ingresoData).length > 0 ? (
              Object.entries(ingresoData).map(([fecha, modelos]) => (
                <tr key={fecha}>
                  <td className="border p-1.5 font-medium">{fecha.split('-').reverse().join('/')}</td>
                  {sortedProducts.map(p => (
                    <td key={p.id} className="border p-1.5 text-center">
                      {modelos[p.modelo] || '-'}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={products.length + 1} className="border p-4 text-center text-gray-500">
                  No hay ingresos en este período
                </td>
              </tr>
            );
          })()}          
          <tr className="bg-gray-50 font-bold">
            <td className="border p-2">TOTAL</td>
            {(() => {
              const ingresoData = getIngresoStockReport();
              const stockData = getStockALaFechaReport();
              const sortedProducts = [...products].sort((a, b) => (stockData[b.modelo] || 0) - (stockData[a.modelo] || 0));
              return sortedProducts.map(p => (
                <td key={p.id} className="border p-2 text-center">
                  {Object.values(ingresoData).reduce((sum, m) => sum + (Number(m[p.modelo]) || 0), 0)}
                </td>
              ));
            })()}
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  {/* Reporte 3: SALIDA - VENTAS */}
  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
    <button
  className="w-full p-4 bg-red-50 border-l-4 border-red-500 flex items-center justify-between hover:bg-red-100 transition-colors"
>
  <div className="flex items-center gap-2 flex-1">
    <ShoppingCart size={20} className="text-red-600" />
    <span className="font-bold text-left text-sm md:text-base">SALIDA - VENTAS AL {getPeruDateTime().fecha.split('-').reverse().join('/')}</span>
  </div>
  <div className="flex items-center gap-2">
    <button
      onClick={() => descargarReportePDF('salidas')}
      className="p-2 hover:bg-red-200 rounded-lg transition-colors"
      title="Descargar PDF"
    >
      <FileDown size={20} className="text-red-600" />
    </button>
    <button
      onClick={() => setShowStockModal('salidas')}
      className="p-2 hover:bg-red-200 rounded-lg transition-colors"
      title="Ver reporte"
    >
      <Eye size={20} className="text-gray-600" />
    </button>
  </div>
</button>
    
    <div className="p-2 overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-1.5 text-left font-bold min-w-[80px]">FECHA</th>
            {(() => {
              const stockData = getStockALaFechaReport();
              const sortedProducts = [...products].sort((a, b) => {
                const stockA = stockData[a.modelo] || 0;
                const stockB = stockData[b.modelo] || 0;
                return stockB - stockA;
              });
              return sortedProducts.map(p => (
                <th key={p.id} className="border p-1.5 text-center font-bold min-w-[55px] md:min-w-[90px] text-[8px] md:text-xs">
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
            const stockData = getStockALaFechaReport();
            const sortedProducts = [...products].sort((a, b) => {
              const stockA = stockData[a.modelo] || 0;
              const stockB = stockData[b.modelo] || 0;
              return stockB - stockA;
            });
            
            return Object.keys(salidaData).length > 0 ? (
              Object.entries(salidaData).map(([fecha, modelos]) => (
                <tr key={fecha}>
                  <td className="border p-1.5 font-medium">{fecha.split('-').reverse().join('/')}</td>
                  {sortedProducts.map(p => (
                    <td key={p.id} className="border p-1.5 text-center">
                      {modelos[p.modelo] || '0'}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={products.length + 1} className="border p-4 text-center text-gray-500">
                  No hay ventas en este período
                </td>
              </tr>
            );
          })()}
          <tr className="bg-gray-50 font-bold">
            <td className="border p-2">TOTAL</td>
            {(() => {
              const salidaData = getSalidaVentasReport();
              const stockData = getStockALaFechaReport();
              const sortedProducts = [...products].sort((a, b) => (stockData[b.modelo] || 0) - (stockData[a.modelo] || 0));
              return sortedProducts.map(p => (
                <td key={p.id} className="border p-2 text-center">
                  {Object.values(salidaData).reduce((sum, m) => sum + (Number(m[p.modelo]) || 0), 0)}
                </td>
              ));
            })()}
          </tr>
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

    {showStockModal === 'movimientos' && 
      `Movimientos de Stock al ${getPeruDateTime().fecha.split('-').reverse().join('/')}`
    }

    {showStockModal === 'salidas' && 
      `Salidas - Ventas al ${getPeruDateTime().fecha.split('-').reverse().join('/')}`
    }
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
                    const sortedProducts = [...products].sort((a, b) => {
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
        const sortedProducts = [...products].sort((a, b) => {
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
                    const stockData = getStockALaFechaReport();
                    const sortedProducts = [...products].sort((a, b) => {
                      const stockA = stockData[a.modelo] || 0;
                      const stockB = stockData[b.modelo] || 0;
                      return stockB - stockA;
                    });
                    
                    return Object.keys(ingresoData).length > 0 ? (
                      Object.entries(ingresoData).map(([fecha, modelos]) => (
                        <tr key={fecha} className="even:bg-gray-50">
                          <td className="border border-gray-300 p-1 md:p-2 font-medium sticky left-0 bg-white z-10 text-[10px] md:text-sm">
                            {fecha.split('-').reverse().join('/')}
                          </td>
                          {sortedProducts.map(p => (
                            <td key={p.id} className="border border-gray-300 p-1 md:p-2 text-center text-xs md:text-xs">
                              {modelos[p.modelo] || '-'}
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
                          {Object.values(ingresoData).reduce((sum, m) => sum + (Number(m[p.modelo]) || 0), 0)}
                        </td>
                      ));
                    })()}
                  </tr>
                )}

                {/* SALIDA - VENTAS */}
                {showStockModal === 'salidas' && (
                  (() => {
                    const salidaData = getSalidaVentasReport();
                    const stockData = getStockALaFechaReport();
                    const sortedProducts = [...products].sort((a, b) => {
                      const stockA = stockData[a.modelo] || 0;
                      const stockB = stockData[b.modelo] || 0;
                      return stockB - stockA;
                    });
                    
                    return Object.keys(salidaData).length > 0 ? (
                      Object.entries(salidaData).map(([fecha, modelos]) => (
                        <tr key={fecha} className="even:bg-gray-50">
                          <td className="border border-gray-300 p-1 md:p-2 font-medium sticky left-0 bg-white z-10 text-[10px] md:text-sm">
                            {fecha.split('-').reverse().join('/')}
                          </td>
                          {sortedProducts.map(p => (
                            <td key={p.id} className="border border-gray-300 p-1 md:p-2 text-center text-xs md:text-sm">
                              {modelos[p.modelo] || '0'}
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
                      <th className="px-3 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
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
{/* TAB: REPORTES */}
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

            {/* REPORTE 1: Stock General */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">📦 REPORTE DE STOCK - GENERAL</h3>
                <span className="text-sm text-gray-500">Fecha: {getPeruDateTime().fecha.split('-').reverse().join('/')}</span>
              </div>
              <div className="space-y-4">
                {getStockGeneralReport().map((productData, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <h4 className="font-bold mb-3 text-center bg-black text-white p-2 rounded">{productData.modelo}</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-black text-white">
                            <th className="border border-white p-2 text-left font-bold">COLOR</th>
                            <th className="border border-white p-2 text-center font-bold">S</th>
                            <th className="border border-white p-2 text-center font-bold">M</th>
                            <th className="border border-white p-2 text-center font-bold">L</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(productData.stockByColor).map(([color, tallas]) => (
                            <tr key={color}>
                              <td className="border p-1.5 font-medium">{color}</td>
                              {['S', 'M', 'L'].map(talla => {
                                const cantidad = tallas[talla] || 0;
                                const bgColor = cantidad > 20 ? 'bg-green-100' : cantidad >= 10 ? 'bg-yellow-100' : 'bg-red-100';
                                return (
                                  <td key={talla} className={`border p-1.5 text-center font-medium ${bgColor}`}>
                                    {cantidad}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <p className="text-sm font-bold">Resumen General de Inventario:</p>
                <p className="text-xl font-bold text-emerald-600">S/ {totalInventoryValue.toFixed(2)}</p>
              </div>
            </div>

            {/* REPORTE 2: Stock para Clientes */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">👥 REPORTE DE STOCK - CLIENTES</h3>
                <span className="text-sm text-gray-500">Colores disponibles (sin cantidades)</span>
              </div>
              <div className="space-y-4">
                {getStockClientesReport().map((productData, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <h4 className="font-bold mb-3 text-center bg-black text-white p-2 rounded">{productData.modelo}</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-black text-white">
                            <th className="border border-white p-2 text-center font-bold">S</th>
                            <th className="border border-white p-2 text-center font-bold">M</th>
                            <th className="border border-white p-2 text-center font-bold">L</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            {['S', 'M', 'L'].map(talla => (
                              <td key={talla} className="border p-2 text-center">
                                {productData.colorsByTalla[talla]?.join(', ') || '-'}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* REPORTE 3: Reporte de Ventas (TOP 3 + Tabla) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">🏆 REPORTE DE VENTAS</h3>
                <span className="text-sm text-gray-500">
                  {(() => {
                    const { top3, totalVentas, totalMonto } = getVentasReport();
                    return `${totalVentas} ventas · Total: S/ ${totalMonto.toFixed(2)}`;
                  })()}
                </span>
              </div>
              
              {/* TOP 3 Destacado */}
              <div className="mb-6 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
                <h4 className="font-bold mb-3 text-center">🥇 TOP 3 MÁS VENDIDOS</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {getVentasReport().top3.map((item, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border-2 border-yellow-300">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-yellow-600 mb-1">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'} {index + 1}º
                        </p>
                        <p className="font-bold text-lg">{item.modelo}</p>
                        <p className="text-2xl font-bold text-emerald-600 mt-2">{item.cantidad} unidades</p>
                        <p className="text-sm font-bold">S/ {item.total.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabla de Ventas Detalladas */}
              <div>
                <h4 className="font-bold mb-3">📋 VENTAS DETALLADAS</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-black text-white">
                        <th className="border border-white p-2 text-left font-bold">FECHA</th>
                        <th className="border border-white p-2 text-center font-bold">VENTAS S/</th>
                        <th className="border border-white p-2 text-center font-bold">GANANCIA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(getVentasReport().ventasPorFecha).map(([fecha, data]) => (
                        <tr key={fecha}>
                          <td className="border p-1.5">{fecha.split('-').reverse().join('/')}</td>
                          <td className="border p-1.5 text-center font-bold">S/ {data.ventas.toFixed(2)}</td>
                          <td className="border p-1.5 text-center font-bold text-emerald-600">S/ {data.ganancia.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-100 font-bold">
                        <td className="border p-2">TOTAL</td>
                        <td className="border p-2 text-center">
                          S/ {Object.values(getVentasReport().ventasPorFecha).reduce((sum, d) => sum + d.ventas, 0).toFixed(2)}
                        </td>
                        <td className="border p-2 text-center text-emerald-600">
                          S/ {Object.values(getVentasReport().ventasPorFecha).reduce((sum, d) => sum + d.ganancia, 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* REPORTE 5: Análisis de Ventas Unificado */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="text-lg font-bold mb-4">📈 ANÁLISIS DE VENTAS</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Por Medio de Venta */}
                <div>
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <ShoppingCart size={18} />
                    Por Medio de Venta
                  </h4>
                  {(() => {
                    const { porMedio, totalVentas } = getAnalisisVentasReport();
                    const totalMedio = porMedio.LIVE + porMedio.TIENDA;
                    
                    return (
                      <div className="space-y-3">
                        <div className="p-3 bg-purple-50 rounded-lg border-2 border-purple-300">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium">LIVE</p>
                            <p className="text-sm text-gray-500">
                              {totalMedio > 0 ? ((porMedio.LIVE / totalMedio) * 100).toFixed(0) : 0}%
                            </p>
                          </div>
                          <p className="text-xl font-bold">S/ {porMedio.LIVE.toFixed(2)}</p>
                          <div className="w-full bg-purple-200 rounded-full h-1 mt-2">
                            <div 
                              className="bg-purple-600 h-1 rounded-full" 
                              style={{width: `${totalMedio > 0 ? (porMedio.LIVE / totalMedio) * 100 : 0}%`}}
                            ></div>
                          </div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg border-2 border-blue-300">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium">TIENDA</p>
                            <p className="text-sm text-gray-500">
                              {totalMedio > 0 ? ((porMedio.TIENDA / totalMedio) * 100).toFixed(0) : 0}%
                            </p>
                          </div>
                          <p className="text-xl font-bold">S/ {porMedio.TIENDA.toFixed(2)}</p>
                          <div className="w-full bg-blue-200 rounded-full h-1 mt-2">
                            <div 
                              className="bg-blue-600 h-1 rounded-full" 
                              style={{width: `${totalMedio > 0 ? (porMedio.TIENDA / totalMedio) * 100 : 0}%`}}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Top Clientes */}
                <div>
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <Users size={18} />
                    Top 5 Clientes
                  </h4>
                  {(() => {
                    const { topClientes } = getAnalisisVentasReport();
                    
                    return (
                      <div className="space-y-2">
                        {topClientes.map((cliente, idx) => (
                          <div key={idx} className="p-2 bg-gray-50 rounded border flex justify-between items-center">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="font-bold text-lg text-gray-400">#{idx + 1}</span>
                              <span className="text-sm font-medium truncate">{cliente.nombre}</span>
                            </div>
                            <span className="text-sm font-bold whitespace-nowrap ml-2">S/ {cliente.total.toFixed(2)}</span>
                          </div>
                        ))}
                        {topClientes.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">No hay datos</p>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Por Departamento */}
                <div>
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <TrendingUp size={18} />
                    Por Departamento
                  </h4>
                  {(() => {
                    const { porDepartamento } = getAnalisisVentasReport();
                    const total = Object.values(porDepartamento).reduce((sum, val) => sum + val, 0);
                    
                    return (
                      <div className="space-y-2">
                        {Object.entries(porDepartamento)
                          .sort((a, b) => b[1] - a[1])
                          .map(([dept, amount]) => (
                            <div key={dept} className="p-2 bg-gray-50 rounded border">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium truncate">{dept}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold">S/ {amount.toFixed(2)}</span>
                                  <span className="text-sm text-gray-500">
                                    {total > 0 ? ((amount / total) * 100).toFixed(0) : 0}%
                                  </span>
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1">
                                <div 
                                  className="bg-emerald-600 h-1 rounded-full" 
                                  style={{width: `${total > 0 ? (amount / total) * 100 : 0}%`}}
                                ></div>
                              </div>
                            </div>
                          ))}
                        {Object.keys(porDepartamento).length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">No hay datos</p>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
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

      {/* MODAL: Agregar Stock */}
      {showAddStock && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Agregar Stock a Producto Existente</h2>
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
              <div>
                <label className="block text-sm font-medium mb-1">Seleccionar Producto</label>
                <select
                  value={stockToAdd.modelo}
                  onChange={(e) => setStockToAdd({ modelo: e.target.value, colors: {} })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none"
                >
                  <option value="">-- Seleccionar --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.modelo}>{p.modelo}</option>
                  ))}
                </select>
              </div>

              {stockToAdd.modelo && (
                <div className="border rounded-lg p-4">
                  <p className="font-medium mb-3">Ejemplo: BOCA RECTA - VARON o Boca recta - varon</p>
                  {products.find(p => p.modelo === stockToAdd.modelo)?.colors.map(color => (
                    <div key={color} className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium mb-2">{color}</p>
                      <div className="grid grid-cols-4 gap-2">
                        {['S', 'M', 'L', 'XL'].map(talla => (
                          <div key={talla}>
                            <label className="block text-sm text-gray-600 mb-1">{talla}</label>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={stockToAdd.colors[color]?.[talla] || ''}
                              onChange={(e) => {
                                const newColors = { ...stockToAdd.colors };
                                if (!newColors[color]) newColors[color] = {};
                                newColors[color][talla] = e.target.value;
                                setStockToAdd({ ...stockToAdd, colors: newColors });
                              }}
                              className="w-full px-2 py-1 border rounded text-sm"
                            />
                          </div>
                        ))}
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Agregar Stock
                </button>
              </div>
            </div>
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
    <div className="bg-white rounded-2xl p-6 max-w-6xl w-full shadow-2xl my-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Nueva Venta</h2>
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
          <h3 className="font-bold mb-3">Productos</h3>
          
          {/* Buscador de productos */}
          <div className="mb-3">
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
                <p className="text-base font-medium">{product.modelo}</p>
                <p className="text-sm text-emerald-600">
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
              if (stock >= 6) return 'text-yellow-600 font-bold';
              return 'text-red-600 font-bold';
            };

            // Calcular si hay al menos una cantidad ingresada
            const hasQuantity = Object.values(colorQuantities).some(qty => qty && parseInt(qty) > 0);

            return (
              <div className="space-y-3">
                {/* Header del producto seleccionado */}
                <div className="bg-gray-50 rounded-lg p-3 border">
                  <div className="flex items-center gap-3">
                    {product.imagen && (
                      <img 
                        src={product.imagen} 
                        alt={product.modelo} 
                        className="w-12 h-12 object-contain rounded flex-shrink-0 bg-white"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-bold text-base">{product.modelo}</p>
                      <p className="text-sm text-emerald-600">S/ {product.precio_venta}</p>
                    </div>
                  </div>
                </div>

                {/* Tabla compacta de stock y cantidades */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border p-2 text-left font-bold sticky left-0 bg-gray-100">Color/Talla</th>
                          <th className="border p-2 text-center font-bold">S</th>
                          <th className="border p-2 text-center font-bold">M</th>
                          <th className="border p-2 text-center font-bold">L</th>
                          <th className="border p-2 text-center font-bold">XL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.colors && product.colors.map(color => (
                          <tr key={color} className="hover:bg-gray-50">
                            <td className="border p-2 font-medium sticky left-0 bg-white">{color}</td>
                            {['S', 'M', 'L', 'XL'].map(talla => {
                              const stockDisponible = product.stock?.[color]?.[talla] || 0;
                              const key = `${color}-${talla}`;
                              return (
                                <td key={talla} className="border p-2">
                                  <div className="flex flex-col items-center gap-1">
                                    {/* Stock semaforizado */}
                                    <span className={`text-xs ${getStockColor(stockDisponible)}`}>
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
                                      className="w-full px-1 py-1 border rounded text-center text-xs disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                      // Agregar todas las cantidades al carrito
                      Object.entries(colorQuantities).forEach(([key, qty]) => {
                        if (qty && parseInt(qty) > 0) {
                          const [color, talla] = key.split('-');
                          addToCart(product, color, talla, parseInt(qty));
                        }
                      });
                      // Limpiar cantidades y producto seleccionado
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
          <h3 className="font-bold mb-3">Resumen de Compra</h3>

          {/* Client Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Cliente *</label>
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
                className={`flex-1 py-2 rounded-lg font-medium text-sm ${
                  salesChannel === 'LIVE'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                LIVE
              </button>
              <button
                onClick={() => setSalesChannel('TIENDA')}
                className={`flex-1 py-2 rounded-lg font-medium text-sm ${
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
            {cart.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded border text-sm">
                <div className="flex-1">
                  <p className="font-medium">{item.modelo}</p>
                  <p className="text-xs text-gray-600">{item.color} - {item.talla} x{item.quantity}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">S/ {(item.precioVenta * item.quantity).toFixed(2)}</span>
                  <button
                    onClick={() => removeFromCart(index)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
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
                className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 text-sm"
              >
                Completar Venta
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
          <div className="space-y-2">
            {viewingSale.items.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border text-sm">
                <div className="flex-1">
                  <p className="font-medium">{item.modelo}</p>
                  <p className="text-xs text-gray-600">{item.color} - {item.talla}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600">x{item.quantity}</p>
                  <p className="font-bold">S/ {item.subtotal.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-black text-white p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-bold">TOTAL:</span>
            <span className="font-bold text-2xl">S/ {viewingSale.total.toFixed(2)}</span>
          </div>
        </div>

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
