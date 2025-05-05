import "./Trainer.css";

export default function Trainer({ name, sprite }) {
    return (
        <div className="Trainer">
            <img src={sprite} alt="{name}" />
        </div>
    );
}