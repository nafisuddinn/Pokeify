import { useEffect, useState } from "react";
import Pokemon from "./Pokemon";
import Trainer from "./Trainer";
import "./PokemonList.css";

export default function PokemonList() {
    const [team, setTeam] = useState([]);
    const [trainer, setTrainer] = useState();


    useEffect(() => {
        const sampleTracks = [
            { name: "Blank Space", artist: "Taylor Swift" },
            { name: "Blank Space", artist: "Taylor Swift" },
            { name: "Blank Space", artist: "Taylor Swift" },
            { name: "back in blood", artist: "Pooh Shiesty" },
            { name: "back in blood", artist: "Pooh Shiesty" },
            { name: "back in blood", artist: "Pooh Shiesty" },
        ];

        fetch("http://127.0.0.1:8000/generate-pokemon-team", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sampleTracks),
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data.pokemon_team)) {
                    setTeam(data.pokemon_team);
                } else {
                    console.warn("Invalid team format:", data);
                    setTeam([]);
                }

                if (data.character_sprite) {
                    setTrainer({ sprite: data.character_sprite });
                }
            })

    }, []);

    return (
        <div className="PokemonList">
            {trainer && (         //while trainer is not null then execute the sprite
                <div className="TrainerWrapper">
                    <Trainer name={trainer.name} sprite={trainer.sprite} />
                </div>)}
            {team.map((pokemon, index) => (
                <div className="PokemonWrapper">
                    <Pokemon key={index} name={pokemon.name} sprite={pokemon.sprite} />

                </div>

            ))}
        </div>
    );
}
