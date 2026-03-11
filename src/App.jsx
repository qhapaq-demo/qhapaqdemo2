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
import { supabase, getPeruDateTime } from './supabaseConfig';

// Logo placeholder (ajusta la ruta según tu proyecto)
import logoABermud from './logo_Abermud.jpg';

import UploadFoto from "./components/UploadFoto";
import ConfiguracionTab from "./components/ConfiguracionTab";
import BackupTab from "./components/BackupTab";
import { Routes, Route } from 'react-router-dom';
import CatalogoProducto from './pages/CatalogoProducto';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

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
  const [colorSwatches, setColorSwatches] = useState([]);  
  const [pinLiquidar, setPinLiquidar] = useState('');
  const [showPinLiquidar, setShowPinLiquidar] = useState(false);
  const [productoALiquidar, setProductoALiquidar] = useState(null);

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
  const [ventaPorCobrar, setVentaPorCobrar] = useState('');
  const [showDeleteProduct, setShowDeleteProduct] = useState(null);

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
  tallas: [],
  imagenes_colores: {},
  stock: {}
});
const [newColorInput, setNewColorInput] = useState('');
const [newTallaInput, setNewTallaInput] = useState('');

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
  const removeFromCart = (index) => {
  setCart(prev => prev.filter((_, i) => i !== index));
};

  // Estados para selección de productos en ventas
  const [selectedProductModel, setSelectedProductModel] = useState(null);
  const [selectedTalla, setSelectedTalla] = useState(null);
  const [colorQuantities, setColorQuantities] = useState({});

  // Estados para agregar stock
  const [stockToAdd, setStockToAdd] = useState({
    modelo: '',
    colors: {}
  });
  const [stockFechaManual, setStockFechaManual] = useState('');

  // Estados para reportes
  const [reportFilter, setReportFilter] = useState('hoy');
  const [customDateRange, setCustomDateRange] = useState({
  start: '',
  end: ''
});

  // Inicializar fechas + botón atrás del celular va al Dashboard
