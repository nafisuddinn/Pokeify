import "./Pokemon.css";

export default function Pokemon({ name, sprite, explanation }) {
    return (
        <div className="RandomPoke">
            <img src={sprite} alt={name} />
            <div className="PokeInfo">
                <h4>{name}</h4>
                <p>{explanation}</p>
            </div>
        </div>
    );
}