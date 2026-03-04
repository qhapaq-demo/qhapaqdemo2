import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseConfig';

const CatalogoProducto = () => {
  const { productId } = useParams();
  const [producto, setProducto] = useState(null);
  const [stockPorTalla, setStockPorTalla] = useState({});
  const [coloresData, setColoresData] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, [productId]);

  const cargarDatos = async () => {
    const { data: prod } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    // Colores con fotos
    const { data: colores } = await supabase
      .from('color_swatches')
      .select('*')
      .eq('modelo', prod?.modelo);

    // Stock por talla
    const { data: stockData } = await supabase
      .from('stock_transactions')
      .select('color, talla, cantidad, tipo')
      .eq('modelo', prod?.modelo);

    // Calcular stock real
    const calc = {};
    (stockData || []).forEach(t => {
      const key = `${t.color}-${t.talla}`;
      if (!calc[key]) calc[key] = 0;
      calc[key] += t.tipo === 'INGRESO' ? t.cantidad : -t.cantidad;
    });

    // Agrupar colores por talla (solo los que tienen stock > 0)
    const porTalla = { S: [], M: [], L: [], XL: [] };
    Object.keys(porTalla).forEach(talla => {
      // Obtener colores únicos con stock en esta talla
      const coloresEnTalla = [];
      const vistos = new Set();
      (stockData || []).forEach(t => {
        if (t.talla === talla && !vistos.has(t.color)) {
          const stockReal = calc[`${t.color}-${t.talla}`] || 0;
          if (stockReal > 0) {
            vistos.add(t.color);
            // Buscar imagen del color
            const colorInfo = (colores || []).find(c =>
              c.color_name?.toLowerCase() === t.color?.toLowerCase()
            );
            coloresEnTalla.push({
              color: t.color,
              image_url: colorInfo?.image_url || null
            });
          }
        }
      });
      porTalla[talla] = coloresEnTalla;
    });

    const { data: configData } = await supabase
      .from('configuracion')
      .select('*')
      .limit(1)
      .single();

    setProducto(prod);
    setStockPorTalla(porTalla);
    setColoresData(colores || []);
    setConfig(configData);
    setLoading(false);
  };

  const tallas = ['S', 'M', 'L', 'XL'].filter(t => stockPorTalla[t]?.length > 0);

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
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <p className="font-bold text-lg text-gray-800">
            {config?.nombre_negocio || 'Tienda'}
          </p>
          <p className="text-xs text-gray-400 font-medium tracking-widest">QHAPAQ</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-2 py-4">

        {/* TABLA IGUAL AL MODAL */}
        {hayStock ? (
          <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
            {/* Nombre producto */}
            <div className="bg-black text-white p-2 text-center">
              <h1 className="font-bold text-lg">{producto.modelo}</h1>
            </div>

            {/* Cabecera tallas */}
            <table className="w-full text-sm border-collapse">
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
                                <img
                                  src={item.image_url}
                                  alt={item.color}
                                  loading="lazy"
                                  className="w-10 h-10 object-cover rounded flex-shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded bg-gray-200 flex-shrink-0" />
                              )}
                              <span className="text-xs break-words">{item.color}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-300 py-2">—</div>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border p-8 text-center">
            <p className="text-gray-400 text-lg">Sin stock disponible</p>
          </div>
        )}

        {/* FOOTER */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-300 tracking-widest">Powered by QHAPAQ</p>
          <p className="text-xs text-gray-300 mt-1">
            Actualizado: {new Date().toLocaleDateString('es-PE')}
          </p>
        </div>

      </div>
    </div>
  );
};

export default CatalogoProducto;

