#!/usr/bin/env python3
"""
add_websites.py  —  Add a "Website" column to a CSV of company names.

It reads your CSV, looks up each company's official website with the Gemini
API (the same thing the Bulk URL Finder web app does), and writes a NEW csv
with a "Website" column added. Your data stays on your computer.

--------------------------------------------------------------------------
HOW TO USE  (you only edit the SETTINGS block below)
--------------------------------------------------------------------------
1. Install Python 3 (python.org) if you don't have it.
2. Open a terminal in the folder with this file and run:
       pip install requests
3. Edit the SETTINGS below:
     - INPUT_CSV     : the name of your file
     - COMPANY_COLUMN: the column header that holds the company NAME
     - API_KEY       : your Gemini key (the AQ.... one)
     - MAX_ROWS      : START SMALL. Leave at 500 for a test run first!
4. Run it:
       python add_websites.py
5. It creates OUTPUT_CSV with a new "Website" column.

IMPORTANT: Start with MAX_ROWS = 500 to confirm it works and see the cost,
THEN raise it. Do NOT point this at a billion rows — it will cost a fortune
and never finish. De-duplicate your company names first.
"""

import csv
import json
import os
import sys
import time
import urllib.request
import urllib.error

# ======================= SETTINGS — EDIT THESE =======================
INPUT_CSV      = "companies.csv"        # <-- your file name
OUTPUT_CSV     = "companies_with_websites.csv"
COMPANY_COLUMN = "Company Name"          # <-- exact header of the name column
API_KEY        = os.environ.get("GEMINI_API_KEY", "PASTE_YOUR_AQ_KEY_HERE")
MAX_ROWS       = 500                     # <-- START SMALL. Raise after a test run.
BATCH_SIZE     = 40                      # companies per API request
# =====================================================================

MODEL = "gemini-2.5-flash"
ENDPOINT = (
    f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"
)
CACHE_FILE = OUTPUT_CSV + ".cache.json"   # remembers results so re-runs resume

SCHEMA = {
    "type": "ARRAY",
    "items": {
        "type": "OBJECT",
        "properties": {
            "name": {"type": "STRING"},
            "url": {"type": "STRING"},
            "found": {"type": "BOOLEAN"},
        },
        "required": ["name", "url", "found"],
    },
}


def lookup_batch(names):
    """Ask Gemini for the official website of each name. Returns {name: url}."""
    listing = "\n".join(f"{i+1}. {n}" for i, n in enumerate(names))
    prompt = (
        "For each company below, return its official website homepage URL "
        "(including https://). Keep the name exactly as given. If you cannot "
        "confidently identify it, return an empty string and found=false. "
        "Do not guess.\n\nCompanies:\n" + listing
    )
    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": SCHEMA,
            "maxOutputTokens": 8192,
        },
    }).encode()

    for attempt in range(3):
        try:
            req = urllib.request.Request(ENDPOINT, data=body,
                                         headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=120) as resp:
                data = json.loads(resp.read())
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            rows = json.loads(text)
            out = {}
            for r in rows:
                if r.get("found") and r.get("url"):
                    out[str(r.get("name", "")).strip().lower()] = r["url"]
            return out
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors="ignore")
            if e.code == 429:
                print("  ! Rate limited / out of credits:", msg[:200])
            else:
                print(f"  ! HTTP {e.code}:", msg[:200])
            time.sleep(2 * (attempt + 1))
        except Exception as e:
            print("  ! Error:", e)
            time.sleep(2 * (attempt + 1))
    return {}


def main():
    if API_KEY.startswith("PASTE_"):
        sys.exit("Please set your API_KEY in the SETTINGS block (the AQ.... key).")
    if not os.path.exists(INPUT_CSV):
        sys.exit(f"Can't find '{INPUT_CSV}'. Put this script in the same folder, or fix INPUT_CSV.")

    # Resume cache (so a re-run doesn't pay for the same lookups again)
    cache = {}
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, encoding="utf-8") as f:
            cache = json.load(f)

    # Read up to MAX_ROWS rows
    with open(INPUT_CSV, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        if COMPANY_COLUMN not in reader.fieldnames:
            sys.exit(f"Column '{COMPANY_COLUMN}' not found. Your columns are: {reader.fieldnames}")
        rows = []
        for i, row in enumerate(reader):
            if i >= MAX_ROWS:
                break
            rows.append(row)

    # Unique company names still needing a lookup
    todo = []
    seen = set()
    for row in rows:
        name = (row.get(COMPANY_COLUMN) or "").strip()
        key = name.lower()
        if name and key not in cache and key not in seen:
            seen.add(key)
            todo.append(name)

    print(f"{len(rows)} rows | {len(todo)} new companies to look up "
          f"({len(cache)} already cached)")

    # Look up in batches
    for start in range(0, len(todo), BATCH_SIZE):
        batch = todo[start:start + BATCH_SIZE]
        results = lookup_batch(batch)
        for name in batch:
            cache[name.strip().lower()] = results.get(name.strip().lower(), "")
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(cache, f)
        print(f"  ...{min(start + BATCH_SIZE, len(todo))}/{len(todo)} looked up")

    # Write output with the new Website column
    fieldnames = list(rows[0].keys()) + ["Website"] if rows else [COMPANY_COLUMN, "Website"]
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            key = (row.get(COMPANY_COLUMN) or "").strip().lower()
            row["Website"] = cache.get(key, "")
            writer.writerow(row)

    found = sum(1 for r in rows if cache.get((r.get(COMPANY_COLUMN) or "").strip().lower()))
    print(f"\nDone. Wrote {OUTPUT_CSV} — found websites for {found} of {len(rows)} rows.")


if __name__ == "__main__":
    main()
