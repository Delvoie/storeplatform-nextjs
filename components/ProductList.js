import Link from 'next/link';
import Image from 'next/image';

function ProductList({ products, page, totalPages, onPageChange }) {
  if (!products || products.length === 0) {
    return <p style={{ textAlign: 'center', padding: '2rem' }}>No products found.</p>;
  }

  return (
    <div className="container">
      <div className="product-list">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <Link href={`/products/${product.id}`}>
              {product.image && (
                <Image 
                  src={`https:${product.image}`} 
                  alt={product.title}
                  width={280}
                  height={180}
                  style={{ objectFit: 'contain' }}
                />
              )}
              <h3>{product.title}</h3>
            </Link>
            {product.brandName && <p><strong>Brand:</strong> {product.brandName}</p>}
            {product.price && <p className="price">${product.price}</p>}
            {product.category && <p><strong>Category:</strong> {product.category}</p>}
          </div>
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="pagination" style={{ textAlign: 'center', margin: '2rem 0' }}>
          <button 
            onClick={() => onPageChange(page - 1)} 
            disabled={page <= 1}
            style={{ 
              padding: '0.5rem 1rem', 
              margin: '0 0.5rem',
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
              minHeight: '44px',
              minWidth: '44px'
            }}
          >
            Previous
          </button>
          <span style={{ margin: '0 1rem' }}>
            Page {page} of {totalPages}
          </span>
          <button 
            onClick={() => onPageChange(page + 1)} 
            disabled={page >= totalPages}
            style={{ 
              padding: '0.5rem 1rem', 
              margin: '0 0.5rem',
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              minHeight: '44px',
              minWidth: '44px'
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default ProductList;
