// src/components/Home.js
import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div>
      <h1>Vítejte ve FitTrack</h1>
      <p>Sledujte svůj progres a porovnávejte se s přáteli.</p>
      <Link to="/login">
        <button>Přihlásit se</button>
      </Link>
      <Link to="/register">
        <button>Zaregistrovat se</button>
      </Link>
    </div>
  );
};

export default Home;
