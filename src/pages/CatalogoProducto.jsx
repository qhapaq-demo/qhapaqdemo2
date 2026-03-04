import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseConfig';

const CatalogoProducto = () => {
  const { productId } = useParams();
  const [producto, setProducto] = useState(null);
  const [stock, setStock] = useState([]);
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

    const { data: stockData } = await supabase
      .from('color_swatches')
      .select('*')
      .eq('modelo', prod?.modelo)
      .order('color_name');

    const { data: configData } = await supabase
      .from('configuracion')
      .select('*')
      .limit(1)
      .single();

    setProducto(prod);
    setStock(stockData || []);
    setConfig(configData);
    setLoading(false);
  };

  // Colores únicos sin repetir
const coloresUnicos = stock.filter((item, index, self) =>
  index === self.findIndex(t => t.color_name === item.color_name)
);

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

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* PRODUCTO HEADER */}
        <div className="bg-white rounded-2xl shadow-sm border p-5 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{producto.modelo}</h1>
          {producto.precio && (
            <p className="text-xl font-bold text-purple-600 mt-2">
              S/ {producto.precio}
            </p>
          )}
        </div>

        {/* STOCK */}
        {stock.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-gray-700 px-1">Colores Disponibles</h2>
            <div className="grid grid-cols-2 gap-3">
              {coloresUnicos.map((item, idx) => (
                <div key={idx} className="bg-white rounded-2xl shadow-sm border p-3 flex items-center gap-3">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.color_name}
                      className="w-14 h-14 object-cover rounded-xl border flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gray-200 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{item.color_name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border p-8 text-center">
            <p className="text-gray-400 text-lg">Sin stock disponible</p>
          </div>
        )}

        {/* FOOTER */}
        <div className="mt-8 text-center">
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
