# Store Platform - Next.js Technical Documentation

## Table of Contents
- [Project Overview](#project-overview)
- [Architecture & Implementation](#architecture--implementation)
- [API Documentation](#api-documentation)
- [Migration Challenges](#migration-challenges)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Features](#features)

---

## Project Overview

**Store Platform** is a modern e-commerce web application built with Next.js 16 and powered by Contentful headless CMS. This project demonstrates the migration from a client-side rendered React application to a server-side rendered Next.js application with static site generation (SSG) and incremental static regeneration (ISR).

---

## Architecture & Implementation

### Pages Router Structure
This project uses Next.js Pages Router (not App Router) for file-based routing:

```
pages/
├── _app.js              # Application wrapper with ProductProvider & Layout
├── index.js             # Homepage (/)
├── about.js             # About page (/about)
└── products/
    ├── index.js         # Product listing (/products)
    └── [id].js          # Dynamic product detail (/products/[id])
```

### Component Architecture
```
components/
├── ProductContext.js    # Global state management (Context API)
├── Layout.js            # Page wrapper (Header, Navbar, Footer)
├── Header.js            # Reusable header component
├── Navbar.js            # Navigation with Next.js Link
├── Footer.js            # Reusable footer component
├── Sidebar.js           # Sidebar component
├── ProductList.js       # Product grid with pagination
├── ProductDetail.js     # Product detail display with image gallery
└── ProductFilter.js     # Dynamic category filter dropdown

```

## API Documentation

### Contentful Content Delivery API

**Base URL:** `https://cdn.contentful.com/spaces/{spaceId}/environments/{envId}`

#### Authentication
All requests require an access token passed as a query parameter:
```
?access_token={CONTENTFUL_CDA_TOKEN}
```

### Endpoints Used

#### 1. Fetch All Products (with pagination)
```
GET /entries?content_type=products&limit={limit}&skip={skip}
```

**Parameters:**
- `content_type`: "products" (required)
- `limit`: Number of entries per page (default: 10)
- `skip`: Number of entries to skip for pagination
- `fields.category`: Filter by category (optional)

**Example Request:**
```javascript
const url = `https://cdn.contentful.com/spaces/${spaceId}/environments/${envId}/entries?access_token=${accessToken}&content_type=products&limit=10&skip=0&fields.category=electronics`;
```

## Migration Challenges

### 1. React to Next.js Migration

#### Challenge: Client-Side Rendering → Server-Side Rendering
**Problem:** Original React app used `useEffect` to fetch data from FakeStoreAPI on component mount, causing:
- Slow initial page loads
- Poor SEO (empty HTML on first render)
- Flash of loading state

**Solution:**
- Implemented `getServerSideProps` for product listing (real-time data)
- Implemented `getStaticProps` + `getStaticPaths` for product details (pre-rendering)
- Data fetched on server before HTML is sent to client

**Before (React):**
```javascript
useEffect(() => {
  const fetchProducts = async () => {
    const response = await fetch('https://fakestoreapi.com/products');
    const data = await response.json();
    setProducts(data);
  };
  fetchProducts();
}, []);
```

**After (Next.js):**
```javascript
export async function getServerSideProps({ query }) {
  const response = await fetch(contentfulUrl);
  const data = await response.json();
  return { props: { products: data.items } };
}
```

#### Challenge: React Router → Next.js File-Based Routing
**Problem:** React Router used `<Route>` components and `react-router-dom` for navigation

**Solution:**
- Converted to file-based routing in `pages/` directory
- Changed `<Link from="react-router-dom">` to `<Link from="next/link">`
- Updated `href` props to match Next.js routing conventions

**Before:**
```jsx
<Link to={`/product/${id}`}>View Product</Link>
```

**After:**
```jsx
<Link href={`/products/${id}`}>View Product</Link>
```

### 2. FakeStoreAPI → Contentful CMS Migration

#### Challenge: Numeric IDs → Alphanumeric sys.id
**Problem:** FakeStoreAPI used simple numeric IDs (1, 2, 3...), Contentful uses alphanumeric system IDs

**Solution:**
- Updated dynamic routes to use `sys.id` from Contentful
- Modified `getStaticPaths` to generate paths from Contentful entries
- Changed ID comparison logic from `parseInt(id)` to string comparison

**Before:**
```javascript
const product = products.find(p => p.id === parseInt(id));
```

**After:**
```javascript
const product = products.find(p => p.id === id); // sys.id is already a string
```

#### Challenge: No Content Ownership → Full Content Control
**Problem:** FakeStoreAPI is a mock API with fixed data, no ability to manage content

**Solution:**
- Set up Contentful space with custom "products" content type
- Created content model with required fields (title, description, brandName, price, category, image)
- Secured API credentials in `.env.local`
- Implemented proper error handling for unpublished/deleted entries

### 3. Rendering Images from Contentful

#### Challenge: Single vs. Multiple Images
**Problem:** Contentful field `image` is type "Media, many files" - supports both single and array of images

**Solution:** Implemented dynamic detection for single vs. multiple images

```javascript
let images = [];
if (item.fields.image) {
  if (Array.isArray(item.fields.image)) {
    // Handle multiple images
    images = item.fields.image.map(img => {
      const imageAsset = assets.find(asset => asset.sys.id === img.sys.id);
      return imageAsset?.fields?.file?.url || null;
    }).filter(url => url !== null);
  } else if (item.fields.image.sys?.id) {
    // Handle single image
    const imageAsset = assets.find(asset => asset.sys.id === item.fields.image.sys.id);
    if (imageAsset?.fields?.file?.url) {
      images.push(imageAsset.fields.file.url);
    }
  }
}

```
### 4. Additional Challenges

#### Challenge: Environment Variables
**Problem:** Exposing API credentials in client-side code

**Solution:**
- Stored all credentials in `.env.local`
- Added `.env.local` to `.gitignore`
- Accessed via `process.env.CONTENTFUL_*` in server-side code only

#### Challenge: Pagination with Category Filtering
**Problem:** Maintain pagination state when filtering by category

**Solution:**
- Used URL query parameters (`?page=1&category=electronics`)
- Reset to page 1 when category changes
- Preserved category filter when navigating pages
- Server-side filtering using Contentful API: `&fields.category={value}`

#### Challenge: Dynamic Category Extraction
**Problem:** Need to populate category filter dropdown from CMS data

**Solution:**
- Fetched all products (limit: 1000) to extract unique categories
- Used JavaScript `Set` to deduplicate categories
- Sorted alphabetically for consistent UX

```javascript
const categorySet = new Set();
allProductsData.items.forEach(item => {
  if (item.fields.category) {
    categorySet.add(item.fields.category);
  }
});
const categories = Array.from(categorySet).sort();
```

---

## Project Structure

```
storeplatform-nextjs/
├── pages/
│   ├── _app.js                 # App wrapper with Context & Layout
│   ├── index.js                # Homepage (SSR)
│   ├── about.js                # About page
│   └── products/
│       ├── index.js            # Product listing (SSR with pagination)
│       └── [id].js             # Product detail (SSG with ISR)
├── components/
│   ├── ProductContext.js       # React Context for state management
│   ├── Layout.js               # Page layout wrapper
│   ├── Header.js               # Header component
│   ├── Navbar.js               # Navigation bar
│   ├── Footer.js               # Footer component
│   ├── Sidebar.js              # Sidebar component
│   ├── ProductList.js          # Product grid with pagination UI
│   ├── ProductDetail.js        # Product detail with image gallery
│   └── ProductFilter.js        # Category filter dropdown
├── styles/
│   └── index.css               # Global styles (responsive, mobile-first)
├── public/                     # Static assets
├── .env.local                  # Environment variables (not committed)
├── .gitignore                  # Git ignore file
├── next.config.mjs             # Next.js configuration
├── jsconfig.json               # JavaScript configuration
├── package.json                # Dependencies
└── README.md                   # This file
```

---

## Setup & Installation

### Prerequisites
- Node.js 18+ (or latest LTS)
- npm or yarn
- Contentful account with configured space

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd storeplatform-nextjs
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   CONTENTFUL_SPACES_ID=your_space_id
   CONTENTFUL_CDA_TOKEN=your_content_delivery_api_token
   CONTENTFUL_CPA_TOKEN=your_content_preview_api_token
   CONTENTFUL_ENV=master
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## Features

### Core Features
- ✅ **Server-Side Rendering (SSR)** - Product listing with real-time data
- ✅ **Static Site Generation (SSG)** - Pre-rendered product detail pages
- ✅ **Incremental Static Regeneration (ISR)** - 60-second revalidation
- ✅ **Dynamic Routing** - File-based routing with `/products/[id]`
- ✅ **Contentful CMS Integration** - Headless CMS for content management
- ✅ **Image Optimization** - Next.js Image component with lazy loading
- ✅ **Pagination** - 10 products per page with Previous/Next navigation
- ✅ **Category Filtering** - Dynamic dropdown with server-side filtering
- ✅ **Responsive Design** - Mobile-first CSS Grid layout
- ✅ **Global State Management** - React Context API
- ✅ **Error Handling** - Graceful error messages and 404 pages
- ✅ **Accessibility** - ARIA labels, 44px touch targets, semantic HTML
- ✅ **Multiple Image Support** - Image gallery with thumbnail navigation

### Advanced Features
- **Fallback Handling:** ISR with 'blocking' fallback for new products
- **Query Parameters:** URL-based state (`?page=1&category=electronics`)
- **Dynamic Categories:** Auto-populated from CMS data
- **Asset Resolution:** Automatic image URL extraction from Contentful
- **Cross-Browser Support:** Works on Chrome, Firefox, Safari, Edge
- **No Horizontal Scroll:** Optimized for 320px mobile devices

---

## Performance Optimizations

1. **Static Site Generation:** Product detail pages pre-rendered at build time
2. **Incremental Static Regeneration:** Pages revalidate every 60 seconds
3. **Image Optimization:** Next.js Image component handles lazy loading, responsive sizes
4. **Server-Side Filtering:** Category filtering done via API, not client-side
5. **Pagination:** Limits data fetching to 10 products per request
6. **Asset Includes:** Images fetched in single request with `includes.Asset`

## Development Notes

### Lessons Learned
1. **SSR vs CSR:** Server-side rendering dramatically improves SEO and initial load times
2. **Contentful Asset Resolution:** Asset references require separate fetching or using `includes`
3. **Dynamic Image Handling:** Must account for both single and multiple image scenarios
4. **URL State Management:** Query parameters provide shareable, bookmarkable state
5. **ISR Benefits:** Combines benefits of SSG (speed) with SSR (fresh data)