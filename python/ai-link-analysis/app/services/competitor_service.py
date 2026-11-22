from app.schemas import CompetitorAnalysis


def enrich_competitor_notes(analysis: CompetitorAnalysis) -> CompetitorAnalysis:
    """Ensure AI-inferred competitors are transparently labeled."""
    for comp in analysis.competitors:
        if not comp.source_note.strip():
            comp.source_note = "AI-identified industry competitor suggestion"
    return analysis
