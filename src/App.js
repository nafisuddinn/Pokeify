import PokemonList from "./PokemonList.js";
import SpotifyLogin from "./SpotifyLogin.js";
import './App.css';
import React, { useEffect, useState } from "react";

function App() {
  return (
    <div className="App">
      {/* <h1>Pokeify your Spotify Profile</h1> */}
      {/* <SpotifyLogin /> */}
      <PokemonList />
      <p></p>
    </div>
  );
}


export default App;