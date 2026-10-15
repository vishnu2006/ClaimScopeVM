"""
ClaimScope — Evaluation Metrics Computation Module
Standardized mathematical formulations for claims AI benchmarking.
"""

from typing import Dict, List, Any, Set, Tuple


def calculate_inconsistency_metrics(
    detected: List[Dict[str, Any]],
    ground_truth: List[Dict[str, Any]],
) -> Dict[str, float]:
    """
    Computes Precision, Recall, and F1-score for cross-document contradiction detection.
    Matches findings by category and field_name.
    """
    if not ground_truth and not detected:
        return {"precision": 1.0, "recall": 1.0, "f1": 1.0, "tp": 0, "fp": 0, "fn": 0}

    if not ground_truth and detected:
        return {"precision": 0.0, "recall": 1.0, "f1": 0.0, "tp": 0, "fp": len(detected), "fn": 0}

    if ground_truth and not detected:
        return {"precision": 1.0, "recall": 0.0, "f1": 0.0, "tp": 0, "fp": 0, "fn": len(ground_truth)}

    gt_signatures = {
        (g.get("category", "").lower(), g.get("field_name", "").lower())
        for g in ground_truth
    }

    tp = 0
    fp = 0
    matched_gt: Set[Tuple[str, str]] = set()

    for d in detected:
        sig = (d.get("category", "").lower(), d.get("field_name", "").lower())
        if sig in gt_signatures:
            tp += 1
            matched_gt.add(sig)
        else:
            fp += 1

    fn = len(gt_signatures - matched_gt)

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

    return {
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
        "tp": tp,
        "fp": fp,
        "fn": fn,
    }


def calculate_routing_accuracy(
    executed_agents: List[str],
    expected_agents: List[str],
    skipped_agents: List[str],
    expected_skipped: List[str],
) -> Dict[str, float]:
    """
    Computes agent routing execution and skip accuracy.
    Measures whether adaptive LangGraph supervisor properly conditionally routed agents.
    """
    exec_set = set(executed_agents)
    exp_exec_set = set(expected_agents)
    skip_set = set(skipped_agents)
    exp_skip_set = set(expected_skipped)

    exec_correct = len(exec_set.intersection(exp_exec_set))
    exec_total = len(exp_exec_set)
    exec_accuracy = exec_correct / exec_total if exec_total > 0 else 1.0

    skip_correct = len(skip_set.intersection(exp_skip_set))
    skip_total = len(exp_skip_set)
    skip_accuracy = skip_correct / skip_total if skip_total > 0 else 1.0

    # Overall Jaccard / IoU of execution decision
    union = len(exec_set.union(exp_exec_set))
    iou = exec_correct / union if union > 0 else 1.0

    return {
        "execution_accuracy": round(exec_accuracy, 4),
        "skip_accuracy": round(skip_accuracy, 4),
        "routing_iou": round(iou, 4),
        "perfect_match": exec_set == exp_exec_set and skip_set == exp_skip_set,
    }


def calculate_assessment_agreement(
    predicted_outcome: str,
    expected_outcome: str,
    predicted_classification: str,
    expected_classification: str,
) -> Dict[str, Any]:
    """
    Evaluates whether the automated assessment outcome aligns with human adjuster review tiers.
    """
    outcome_match = (predicted_outcome or "").upper() == (expected_outcome or "").upper()
    classification_match = (predicted_classification or "").lower() == (expected_classification or "").lower()

    return {
        "outcome_match": outcome_match,
        "classification_match": classification_match,
        "predicted_outcome": predicted_outcome,
        "expected_outcome": expected_outcome,
    }


def calculate_evidence_traceability(evidences: List[Dict[str, Any]]) -> Dict[str, float]:
    """
    Computes provenance score: fraction of extracted facts that trace back to a
    specific source document with recorded confidence.
    """
    if not evidences:
        return {"traceability_score": 1.0, "total_facts": 0, "traced_facts": 0}

    traced = 0
    with_confidence = 0

    for ev in evidences:
        src = ev.get("source_document") or ev.get("source_reference")
        conf = ev.get("confidence")
        if src and str(src).strip() and str(src).strip() != "None":
            traced += 1
        if conf is not None:
            with_confidence += 1

    total = len(evidences)
    trace_score = traced / total if total > 0 else 0.0
    conf_score = with_confidence / total if total > 0 else 0.0

    return {
        "traceability_score": round(trace_score, 4),
        "confidence_coverage": round(conf_score, 4),
        "total_facts": total,
        "traced_facts": traced,
    }


def calculate_report_completeness(report: Dict[str, Any]) -> Dict[str, Any]:
    """
    Verifies that the generated investigation report contains all essential P&C sections.
    """
    essential_fields = [
        "incident_summary",
        "document_analysis",
        "extracted_facts",
        "inconsistencies",
        "verification_results",
        "recommendation",
        "recommendation_rationale",
        "triggered_rules",
        "recommended_actions",
        "limitations",
        "disclaimer",
    ]

    populated = [f for f in essential_fields if report.get(f) is not None]
    completeness = len(populated) / len(essential_fields)

    return {
        "completeness_score": round(completeness, 4),
        "populated_sections": len(populated),
        "total_required_sections": len(essential_fields),
        "missing_sections": list(set(essential_fields) - set(populated)),
    }
