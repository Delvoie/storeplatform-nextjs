import Image from 'next/image';
import { useRouter } from 'next/router';
import { useState } from 'react';

function ProductDetail({ product }) {
  const router = useRouter();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleBack = () => {
    router.push('/products');
  };

  if (!product) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '2rem' }}>
        <h1>Product not found</h1>
        <button 
          onClick={handleBack}
          style={{ 
            padding: '0.6rem 1.2rem',
            marginTop: '1rem',
            cursor: 'pointer',
            minHeight: '44px',
            minWidth: '44px'
          }}
        >
          Back to Products
        </button>
      </div>
    );
  }

  const images = product.images || [];
  const hasMultipleImages = images.length > 1;

  return (
    <div className="product-detail container">
      {images.length > 0 && (
        <div>
          <Image 
            src={`https:${images[selectedImageIndex]}`} 
            alt={`${product.title} - Image ${selectedImageIndex + 1}`}
            width={600}
            height={400}
            style={{ objectFit: 'contain' }}
          />
          {hasMultipleImages && (
            <div className="image-thumbnails" style={{ 
              display: 'flex', 
              gap: '0.5rem', 
              marginTop: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  style={{
                    padding: '0.25rem',
                    border: selectedImageIndex === index ? '2px solid #007bff' : '2px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    minHeight: '44px',
                    minWidth: '44px',
                    background: 'white'
                  }}
                  aria-label={`View image ${index + 1}`}
                >
                  <Image 
                    src={`https:${img}`} 
                    alt={`${product.title} thumbnail ${index + 1}`}
                    width={60}
                    height={60}
                    style={{ objectFit: 'contain' }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <h1>{product.title}</h1>
      {product.brandName && <p><strong>Brand:</strong> {product.brandName}</p>}
      {product.price && <p className="price">${product.price}</p>}
      {product.category && <p><strong>Category:</strong> {product.category}</p>}
      {product.description && <p>{product.description}</p>}
      <button 
        onClick={handleBack}
        style={{ 
          padding: '0.6rem 1.2rem',
          marginTop: '1rem',
          cursor: 'pointer',
          minHeight: '44px',
          minWidth: '44px'
        }}
      >
        Back to Products
      </button>
    </div>
  );
}

export default ProductDetail;
