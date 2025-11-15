import { useState } from 'react';

function ProductFilter({ categories, selectedCategory, onCategoryChange }) {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="product-filter" style={{ textAlign: 'center', margin: '1.5rem 0' }}>
      <label htmlFor="category-filter" style={{ marginRight: '0.5rem', fontWeight: '500' }}>
        Filter by Category:
      </label>
      <select
        id="category-filter"
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
        style={{
          padding: '0.5rem 1rem',
          minHeight: '44px',
          minWidth: '200px',
          fontSize: '1rem',
          borderRadius: '4px',
          border: '1px solid #ddd',
          cursor: 'pointer'
        }}
      >
        <option value="all">All Categories</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ProductFilter;
