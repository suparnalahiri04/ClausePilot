import re
from typing import List, Dict, Any, Optional, Tuple
from models import VerificationResult, DocumentSection


def _normalize_with_mapping(text: str) -> Tuple[str, List[int]]:
    """
    Normalizes text to lowercase alphanumeric + single spaces while maintaining
    an index map back to the original character positions.
    """
    norm_chars: List[str] = []
    index_map: List[int] = []
    last_was_space = True

    for idx, ch in enumerate(text):
        if ch.isalnum():
            norm_chars.append(ch.lower())
            index_map.append(idx)
            last_was_space = False
        elif ch.isspace() or ch in "-–—,;:.()[]\"'“”‘’/":
            if not last_was_space and norm_chars:
                norm_chars.append(" ")
                index_map.append(idx)
                last_was_space = True

    if norm_chars and norm_chars[-1] == " ":
        norm_chars.pop()
        index_map.pop()

    return "".join(norm_chars), index_map


def _find_section_for_offset(
    sections: List[DocumentSection], start_char: int
) -> Tuple[Optional[str], Optional[str]]:
    for sec in sections:
        if sec.start_char <= start_char <= sec.end_char:
            return sec.id, f"Section {sec.number} — {sec.heading}"
    if sections:
        # Find nearest section
        nearest = min(sections, key=lambda s: abs(s.start_char - start_char))
        return nearest.id, f"Section {nearest.number} — {nearest.heading}"
    return None, None


def verify_excerpt_against_source(
    candidate_quote: str,
    source_text: str,
    sections: List[DocumentSection],
    min_grounding_score: float = 0.72,
) -> VerificationResult:
    """
    Explicit Evidence-First Verification Layer.
    Verifies whether an AI-extracted quote or finding is strictly grounded in
    the extracted contract source text, returning character offsets, section IDs,
    confidence scores, and verification badges.
    """
    clean_quote = (candidate_quote or "").strip()
    if not clean_quote or not source_text:
        return VerificationResult(
            status="UNVERIFIED_FLAGGED",
            confidence_score=0.0,
            matched_excerpt="",
            section_id=None,
            section_title=None,
            start_char=None,
            end_char=None,
            verification_note="No source excerpt was provided for verification.",
        )

    # 1. Exact substring check
    exact_pos = source_text.find(clean_quote)
    if exact_pos != -1:
        end_pos = exact_pos + len(clean_quote)
        sec_id, sec_title = _find_section_for_offset(sections, exact_pos)
        return VerificationResult(
            status="VERIFIED_EXACT",
            confidence_score=1.0,
            matched_excerpt=source_text[exact_pos:end_pos],
            section_id=sec_id,
            section_title=sec_title,
            start_char=exact_pos,
            end_char=end_pos,
            verification_note=f"Exact verbatim match verified at characters {exact_pos}–{end_pos}.",
        )

    # 2. Case-insensitive / whitespace-normalized exact match
    norm_source, source_map = _normalize_with_mapping(source_text)
    norm_quote, _ = _normalize_with_mapping(clean_quote)

    if len(norm_quote) >= 12:
        norm_pos = norm_source.find(norm_quote)
        if norm_pos != -1:
            orig_start = source_map[norm_pos]
            orig_end = source_map[min(norm_pos + len(norm_quote) - 1, len(source_map) - 1)] + 1
            sec_id, sec_title = _find_section_for_offset(sections, orig_start)
            return VerificationResult(
                status="VERIFIED_EXACT",
                confidence_score=0.98,
                matched_excerpt=source_text[orig_start:orig_end],
                section_id=sec_id,
                section_title=sec_title,
                start_char=orig_start,
                end_char=orig_end,
                verification_note=f"Normalized verbatim match verified in source text ({orig_start}–{orig_end}).",
            )

    # 3. Handle ellipsis-joined quotes (e.g. "first part ... second part")
    if "..." in clean_quote or "…" in clean_quote:
        parts = [p.strip() for p in re.split(r"\.\.\.|…", clean_quote) if len(p.strip()) >= 15]
        if parts:
            norm_first, _ = _normalize_with_mapping(parts[0])
            pos_first = norm_source.find(norm_first)
            if pos_first != -1:
                orig_start = source_map[pos_first]
                orig_end = source_map[min(pos_first + len(norm_first) - 1, len(source_map) - 1)] + 1
                if len(parts) > 1:
                    norm_last, _ = _normalize_with_mapping(parts[-1])
                    pos_last = norm_source.find(norm_last, pos_first)
                    if pos_last != -1 and (pos_last - pos_first) < 1200:
                        orig_end = source_map[min(pos_last + len(norm_last) - 1, len(source_map) - 1)] + 1
                sec_id, sec_title = _find_section_for_offset(sections, orig_start)
                return VerificationResult(
                    status="VERIFIED_HIGH_CONFIDENCE",
                    confidence_score=0.93,
                    matched_excerpt=source_text[orig_start:orig_end],
                    section_id=sec_id,
                    section_title=sec_title,
                    start_char=orig_start,
                    end_char=orig_end,
                    verification_note="Multi-segment excerpt anchored and verified against source passage.",
                )

    # 4. Sentence/Paragraph Window Fuzzy Grounding Check
    quote_tokens = [t for t in norm_quote.split(" ") if len(t) > 2]
    if not quote_tokens:
        return VerificationResult(
            status="UNVERIFIED_FLAGGED",
            confidence_score=0.0,
            matched_excerpt=clean_quote,
            section_id=None,
            section_title=None,
            start_char=None,
            end_char=None,
            verification_note="Excerpt too short for deterministic grounding check.",
        )

    quote_token_set = set(quote_tokens)
    best_score = 0.0
    best_span: Tuple[int, int] = (0, 0)
    best_text = ""

    # Split source into candidate sentences / clauses with spans
    sentence_pattern = re.compile(r"[^\n.!?]+[.!?]?", re.MULTILINE)
    raw_spans = [(m.start(), m.end(), m.group(0)) for m in sentence_pattern.finditer(source_text) if len(m.group(0).strip()) > 10]

    # Evaluate single sentences and 2-sentence windows
    for i in range(len(raw_spans)):
        for window_len in (1, 2, 3):
            if i + window_len > len(raw_spans):
                continue
            w_start = raw_spans[i][0]
            w_end = raw_spans[i + window_len - 1][1]
            w_text = source_text[w_start:w_end].strip()
            norm_w, _ = _normalize_with_mapping(w_text)
            w_tokens = [t for t in norm_w.split(" ") if len(t) > 2]
            if not w_tokens:
                continue
            w_set = set(w_tokens)
            overlap = len(quote_token_set.intersection(w_set))
            recall = overlap / max(len(quote_token_set), 1)
            precision = overlap / max(len(w_set), 1)
            # F-beta weighted toward quote coverage (recall)
            score = (0.72 * recall) + (0.28 * precision)
            if score > best_score:
                best_score = score
                best_span = (w_start, w_end)
                best_text = source_text[w_start:w_end].strip()

    sec_id, sec_title = _find_section_for_offset(sections, best_span[0])
    rounded_score = round(min(best_score, 0.96), 2)

    if rounded_score >= min_grounding_score:
        return VerificationResult(
            status="VERIFIED_HIGH_CONFIDENCE",
            confidence_score=rounded_score,
            matched_excerpt=best_text,
            section_id=sec_id,
            section_title=sec_title,
            start_char=best_span[0],
            end_char=best_span[1],
            verification_note=f"High-confidence lexical grounding ({int(rounded_score * 100)}% overlap) mapped to source text.",
        )
    elif rounded_score >= 0.45:
        return VerificationResult(
            status="PARTIAL_SUPPORT",
            confidence_score=rounded_score,
            matched_excerpt=best_text or clean_quote,
            section_id=sec_id,
            section_title=sec_title,
            start_char=best_span[0] if best_text else None,
            end_char=best_span[1] if best_text else None,
            verification_note=f"Partial textual support ({int(rounded_score * 100)}% match). Review source clause directly.",
        )
    else:
        return VerificationResult(
            status="UNVERIFIED_FLAGGED",
            confidence_score=rounded_score,
            matched_excerpt=clean_quote,
            section_id=None,
            section_title=None,
            start_char=None,
            end_char=None,
            verification_note="Flagged by Verification Layer: Excerpt could not be strictly matched to extracted source text.",
        )


