import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Info, Package, Tag, AlertCircle, RefreshCw } from 'lucide-react';
import { getProductById } from '../../api/productApi';
import toast from 'react-hot-toast';
import { useCart } from '../../context/CartContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Loader } from '../../components/ui/Loader';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, loading: cartLoading } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pageVisibleRef = useRef(false);

  useEffect(() => {
    fetchProduct();
    
    // Refetch product data when page becomes visible (returns from checkout/order page)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && pageVisibleRef.current) {
        // User has returned to this page; refetch latest stock
        fetchProduct();
      }
      pageVisibleRef.current = document.visibilityState === 'visible';
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    pageVisibleRef.current = true;
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getProductById(id);
      const data = res.data || res;
      setProduct(data);
    } catch (err) {
      console.error('Error fetching product details:', err);
      setError('Product not found or failed to load.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchProduct();
    toast.success('Stock updated!');
  };

  const handleAddToCart = async () => {
    try {
      // Client-side validation: if requested more than available, show message and abort
      if (quantity > product.stock) {
        const available = product.stock;
        if (available <= 0) {
          toast.error(`\"${product.name}\" is out of stock.`);
        } else {
          toast.error(`Only ${available} unit(s) of \"${product.name}\" are available.`);
        }
        return;
      }

      setIsAdding(true);
      await addToCart(product.id, quantity);
    } catch (error) {
      // Backend errors are shown by CartContext; nothing more to do here
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] " >
        <Loader size="xl" />
        <p className="text-text-light mt-4">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center animate-in fade-in">
        <div className="w-20 h-20 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-text mb-4">Product Not Found</h1>
        <p className="text-text-light mb-8">{error || 'The product you are looking for does not exist.'}</p>
        <Button onClick={() => navigate('/products')} variant="primary" size="lg">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Products
        </Button>
      </div>
    );
  }

  const isAvailable = product.stock > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
      <Link to="/products" className="inline-flex items-center text-text-light hover:text-primary transition-colors mb-6 font-medium">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Products
      </Link>

      <div className="bg-surface rounded-2xl shadow-soft-lg overflow-hidden border border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          
          {/* Product Image */}
          <div className="bg-gray-50 aspect-square lg:aspect-auto lg:h-full p-8 flex items-center justify-center relative">
            <img 
              src={product.image_url || 'https://via.placeholder.com/600x600?text=Product'} 
              alt={product.name}
              className={`max-w-full max-h-full object-contain mix-blend-multiply ${!isAvailable && 'grayscale opacity-80'}`}
            />
            <div className="absolute top-6 right-6 flex items-center gap-2">
              {isAvailable ? (
                <Badge variant="success" className="text-sm px-4 py-1.5 shadow-md">In Stock ({product.stock} units)</Badge>
              ) : (
                <Badge variant="danger" className="text-sm px-4 py-1.5 shadow-md">Out of Stock</Badge>
              )}
              <button
                onClick={handleRefresh}
                className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                title="Refresh stock info"
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 text-text-light ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Product Details */}
          <div className="p-8 lg:p-12 flex flex-col">
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="secondary" className="uppercase tracking-wider text-[10px]">
                <Tag className="w-3 h-3 mr-1" /> Category {product.category_id}
              </Badge>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-text mb-4 tracking-tight">
              {product.name}
            </h1>
            {quantity > product.stock && (
              <div className="mt-2">
                <p className="text-sm text-danger">Only {product.stock} unit(s) available — you entered {quantity}.</p>
              </div>
            )}
            
            <div className="text-3xl font-extrabold text-primary mb-6">
              ₹{product.price} <span className="text-sm font-medium text-text-light">/ unit</span>
            </div>

            <div className="prose prose-sm text-text-light mb-8 max-w-none">
              <p>{product.description || 'No description provided for this product. Premium quality materials guaranteed by Prince Piping.'}</p>
            </div>

            <div className="bg-background rounded-xl p-6 mb-8 border border-gray-100">
              <h3 className="flex items-center text-text font-semibold mb-4">
                <Info className="w-5 h-5 mr-2 text-secondary" /> Specifications
              </h3>
              <p className="text-sm text-text-light">
                {product.specifications || 'Standard specifications apply. Contact dealer support for more details.'}
              </p>
            </div>

            {/* Add to Cart Actions */}
            <div className="mt-auto pt-8 border-t border-gray-100 flex flex-col sm:flex-row gap-4 items-end">
              {isAvailable && (
                <div className="w-full sm:w-32">
                  <label htmlFor="quantity" className="block text-sm font-medium text-text mb-2">Quantity</label>
                  <div className="flex items-center border border-gray-200 rounded-[var(--radius-soft)] bg-surface overflow-hidden">
                    <button 
                      className="px-3 py-2 text-text-light hover:text-text hover:bg-gray-50 transition-colors"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      -
                    </button>
                    <input 
                      id="quantity"
                      type="number" 
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full text-center py-2 focus:outline-none font-medium text-text"
                    />
                    <button 
                      className="px-3 py-2 text-text-light hover:text-text hover:bg-gray-50 transition-colors"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
              

              <Button 
                variant={isAvailable ? 'primary' : 'danger'}
                size="lg" 
                className={`flex-1 h-12 text-lg ${(!isAvailable || isAdding) && 'opacity-50 cursor-not-allowed'}`}
                disabled={!isAvailable || isAdding}
                onClick={handleAddToCart}
                isLoading={isAdding}
              >
                {isAvailable ? (
                  <><ShoppingCart className="w-5 h-5 mr-2" /> Add to Cart</>
                ) : (
                  <><Package className="w-5 h-5 mr-2" /> Out of Stock</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
