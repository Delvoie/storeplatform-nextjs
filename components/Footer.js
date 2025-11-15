function Footer({ appTitle }) {
  return (
    <footer>
      <div className="container">
        <small>&copy; {new Date().getFullYear()} {appTitle || 'Store Platform'}</small>
      </div>
    </footer>
  );
}

export default Footer;
