import React from 'react';
import './Loader.css';

const Loader = () => {
    return (
        <div className="loader-container">
            <img src="simple_pokeball.gif" alt="Loading..." className="fullscreen-gif" />
            <p>Loading your Pokémon team...</p>
        </div>
    );
};

export default Loader;