def compute_verification_audit(
    clauses: List[Dict[str, Any]],
    risks: List[Dict[str, Any]],
    obligations: List[Dict[str, Any]],
) -> Dict[str, Any]:
    all_items = []
    for c in clauses:
        v = c.get("verification") if isinstance(c, dict) else c.verification.model_dump()
        all_items.append(("clause", c.get("title") if isinstance(c, dict) else c.title, v))
    for r in risks:
        v = r.get("verification") if isinstance(r, dict) else r.verification.model_dump()
        all_items.append(("risk", r.get("title") if isinstance(r, dict) else r.title, v))
    for o in obligations:
        v = o.get("verification") if isinstance(o, dict) else o.verification.model_dump()
        all_items.append(("obligation", o.get("title") if isinstance(o, dict) else o.title, v))

    total = len(all_items)
    if total == 0:
        return {
            "total_findings": 0,
            "verified_exact_count": 0,
            "verified_high_count": 0,
            "partial_support_count": 0,
            "unverified_flagged_count": 0,
            "overall_grounding_score": 1.0,
            "trust_grade": "A+",
            "audit_status": "VERIFIED",
        }

    exact_count = sum(1 for _, _, v in all_items if v.get("status") == "VERIFIED_EXACT")
    high_count = sum(1 for _, _, v in all_items if v.get("status") == "VERIFIED_HIGH_CONFIDENCE")
    partial_count = sum(1 for _, _, v in all_items if v.get("status") == "PARTIAL_SUPPORT")
    unverified_count = sum(1 for _, _, v in all_items if v.get("status") == "UNVERIFIED_FLAGGED")
    avg_score = round(sum(float(v.get("confidence_score", 0.0)) for _, _, v in all_items) / total, 3)

    if avg_score >= 0.94 and unverified_count == 0:
        grade = "A+"
        status = "FULLY_GROUNDED"
    elif avg_score >= 0.85 and unverified_count == 0:
        grade = "A"
        status = "VERIFIED"
    elif avg_score >= 0.72:
        grade = "B+"
        status = "MOSTLY_VERIFIED"
    else:
        grade = "C"
        status = "REQUIRES_HUMAN_REVIEW"

    return {
        "total_findings": total,
        "verified_exact_count": exact_count,
        "verified_high_count": high_count,
        "partial_support_count": partial_count,
        "unverified_flagged_count": unverified_count,
        "overall_grounding_score": avg_score,
        "trust_grade": grade,
        "audit_status": status,
    }

