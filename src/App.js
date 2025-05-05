import React, { useState, useEffect } from 'react';
import PokemonList from './components/PokemonList';
import SpotifyLogin from './components/SpotifyLogin';
import Loader from './components/Loader';
import './App.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [showTitle, setShowTitle] = useState(true);

  useEffect(() => {
    // grab Spotify code from URL once
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code && !token) {
      fetch(`http://localhost:8000/callback?code=${code}`)
        .then(res => res.json())
        .then(data => {
          if (data.access_token) {
            setToken(data.access_token);
            // clean up URL so it doesn’t re-trigger
            window.history.replaceState({}, document.title, '/');
          } else {
            console.error('Access token missing:', data);
          }
        })
        .catch(err => console.error('Token exchange error:', err));
    }

    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, [token]);

  const handleTeamLoaded = () => setShowTitle(false);

  return (
    <div className="App">
      {isLoading ? (
        <Loader />
      ) : (
        <>
          {showTitle && <h1>Pokeify your Spotify Profile</h1>}
          {token ? (
            <PokemonList token={token} onTeamLoaded={handleTeamLoaded} />
          ) : (
            <SpotifyLogin />
          )}
        </>
      )}
    </div>
  );
}

export default App;
