import { createContext, useState, useContext } from 'react';

export const ProductContext = createContext(null);

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);

  const getProductById = (id) => {
    return products.find(product => product.id === id);
  };

  return (
    <ProductContext.Provider value={{ products, setProducts, getProductById }}>
      {children}
    </ProductContext.Provider>
  );
}

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
