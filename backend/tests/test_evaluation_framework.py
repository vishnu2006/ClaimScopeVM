import pytest
from app.evaluation.metrics import (
    calculate_inconsistency_metrics,
    calculate_routing_accuracy,
    calculate_assessment_agreement,
    calculate_evidence_traceability,
    calculate_report_completeness,
)
from app.evaluation.runner import (
    load_ground_truth,
    evaluate_deterministic_routing,
    evaluate_assessment_engine,
    evaluate_report_generation_and_completeness,
)


def test_inconsistency_metric_calculation():
    detected = [
        {"category": "vehicle_identity", "field_name": "vin"},
        {"category": "narrative_fault", "field_name": "accident_description"},
    ]
    gt = [
        {"category": "vehicle_identity", "field_name": "vin"},
        {"category": "narrative_fault", "field_name": "accident_description"},
        {"category": "damage_severity", "field_name": "severity_match"},
    ]
    res = calculate_inconsistency_metrics(detected, gt)
    assert res["tp"] == 2
    assert res["fp"] == 0
    assert res["fn"] == 1
    assert res["precision"] == 1.0
    assert abs(res["recall"] - 0.6667) < 0.01


def test_routing_metric_calculation():
    executed = ["intake_classifier", "supervisor_router", "fnol_extractor"]
    expected = ["intake_classifier", "supervisor_router", "fnol_extractor"]
    skipped = ["police_extractor", "estimate_extractor"]
    exp_skipped = ["police_extractor", "estimate_extractor"]

    acc = calculate_routing_accuracy(executed, expected, skipped, exp_skipped)
    assert acc["execution_accuracy"] == 1.0
    assert acc["skip_accuracy"] == 1.0
    assert acc["perfect_match"] is True


def test_evidence_traceability_metrics():
    sample = [
        {"source_document": "fnol.pdf", "confidence": 0.95},
        {"source_document": None, "confidence": None},
        {"source_document": "police.pdf", "confidence": 0.88},
    ]
    trace = calculate_evidence_traceability(sample)
    assert trace["total_facts"] == 3
    assert trace["traced_facts"] == 2
    assert abs(trace["traceability_score"] - 0.6667) < 0.01


def test_ground_truth_dataset_loading_and_scenarios():
    gt = load_ground_truth()
    assert "scenarios" in gt
    scenarios = gt["scenarios"]
    assert len(scenarios) == 5
    for expected_key in ["case_a", "case_b", "case_c", "case_d", "case_e"]:
        assert expected_key in scenarios
        assert len(scenarios[expected_key]["document_inventory"]) >= 1


def test_deterministic_routing_evaluation():
    gt = load_ground_truth()
    res = evaluate_deterministic_routing(gt)
    assert res["mean_execution_accuracy"] >= 0.90
    assert res["mean_skip_accuracy"] >= 0.90


def test_assessment_engine_benchmark():
    gt = load_ground_truth()
    res = evaluate_assessment_engine(gt)
    assert res["outcome_agreement_rate"] == 1.0
    scenario_res = res["scenario_results"]
    assert scenario_res["case_d"]["agreement"]["outcome_match"] is True
    assert "TRG-MAT-01" in scenario_res["case_d"]["triggered_rules"]


def test_report_schema_completeness():
    res = evaluate_report_generation_and_completeness()
    assert res["pdf_valid_bytes"] is True
    assert res["schema_completeness"]["completeness_score"] == 1.0
