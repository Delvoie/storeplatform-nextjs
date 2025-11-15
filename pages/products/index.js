import { useEffect, useContext, useState } from 'react';
import { useRouter } from 'next/router';
import ProductList from '@/components/ProductList';
import ProductFilter from '@/components/ProductFilter';
import { ProductContext } from '@/components/ProductContext';

export default function Products({ products, error, page, totalProducts, totalPages, categories }) {
  const { setProducts } = useContext(ProductContext);
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(router.query.category || 'all');

  useEffect(() => {
    if (products) setProducts(products);
  }, [products, setProducts]);

  useEffect(() => {
    setSelectedCategory(router.query.category || 'all');
  }, [router.query.category]);

  const handlePageChange = (newPage) => {
    const query = { page: newPage };
    if (selectedCategory !== 'all') {
      query.category = selectedCategory;
    }
    router.push({ pathname: '/products', query });
  };

  const handleCategoryChange = (category) => {
    const query = { page: 1 };
    if (category !== 'all') {
      query.category = category;
    }
    router.push({ pathname: '/products', query });
  };

  return (
    <div className="container">
      <section className="card" style={{ padding: '1rem', marginTop: '1rem' }}>
        <h1 style={{ textAlign: 'center' }}>Our Products</h1>
        <ProductFilter 
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />
        {error ? (
          <p role="alert" style={{ textAlign: 'center', color: 'red', padding: '2rem' }}>
            {error}
          </p>
        ) : (
          <ProductList
            products={products}
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </section>
    </div>
  );
}

export async function getServerSideProps({ query }) {
  const spaceId = process.env.CONTENTFUL_SPACES_ID;
  const accessToken = process.env.CONTENTFUL_CDA_TOKEN;
  const envId = process.env.CONTENTFUL_ENV || 'master';
  const contentType = "products";

  // Pagination parameters
  const limit = 10; 
  const page = parseInt(query.page || '1', 10);
  const skip = (page - 1) * limit;
  const categoryFilter = query.category || null;

  // Build URL with optional category filter
  let url = `https://cdn.contentful.com/spaces/${spaceId}/environments/${envId}/entries?access_token=${accessToken}&content_type=${contentType}&limit=${limit}&skip=${skip}`;
  
  if (categoryFilter && categoryFilter !== 'all') {
    url += `&fields.category=${encodeURIComponent(categoryFilter)}`;
  }

  try {
    console.log("Fetching products from Contentful API:", url);

    const response = await fetch(url);

    if (!response.ok) {
      console.error("Failed to fetch:", response.status, response.statusText);
      throw new Error("Failed to fetch Contentful products");
    }

    const data = await response.json();
    console.log("Contentful API response:", data);

    // Fetch all products to get unique categories
    const allProductsUrl = `https://cdn.contentful.com/spaces/${spaceId}/environments/${envId}/entries?access_token=${accessToken}&content_type=${contentType}&limit=1000`;
    const allProductsResponse = await fetch(allProductsUrl);
    let categories = [];
    
    if (allProductsResponse.ok) {
      const allProductsData = await allProductsResponse.json();
      const categorySet = new Set();
      allProductsData.items.forEach(item => {
        if (item.fields.category) {
          categorySet.add(item.fields.category);
        }
      });
      categories = Array.from(categorySet).sort();
    }

    if (!data.items || data.items.length === 0) {
      console.warn("No items found in Contentful response");
      return {
        props: {
          products: [],
          error: null,
          page,
          totalProducts: 0,
          totalPages: 1,
          categories
        }
      };
    }

    // Map the data to extract relevant fields
    const assets = data.includes?.Asset || [];
    
    const products = (data.items || []).map((item) => {
      let images = [];
      if (item.fields.image) {
        if (Array.isArray(item.fields.image)) {
          // used ai to help with image fetching logic
          images = item.fields.image
            .map(img => {
              const imageAsset = assets.find(asset => asset.sys.id === img.sys.id);
              return imageAsset?.fields?.file?.url || null;
            })
            .filter(url => url !== null);
        } else if (item.fields.image.sys?.id) {
          // used ai to help with image fetching logic
          const imageAsset = assets.find(asset => asset.sys.id === item.fields.image.sys.id);
          if (imageAsset?.fields?.file?.url) {
            images.push(imageAsset.fields.file.url);
          }
        }
      }
      
      return {
        id: item.sys.id,
        title: item.fields.title || 'Untitled Product',
        description: item.fields.description || '',
        brandName: item.fields.brandName || item.fields.author || '',
        price: item.fields.price || null,
        category: item.fields.category || '',
        images: images,
        image: images[0] || null // Primary image for backwards compatibility
      };
    });

    const totalProducts = data.total || 0;
    const totalPages = Math.ceil(totalProducts / limit);

    return {
      props: {
        products,
        error: null,
        page,
        totalProducts,
        totalPages,
        categories
      }
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      props: {
        products: [],
        error: "Failed to fetch products: " + error.message,
        page: 1,
        totalProducts: 0,
        totalPages: 1,
        categories: []
      }
    };
  }
}
