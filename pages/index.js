import Link from 'next/link';

export default function Home() {
  return (
    <div className="container">
      <section className="hero">
        <h1>Welcome to Lucas' Store Platform</h1>
        <p>Browse Lucas' collection of products powered by Contentful CMS</p>
        <Link href="/products" style={{ 
          display: 'inline-block',
          padding: '0.6rem 1.2rem',
          marginTop: '1rem',
          backgroundColor: '#007bff',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px',
          minHeight: '44px',
          minWidth: '44px',
          lineHeight: '28px'
        }}>
          Browse Products
        </Link>
      </section>
    </div>
  );
}
