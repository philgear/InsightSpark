#!/usr/bin/env python3
"""
Live End-to-End Test for Combinatorial Synergy with Local Ollama
Tests 'Biomimetic Play' (Create Mode) and 'Kinship Harmony Mesh' (Care Mode)
running 100% locally on workstation hardware via http://localhost:11434.
"""

import sys
import json
import urllib.request
import urllib.error
import time

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3.2:3b"

def run_ollama_prompt(scenario_name: str, mode: str, problem: str, strategies: list, gist: str = None):
    print(f"\n=====================================================================")
    print(f" TEST RUN: {scenario_name} [{mode.upper()} MODE]")
    print(f" Engine: Local Ollama ({MODEL_NAME}) | 100% On-Device & Zero-Network")
    print(f"=====================================================================")
    print(f"Problem: \"{problem}\"")
    print(f"Active Strategies: {', '.join([s['name'] for s in strategies])}")
    if gist:
        print(f"Persona Blend: \"{gist}\"")
    print("\nStreaming generation from local GPU/CPU...\n")

    strategy_text = "\n\n".join([
        f"- Strategy Name: \"{s['name']}\"\n  Description: {s['description']}"
        for s in strategies
    ])

    system_instruction = (
        "You are a compassionate, HIPAA-compliant care support partner. Provide creative, positive psychology insights for health goals in valid JSON format."
        if mode == "care"
        else "You are a creative thinking partner. Provide distinct actionable insights matching JSON schema."
    )

    prompt = f"""
{f'Guiding Principle: "{gist}"' if gist else ''}

I am facing the following challenge:
"{problem}"

Please apply EACH of the following creative strategies:
{strategy_text}

For each strategy, provide 2 distinct, actionable insights.
Ensure the insights are clear, jargon-free, and inspiring.

**Combinatorial Cross-Pollination & Synthesis:**
Because multiple strategies are active ({', '.join([s['name'] for s in strategies])}), allow them to cross-pollinate! Ensure at least one insight actively bridges the friction points between the selected strategies into a cohesive, non-obvious breakthrough.

Return the output strictly as a JSON array of objects with the schema:
[
  {{
    "strategyName": string,
    "insights": [
      {{
        "text": string
        {', "influence": string' if mode == "care" else ''}
      }}
    ]
  }}
]
"""

    payload = {
        "model": MODEL_NAME,
        "prompt": f"{system_instruction}\n\n{prompt}",
        "format": "json",
        "stream": False,
        "options": {
            "temperature": 0.7,
            "top_p": 0.9
        }
    }

    req = urllib.request.Request(
        OLLAMA_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )

    start_time = time.time()
    try:
        with urllib.request.urlopen(req, timeout=90) as response:
            result = json.loads(response.read().decode("utf-8"))
            elapsed = time.time() - start_time
            raw_response = result.get("response", "")
            
            print(f"[Done in {elapsed:.2f}s | Tokens: {result.get('eval_count', 'N/A')} | Eval Speed: {result.get('eval_count', 0) / max(elapsed, 0.001):.1f} tok/s]\n")
            
            try:
                parsed = json.loads(raw_response)
                print(json.dumps(parsed, indent=2))
                return parsed
            except json.JSONDecodeError:
                print(raw_response)
                return raw_response

    except urllib.error.URLError as err:
        print(f"[ERROR] Could not connect to Ollama at {OLLAMA_URL}: {err}")
        print("Ensure 'ollama serve' is running in the background.")
        return None


def main():
    # 1. Test Biomimetic Play (Create Mode)
    run_ollama_prompt(
        scenario_name="Biomimetic Play (Create Mode)",
        mode="creative",
        problem="Designing a flood-resilient community gathering space and playground in an urban wetlands zone.",
        strategies=[
            {
                "name": "Nature's Wisdom (Biomimicry)",
                "description": "How does nature handle water management, soil anchoring, and flexible structures (e.g. mangrove root networks, burdock seeds, lotus leaf hydrophobic surfaces)?"
            },
            {
                "name": "Child's Play",
                "description": "How would an 8-year-old perceive, interact with, and explain this space? Strip away all bureaucratic engineering jargon."
            },
            {
                "name": "FMEA Pre-Mortem (Failure Mode & Effects Analysis)",
                "description": "Identify edge-case failure modes: heavy mud accumulation, kids falling on slick logs, silt clogging drainage. Proactively build in fail-safes."
            }
        ]
    )

    # 2. Test Kinship Harmony Mesh (Care Mode)
    run_ollama_prompt(
        scenario_name="Kinship Harmony Mesh (Care Mode)",
        mode="care",
        problem="A 78-year-old grandfather (Arthur) recovering from mild stroke feels depressed, isolated in his room, and worries he is a financial and care burden to his daughter and teenage grandchildren.",
        strategies=[
            {
                "name": "Intergenerational Kinship Triad",
                "description": "Distribute care across Youth (story recorders/tech), Parents (environment & safety pacing), and Elders (wisdom keepers, dignity preservation)."
            },
            {
                "name": "Sensory Bridge & Somatics",
                "description": "Ground interactions in nostalgic sounds, tactile textures, era-specific music (from his 20s), and calming aromas."
            },
            {
                "name": "VIA Character Strengths & PERMA+H",
                "description": "Activate signature strengths (curiosity, craftsmanship, humor) and celebrate micro-masteries to build agency."
            }
        ],
        gist="Blend perspectives: Daughter (loving pacing and 3h respite protector), Son/Youth (enthusiastic digital oral historian), Grandmother/Matriarch (preserver of family legacy)."
    )

if __name__ == "__main__":
    main()
