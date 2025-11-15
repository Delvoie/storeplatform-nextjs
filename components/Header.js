import React from 'react';

function Header({ title }) {
  return (
    <header className="header">
      <div className="container">
        <h2>{title || 'Store Platform'}</h2>
      </div>
    </header>
  );
}

export default Header;
