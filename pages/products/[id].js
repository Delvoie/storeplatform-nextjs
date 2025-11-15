import { useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import ProductDetail from '@/components/ProductDetail';
import { ProductContext } from '@/components/ProductContext';

export default function ProductDetailPage({ product, error }) {
  const router = useRouter();
  const { setProducts, products } = useContext(ProductContext);

  useEffect(() => {
    if (product && !products.find(p => p.id === product.id)) {
      setProducts(prev => [...prev, product]);
    }
  }, [product, products, setProducts]);

  if (router.isFallback) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;
  }

  if (error) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '2rem' }}>
        <p role="alert" style={{ color: 'red' }}>{error}</p>
      </div>
    );
  }

  return <ProductDetail product={product} />;
}

export async function getStaticPaths() {
  const spaceId = process.env.CONTENTFUL_SPACES_ID;
  const accessToken = process.env.CONTENTFUL_CDA_TOKEN;
  const envId = process.env.CONTENTFUL_ENV || 'master';
  const contentType = "products";

  try {
    const url = `https://cdn.contentful.com/spaces/${spaceId}/environments/${envId}/entries?access_token=${accessToken}&content_type=${contentType}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Failed to fetch products for paths");
    }

    const data = await response.json();
    const paths = (data.items || []).map((item) => ({
      params: { id: item.sys.id }
    }));

    return {
      paths,
      fallback: 'blocking' // Enable ISR for new products
    };
  } catch (error) {
    console.error("Error fetching product paths:", error);
    return {
      paths: [],
      fallback: 'blocking'
    };
  }
}

export async function getStaticProps({ params }) {
  const spaceId = process.env.CONTENTFUL_SPACES_ID;
  const accessToken = process.env.CONTENTFUL_CDA_TOKEN;
  const envId = process.env.CONTENTFUL_ENV || 'master';
  const { id } = params;

  try {
    // Fetch the specific product by sys.id
    const url = `https://cdn.contentful.com/spaces/${spaceId}/environments/${envId}/entries/${id}?access_token=${accessToken}`;
    console.log("Fetching product detail from Contentful:", url);

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        return { notFound: true };
      }
      throw new Error("Failed to fetch product details");
    }

    const item = await response.json();

    // used ai to help with image fetching logic
    let images = [];
    if (item.fields.image) {
      if (Array.isArray(item.fields.image)) {
        for (const img of item.fields.image) {
          if (img.sys?.id) {
            const assetUrl = `https://cdn.contentful.com/spaces/${spaceId}/environments/${envId}/assets/${img.sys.id}?access_token=${accessToken}`;
            const assetResponse = await fetch(assetUrl);
            if (assetResponse.ok) {
              const assetData = await assetResponse.json();
              const imageUrl = assetData.fields?.file?.url;
              if (imageUrl) images.push(imageUrl);
            }
          }
        }
      } else if (item.fields.image.sys?.id) {
        const assetUrl = `https://cdn.contentful.com/spaces/${spaceId}/environments/${envId}/assets/${item.fields.image.sys.id}?access_token=${accessToken}`;
        const assetResponse = await fetch(assetUrl);
        if (assetResponse.ok) {
          const assetData = await assetResponse.json();
          const imageUrl = assetData.fields?.file?.url;
          if (imageUrl) images.push(imageUrl);
        }
      }
    }

    const product = {
      id: item.sys.id,
      title: item.fields.title || 'Untitled Product',
      description: item.fields.description || '',
      brandName: item.fields.brandName || item.fields.author || '',
      price: item.fields.price || null,
      category: item.fields.category || '',
      images: images,
      image: images[0] || null
    };

    return {
      props: {
        product,
        error: null
      },
      revalidate: 60 
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    return {
      props: {
        product: null,
        error: "Failed to fetch product: " + error.message
      }
    };
  }
}
