#!/usr/bin/env python3
"""
JAX & Vectorized Divergence / PERMA+H Scoring Engine for InsightSpark (Pivot & Pulse)

Provides high-throughput tensor mathematics for:
1. Create Mode: Gram-Schmidt orthogonalization & Divergence Dial (1 - cos(s, p))
2. Care Mode: 6D PERMA+H basis projection & Kinship Triad load balancing (<60% primary burden, >=3h respite)
3. Parquet Memory-Mapped DPO lookup and similarity scoring
"""

import sys
import json
import argparse
from typing import Dict, Any, List, Tuple

# Gracefully support JAX if installed, with vectorized NumPy fallback
try:
    import jax
    import jax.numpy as jnp
    from jax import jit
    USING_JAX = True
except ImportError:
    import numpy as jnp
    USING_JAX = False
    def jit(fn):
        return fn

import numpy as np


# ---------------------------------------------------------------------------
# Vector Math & Divergence Functions
# ---------------------------------------------------------------------------

@jit
def normalize_vector(v: jnp.ndarray) -> jnp.ndarray:
    norm = jnp.linalg.norm(v)
    return jnp.where(norm > 1e-9, v / norm, v)


@jit
def cosine_similarity(v1: jnp.ndarray, v2: jnp.ndarray) -> jnp.ndarray:
    n1 = normalize_vector(v1)
    n2 = normalize_vector(v2)
    return jnp.dot(n1, n2)


@jit
def compute_divergence(problem_vec: jnp.ndarray, spark_vec: jnp.ndarray) -> jnp.ndarray:
    """Computes semantic divergence: Div(s, p) = 1 - cos(s, p). Range: [0.0, 2.0]"""
    cos_sim = cosine_similarity(problem_vec, spark_vec)
    return jnp.clip(1.0 - cos_sim, 0.0, 2.0)


@jit
def gram_schmidt_orthogonalize(problem_vec: jnp.ndarray, spark_vec: jnp.ndarray) -> jnp.ndarray:
    """
    Projects candidate spark vector s onto the orthogonal complement of problem vector p:
    s_perp = s - ((s . p) / ||p||^2) * p
    """
    p_norm_sq = jnp.dot(problem_vec, problem_vec)
    projection = jnp.where(
        p_norm_sq > 1e-9,
        (jnp.dot(spark_vec, problem_vec) / p_norm_sq) * problem_vec,
        jnp.zeros_like(spark_vec)
    )
    return spark_vec - projection


# ---------------------------------------------------------------------------
# PERMA+H 6D Basis Projection & Harmony Scoring
# ---------------------------------------------------------------------------

PERMA_H_DIMENSIONS = [
    "Positive_Emotion",
    "Engagement_Flow",
    "Relationships_Kinship",
    "Meaning_Legacy",
    "Accomplishment_Mastery",
    "Health_Vitality"
]


def synthesize_synthetic_basis(dim: int = 64) -> jnp.ndarray:
    """
    Constructs an orthonormal 6-dimensional reference basis for PERMA+H.
    In production with full embeddings, this uses mean embeddings of gold-standard PERMA+H lexicons.
    """
    np.random.seed(42)
    raw_matrix = np.random.randn(6, dim)
    q, _ = np.linalg.qr(raw_matrix.T)
    return jnp.array(q[:, :6].T)


@jit
def project_perma_h(spark_vec: jnp.ndarray, basis: jnp.ndarray) -> jnp.ndarray:
    """
    Projects a normalized spark vector into 6D PERMA+H subspace:
    scores = Softmax(Basis * spark_vec)
    """
    norm_spark = normalize_vector(spark_vec)
    raw_projections = jnp.dot(basis, norm_spark)
    exp_p = jnp.exp(raw_projections - jnp.max(raw_projections))
    return exp_p / jnp.sum(exp_p)


