export default function About() {
  return (
    <div className="container">
      <section className="card">
        
        <h1>About Lucas' Store Platform</h1>
        <div>
          This is a modern e-commerce platform built with Next.js and powered by Contentful CMS.
          The application demonstrates the use of Static Site Generation (SSG) for optimal 
          performance and SEO.
        </div>
        <h2>Features</h2>
        <ul>
          <li>Dynamic product listing with pagination</li>
          <li>Contentful CMS integration for easy content management</li>
          <li>Responsive design for all devices</li>
          <li>Optimized images with Next.js Image component</li>
          <li>Server-side rendering and static site generation</li>
        </ul>
        <h2>Technology Stack</h2>
        <ul>
          <li>Next.js - React framework for production</li>
          <li>Contentful - Headless CMS for content management</li>
          <li>React Context API - For global state management</li>
        </ul>
      </section>
    </div>
  );
}
