import os
from urllib.parse import urlencode
from dotenv import load_dotenv
from pathlib import Path
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import google.generativeai as genai
import random
from trainers import character_sprites

# Load environment
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

SPOTIFY_CLIENT_ID     = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
GOOGLE_API_KEY        = os.getenv("GOOGLE_API_KEY")

genai.configure(api_key=GOOGLE_API_KEY)

sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(
    client_id=SPOTIFY_CLIENT_ID,
    client_secret=SPOTIFY_CLIENT_SECRET,
))

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Track(BaseModel):
    name: str
    artist: str
    uri: str

@app.get("/")
def read_root():
    return {"message": "Welcome to Pokéify!"}

@app.get("/login")
async def login():
    params = {
        "client_id":     SPOTIFY_CLIENT_ID,
        "response_type": "code",
        "redirect_uri":  "http://localhost:3000/callback",
        "scope":         "playlist-read-private user-top-read",
    }
    url = "https://accounts.spotify.com/authorize?" + urlencode(params)
    return {"url": url}

@app.get("/callback")
async def callback(code: str):
    token_url = "https://accounts.spotify.com/api/token"
    payload = {
        "grant_type":    "authorization_code",
        "code":          code,
        "redirect_uri":  "http://localhost:3000/callback",
        "client_id":     SPOTIFY_CLIENT_ID,
        "client_secret": SPOTIFY_CLIENT_SECRET,
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    resp = requests.post(token_url, data=payload, headers=headers)
    if resp.status_code != 200:
        raise HTTPException(500, "Failed to authenticate with Spotify")
    data = resp.json()
    access_token = data.get("access_token")
    if not access_token:
        raise HTTPException(500, "Missing access token")
    return {"access_token": access_token}

@app.get("/top-tracks")
async def top_tracks(token: str):
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get("https://api.spotify.com/v1/me/top/tracks?limit=6", headers=headers)
    if resp.status_code != 200:
        raise HTTPException(resp.status_code, f"Spotify returned {resp.status_code}")
    return resp.json()

@app.get("/trainer-sprites")
async def trainer_sprites():
    return {"sprites": character_sprites}

@app.post("/generate-pokemon-team")
async def generate_pokemon_team(tracks: List[Track]):
    if not tracks:
        raise HTTPException(status_code=400, detail="No tracks provided for analysis")
    try:
        track_names = [f"{t.name} by {t.artist}" for t in tracks]
        prompt_text = (
            f"List exactly 6 rand Pokémon (just their names, comma-separated) whose character, "
            f"vibe, type, and personality matches this playlist: {', '.join(track_names)}. "
            "Do not choose any shinies, or any Alolan pokémon."
        )
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt_text)
        pokemon_names = [n.strip() for n in response.text.strip().split(",")[:6]]

        # Enforce IDs prompt
        enforce_prompt = (
            f"For every pokémon chosen in: {', '.join(pokemon_names)} "
            "-- list ONLY their corresponding ID number, NO extra 0s."
        )
        response2 = model.generate_content(enforce_prompt)
        identification_nums = [n.strip() for n in response2.text.strip().split(",")[:6]]

        explanation_prompt = (
            f"The following playlist has these songs: {', '.join(track_names)}. "
            f"A Pokémon team was chosen for this playlist: {', '.join(pokemon_names)}. "
            "Explain why each Pokémon fits the mood and energy of this playlist BRIEFLY. "
            "Be creative but concise."
        )
        explanation_text = model.generate_content(explanation_prompt).text.strip()

        pokemon_team = []
        for idx, name in enumerate(pokemon_names):
            name_clean = name.lower()
            poke_resp = requests.get(f"https://pokeapi.co/api/v2/pokemon/{name_clean}")
            if poke_resp.status_code == 200:
                data = poke_resp.json()
                pid = data["id"]
            else:
                pid = identification_nums[idx] if idx < len(identification_nums) else None

            if pid is None:
                continue

            shiny = random.randint(1, 4096) == 1
            sprite_url = (
                f"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/{pid}.png"
                if shiny
                else f"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{pid}.png"
            )
            pokemon_team.append({
                "name": name.capitalize(),
                "sprite": sprite_url,
                "id": pid
            })

        return {
            "pokemon_team": pokemon_team,
            "explanation": explanation_text,
            "character_sprite": character_sprites,
            "all_sprites": character_sprites
        }
    except Exception as e:
        return {"error": str(e)}
