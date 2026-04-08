import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseConfig';
import logoQhapaq from '../logo_Qhapaq.png';

const CatalogoProducto = () => {
  const { productId } = useParams();
  const [producto, setProducto] = useState(null);
  const [stockPorTalla, setStockPorTalla] = useState({});
  const [coloresData, setColoresData] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoomImg, setZoomImg] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, [productId]);

  const cargarDatos = async () => {
  const { data: prod } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  const { data: swatches } = await supabase
    .from('color_swatches')
    .select('*')
    .eq('modelo', prod?.modelo);
  
  const { data: transactions } = await supabase
  .from('stock_transactions')
  .select('*')
  .eq('modelo', prod?.modelo)
  .order('fecha', { ascending: true });

  const { data: configData } = await supabase
    .from('configuracion')
    .select('*')
    .limit(1)
    .single();

  const calcularStock = (txs) => {
  const stock = {};
  (txs || []).forEach(t => {
    if (!stock[t.color]) stock[t.color] = {};
    if (!stock[t.color][t.talla]) stock[t.color][t.talla] = 0;
    if (t.tipo === 'LIQUIDACION') {
      stock[t.color][t.talla] = 0;
    } else if (t.tipo === 'SALIDA') {
      stock[t.color][t.talla] = Math.max(0, stock[t.color][t.talla] - t.cantidad);
    } else if (t.tipo === 'REVERSION') {
      stock[t.color][t.talla] += t.cantidad;
    } else {
      stock[t.color][t.talla] += t.cantidad;
    }
  });
  return stock;
};
const stockCalculado = calcularStock(transactions);

  const tallas = prod?.tallas?.length ? prod.tallas : ['S', 'M', 'L', 'XL'];
  const porTalla = {};
  tallas.forEach(talla => {
    porTalla[talla] = [];
    (prod?.colors || []).forEach(color => {
      const cantidad = stockCalculado?.[color]?.[talla] || 0;
      if (cantidad > 0) {
        // Buscar imagen en imagenes_colores primero, luego en swatches
        const imageUrl = prod?.imagenes_colores?.[color] 
          || swatches?.find(s => s.color_name?.toLowerCase() === color.toLowerCase())?.image_url 
          || null;
        porTalla[talla].push({ color, image_url: imageUrl });
      }
    });
  });  

  setProducto(prod);
  setStockPorTalla(porTalla);
  setConfig(configData);
  setLoading(false);
};

  const tallas = (producto?.tallas?.length ? producto.tallas : ['S', 'M', 'L', 'XL'])
  .filter(t => stockPorTalla[t]?.length > 0);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500">Cargando catálogo...</p>
      </div>
    </div>
  );

  if (!producto) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500">Producto no encontrado</p>
    </div>
  );

  const hayStock = tallas.some(t => stockPorTalla[t]?.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-3 py-3 flex items-center justify-between">
          <div className="flex flex-col items-start">
  <img src={logoQhapaq} alt="Logo" className="h-28 object-contain" />
  <p className="text-sm text-gray-500 font-medium mt-1 mb-0.5 pl-1">
    {config?.nombre_negocio || 'Tienda'}
  </p>
</div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-2 py-2">

      {/* TABLA IGUAL AL MODAL */}
{hayStock ? (
  <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
    {/* Nombre producto */}
    <div className="bg-black text-white p-2 text-center">
      <h1 className="font-bold text-lg">{producto.modelo}</h1>
    </div>
    {/* Scroll wrapper */}
    <div className="overflow-x-auto">
      <table className="text-base border-collapse w-full">
        <thead>
          <tr className="bg-black text-white">
            {tallas.map(t => (
              <th key={t} className="border border-white p-2 text-center font-bold">{t}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {tallas.map(talla => (
              <td key={talla} className="border p-1 align-top w-1/4">
                {stockPorTalla[talla]?.length > 0 ? (
                  <div className="space-y-1">
                    {stockPorTalla[talla].map((item, i) => (
                      <div key={i} className="flex items-center gap-1 bg-white border rounded p-1">
                        {item.image_url ? (
                          <>
                            <img
                              src={item.image_url}
                              alt={item.color}
                              loading="eager"
                              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                              onClick={() => setZoomImg({ url: item.image_url, color: item.color })}
                              className="w-14 h-14 object-cover rounded flex-shrink-0 cursor-pointer active:opacity-70"
                            />
                            <div className="w-14 h-14 rounded bg-gray-200 flex-shrink-0 hidden" />
                          </>
                        ) : (
                          <div className="w-14 h-14 rounded bg-gray-200 flex-shrink-0" />
                        )}
                        <span className="text-xs break-words">{item.color}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-300 py-3">—</div>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  </div>
) : (
  <div className="bg-white rounded-2xl shadow-sm border p-8 text-center">
    <p className="text-gray-400 text-lg">Sin stock disponible</p>
  </div>
)}   

{/* MODAL: Zoom imagen */}
{zoomImg && (
  <div 
    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
    onClick={() => setZoomImg(null)}
  >
    <div className="max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
      <img
        src={zoomImg.url}
        alt={zoomImg.color}
        className="w-full rounded-2xl shadow-2xl object-cover"
      />
      <p className="text-white text-center font-bold mt-3 text-xl">{zoomImg.color}</p>
      <button
        onClick={() => setZoomImg(null)}
        className="mt-3 w-full py-3 bg-white text-black rounded-xl font-medium text-xl"
      >
        Cerrar
      </button>
    </div>
  </div>
)}

        {/* FOOTER */}
        <div className="mt-6 text-center">
          <p className="text-lg text-gray-400 tracking-widest">Powered by QHAPAQ</p>
          <p className="text-base text-gray-400 mt-1">
            Actualizado: {new Date().toLocaleDateString('es-PE')}
          </p>
        </div>

      </div>
    </div>
  );
};

export default CatalogoProducto;

