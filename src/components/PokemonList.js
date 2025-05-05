import React, { useEffect, useState } from 'react';
import Pokemon from './Pokemon';
import Trainer from './Trainer';
import Loader from './Loader';
import './PokemonList.css';

export default function PokemonList({ token, onTeamLoaded }) {
    const [trainerOptions, setTrainerOptions] = useState([]);
    const [selectedTrainer, setSelectedTrainer] = useState(null);
    const [team, setTeam] = useState([]);
    const [explanations, setExplanations] = useState([]);
    const [loadingTeam, setLoadingTeam] = useState(false);

    useEffect(() => {
        fetch('http://localhost:8000/trainer-sprites')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data.sprites) && data.sprites.length) {
                    setTrainerOptions(data.sprites);
                    setSelectedTrainer(data.sprites[0]);
                }
            })
            .catch(console.error);
    }, []);

    const handleGenerate = () => {
        setLoadingTeam(true);

        // proxy Spotify call through our backend
        fetch(`http://localhost:8000/top-tracks?token=${token}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch top tracks');
                return res.json();
            })
            .then(data =>
                data.items.map(item => ({
                    name: item.name,
                    artist: item.artists?.[0]?.name,
                    uri: item.uri,
                }))
            )
            .then(tracks =>
                fetch('http://localhost:8000/generate-pokemon-team', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(tracks),
                })
            )
            .then(res => res.json())
            .then(data => {
                const pokemons = Array.isArray(data.pokemon_team) ? data.pokemon_team : [];

                // split explanation into per-Pokémon chunks
                let expArr = data.explanation
                    .split('\n')
                    .map(l => l.trim())
                    .filter(l => l);

                if (expArr.length !== pokemons.length) {
                    const sentences = data.explanation
                        .split(/\. +/)
                        .map(s => s.trim())
                        .filter(s => s);
                    const per = Math.ceil(sentences.length / pokemons.length);
                    expArr = pokemons.map((_, i) => {
                        const chunk = sentences.slice(i * per, (i + 1) * per).join('. ');
                        return chunk ? (chunk.endsWith('.') ? chunk : chunk + '.') : '';
                    });
                }
                if (expArr.length !== pokemons.length) {
                    expArr = pokemons.map(() => data.explanation);
                }

                setTeam(pokemons);
                setExplanations(expArr);
                onTeamLoaded?.();
            })
            .catch(console.error)
            .finally(() => setLoadingTeam(false));
    };

    return (
        <div className="PokemonList">
            {/* Trainer selector */}
            {trainerOptions.length > 0 && !team.length && (
                <div className="TrainerSelector">
                    <label htmlFor="trainer-select">Choose your trainer:</label>
                    <select
                        id="trainer-select"
                        value={selectedTrainer?.name}
                        onChange={e => {
                            const picked = trainerOptions.find(t => t.name === e.target.value);
                            setSelectedTrainer(picked);
                        }}
                    >
                        {trainerOptions.map(t => (
                            <option key={t.name} value={t.name}>
                                {t.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Generate button or Loader */}
            {!team.length && trainerOptions.length > 0 && (
                loadingTeam ? (
                    <Loader />
                ) : (
                    <button className="GenerateButton" onClick={handleGenerate}>
                        <span>Generate Pokémon Team</span>
                    </button>
                )
            )}

            {/* Display trainer + team */}
            {team.length > 0 && (
                <>
                    <div className="TrainerWrapper">
                        <Trainer sprite={selectedTrainer.sprite} />
                    </div>
                    {team.map((p, i) => (
                        <div key={p.id} className="PokemonWrapper">
                            <Pokemon
                                name={p.name}
                                sprite={p.sprite}
                                explanation={explanations[i]}
                            />
                        </div>
                    ))}
                </>
            )}
        </div>
    );
}
