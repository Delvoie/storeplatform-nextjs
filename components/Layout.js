import Header from './Header';
import Navbar from './Navbar';
import Footer from './Footer';

function Layout({ children }) {
  return (
    <div className="page-wrapper">
      <Header title="Store Platform" />
      <Navbar links={['Home', 'Products', 'About']} />
      <main className="content">
        {children}
      </main>
      <Footer appTitle="Store Platform" />
    </div>
  );
}

export default Layout;
