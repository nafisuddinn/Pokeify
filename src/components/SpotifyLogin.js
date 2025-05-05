import React from 'react';
import './SpotifyLogin.css';

export default function SpotifyLogin() {
    // relocate user to spotifys login site
    const handleLogin = async () => {
        try {
            const response = await fetch("http://localhost:8000/login");
            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                console.error("No login URL returned.");
            }
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    return (
        <div className="login-container">
            <button className="login-button" onClick={handleLogin}>
                Login With Spotify!
            </button>
        </div>
    );
}