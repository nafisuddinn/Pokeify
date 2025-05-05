import "./Pokemon.css";

//generates the pokemon image
export default function Pokemon({ name, sprite }) {
    return (
        <div className="RandomPoke">
            <img src={sprite} alt="{name}" />
            {/* <img src="./pokeball.png" alt="" id="pokeball" /> */}

            {/* <div className="PokeInfo">
                <p>{name}</p>
            </div> */}
        </div>
    );
}