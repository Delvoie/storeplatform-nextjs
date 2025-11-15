import Link from 'next/link';

function Navbar({ links }) {
  return (
    <nav className="navbar">
      <ul>
        {links && links.map((link, index) => (
          <li key={index}>
            <Link
              href={link === 'Home' ? '/' : `/${link.toLowerCase()}`}
              aria-label={link === 'Home' ? 'Home page' : `${link} page`}
            >
              {link}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Navbar;