useEffect(() => {
  const fechaHoy = getPeruDateTime().fecha;
  setSaleDate(fechaHoy);
  setCustomDateRange({ start: fechaHoy, end: fechaHoy });

  // Botón atrás → ir al Dashboard en vez de cerrar la app
  window.history.pushState(null, '', window.location.href);
  const handlePopState = () => {
    window.history.pushState(null, '', window.location.href);
    setActiveTab('dashboard');
  };
  window.addEventListener('popstate', handlePopState);
  return () => window.removeEventListener('popstate', handlePopState);
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
  // FUNCIÓN HELPER: Color Swatches
  // ============================================
  const getColorImageUrl = (modelo, colorName) => {
  // Primero buscar en imagenes_colores del producto
  const product = products.find(p => p.modelo === modelo);
  if (product?.imagenes_colores?.[colorName]) {
    return `${product.imagenes_colores[colorName]}?width=80&height=80&quality=70`;
  }
  
  // Si no, buscar en color_swatches
  const swatch = colorSwatches.find(
    s => s.modelo === modelo && 
    s.color_name.toLowerCase() === colorName.toLowerCase()
  );
  if (!swatch?.image_url) return null;
  return `${swatch.image_url}?width=80&height=80&quality=70`;
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

  const fetchColorSwatches = async () => {
  const { data, error } = await supabase
    .from('color_swatches')
    .select('*');
  if (!error) setColorSwatches(data);
};

useEffect(() => {
  fetchColorSwatches();
}, []);

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
    tallas: newProduct.tallas || [],
    imagenes_colores: newProduct.imagenes_colores || {},
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
    tallas: editingProduct.tallas || [],
    imagenes_colores: editingProduct.imagenes_colores || {},
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
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) {
    console.error('Error eliminando producto:', error);
    alert('Error al eliminar producto');
  } else {
    setProducts(products.filter(p => p.id !== productId));
    setShowDeleteProduct(null);
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
    const tallas = productObj.tallas?.length ? productObj.tallas : ['S', 'M', 'L', 'XL'];
    updatedStock[newColorInput.trim()] = Object.fromEntries(tallas.map(t => [t, 0]));
    
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
    tallas: [],
    imagenes_colores: {},
    stock: {}
  });
  setNewColorInput('');
  setNewTallaInput('');
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
    const totalCalculado = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const total = ventaPorCobrar ? parseFloat(ventaPorCobrar) : totalCalculado;
    const descuento = totalCalculado - total;

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
        total: total,
        descuento: descuento > 0 ? descuento : 0
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
      total,
      descuento: descuento > 0 ? descuento : 0
    });

    // 5. Limpiar
    setCart([]);
    setSelectedClient(null);
    setShowAddSale(false);
    setClientSearch('');
    setSaleDate(getPeruDateTime().fecha);
    setSalesChannel('TIENDA');
    setShowSaleConfirm(true);
    setVentaPorCobrar('');

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

  const { fecha: fechaAuto, hora } = getPeruDateTime();
  const fecha = stockFechaManual || fechaAuto;
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
    updatedStock[color] = Object.fromEntries((product.tallas?.length ? product.tallas : ['S','M','L','XL']).map(t => [t, 0]));
  }

  Object.entries(tallas).forEach(([talla, cantidad]) => {
    const cantidadInt = parseInt(cantidad) || 0;
    if (cantidadInt !== 0) {
      stockTransactionsToInsert.push({
        fecha: fecha,
        hora: hora,
        tipo: cantidadInt < 0 ? 'CORRECCION' : 'INGRESO',  // ← CAMBIO
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

  const filteredTransactions = stockTransactions.filter(t => 
    (t.tipo === 'INGRESO' || t.tipo === 'LIQUIDACION') &&
    t.fecha >= start &&
    t.fecha <= end
  );

  const grouped = {};
  filteredTransactions.forEach(t => {
    if (!grouped[t.fecha]) grouped[t.fecha] = {};
    if (!grouped[t.fecha][t.modelo]) grouped[t.fecha][t.modelo] = { ingreso: 0, correccion: 0, liquidacion: 0 };
    
    if (t.tipo === 'LIQUIDACION') {
      grouped[t.fecha][t.modelo].liquidacion += t.cantidad;
    } else if (t.cantidad > 0) {
      grouped[t.fecha][t.modelo].ingreso += t.cantidad;
    } else if (t.cantidad < 0) {
      grouped[t.fecha][t.modelo].correccion += t.cantidad;
    }
  });

  return grouped;
};

const getStockDetailByDate = (fecha, modelo) => {
  const transactions = stockTransactions.filter(t => 
    t.tipo === 'INGRESO' &&
    t.fecha === fecha &&
    t.modelo === modelo
  );

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
    const today = getPeruDateTime().fecha;

    products.filter(p => p.activo !== false).forEach(product => {
      const ultimaLiquidacion = stockTransactions
        .filter(t => t.tipo === 'LIQUIDACION' && t.modelo === product.modelo)
        .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.hora.localeCompare(a.hora))
        .at(0);

      const fechaInicio = ultimaLiquidacion ? ultimaLiquidacion.fecha : '2000-01-01';

      const ingresos = stockTransactions
        .filter(t => t.tipo === 'INGRESO' && t.modelo === product.modelo && t.fecha >= fechaInicio && t.cantidad > 0)
        .reduce((sum, t) => sum + t.cantidad, 0);

      const ventas = sales
        .filter(s => s.fecha >= fechaInicio && s.fecha <= today)
        .reduce((sum, sale) => sum + sale.items
          .filter(item => item.modelo === product.modelo)
          .reduce((s, item) => s + item.quantity, 0), 0);

      stockByModel[product.modelo] = ingresos - ventas;
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

  const totalRow = ['', '', 'TOTAL:', `S/ ${sale.total.toFixed(2)}`];

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
        const tallas = product.tallas?.length ? product.tallas : ['S', 'M', 'L', 'XL'];
        tallas.forEach(talla => {
          const cantidad = product.stock?.[color]?.[talla] || 0;
          stockByColor[color][talla] = cantidad;
          totalProduct += cantidad;
        });
      });
      
      return {
        modelo: product.modelo,
        stockByColor,
        total: totalProduct,
        tallas: product.tallas?.length ? product.tallas : ['S', 'M', 'L', 'XL']
      };
    })
    .sort((a, b) => b.total - a.total);
};

const getStockClientesReport = () => {
  return products
    .filter(product => product.activo !== false)
    .map(product => {
      const colorsByTalla = {};
      const tallas = product.tallas?.length ? product.tallas : ['S', 'M', 'L', 'XL'];
      tallas.forEach(talla => {
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
  const tallas = product.tallas?.length ? product.tallas : ['S', 'M', 'L', 'XL'];
  tallas.forEach(talla => {
    totalProduct += product.stock?.[color]?.[talla] || 0;
  });
});

return {
  modelo: product.modelo,
  colorsByTalla,
  total: totalProduct,
  tallas: product.tallas?.length ? product.tallas : ['S', 'M', 'L', 'XL']
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
    const modelosActivos = products
      .filter(p => p.activo !== false)
      .map(p => p.modelo)
      .filter(modelo => ventasFiltradas.some(sale => 
        sale.items.some(item => item.modelo === modelo)
    ));
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
          <button onClick={onVolver} className="flex items-center gap-1 text-gray-600 hover:text-black font-bold text-2xl">
            ‹ Volver a fechas
          </button>

          <button onClick={onCerrar}><X size={24} /></button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-xl capitalize">
                {new Date(fechaSeleccionada + 'T12:00:00').toLocaleDateString('es-PE', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                })}
              </p>
              <p className="text-lg text-gray-500">
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
            <div className="bg-gray-800 text-white p-3">
              <span className="font-bold text-2xl">📊 VENTAS POR MODELO</span>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-gray-300 text-lg">Filtrar por:</span>
                <button
                  onClick={() => setFiltroDetalle('dia')}
                  className={`px-3 py-1.5 rounded text-lg font-medium ${filtroDetalle === 'dia' ? 'bg-white text-black' : 'bg-gray-600 text-white'}`}
                >
                  Hoy
                </button>
                <button
                  onClick={() => setFiltroDetalle('personalizado')}
                  className={`px-3 py-1.5 rounded text-lg font-medium ${filtroDetalle === 'personalizado' ? 'bg-white text-black' : 'bg-gray-600 text-white'}`}
                >
                  Personalizado
                </button>
              </div>
            </div>

            {filtroDetalle === 'personalizado' && (
              <div className="bg-gray-50 p-3 flex gap-3 items-center text-xl border-b flex-wrap">
                <span className="text-gray-600">Desde:</span>
                <input type="date" value={rangoPersonalizado.start}
                  onChange={e => setRangoPersonalizado(r => ({ ...r, start: e.target.value }))}
                  className="border rounded px-2 py-1 text-xl" />
                <span className="text-gray-600">Hasta:</span>
                <input type="date" value={rangoPersonalizado.end}
                  onChange={e => setRangoPersonalizado(r => ({ ...r, end: e.target.value }))}
                  className="border rounded px-2 py-1 text-xl" />
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-2xl">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left border-r font-bold">FECHA</th>
                    {modelosOrdenados.map(m => (
                      // DESPUÉS
                      <th key={m} className="p-3 text-center font-bold">
                        {abreviarNombreProducto(m)}
                      </th>
                    ))}
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
                            <td className="p-2 border-r font-medium whitespace-nowrap w-16">
                              {new Date(fecha + 'T12:00:00').toLocaleDateString('es-PE', {
                                day: '2-digit', month: '2-digit'
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
                          </tr>
                        );
                      })}
                      <tr className="bg-black text-white">
                        <td className="p-3 font-bold border-r">TOTAL</td>
                        {modelosOrdenados.map(m => (
                          <td key={m} className="p-3 text-center font-bold">{totalPorModelo[m] || 0}</td>
                        ))}
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
        <span className="text-lg text-gray-500">Filtrar por:</span>
        <button onClick={() => setFiltroAnalisis('hoy')}
          className={`px-3 py-1.5 rounded-lg text-lg font-medium ${filtroAnalisis === 'hoy' ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
          Hoy
        </button>
        <button onClick={() => setFiltroAnalisis('personalizado')}
          className={`px-3 py-1.5 rounded-lg text-lg font-medium ${filtroAnalisis === 'personalizado' ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
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
          <span className="font-bold text-xl">📊 VENTAS POR MEDIO</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left font-bold border-r">FECHA</th>
                {medios.map(m => (
                  <th key={m} colSpan={2} className="p-3 text-center font-bold border-r">{m}</th>
                ))}
                <th className="p-3 text-center font-bold bg-gray-200">TOTAL</th>
              </tr>
              <tr className="bg-gray-50 text-sm text-gray-500">
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
                        <td className="p-3 font-medium whitespace-nowrap border-r">
                          {fecha.split('-').slice(1).reverse().join('/')}
                        </td>
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
          <span className="font-bold text-xl">👥 CLIENTES</span>
          <span className="text-xs text-gray-400">{clientesOrdenados.length} clientes</span>
        </div>
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-base">
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
          <span className="font-bold text-xl">📍 POR DEPARTAMENTO</span>
        </div>
        <table className="w-full text-base">
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
                  <td className="p-3 font-bold text-xl">TOTAL</td>
                  <td className="p-3 text-center font-bold text-xl">{ventasFiltradas.length}</td>
                  <td className="p-3 text-center font-bold text-xl">
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

      {/* Desktop: ingresos + botón salir */}
      <div className="hidden md:flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium">Ingresos del día</p>
          <p className="text-xl font-bold text-emerald-400">
            S/ {sales
              .filter(s => s.fecha === getPeruDateTime().fecha)
              .reduce((sum, s) => sum + s.total, 0)
              .toFixed(2)}
          </p>
        </div>
        <button
          onClick={async () => {
            if (!confirm('¿Cerrar sesión?')) return;
            await supabase.auth.signOut();
            window.location.href = '/login';
          }}
          className="flex items-center gap-2 border border-white/30 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Salir
        </button>
      </div>

      {/* Móvil: hamburguesa */}
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
          <div className="flex flex-col md:flex-row gap-2 md:gap-0 py-2 text-xl">
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

      {/* BARRA RÁPIDA - solo móvil */}
<div className="md:hidden bg-white border-b flex">
  {[
    { id: 'inventario', icon: ClipboardListIcon, label: 'Inventario' },
    { id: 'ventas', icon: ShoppingCart, label: 'Ventas' },
    { id: 'reportes', icon: TrendingUp, label: 'Reportes' },
  ].map(tab => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-medium text-xl transition-all
        ${activeTab === tab.id ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
    >
      <tab.icon size={20} />
      <span>{tab.label}</span>
    </button>
  ))}
</div>

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
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none text-2xl"
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
                <h3 className="font-bold text-2xl mb-1">{product.modelo}</h3>
                <p className="text-emerald-600 font-bold text-xl">S/ {product.precio_venta}</p>
                {product.precio_compra > 0 && (
                  <p className="text-sm text-gray-500">Compra: S/ {product.precio_compra}</p>
                )}
              </div>
              
              {/* Botones de acción */}
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => setEditingProduct(product)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="Editar"
                >
                  <Edit2 size={20} />
                </button>
                <button
                  onClick={() => setShowDeleteProduct(product)}
                  className="p-2 hover:bg-red-50 text-red-600 rounded-lg"
                  title="Eliminar"
                >
                  <Trash2 size={20} />
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
        <div className="space-y-3 text-base">
          <div className="flex items-center justify-between text-lg">
            <span className="text-gray-700">Stock Total:</span>
            <span className={`font-bold ${totalStock < 14 ? 'text-orange-600' : 'text-emerald-600'}`}>
              {totalStock} unidades
            </span>
          </div>

          {product.colors && product.colors.length > 0 && (
            <div>
              <p className="text-lg font-bold mb-1">Colores:</p>
              <div className="flex flex-wrap gap-1">
                {product.colors.map(color => (
                  <span key={color} className="text-base bg-gray-100 px-2 py-0.5 rounded">
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
        <Plus size={22} />
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
                className="px-2 py-1.5 border rounded-lg text-base" />
              <span className="text-sm">a</span>
              <input type="date" value={customDateRange.end}
                onChange={(e) => setCustomDateRange({...customDateRange, end: e.target.value})}
                className="px-2 py-1.5 border rounded-lg text-base" />
            </div>
          )}
        </div>
      </div>  

  {/* Reporte 1: STOCK ACUMULADO - orden: más stock a la izquierda */}
  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
    <button className="w-full p-4 bg-blue-50 border-l-4 border-blue-500 flex items-center justify-between hover:bg-blue-100 transition-colors">
      <div className="flex items-center gap-2 flex-1">
        <BarChart3 size={20} className="text-blue-600" />
        <span className="font-bold text-left text-base md:text-base">STOCK ACUMULADO AL {getPeruDateTime().fecha.split('-').reverse().join('/')}</span>
      </div>
      <button onClick={() => setShowStockModal('stock_fecha')} className="p-2 hover:bg-blue-200 rounded-lg transition-colors" title="Ver reporte">
        <Eye size={24} className="text-gray-600" />
      </button>
    </button>
    <div className="p-2 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-1 text-left font-bold w-12">FECHA</th>
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
            <td className="border p-1 font-medium">{getPeruDateTime().fecha.split('-').slice(1).reverse().join('/')}</td>
            {(() => {
              const stockData = getStockALaFechaReport();
              const sortedProducts = [...products].filter(p => p.activo !== false).sort((a, b) => (stockData[b.modelo] || 0) - (stockData[a.modelo] || 0));
              return sortedProducts.map(p => (
                <td key={p.id} className="border p-2 text-center text-base">{stockData[p.modelo] || 0}</td>
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
        <span className="font-bold text-left text-base md:text-base">MOVIMIENTOS DE STOCK AL {getPeruDateTime().fecha.split('-').reverse().join('/')}</span>
      </div>
      <div className="flex items-center gap-2">
        
        <button onClick={() => setShowStockModal('movimientos')} className="p-2 hover:bg-green-200 rounded-lg transition-colors" title="Ver reporte">
          <Eye size={24} className="text-gray-600" />
        </button>
      </div>
    </button>
    <div className="p-2 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-1 text-left font-bold w-12 sticky left-0 bg-gray-100 z-10">FECHA</th>
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
                   <td className="border p-1 font-medium sticky left-0 bg-white z-10">{fecha.split('-').slice(1).reverse().join('/')}</td>
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
                            {modelos[p.modelo].ingreso !== 0 && <span className="text-lg">{modelos[p.modelo].ingreso}</span>}
                            {modelos[p.modelo].correccion !== 0 && <span className="text-red-600 font-bold text-sm">⚠️{modelos[p.modelo].correccion}</span>}
                            {modelos[p.modelo].ingreso === 0 && modelos[p.modelo].correccion === 0 && '-'}
                          </div>
                        ) : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold">
                  <td className="border p-2 sticky left-0 bg-gray-50 z-10">TOTAL</td>
                  {sortedProducts.map(p => (
                    <td key={p.id} className="border p-2 text-center text-base font-bold">
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
        <span className="font-bold text-left text-base md:text-base">SALIDA - VENTAS AL {getPeruDateTime().fecha.split('-').reverse().join('/')}</span>
      </div>
      <div className="flex items-center gap-2">
        
        <button onClick={() => setShowStockModal('salidas')} className="p-2 hover:bg-red-200 rounded-lg transition-colors" title="Ver reporte">
          <Eye size={24} className="text-gray-600" />
        </button>
      </div>
    </button>
    <div className="p-2 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-1 text-left font-bold w-12 sticky left-0 bg-gray-100 z-10">FECHA</th>
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
                    <td className="border p-1 font-medium sticky left-0 bg-white z-10">{fecha.split('-').slice(1).reverse().join('/')}</td>
                    {sortedProducts.map(p => (
                      <td key={p.id} className="border p-1.5 text-center text-base">{modelos[p.modelo] || '0'}</td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-gray-50 font-bold">
                  <td className="border p-2 sticky left-0 bg-gray-50 z-10">TOTAL</td>
                  {sortedProducts.map(p => (
                    <td key={p.id} className="border p-2 text-center text-base font-bold">
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
            <h1 className="text-xl md:text-2xl font-bold">ABermud</h1>
            <p className="text-base md:text-sm italic">Lo bueno va contigo</p>
            <p className="text-sm md:text-sm mt-1 md:mt-2 opacity-90">
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
{showStockModal !== 'stock_fecha' && (
  <div className="mb-3 md:mb-4 pb-2 md:pb-3 border-b">
    <p className="text-base md:text-sm text-gray-600">
      <span className="font-semibold">Fecha:</span> {getPeruDateTime().fecha.split('-').reverse().join('/')}
    </p>
  </div>
)}

          {/* TÍTULO DEL REPORTE */}
<div className="mb-3 md:mb-4">
  <h2 className="text-base md:text-xl font-bold uppercase">
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
    <p className="text-sm md:text-sm text-gray-600 mt-1">
      Filtrado: {customDateRange.start.split('-').reverse().join('/')} - {customDateRange.end.split('-').reverse().join('/')}
    </p>
  )}
</div>

          {/* TABLA DEL REPORTE */}
          <div className="overflow-x-auto -mx-3 md:mx-0">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-black text-white">
                  <th className="border border-gray-300 p-1 text-left font-bold sticky left-0 bg-black z-10 text-[8px] md:text-sm w-12">
                    FECHA
                  </th>
                  {(() => {
  let sortedProducts;
  if (showStockModal === 'stock_fecha') {
    const stockData = getStockALaFechaReport();
    sortedProducts = [...products].filter(p => p.activo !== false).sort((a, b) => (stockData[b.modelo] || 0) - (stockData[a.modelo] || 0));
  } else if (showStockModal === 'movimientos') {
    const ingresoData = getIngresoStockReport();
    sortedProducts = [...products].filter(p => p.activo !== false).sort((a, b) => {
      const totalA = Object.values(ingresoData).reduce((sum, m) => sum + (m[a.modelo]?.ingreso || 0), 0);
      const totalB = Object.values(ingresoData).reduce((sum, m) => sum + (m[b.modelo]?.ingreso || 0), 0);
      return totalB - totalA;
    });
  } else {
    const salidaData = getSalidaVentasReport();
    sortedProducts = [...products].filter(p => p.activo !== false).sort((a, b) => {
      const totalA = Object.values(salidaData).reduce((sum, m) => sum + (Number(m[a.modelo]) || 0), 0);
      const totalB = Object.values(salidaData).reduce((sum, m) => sum + (Number(m[b.modelo]) || 0), 0);
      return totalB - totalA;
    });
  }
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
      <td className="border border-gray-300 p-1 md:p-2 font-medium sticky left-0 bg-white z-10 text-[10px] md:text-sm w-12">
        {getPeruDateTime().fecha.split('-').slice(1).reverse().join('/')}
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
            className="border border-gray-300 p-1 md:p-2 text-center font-bold text-base md:text-sm"
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
          <td className="border border-gray-300 p-1 md:p-2 font-medium sticky left-0 bg-white z-10 text-[10px] md:text-sm w-12">
            {fecha.split('-').slice(1).reverse().join('/')}
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
                   <span className="font-bold text-base md:text-sm">{modelos[p.modelo].ingreso}</span>
                 )}
                 {modelos[p.modelo].correccion !== 0 && (
                   <span className="text-red-600 font-bold text-sm">⚠️{modelos[p.modelo].correccion}</span>
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
      const sortedProducts = [...products].filter(p => p.activo !== false).sort((a, b) => {
        const totalA = Object.values(ingresoData).reduce((sum, m) => sum + (m[a.modelo]?.ingreso || 0), 0);
        const totalB = Object.values(ingresoData).reduce((sum, m) => sum + (m[b.modelo]?.ingreso || 0), 0);
        return totalB - totalA;
      });
      return sortedProducts.map(p => (
        <td key={p.id} className="border border-gray-300 p-1 md:p-2 text-center font-bold text-base md:text-sm">
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
          <td className="border border-gray-300 p-1 md:p-2 font-medium sticky left-0 bg-white z-10 text-[10px] md:text-sm w-12">
            {fecha.split('-').slice(1).reverse().join('/')}
          </td>
          {sortedProducts.map(p => (
            <td key={p.id} className="border border-gray-300 p-1 md:p-2 text-center font-bold text-base md:text-sm">
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
                  const sortedProducts = [...products].filter(p => p.activo !== false).sort((a, b) => {
                    const totalA = Object.values(salidaData).reduce((sum, m) => sum + (Number(m[a.modelo]) || 0), 0);
                    const totalB = Object.values(salidaData).reduce((sum, m) => sum + (Number(m[b.modelo]) || 0), 0);
                    return totalB - totalA;
                  });
                  return Object.keys(salidaData).length > 0 ? (
                    <tr className="bg-gray-200 font-bold">
                      <td className="border border-gray-300 p-1 md:p-2 sticky left-0 bg-gray-200 z-10 text-[10px] md:text-sm">TOTAL</td>
                      {sortedProducts.map(p => (
                        <td key={p.id} className="border border-gray-300 p-1 md:p-2 text-center font-bold text-base md:text-sm">
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
              <h3 className="font-bold text-base md:text-sm uppercase mb-2">Resumen de Inventario</h3>
              <div className="grid grid-cols-2 gap-2 md:gap-4 text-xs md:text-sm">
                <div>
                  <span className="text-sm gray-600">Total de productos:</span>
                  <span className="ml-2 font-bold">{products.length}</span>
                </div>
                <div>
                  <span className="text-sm gray-600">Total de unidades:</span>
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
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center gap-2 font-medium text-lg"
        >
          <Plus size={18} />
          Nueva Venta
        </button>
      </div>
      
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setReportFilter('hoy')}
          className={`px-3 py-1.5 rounded-lg font-medium text-base transition-colors ${
            reportFilter === 'hoy'
              ? 'bg-black text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          Hoy
        </button>
        <button
          onClick={() => setReportFilter('personalizado')}
          className={`px-3 py-1.5 rounded-lg font-medium text-base transition-colors ${
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
                    <Eye size={20} />
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
  <div className="space-y-4">
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
        <h3 className="text-2xl font-bold mb-1">Stock General</h3>
        <p className="text-lg text-gray-600">Vista matricial con semaforización</p>
      </div>
      <FileText className="text-gray-400" size={24} />
    </div>
    <button
      onClick={() => setShowModalStockGeneral(true)}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 font-medium transition-colors"
    >
      <Eye size={20} />
      Ver Reporte
    </button>
  </div>

  {/* Tarjeta 2: Stock para Clientes */}
  <div className="bg-gradient-to-br from-purple-100 to-white p-6 rounded-xl shadow-sm border">
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-2xl font-bold mb-1">Stock para Clientes</h3>
        <p className="text-lg text-gray-600">Sin cantidades, solo colores</p>
      </div>
      <FileText className="text-gray-400" size={24} />
    </div>
    <button
      onClick={() => setShowModalStockClientes(true)}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 font-medium transition-colors"
    >
      <Eye size={20} />
      Ver Reporte
    </button>
  </div>

  {/* Tarjeta 3: Reporte de Ventas */}
  <div className="p-6 rounded-xl shadow-sm border bg-gradient-to-br from-emerald-100 to-white">
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-2xl font-bold mb-1">Reporte de Ventas</h3>
        <p className="text-lg text-gray-600">Por modelo</p>
      </div>
      <FileText className="text-emerald-600" size={24} />
    </div>
    <button
      onClick={() => setShowModalReporteVentas(true)}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 font-medium transition-colors"
    >
      <Eye size={20} />
      Ver Reporte
    </button>
  </div>

  {/* Tarjeta 4: Análisis de Ventas */}
  <div className="p-6 rounded-xl shadow-sm border bg-gradient-to-br from-slate-100 to-white">
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-2xl font-bold mb-1">Análisis de Ventas</h3>
        <p className="text-lg text-gray-600">Medio, clientes y departamento</p>
      </div>
      <FileText className="text-slate-600" size={24} />
    </div>
    <button
      onClick={() => setShowModalAnalisisVentas(true)}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 font-medium transition-colors"
    >
      <Eye size={20} />
      Ver Reporte
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
        <h3 className="text-2xl font-bold">📦 Stock General</h3>
        <button
          onClick={() => setShowModalStockGeneral(false)}
          className="text-gray-500 hover:text-black"
        >
          <X size={24} />
        </button>
      </div>
      
      <div className="p-4 space-y-3">
        {getStockGeneralReport().map((productData, idx) => {
          // Calcular totales por talla
          const totalesPorTalla = (productData.tallas || ['S','M','L','XL']).map(talla =>
            Object.values(productData.stockByColor).reduce((sum, tallas) => sum + (tallas[talla] || 0), 0)
          );

          return (
            <div key={idx} className="border rounded-lg p-4">
              <h4 className="font-bold mb-3 bg-black text-white p-2 rounded flex justify-between items-center">
                <span>{productData.modelo}</span>
                <span className="text-emerald-400">
                  {Object.values(productData.stockByColor).reduce((sum, tallas) => 
                    sum + Object.values(tallas).reduce((a, b) => a + b, 0), 0)}
                </span>
              </h4>
              <table className="w-full text-base border-collapse">
                <thead>
                  <tr className="bg-black text-white">
                    <th className="border border-white p-1 text-center text-base">COLOR</th>
                    {(productData.tallas || ['S','M','L','XL']).map(talla => (
                      <th key={talla} className="border border-white p-2 text-center text-base">{talla}</th>
                   ))}
                 </tr>
                </thead>
                <tbody>
                  {Object.entries(productData.stockByColor).map(([color, tallas]) => (
                    <tr key={color}>
                      <td className="border p-1 text-sm w-24">{color}</td>
                      {(productData.tallas || ['S','M','L','XL']).map(talla => {
                        const cantidad = tallas[talla] || 0;
                        const bgColor = cantidad > 10 ? 'bg-green-100' : cantidad >= 6 ? 'bg-yellow-100' : cantidad > 0 ? 'bg-red-100' : 'bg-gray-50';
                        return (
                          <td key={talla} className={`border p-1 text-center text-lg ${bgColor}`}>
                            {cantidad}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
                {/* ✅ FILA TOTAL POR TALLA */}
                <tfoot>
                  <tr className="bg-gray-800 text-white font-bold">
                    <td className="border border-gray-600 p-1 text-sm text-center">TOTAL</td>
                    {totalesPorTalla.map((total, i) => (
                      <td key={i} className="border border-gray-600 p-1 text-center text-lg">
                        {total}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  </div>
)}
  
{/* MODAL: Stock para Clientes */}
{showModalStockClientes && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b p-2 flex justify-between items-center">
        <h3 className="text-2xl font-bold">👥 Stock para Clientes</h3>
        <button
          onClick={() => setShowModalStockClientes(false)}
          className="text-gray-500 hover:text-black"
        >
          <X size={24} />
        </button>
      </div>
      
      <div className="p-0.5 space-y-2">
        {getStockClientesReport().map((productData, idx) => (
  <div key={idx} className="border rounded-lg overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full text-sm md:text-sm border-collapse">
      <thead>
        <tr className="bg-black text-white">
          <th colSpan={(productData.tallas?.length ? productData.tallas : ['S', 'M', 'L', 'XL']).length} className="p-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg">{productData.modelo}</span>
              <button
                onClick={() => {
                  const prod = products.find(p => 
                    p.modelo?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === 
                    productData.modelo?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
                  );
                  if (prod) {
                    const url = `${window.location.origin}/catalogo/${prod.id}`;
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(url).then(() => alert('✅ Link copiado!'));
                    } else {
                      const el = document.createElement('textarea');
                      el.value = url;
                      document.body.appendChild(el);
                      el.select();
                      document.execCommand('copy');
                      document.body.removeChild(el);
                      alert('✅ Link copiado!');
                    }
                  } else {
                    alert('❌ No se encontró: ' + productData.modelo);
                  }
                }}
                className="bg-white text-black text-sm font-bold px-2 py-1 rounded hover:bg-gray-200 transition-colors flex-shrink-0"
              >
                📋 Copiar Link
              </button>
            </div>
          </th>
        </tr>
        <tr className="bg-black text-white">
          {(productData.tallas?.length ? productData.tallas : ['S', 'M', 'L', 'XL']).map(talla => (
            <th key={talla} className="border border-white p-1 text-center text-sm">{talla}</th>
          ))}
        </tr>
      </thead>
              <tbody>
                <tr>
                  {(productData.tallas?.length ? productData.tallas : ['S', 'M', 'L', 'XL']).map(talla => (
                    <td key={talla} className="border p-2 align-top w-1/4">
                      {productData.colorsByTalla[talla]?.length > 0 ? (
                        <div className="space-y-2">
                          {productData.colorsByTalla[talla].map((color, i) => {
                            const imageUrl = getColorImageUrl(productData.modelo, color);
                            return (
                              <div key={i} className="flex items-center gap-2 bg-white border rounded p-1">
                                {imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt={color}
                                    loading="lazy"
                                    className="w-10 h-10 object-cover rounded flex-shrink-0"
                                    style={{ background: '#fff' }}
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded bg-gray-200 flex-shrink-0" />
                                )}
                                <span className="text-sm break-words">{color}</span>
                              </div>
                            );
                          })}
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
            <h3 className="text-2xl font-bold">📊 Reporte de Ventas</h3>
            <button onClick={() => setShowModalReporteVentas(false)}><X size={24} /></button>
          </div>
          <div className="p-4 space-y-2">
            <p className="text-base text-gray-500">Ventas por Fecha · Haz clic en una fecha para ver el detalle</p>
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
  className="w-full text-left border rounded-lg p-4 hover:bg-gray-50 flex items-center gap-2 text-xl"
>
  <div className="flex-1">
    <p className="font-medium">
      {new Date(fecha + 'T12:00:00').toLocaleDateString('es-PE', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })}
    </p>
    <div className="flex items-center justify-between mt-1">
      <p className="text-base text-gray-500">{data.ventas} {data.ventas === 1 ? 'venta' : 'ventas'}</p>
      <span className="font-bold text-emerald-600 whitespace-nowrap text-xl">S/ {data.total.toFixed(2)}</span>
    </div>
  </div>
  <span className="text-gray-700 text-5xl font-bold flex-shrink-0">›</span>
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
        <h3 className="text-2xl font-bold">📈 Análisis de Ventas</h3>
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
          <BackupTab supabase={supabase} />
        )}

        {/* ============================================ */}
        {/* TAB: CONFIGURACIÓN */}
        {/* ============================================ */}
        {activeTab === 'configuracion' && (
  <ConfiguracionTab
    supabase={supabase}
    products={products}
    sales={sales}
    clients={clients}
  />
)}
        </main>

      {/* ============================================ */}
      {/* MODALES */}
      {/* ============================================ */}

      {/* MODAL: Agregar/Editar Producto */}
{(showAddProduct || editingProduct) && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

      {/* Header fijo */}
      <div className="bg-gray-900 px-5 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {editingProduct ? '✏️ Editar Producto' : '➕ Agregar Producto'}
          </h2>
          <p className="text-gray-400 text-xl">
            {(editingProduct?.modelo || newProduct.modelo) || 'Nuevo producto'}
          </p>
        </div>
        <button
          onClick={() => {
            setShowAddProduct(false);
            setEditingProduct(null);
            resetNewProduct();
          }}
          className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
        >
          <X size={16} color="white" />
        </button>
      </div>

      {/* Body scrollable */}
      <div className="overflow-y-auto flex-1 p-4 space-y-4">

        {/* SECCIÓN: Información básica */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <div className="bg-gray-900 px-4 py-2.5 flex items-center gap-2">
            <span className="text-sm">📋</span>
            <h3 className="text-white font-bold text-2xl tracking-wide">INFORMACIÓN BÁSICA</h3>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <label className="block text-xl font-bold text-gray-600 mb-1">Nombre del Producto *</label>
              <input
                type="text"
                value={editingProduct ? editingProduct.modelo : newProduct.modelo}
                onChange={(e) => editingProduct
                  ? setEditingProduct({ ...editingProduct, modelo: e.target.value })
                  : setNewProduct({ ...newProduct, modelo: e.target.value })
                }
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-2xl focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                placeholder="Ej: Jean Princesa, Polo Básico, Jogger Casual..."
              />
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-1.5">
                <span className="text-amber-500 text-2xl mt-0.5">💡</span>
                <p className="text-base text-amber-800 leading-relaxed">
                  Si tienes varios modelos del mismo tipo, diferéncialos: <strong>Jean Princesa, Jean Clásico, Jean Casual</strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xl font-bold text-gray-600 mb-1">Precio Venta *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-2xl font-semibold">S/</span>
                  <input
                    type="number" step="0.01"
                    value={editingProduct ? editingProduct.precio_venta : newProduct.precioVenta}
                    onChange={(e) => editingProduct
                      ? setEditingProduct({ ...editingProduct, precio_venta: e.target.value })
                      : setNewProduct({ ...newProduct, precioVenta: e.target.value })
                    }
                    className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-2xl focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xl font-bold text-gray-600 mb-1">Precio Compra</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-2xl font-semibold">S/</span>
                  <input
                    type="number" step="0.01"
                    value={editingProduct ? editingProduct.precio_compra : newProduct.precioCompra}
                    onChange={(e) => editingProduct
                      ? setEditingProduct({ ...editingProduct, precio_compra: e.target.value })
                      : setNewProduct({ ...newProduct, precioCompra: e.target.value })
                    }
                    className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-2xl focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Ganancia automática */}
            {(() => {
              const pv = parseFloat(editingProduct ? editingProduct.precio_venta : newProduct.precioVenta) || 0;
              const pc = parseFloat(editingProduct ? editingProduct.precio_compra : newProduct.precioCompra) || 0;
              if (pv > 0 && pc > 0) return (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 flex justify-between items-center">
                  <span className="text-base text-emerald-700 font-medium">Ganancia por unidad</span>
                  <span className="text-base font-bold text-emerald-700">S/ {(pv - pc).toFixed(2)}</span>
                </div>
              );
            })()}
          </div>
        </div>

        {/* SECCIÓN: Tallas */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <div className="bg-gray-900 px-4 py-2.5 flex items-center gap-2">
            <span className="text-sm">📏</span>
            <h3 className="text-white font-bold text-2xl tracking-wide">TALLAS</h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <span className="text-amber-500 text-2xl mt-0.5">💡</span>
              <p className="text-base text-amber-800 leading-relaxed">
                Escribe cada talla y presiona Enter. Se ordenan solos.<br/>
                Adulto: <strong>S M L XL XXL</strong> · Jean: <strong>28 30 32 34 36 38</strong> · Niños: <strong>2 4 6 8 10 12 14 16</strong> · Especial: <strong>ST</strong> (standard) · <strong>UNICO</strong> (medias, gorros)
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTallaInput}
                onChange={(e) => setNewTallaInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const raw = newTallaInput.trim();
                    if (!raw) return;
                    const t = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
                    const norm = /^(STANDARD|STANDAR|ESTANDAR|ST|STD)$/.test(t) ? 'ST'
                      : /^(UNICO|UNICA|UN|U)$/.test(t) ? 'UNICO'
                      : /^(TALLA\s*)(\d+)$/.test(t) ? t.replace(/^TALLA\s*/, 'T')
                      : t;
                    const current = editingProduct ? (editingProduct.tallas || []) : newProduct.tallas;
                    if (!current.includes(norm)) {
                      const updated = [...current, norm].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
                      editingProduct
                        ? setEditingProduct({ ...editingProduct, tallas: updated })
                        : setNewProduct({ ...newProduct, tallas: updated });
                    }
                    setNewTallaInput('');
                  }
                }}
                className="w-80 px-3 py-2.5 border border-gray-200 rounded-xl text-2xl focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                placeholder="Ej: S, M, 28, ST, UNICO..."
              />
              <button
                onClick={() => {
                  const raw = newTallaInput.trim();
                  if (!raw) return;
                  const t = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
                  const norm = /^(STANDARD|STANDAR|ESTANDAR|ST|STD)$/.test(t) ? 'ST'
                    : /^(UNICO|UNICA|UN|U)$/.test(t) ? 'UNICO'
                    : /^(TALLA\s*)(\d+)$/.test(t) ? t.replace(/^TALLA\s*/, 'T')
                    : t;
                  const current = editingProduct ? (editingProduct.tallas || []) : newProduct.tallas;
                  if (!current.includes(norm)) {
                    const updated = [...current, norm].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
                    editingProduct
                      ? setEditingProduct({ ...editingProduct, tallas: updated })
                      : setNewProduct({ ...newProduct, tallas: updated });
                  }
                  setNewTallaInput('');
                }}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition-colors font-bold text-xl"
              >+</button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[32px]">
              {(editingProduct ? (editingProduct.tallas || []) : newProduct.tallas).length === 0
                ? <p className="text-base text-gray-400 italic">Aún no hay tallas — agrega la primera</p>
                : (editingProduct ? (editingProduct.tallas || []) : newProduct.tallas).map(t => (
                  <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-base font-medium bg-gray-900 text-white border border-gray-700">
                    {t}
                    <button
                      onClick={() => {
                        const current = editingProduct ? (editingProduct.tallas || []) : newProduct.tallas;
                        const updated = current.filter(x => x !== t);
                        editingProduct
                          ? setEditingProduct({ ...editingProduct, tallas: updated })
                          : setNewProduct({ ...newProduct, tallas: updated });
                      }}
                      className="hover:opacity-50 transition-opacity"
                    ><X size={11} /></button>
                  </span>
                ))
              }
            </div>
          </div>
        </div>

        {/* SECCIÓN: Colores */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <div className="bg-gray-900 px-4 py-2.5 flex items-center gap-2">
            <span className="text-sm">🎨</span>
            <h3 className="text-white font-bold text-2xl tracking-wide">COLORES DISPONIBLES</h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <span className="text-amber-500 text-lg mt-0.5">💡</span>
              <p className="text-base text-amber-800 leading-relaxed">
                Escribe sin tilde y presiona Enter. Se ordenan alfabéticamente solos.<br/>
                Correcto: <strong>Azul Marino, Verde Olivo, Guinda, Gris Jaspe</strong>
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newColorInput}
                onChange={(e) => setNewColorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addColorToProduct(editingProduct || newProduct);
                  }
                }}
                className="w-80 px-3 py-2.5 border border-gray-200 rounded-xl text-2xl focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                placeholder="Ej: Negro, Azul Marino, Verde Olivo..."
              />
              <button
                onClick={() => addColorToProduct(editingProduct || newProduct)}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition-colors font-bold text-lg"
              >+</button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[32px]">
              {(editingProduct ? editingProduct.colors : newProduct.colors).length === 0
                ? <p className="text-base text-gray-400 italic">Aún no hay colores — agrega el primero</p>
                : [...(editingProduct ? editingProduct.colors : newProduct.colors)].sort().map(color => (
                  <span key={color} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xl font-medium bg-gray-100 text-gray-700 border border-gray-200">
                    {color}
                    <button
                      onClick={() => removeColorFromProduct(editingProduct || newProduct, color)}
                      className="hover:opacity-50 transition-opacity text-red-500"
                    ><X size={16} /></button>
                  </span>
                ))
              }
            </div>
          </div>
        </div>

        {/* SECCIÓN: Fotos */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <div className="bg-gray-900 px-4 py-2.5 flex items-center gap-2">
            <span className="text-sm">📸</span>
            <h3 className="text-white font-bold text-2xl tracking-wide">FOTOS DEL PRODUCTO</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <span className="text-amber-500 text-lg mt-0.5">💡</span>
              <p className="text-base text-amber-800 leading-relaxed">
                Las fotos van directo a la nube — no dependen de nadie. La foto <strong>Principal</strong> aparece en el catálogo.
              </p>
            </div>

            {/* Foto principal */}
            <div>
              <p className="text-lg font-bold text-gray-600 mb-2">Foto Principal</p>
              <div className="w-36 mx-auto">
                <div
                  className="w-full aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group hover:border-gray-500 hover:bg-gray-50 transition-all"
                  onClick={() => document.getElementById('upload-principal').click()}
                >
                  {(editingProduct ? editingProduct.imagen : newProduct.imagen) ? (
                    <>
                      <img
                        src={editingProduct ? editingProduct.imagen : newProduct.imagen}
                        alt="Principal"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">Cambiar</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1 p-2">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="3"/>
                        <circle cx="8.5" cy="8.5" r="1.5" fill="#d1d5db" stroke="none"/>
                        <path d="M21 15l-5-5L5 21"/>
                      </svg>
                      <span className="text-lg text-gray-400">Subir foto</span>
                    </div>
                  )}
                </div>
                <input
                  id="upload-principal"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const archivo = e.target.files[0];
                    if (!archivo) return;
                    const formData = new FormData();
                    formData.append('file', archivo);
                    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
                    formData.append('folder', `qhapaq/abermud/productos`);
                    const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
                    const data = await res.json();
                    editingProduct
                      ? setEditingProduct({ ...editingProduct, imagen: data.secure_url })
                      : setNewProduct({ ...newProduct, imagen: data.secure_url });
                  }}
                />
                <p className="text-base text-gray-500 font-semibold text-center mt-1">Principal</p>
              </div>
            </div>

            {/* Fotos por color */}
            {(editingProduct ? editingProduct.colors : newProduct.colors).length > 0 && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-lg font-bold text-gray-600 mb-1">
                  Foto por Color <span className="font-normal text-gray-400">(opcional)</span>
                </p>
                <p className="text-base text-gray-400 mb-3">Aparece en el catálogo al seleccionar ese color</p>
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                  <span className="text-amber-500 text-xs mt-0.5">💡</span>
                  <p className="text-base text-amber-800 leading-relaxed">
                    Fotografía la prenda sobre <strong>fondo blanco</strong> para mejor presentación. Ej: coloca el Jogger Negro sobre una superficie blanca.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[...(editingProduct ? editingProduct.colors : newProduct.colors)].sort().map((color) => {
                    const imgColores = editingProduct ? (editingProduct.imagenes_colores || {}) : (newProduct.imagenes_colores || {});
                    const preview = imgColores[color];
                    return (
                      <div key={color} className="flex flex-col items-center gap-1">
                        <div
                          className="w-full aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group hover:border-gray-500 hover:bg-gray-50 transition-all"
                          onClick={() => document.getElementById(`upload-color-${color}`).click()}
                        >
                          {preview ? (
                            <>
                              <img src={preview} alt={color} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-xl font-semibold">Cambiar</span>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center gap-1 p-1">
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="3"/>
                                <circle cx="8.5" cy="8.5" r="1.5" fill="#d1d5db" stroke="none"/>
                                <path d="M21 15l-5-5L5 21"/>
                              </svg>
                              <span className="text-lg text-gray-400 text-center leading-tight">Subir</span>
                            </div>
                          )}
                        </div>
                        <input
                          id={`upload-color-${color}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const archivo = e.target.files[0];
                            if (!archivo) return;
                            const formData = new FormData();
                            formData.append('file', archivo);
                            formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
                            formData.append('folder', `qhapaq/abermud/productos`);
                            const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
                            const data = await res.json();
                            const nuevasImagenes = {
                              ...(editingProduct ? (editingProduct.imagenes_colores || {}) : (newProduct.imagenes_colores || {})),
                              [color]: data.secure_url
                            };
                            editingProduct
                              ? setEditingProduct({ ...editingProduct, imagenes_colores: nuevasImagenes })
                              : setNewProduct({ ...newProduct, imagenes_colores: nuevasImagenes });
                          }}
                        />
                        <span className="text-xl text-gray-500 font-semibold text-center leading-tight">{color}</span>
                      </div>
                    );
                  })}
                </div>
                {(editingProduct ? editingProduct.colors : newProduct.colors).length > 6 && (
                  <p className="text-xs text-gray-400 text-center mt-2 italic">
                    Mostrando 6 de {(editingProduct ? editingProduct.colors : newProduct.colors).length} colores
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="h-2" />
      </div>

      {/* Footer fijo */}
      <div className="px-4 py-3 border-t border-gray-100 flex gap-3 flex-shrink-0 bg-white">
        <button
          onClick={() => {
            setShowAddProduct(false);
            setEditingProduct(null);
            resetNewProduct();
          }}
          className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-xl hover:bg-gray-200 transition-colors"
        >Cancelar</button>
        <button
          onClick={editingProduct ? updateProduct : addProduct}
          className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl font-semibold text-xl hover:bg-gray-700 transition-colors"
        >
          {editingProduct ? 'Actualizar Producto ✓' : 'Guardar Producto ✓'}
        </button>
      </div>
    </div>
  </div>
)}

      {/* MODAL: Agregar Stock - SIMPLIFICADO V2 */}
{showAddStock && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-2xl p-6 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-bold">Agregar Stock</h2>
        <button 
          onClick={() => {
            setShowAddStock(false);
            setStockToAdd({ modelo: '', colors: {} });
            setStockFechaManual('');
          }}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4">

        {/* Instrucciones */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
          <p className="text-xl text-blue-900">
            💡 <strong>Tip:</strong> Escribe números positivos para ingresar (+14) o negativos para corregir (-10)
          </p>
        </div>

        <div>
          <label className="block text-2xl font-bold mb-1">Seleccionar Producto</label>
          <select
            value={stockToAdd.modelo}
            onChange={(e) => setStockToAdd({ ...stockToAdd, modelo: e.target.value, colors: {} })}
            className="w-full px-2 py-1 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none text-2xl"
          >
            <option value="">-- Seleccionar --</option>
            {products.filter(p => p.activo !== false).map(p => (
              <option key={p.id} value={p.modelo}>{p.modelo}</option>
            ))}
          </select>
        </div>

        {/* Botón Liquidar Stock */}
{stockToAdd.modelo && (
  <div className="flex justify-end">
    <button
      onClick={() => {
        const product = products.find(p => p.modelo === stockToAdd.modelo);
        if (!product) return;
        setProductoALiquidar(product);
        setShowPinLiquidar(true);
      }}
      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xl flex items-center gap-2"
    >
      🔴 Liquidar Stock
    </button>
  </div>
)}

        {/* Input unificado para todas las tallas */}
        {stockToAdd.modelo && (
  <div className="border-2 rounded-lg p-4 border-gray-200">
    {(() => {
      const product = products.find(p => p.modelo === stockToAdd.modelo);
      const tallas = product?.tallas?.length ? product.tallas : ['S','M','L','XL'];
      return product?.colors.map(color => (
        <div key={color} className="mb-4 p-0.5 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold mb-2">{color}</p>
          <div className="grid grid-cols-4 gap-2 md:gap-4">
            {tallas.map(talla => {
              const val = parseInt(stockToAdd.colors[color]?.[talla]) || 0;
              const stockActual = product?.stock?.[color]?.[talla] || 0;
              return (
                <div key={talla} className="flex flex-col items-center gap-1">
                  <label className={`text-lg font-medium px-2 py-1 rounded ${
                    stockActual >= 10
                      ? 'bg-green-100 text-green-800'
                      : stockActual >= 6
                        ? 'bg-yellow-100 text-yellow-800'
                        : stockActual > 0
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-500'
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
                            const valor = e.target.value;
                            const cantidadInt = parseInt(valor) || 0;
                            if (cantidadInt < 0 && (stockActual + cantidadInt) < 0) return;
                            const newColors = { ...stockToAdd.colors };
                            if (!newColors[color]) newColors[color] = {};
                            newColors[color][talla] = valor;
                            setStockToAdd({ ...stockToAdd, colors: newColors });
                          }}
                          className={`w-full px-2 py-2 border rounded text-center text-3xl ${
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
            ));
          })()}
        </div>
      )}

        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowAddStock(false);
              setStockToAdd({ modelo: '', colors: {} });
              setStockFechaManual('');
            }}
            className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-medium text-2xl"
          >
            Cancelar
          </button>
          <button
            onClick={addStockToProduct}
            disabled={isProcessing}
            className={`flex-1 px-4 py-2 text-white rounded-lg font-medium text-2xl ${
              isProcessing 
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >  
            {isProcessing ? '⏳ Procesando...' : '📦 Guardar '}
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
          <h2 className="text-xl font-bold">
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
        <p className="text-base text-gray-600">
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
    <div className="flex items-center justify-between mb-1">
      <p className="text-base text-gray-500">{operacion.hora}</p>
      <button
        onClick={async () => {
          const pin = prompt('Ingresa el PIN de administrador:');
          if (pin !== '1111') {
            alert('PIN incorrecto.');
            return;
          }
          const confirmar = window.confirm(`⚠️ ¿Eliminar la operación de las ${operacion.hora}?\n\nEl stock se ajustará automáticamente.`);
          if (!confirmar) return;
          try {
            const product = products.find(p => p.modelo === stockDetailData.modelo);
            if (!product) return;
            const updatedStock = { ...product.stock };
            operacion.items.forEach(item => {
              if (updatedStock[item.color]?.[item.talla] !== undefined) {
                updatedStock[item.color][item.talla] = Math.max(0, (updatedStock[item.color][item.talla] || 0) - item.cantidad);
              }
            });
            await supabase.from('stock_transactions')
              .delete()
              .eq('modelo', stockDetailData.modelo)
              .eq('fecha', stockDetailData.fecha)
              .eq('hora', operacion.hora);
            await supabase.from('products')
              .update({ stock: updatedStock })
              .eq('id', product.id);
            setProducts(products.map(p => p.id === product.id ? { ...p, stock: updatedStock } : p));
            setStockTransactions(prev => prev.filter(t => 
              !(t.modelo === stockDetailData.modelo && t.fecha === stockDetailData.fecha && t.hora === operacion.hora)
            ));
            const newOperaciones = stockDetailData.operaciones.filter((_, i) => i !== idx);
            const newTotal = newOperaciones.reduce((sum, op) => sum + op.items.reduce((s, i) => s + i.cantidad, 0), 0);
            if (newOperaciones.length === 0) {
              setShowStockDetail(false);
            } else {
              setStockDetailData({ ...stockDetailData, operaciones: newOperaciones, total: newTotal });
            }
            alert('✅ Operación eliminada correctamente.');
          } catch (error) {
            alert('❌ Error al eliminar: ' + error.message);
          }
        }}
        className="p-1 hover:bg-red-50 rounded-lg transition-colors text-red-400 hover:text-red-600"
        title="Eliminar esta operación"
      >
        <Trash2 size={20} />
      </button>
    </div>
    {Object.entries(grouped).map(([color, items]) => (
            <div key={color} className="text-base">
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
        <div key={color} className="text-base">
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
        className="w-full mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-medium text-lg"
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
        <h2 className="text-3xl md:text-xl font-bold">Nueva Venta</h2>
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
          <h3 className="hidden md:block font-bold mb-3 text-2xl md:text-base">Productos</h3>
          
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
                <p className="text-2xl md:text-base font-medium">{product.modelo}</p>
                <p className="text-xl md:text-sm text-emerald-600">
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
          <th className="border p-2 text-left font-bold sticky left-0 bg-gray-100 text-base md:text-sm">Color/Talla</th>
          {(product.tallas?.length ? product.tallas : ['S','M','L','XL']).map(talla => (
            <th key={talla} className="border p-2 text-center font-bold text-lg md:text-base">{talla}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {product.colors && product.colors
          .filter(color =>
            (product.tallas?.length ? product.tallas : ['S','M','L','XL']).some(talla => (product.stock?.[color]?.[talla] || 0) > 0)
          )
          .map(color => (
            <tr key={color} className="hover:bg-gray-50">
              <td className="border p-2 md:p-2 font-medium sticky left-0 bg-white text-lg md:text-xs w-20 md:w-auto">{color}</td>
              {(product.tallas?.length ? product.tallas : ['S','M','L','XL']).map(talla => {
                const stockDisponible = product.stock?.[color]?.[talla] || 0;
                const key = `${color}-${talla}`;
                return (
                  <td key={talla} className="border p-2 md:p-2">
                    <div className="flex flex-col items-center gap-2 md:gap-1">
                      <span className={`text-base md:text-sm font-bold px-3 py-1.5 md:py-0.5 rounded-full ${
                        stockDisponible >= 10 ? 'bg-green-100 text-green-700' :
                        stockDisponible >= 6  ? 'bg-yellow-100 text-yellow-700' :
                        stockDisponible > 0   ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {stockDisponible}
                      </span>
                      <input
                        type="number"
                        min="0"
                        max={stockDisponible}
                        placeholder="0"
                        value={colorQuantities[key] || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= stockDisponible)) {
                            setColorQuantities({ ...colorQuantities, [key]: value });
                          }
                        }}
                        disabled={stockDisponible === 0}
                        className={`w-full px-0 py-1 md:py-1 border rounded text-center text-4xl md:text-lg disabled:bg-gray-100 disabled:cursor-not-allowed ${
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
                    className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-xl flex items-center justify-center gap-2"
                  >
                    <Plus size={20} />
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
  className={`flex-1 px-4 py-2 rounded-lg font-medium text-xl ${
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
          <h3 className="font-bold mb-3 text-2xl md:text-lg">Resumen de Compra</h3>

          {/* Client Selection */}
          <div className="mb-4">
            <label className="block text-2xl md:text-xl font-medium mb-1">Cliente *</label>
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
                className="w-full px-3 py-3 border rounded-lg focus:ring-3 focus:ring-black/10 outline-none text-xl"
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
                        <p className="font-medium text-2xl">{client.nombre}</p>
                        {client.dni && <p className="text-2xl text-gray-500">DNI: {client.dni}</p>}
                      </button>
                    ))
                  ) : (
                    <button
                      onClick={() => {
                        setShowCreateClient(true);
                        setShowClientResults(false);
                        setNewClient({ ...newClient, nombre: clientSearch });
                      }}
                      className="w-full px-3 py-3 text-left hover:bg-gray-50 text-blue-600 text-xl"
                    >
                      + Crear nuevo cliente "{clientSearch}"
                    </button>
                  )}
                </div>
              )}
            </div>

            {selectedClient && (
              <div className="mt-2 p-2 bg-emerald-50 rounded-lg text-xl">
                <p className="font-medium">{selectedClient.nombre}</p>
                {selectedClient.telefono && <p className="text-base">Tel: {selectedClient.telefono}</p>}
              </div>
            )}
          </div>

          {showCreateClient && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-medium mb-3 text-xl">Crear Nuevo Cliente</h4>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Nombre *"
                  value={newClient.nombre}
                  onChange={(e) => setNewClient({...newClient, nombre: e.target.value})}
                  className="w-full px-3 py-2 border rounded text-xl"
                />
                <input
                  type="text"
                  placeholder="DNI *"
                  value={newClient.dni}
                  onChange={(e) => setNewClient({...newClient, dni: e.target.value})}
                  className="w-full px-3 py-2 border rounded text-xl"
                  maxLength="8"
                />
                <input
                  type="tel"
                  placeholder="Teléfono"
                  value={newClient.telefono}
                  onChange={(e) => setNewClient({...newClient, telefono: e.target.value})}
                  className="w-full px-3 py-2 border rounded text-xl"
                />
                <input
                  type="text"
                  placeholder="Departamento"
                  value={newClient.departamento}
                  onChange={(e) => setNewClient({...newClient, departamento: e.target.value})}
                  className="w-full px-3 py-2 border rounded text-xl"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreateClient(false)}
                    className="flex-1 px-3 py-2 bg-gray-200 rounded text-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={addClient}
                    className="flex-1 px-3 py-2 bg-black text-white rounded text-xl"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mb-3">
            <label className="block text-2xl font-medium mb-1">Medio de Captación</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSalesChannel('LIVE')}
                className={`flex-1 py-3 md:py-2 rounded-lg font-medium text-xl md:text-sm ${
                  salesChannel === 'LIVE'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                LIVE
              </button>
              <button
                onClick={() => setSalesChannel('TIENDA')}
                className={`flex-1 py-3 md:py-2 rounded-lg font-medium text-xl md:text-sm ${
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
            <label className="block text-2xl font-medium mb-1">Fecha</label>
            <input
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              className="w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-black/10 outline-none text-xl"
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
      <div key={modelo} className="border rounded-lg overflow-hidden text-xl">
        {/* Header producto */}
        <div className="bg-gray-200 px-3 py-1.5">
          <p className="font-bold text-2xl">{modelo}</p>
        </div>
        {/* Filas color-talla */}
        {items.map((item) => (
          <div key={item.index} className="flex items-center justify-between px-3 py-1.5 border-t">
            <div className="flex-1">
              <span className="font-bold text-xl bg-black text-white px-1.5 py-0.5 rounded mr-1">{item.talla}</span>
              <span className="text-gray-700 text-2xl">{item.color} x{item.quantity}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-2xl">S/ {(item.precioVenta * item.quantity).toFixed(2)}</span>
              <button
                onClick={() => removeFromCart(item.index)}
                className="text-red-500 hover:bg-red-50 rounded p-1.5"
              >
                <X size={18} />
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
    <span className="font-bold text-xl">TOTAL:</span>
    <span className="font-bold text-2xl">
      S/ {cart.reduce((sum, item) => sum + (item.precioVenta * item.quantity), 0).toFixed(2)}
    </span>
  </div>
  {(() => {
    const totalCalculado = cart.reduce((sum, item) => sum + (item.precioVenta * item.quantity), 0);
    const montoCobrar = parseFloat(ventaPorCobrar) || totalCalculado;
    const descuento = totalCalculado - montoCobrar;
    return descuento > 0 ? (
      <div className="flex justify-between items-center mt-1 text-red-300">
        <span className="text-lg">Descuento:</span>
        <span className="text-lg font-bold">- S/ {descuento.toFixed(2)}</span>
      </div>
    ) : null;
  })()}
</div>

<div className="mb-3">
  <label className="block text-xl font-medium mb-1 text-gray-700">Venta por Cobrar</label>
  <input
    type="number"
    step="0.01"
    value={ventaPorCobrar}
    onChange={(e) => setVentaPorCobrar(e.target.value)}
    placeholder={cart.reduce((sum, item) => sum + (item.precioVenta * item.quantity), 0).toFixed(2)}
    className="w-full px-3 py-3 border rounded-lg text-xl focus:outline-none focus:ring-2 focus:ring-black/10"
  />
</div>

<button
  onClick={completeSale}
  disabled={isProcessing}
  className={`w-full px-4 py-4 md:py-3 rounded-lg font-medium text-3xl md:text-sm text-white ${
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
              <p className="text-gray-500 text-xl">Carrito vacío</p>
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
  <div className="fixed inset-0 bg-black/70 backdrop-blur-base flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-2xl p-4 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Detalle de Venta</h2>
        <button onClick={() => setViewingSale(null)} className="p-2 hover:bg-gray-100 rounded-lg">
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4 border">
          <div className="grid grid-cols-2 gap-3 text-lg">
            <div>
              <p className="text-xl text-gray-600 mb-1">Pedido #</p>
              <p className="font-bold font-mono">{viewingSale.order_number}</p>
            </div>
            <div>
              <p className="text-xl text-gray-600 mb-1">Fecha</p>
              <p className="font-bold">{viewingSale.fecha.split('-').reverse().join('/')}</p>
            </div>
            <div>
              <p className="text-xl text-gray-600 mb-1">Cliente</p>
              <p className="font-bold">{viewingSale.client_name}</p>
            </div>
            <div>
              <p className="text-xl text-gray-600 mb-1">Medio</p>
              <p className="font-bold">{viewingSale.sales_channel || 'TIENDA'}</p>
            </div>
          </div>
        </div>

        <div>
  <h3 className="font-bold mb-2 text-2xl">Productos</h3>
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
            <p className="font-bold text-xl">{modelo}</p>
          </div>
          {/* Filas por talla */}
          {Object.keys(tallas).filter(t => tallas[t]).map(talla => {
            const colores = tallas[talla];
            const subtotalTalla = colores.reduce((sum, c) => sum + c.subtotal, 0);
            return (
              <div key={talla} className="flex items-center justify-between px-3 py-2 border-t text-xl">
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
  {viewingSale.descuento > 0 && (
    <div className="flex justify-between items-center mb-2 text-red-300">
      <span className="text-lg">Descuento:</span>
      <span className="text-lg font-bold">- S/ {viewingSale.descuento.toFixed(2)}</span>
    </div>
  )}
  <div className="flex justify-between items-center">
    <span className="font-bold text-2xl">TOTAL:</span>
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
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 flex items-center justify-center gap-2 text-lg"
            >
              <Trash2 size={16} />
              Eliminar Venta
            </button>
          );
        })()}

        <div className="flex gap-2">
          <button
            onClick={() => downloadOrderNote(viewingSale)}
            className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-900 flex items-center justify-center gap-2 text-lg"
          >
            <Download size={16} />
            PDF
          </button>
          <button
            onClick={() => shareOrderViaWhatsApp(viewingSale)}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 flex items-center justify-center gap-2 text-lg"
          >
            <Share2 size={16} />
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  </div>
)}

{/* MODAL: Confirmar eliminar producto */}
{showDeleteProduct && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
      <div className="text-center mb-5">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 size={28} className="text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">¿Eliminar producto?</h2>
        <p className="text-gray-500 text-base mt-2">
          Estás a punto de eliminar <span className="font-semibold text-gray-800">"{showDeleteProduct.modelo}"</span>. Esta acción no se puede deshacer.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => setShowDeleteProduct(null)}
          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-base font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={() => deleteProduct(showDeleteProduct.id)}
          className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl text-base font-medium hover:bg-red-700 transition-colors"
        >
          Sí, eliminar
        </button>
      </div>
    </div>
  </div>
)}

{/* MODAL: PIN Liquidar Stock */}
{showPinLiquidar && productoALiquidar && (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
      <div className="text-center mb-5">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🔴</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900">Liquidar Stock</h2>
        <p className="text-gray-500 text-base mt-2">
          Estás a punto de poner en <strong>0</strong> todo el stock de{' '}
          <span className="font-semibold text-gray-800">"{productoALiquidar.modelo}"</span>.
          Esta acción no se puede deshacer.
        </p>
      </div>
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-1 block">PIN de Administrador</label>
        <input
          type="password"
          value={pinLiquidar}
          onChange={(e) => setPinLiquidar(e.target.value)}
          placeholder="Ingresa tu PIN"
          maxLength={8}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-xl font-mono focus:outline-none focus:border-red-400"
        />
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => { setShowPinLiquidar(false); setPinLiquidar(''); setProductoALiquidar(null); }}
          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-base font-medium text-gray-600 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          onClick={async () => {
            const { data: cfg } = await supabase.from('configuracion').select('pin_admin').limit(1).single();
            if (pinLiquidar !== cfg?.pin_admin) {
              alert('❌ PIN incorrecto');
              setPinLiquidar('');
              return;
            }
            const product = productoALiquidar;
            const { fecha, hora } = getPeruDateTime();
            const stockEnCero = {};
            const transacciones = [];
            product.colors.forEach(color => {
              stockEnCero[color] = {};
              const tallas = product.tallas?.length ? product.tallas : ['S','M','L','XL'];
              tallas.forEach(talla => {
                stockEnCero[color][talla] = 0;
                const stockActual = product.stock?.[color]?.[talla] || 0;
                if (stockActual > 0) {
                  transacciones.push({ fecha, hora, tipo: 'LIQUIDACION', modelo: product.modelo, color, talla, cantidad: -stockActual, notes: '🔴 Liquidación de stock' });
                }
              });
            });
            try {
              if (transacciones.length > 0) {
                await supabase.from('stock_transactions').insert(transacciones);
              }
              await supabase.from('products').update({ stock: stockEnCero }).eq('id', product.id);
              setProducts(products.map(p => p.id === product.id ? { ...p, stock: stockEnCero } : p));
              setStockToAdd({ modelo: '', colors: {} });
              setShowPinLiquidar(false);
              setPinLiquidar('');
              setProductoALiquidar(null);
              setShowAddStock(false);
              alert(`✅ Stock de "${product.modelo}" liquidado correctamente.`);
            } catch (error) {
              alert('❌ Error al liquidar: ' + error.message);
            }
          }}
          className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl text-base font-medium hover:bg-red-700"
        >
          Confirmar Liquidar
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}

export default App;