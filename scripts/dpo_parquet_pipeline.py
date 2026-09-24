#!/usr/bin/env python3
"""
DPO Parquet Pipeline for InsightSpark (Pivot & Pulse)
Converts Hugging Face TRL pairwise DPO preference datasets (.jsonl)
into high-throughput, memory-mapped Apache Parquet format (.parquet)
with embedded CC BY-SA 4.0 provenance and cryptographic schema metadata.
"""

import os
import sys
import json
import argparse
from typing import Dict, Any, List
import pyarrow as pa
import pyarrow.parquet as pq

# Canonical Parquet Schema for DPO Pairwise Datasets
DPO_ARROW_SCHEMA = pa.schema([
    pa.field("system", pa.string()),
    pa.field("prompt", pa.string()),
    pa.field("chosen", pa.string()),
    pa.field("rejected", pa.string()),
    pa.field("case_study", pa.string()),
    pa.field("principles", pa.list_(pa.string())),
    pa.field("preference_rationale", pa.string()),
    pa.field("curator_orcid", pa.string()),
    pa.field("provenance", pa.string()),
])


def convert_jsonl_to_parquet(jsonl_path: str, parquet_path: str) -> Dict[str, Any]:
    if not os.path.exists(jsonl_path):
        raise FileNotFoundError(f"Source JSONL not found: {jsonl_path}")

    records: List[Dict[str, Any]] = []
    file_metadata: Dict[str, Any] = {}

    with open(jsonl_path, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                item = json.loads(line)
            except json.JSONDecodeError as err:
                print(f"[WARN] Skipping malformed line {line_num}: {err}")
                continue

            if "_metadata" in item:
                file_metadata = item["_metadata"]
                continue

            # Normalize DPO record
            meta = item.get("metadata", {})
            record = {
                "system": item.get("system", "Empathetic clinical strategist, positive psychology mentor, and kinship partner."),
                "prompt": item.get("prompt", ""),
                "chosen": item.get("chosen", ""),
                "rejected": item.get("rejected", ""),
                "case_study": meta.get("case_study", "Kinship Support Scenario"),
                "principles": meta.get("principles", ["PERMA+H", "Asset-Based", "Kinship-Mesh"]),
                "preference_rationale": meta.get("preference_rationale", ""),
                "curator_orcid": meta.get("curator_orcid", file_metadata.get("orcid", "https://orcid.org/0009-0008-1372-5381")),
                "provenance": meta.get("provenance", file_metadata.get("provenance", "InsightSpark-Kinship-v1")),
            }
            records.append(record)

    if not records:
        raise ValueError(f"No valid preference records found in {jsonl_path}")

    # Build columnar PyArrow arrays
    arrays = {
        "system": pa.array([r["system"] for r in records], pa.string()),
        "prompt": pa.array([r["prompt"] for r in records], pa.string()),
        "chosen": pa.array([r["chosen"] for r in records], pa.string()),
        "rejected": pa.array([r["rejected"] for r in records], pa.string()),
        "case_study": pa.array([r["case_study"] for r in records], pa.string()),
        "principles": pa.array([r["principles"] for r in records], pa.list_(pa.string())),
        "preference_rationale": pa.array([r["preference_rationale"] for r in records], pa.string()),
        "curator_orcid": pa.array([r["curator_orcid"] for r in records], pa.string()),
        "provenance": pa.array([r["provenance"] for r in records], pa.string()),
    }

    # Embed metadata into schema
    meta_dict = {
        b"format": b"DPO_PARQUET_PAIRWISE_PREFERENCES",
        b"version": b"1.0.0",
        b"license": b"CC BY-SA 4.0 / Apache-2.0",
        b"provenance": file_metadata.get("provenance", "InsightSpark (Pivot & Pulse)").encode("utf-8"),
        b"curator_orcid": file_metadata.get("orcid", "https://orcid.org/0009-0008-1372-5381").encode("utf-8"),
        b"raw_metadata": json.dumps(file_metadata).encode("utf-8"),
    }
    schema_with_meta = DPO_ARROW_SCHEMA.with_metadata(meta_dict)

    table = pa.Table.from_arrays(list(arrays.values()), schema=schema_with_meta)

    # Ensure target directory exists
    os.makedirs(os.path.dirname(os.path.abspath(parquet_path)), exist_ok=True)

    # Write Snappy-compressed Parquet with dictionary encoding
    pq.write_table(
        table,
        parquet_path,
        compression="snappy",
        use_dictionary=True,
        version="2.6"
    )

    jsonl_size = os.path.getsize(jsonl_path)
    parquet_size = os.path.getsize(parquet_path)
    compression_ratio = (1.0 - (parquet_size / max(jsonl_size, 1))) * 100.0

    return {
        "record_count": len(records),
        "jsonl_bytes": jsonl_size,
        "parquet_bytes": parquet_size,
        "compression_savings_percent": round(compression_ratio, 2),
        "parquet_path": parquet_path,
        "metadata": file_metadata
    }


def verify_parquet_dataset(parquet_path: str):
    if not os.path.exists(parquet_path):
        raise FileNotFoundError(f"Parquet file not found: {parquet_path}")

    table = pq.read_table(parquet_path)
    print(f"\n[OK] Parquet Dataset Verified: {parquet_path}")
    print(f"Total Rows: {table.num_rows}")
    print(f"Total Columns: {table.num_columns} ({', '.join(table.column_names)})")
    
    # Metadata inspection
    custom_meta = table.schema.metadata or {}
    print("\nEmbedded Dataset Metadata:")
    for k, v in custom_meta.items():
        key_str = k.decode('utf-8', errors='ignore') if isinstance(k, bytes) else str(k)
        val_str = v.decode('utf-8', errors='ignore') if isinstance(v, bytes) else str(v)
        if key_str == 'raw_metadata':
            try:
                parsed = json.loads(val_str)
                print(f"  - raw_metadata: {json.dumps(parsed, indent=4)}")
            except Exception:
                print(f"  - raw_metadata: {val_str}")
        else:
            print(f"  - {key_str}: {val_str}")

    print("\nSample Pairwise Record Preview:")
    for i in range(min(2, table.num_rows)):
        prompt = str(table.column("prompt")[i])[:90].replace("\n", " ")
        chosen = str(table.column("chosen")[i])[:90].replace("\n", " ")
        principles = table.column("principles")[i].as_py()
        print(f"\nRow {i + 1}:")
        print(f"  Case: {table.column('case_study')[i]}")
        print(f"  Principles: {', '.join(principles)}")
        print(f"  Prompt: '{prompt}...'")
        print(f"  Chosen (yw): '{chosen}...'")


def main():
    parser = argparse.ArgumentParser(description="Convert DPO JSONL datasets to Apache Parquet format")
    parser.add_argument("--input", default="datasets/kinship-care-dpo.jsonl", help="Input JSONL path")
    parser.add_argument("--output", default="datasets/kinship-care-dpo.parquet", help="Output Parquet path")
    parser.add_argument("--verify", action="store_true", help="Verify output Parquet after conversion")

    args = parser.parse_args()

    print(f"Transforming {args.input} -> {args.output}...")
    stats = convert_jsonl_to_parquet(args.input, args.output)
    print(f"[SUCCESS] Converted {stats['record_count']} records.")
    print(f"JSONL size: {stats['jsonl_bytes']:,} bytes | Parquet size: {stats['parquet_bytes']:,} bytes ({stats['compression_savings_percent']}% compression)")

    if args.verify:
        verify_parquet_dataset(args.output)


if __name__ == "__main__":
    main()
