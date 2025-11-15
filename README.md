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

### Technology Stack
- **Framework:** Next.js 16.0.3 (Pages Router)
- **React:** 19.2.0
- **CMS:** Contentful (Content Delivery API)
- **Language:** JavaScript (ES6+)
- **Styling:** CSS3 (Responsive, Mobile-First)
- **State Management:** React Context API

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

### Data Flow

1. **Server-Side Rendering (SSR)** - Product listing page (`/products`)
   - Uses `getServerSideProps` for real-time data fetching
   - Supports pagination and category filtering
   - Query parameters: `?page=1&category=electronics`

2. **Static Site Generation (SSG)** - Product detail pages (`/products/[id]`)
   - Uses `getStaticProps` + `getStaticPaths` for pre-rendering
   - Implements ISR with 60-second revalidation
   - Fallback: 'blocking' for on-demand generation

3. **Global State Management**
   - ProductContext provides product state across components
   - Updates on page navigation and route changes
   - Prevents unnecessary re-fetching

---

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

**Response Structure:**
```json
{
  "items": [
    {
      "sys": {
        "id": "alphanumeric-id"
      },
      "fields": {
        "title": "Product Name",
        "description": "Product description",
        "brandName": "Brand",
        "price": 99.99,
        "category": "electronics",
        "image": [
          { "sys": { "id": "asset-id-1" } },
          { "sys": { "id": "asset-id-2" } }
        ]
      }
    }
  ],
  "includes": {
    "Asset": [
      {
        "sys": { "id": "asset-id-1" },
        "fields": {
          "file": {
            "url": "//images.ctfassets.net/..."
          }
        }
      }
    ]
  },
  "total": 50
}
```

#### 2. Fetch Single Product by ID
```
GET /entries/{sys.id}?access_token={token}
```

**Example:**
```javascript
const url = `https://cdn.contentful.com/spaces/${spaceId}/environments/${envId}/entries/${productId}?access_token=${accessToken}`;
```

#### 3. Fetch Asset (Image)
```
GET /assets/{assetId}?access_token={token}
```

**Example:**
```javascript
const assetUrl = `https://cdn.contentful.com/spaces/${spaceId}/environments/${envId}/assets/${imageId}?access_token=${accessToken}`;
```

**Asset Response:**
```json
{
  "sys": { "id": "asset-id" },
  "fields": {
    "title": "Image Title",
    "file": {
      "url": "//images.ctfassets.net/awoqukumntwz/...",
      "contentType": "image/png",
      "details": {
        "size": 123456,
        "image": {
          "width": 1920,
          "height": 1080
        }
      }
    }
  }
}
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

#### Challenge: Asset References vs. Direct URLs
**Problem:** Contentful doesn't return image URLs directly - returns asset references that must be resolved

**Solution:**
- Used `includes.Asset` array from API response for product listing
- Made separate asset API calls for product detail pages
- Extracted `url` from nested `fields.file.url` structure

#### Challenge: Image Optimization & Security
**Problem:** Need to display images from external domain (images.ctfassets.net)

**Solution:**
- Configured `next.config.mjs` with `remotePatterns` for Contentful CDN
- Used Next.js `<Image>` component for lazy loading and optimization
- Prepended `https:` to protocol-relative URLs (`//images.ctfassets.net/...`)

```javascript
// next.config.mjs
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.ctfassets.net',
      },
    ],
  },
};
```

#### Challenge: Multiple Images UI/UX
**Problem:** How to display multiple product images effectively

**Solution:** Implemented image gallery with thumbnails
- Main image display (600x400)
- Clickable thumbnail navigation below
- State management for selected image index
- Visual feedback (blue border on selected thumbnail)

```javascript
const [selectedImageIndex, setSelectedImageIndex] = useState(0);

// Main image
<Image src={`https:${images[selectedImageIndex]}`} />

// Thumbnails
{images.map((img, index) => (
  <button onClick={() => setSelectedImageIndex(index)}>
    <Image src={`https:${img}`} width={60} height={60} />
  </button>
))}
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

---

## Future Enhancements

- [ ] Add shopping cart functionality
- [ ] Implement search feature
- [ ] Add product reviews/ratings
- [ ] Implement user authentication
- [ ] Add wishlist functionality
- [ ] Set up Contentful webhooks for ISR
- [ ] Add loading skeletons
- [ ] Implement product comparison
- [ ] Add sorting options (price, name, date)
- [ ] Set up analytics tracking

---

## Development Notes

### Lessons Learned
1. **SSR vs CSR:** Server-side rendering dramatically improves SEO and initial load times
2. **Contentful Asset Resolution:** Asset references require separate fetching or using `includes`
3. **Dynamic Image Handling:** Must account for both single and multiple image scenarios
4. **URL State Management:** Query parameters provide shareable, bookmarkable state
5. **ISR Benefits:** Combines benefits of SSG (speed) with SSR (fresh data)

### Known Issues
- Category filter fetches all products (limit 1000) - could be optimized with separate categories content type
- No search functionality yet
- No server-side sorting options

### Credits
- **Framework:** Next.js by Vercel
- **CMS:** Contentful
- **Developer:** Lucas Delvoie
- **Course:** INFT 3102 - Web Development Frameworks
- **Institution:** Durham College

---

## License
This project is for educational purposes as part of INFT 3102 Assignment 2.

---

## Support
For issues or questions, please contact the development team or refer to:
- [Next.js Documentation](https://nextjs.org/docs)
- [Contentful Documentation](https://www.contentful.com/developers/docs/)
- [React Context API](https://react.dev/reference/react/useContext)