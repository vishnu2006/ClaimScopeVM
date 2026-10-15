#!/usr/bin/env python3
"""
ClaimScope — Benchmark Evaluation Script Runner
Convenience wrapper to run evaluation from any working directory.
"""

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.evaluation.runner import run_consolidated_evaluation

if __name__ == "__main__":
    run_consolidated_evaluation()
