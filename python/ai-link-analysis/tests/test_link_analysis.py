import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.utils.validators import URLValidationError, validate_public_url

client = TestClient(app)


def test_blocks_private_ssrf_urls() -> None:
    for bad_url in [
        "http://127.0.0.1:8000",
        "http://localhost:4000",
        "http://169.254.169.254/latest/meta-data/",
        "ftp://example.com",
    ]:
        with pytest.raises(URLValidationError):
            validate_public_url(bad_url)


def test_invalid_url_endpoint_returns_400() -> None:
    response = client.post("/link-analysis", json={"url": "http://127.0.0.1:4000"})
    assert response.status_code == 400
    assert response.json()["success"] is False