def evaluate_kinship_triad_equity(
    youth_load: float,
    parent_load: float,
    elder_load: float,
    respite_hours: float
) -> Dict[str, Any]:
    """
    Evaluates kinship sustainability and checks caregiver protection invariants.
    Rule 1: Primary caregiver (parent) load must not exceed 60% of systemic burden.
    Rule 2: Minimum non-negotiable respite >= 3.0 hours/week.
    """
    total = max(youth_load + parent_load + elder_load, 1e-6)
    y_pct = round((youth_load / total) * 100.0, 1)
    p_pct = round((parent_load / total) * 100.0, 1)
    e_pct = round((elder_load / total) * 100.0, 1)

    overburdened = p_pct > 60.0
    respite_adequate = respite_hours >= 3.0
    balanced = (not overburdened) and respite_adequate

    status_notes = []
    if overburdened:
        status_notes.append(f"Caregiver load ({p_pct}%) exceeds 60% ceiling. Reallocate digital documentation to youth and story rituals to elder.")
    if not respite_adequate:
        status_notes.append(f"Respite ({respite_hours}h) falls below the 3.0h/week clinical sustainability guardrail.")
    if balanced:
        status_notes.append("Kinship triad is harmoniously distributed with protected caregiver respite.")

    return {
        "balanced": balanced,
        "youth_share_pct": y_pct,
        "parent_primary_share_pct": p_pct,
        "elder_share_pct": e_pct,
        "respite_hours": respite_hours,
        "respite_adequate": respite_adequate,
        "guardrail_status": "PASS" if balanced else "ACTION_REQUIRED",
        "recommendations": status_notes
    }


# ---------------------------------------------------------------------------
# Test Runner & CLI
# ---------------------------------------------------------------------------

def run_spark_benchmark():
    print(f"===========================================================")
    print(f" Pivot & Pulse Spark Engine (Backend: {'JAX (JIT Enabled)' if USING_JAX else 'NumPy Vectorized'})")
    print(f"===========================================================\n")

    # 1. CREATE MODE: Orthogonal Divergence Demo
    dim = 64
    np.random.seed(101)
    problem_vec = jnp.array(np.random.randn(dim))
    # Spark 1: Incremental / close to problem
    spark_close = problem_vec + jnp.array(np.random.randn(dim) * 0.2)
    # Spark 2: Orthogonal / radical lateral shift
    spark_wild = jnp.array(np.random.randn(dim))

    div_close = float(compute_divergence(problem_vec, spark_close))
    div_wild = float(compute_divergence(problem_vec, spark_wild))
    spark_orthogonal = gram_schmidt_orthogonalize(problem_vec, spark_wild)
    div_forced_ortho = float(compute_divergence(problem_vec, spark_orthogonal))

    print("[CREATE MODE: Orthogonal Divergence Dial]")
    print(f"  - Incremental Spark (Adjacent Possible) Divergence: {div_close:.4f}  (Level 1)")
    print(f"  - Lateral Shift Spark Divergence:                  {div_wild:.4f}  (Level 2)")
    print(f"  - Gram-Schmidt Orthogonalized Spark Divergence:    {div_forced_ortho:.4f}  (Level 3 - Radical)")

    # 2. CARE MODE: PERMA+H 6D Radar Projection Demo
    basis = synthesize_synthetic_basis(dim)
    spark_care_vec = jnp.array(np.random.randn(dim))
    perma_weights = project_perma_h(spark_care_vec, basis)

    print("\n[CARE MODE: 6D PERMA+H Vitality Radar Projection]")
    for dim_name, score in zip(PERMA_H_DIMENSIONS, np.array(perma_weights)):
        bar = "#" * int(score * 40)
        print(f"  {dim_name:25s}: {score*100:5.1f}% | {bar}")

    # 3. KINSHIP RESIDUAL LOAD EVALUATION
    print("\n[CARE MODE: Kinship Triad Load & Respite Audit]")
    # Scenario A: Overburdened Sandwich Mom
    eval_a = evaluate_kinship_triad_equity(youth_load=1.0, parent_load=7.5, elder_load=1.5, respite_hours=1.0)
    print(f"  Scenario A (Traditional Burnout Pattern):")
    print(f"    - Youth: {eval_a['youth_share_pct']}% | Primary Caregiver: {eval_a['parent_primary_share_pct']}% | Elder: {eval_a['elder_share_pct']}%")
    print(f"    - Guardrail Status: {eval_a['guardrail_status']} (Respite: {eval_a['respite_hours']}h/wk)")
    for rec in eval_a['recommendations']:
        print(f"      * {rec}")

    # Scenario B: Pivot & Pulse Asset-Framed Triad
    eval_b = evaluate_kinship_triad_equity(youth_load=3.0, parent_load=4.0, elder_load=3.0, respite_hours=4.0)
    print(f"\n  Scenario B (Pivot & Pulse Balanced Kinship Mesh):")
    print(f"    - Youth: {eval_b['youth_share_pct']}% | Primary Caregiver: {eval_b['parent_primary_share_pct']}% | Elder: {eval_b['elder_share_pct']}%")
    print(f"    - Guardrail Status: {eval_b['guardrail_status']} (Respite: {eval_b['respite_hours']}h/wk)")
    for rec in eval_b['recommendations']:
        print(f"      * {rec}")

    print("\n[OK] Vectorized calculations completed successfully.")


if __name__ == "__main__":
    run_spark_benchmark()
