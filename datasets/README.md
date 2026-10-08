---
license: apache-2.0
task_categories:
  - text-generation
  - conversational
tags:
  - dpo
  - trl
  - rlhf
  - direct-preference-optimization
  - positive-psychology
  - perma-plus-h
  - caregiver-sustainability
  - intergenerational-care
  - de-bono-lateral-thinking
size_categories:
  - n<1K
configs:
  - config_name: default
    data_files:
      - split: train
        path: multitask-dpo.parquet
---

# InsightSpark Multi-Task Direct Preference Optimization (DPO) Dataset

Pairwise preference dataset ($\mathbf{y}_w \succ \mathbf{y}_l$) curated by **InsightSpark (Pivot & Pulse)** for aligning large language models with **Asset-Based Positive Psychology (PERMA+H)**, **Lateral Thinking Provocations (Edward de Bono)**, and **Intergenerational Kinship Care Sustainability**.

Directly compatible with Hugging Face **TRL (`DPOTrainer`)**, Unsloth, Axolotl, and Alignment Handbook.

---

## Dataset Summary

- **Curator & Lead Architect**: Phil Gear ([ORCID: 0009-0008-1372-5381](https://orcid.org/0009-0008-1372-5381))
- **Framework Target**: Hugging Face TRL (`trl.trainer.DPOTrainer`)
- **License**: Apache-2.0
- **Supported Formats**: Parquet (`multitask-dpo.parquet`) & JSON Lines (`multitask-dpo.jsonl`, `kinship-care-dpo.jsonl`)
- **Total Multitask Pairs**: 48 pairwise instances + 1 metadata header

---

## Dataset Schema

Each preference sample is structured as follows:

```json
{
  "system": "You are an empathetic clinical strategist, positive psychology mentor, and intergenerational kinship partner...",
  "prompt": "[Task Prefix Token] Problem or challenge statement...",
  "chosen": "Asset-based, empowering response that distributes family roles and protects caregiver respite.",
  "rejected": "Pathologizing, deficit-focused response that overburdens a single caregiver or enforces coercive paternalism.",
  "metadata": {
    "provenance": "InsightSpark-Multitask-v1",
    "case_study": "Sandwich Generation & Dementia Dignity Preservation",
    "curator_orcid": "https://orcid.org/0009-0008-1372-5381",
    "principles": ["PERMA+H", "Asset-Based", "Intergenerational-Mesh", "Caregiver-Respite", "Dignity-Preservation"]
  }
}
```

---

## Preference Criteria Matrix ($\mathbf{y}_w \succ \mathbf{y}_l$)

| Dimension | Chosen ($\mathbf{y}_w$) Preferred | Rejected ($\mathbf{y}_l$) Penalized |
| :--- | :--- | :--- |
| **Tone & Stance** | Compassionate, optimistic, respectful of dignity | Clinical detachment, pathologizing, alarmist |
| **Psychological Lens** | PERMA+H (strengths, meaning, accomplishment, vitality) | Deficit-based ("patient is non-compliant / high liability") |
| **Kinship Roles** | Distributed across youth, parents, elders | 100% burden on solitary primary caregiver |
| **Respite Guardrails** | Explicit, scheduled, guilt-free respite (3–4 hrs/week) | Respite ignored or treated as an unearned luxury |
| **Actionability** | Micro-masteries, step-by-step low-friction actions | Overwhelming, impractical 20-step clinical mandates |

---

## How to Use with Hugging Face TRL

```python
from datasets import load_dataset
from trl import DPOTrainer, DPOConfig
from transformers import AutoModelForCausalLM, AutoTokenizer

# Load InsightSpark dataset
dataset = load_dataset("parquet", data_files="datasets/multitask-dpo.parquet", split="train")

# Train with DPOTrainer
# trainer = DPOTrainer(model=model, ref_model=ref_model, args=dpo_config, train_dataset=dataset, tokenizer=tokenizer)
```

---

## Compliance & De-Identification Notice

All interactions and case studies in this dataset have undergone strict pre-flight de-identification under **HIPAA Safe Harbor standards** (45 CFR § 164.514(b)(2)). No Protected Health Information (PHI) or Personally Identifiable Information (PII) is present.
