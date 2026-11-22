from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_rejects_message_over_200_chars() -> None:
    msg = ("a" * 185) + " https://example.com"
    res = client.post("/posting", json={"message": msg})
    assert res.status_code == 422


def test_rejects_missing_cta_link() -> None:
    res = client.post("/posting", json={"message": "Launch update without any URL link."})
    assert res.status_code == 422


def test_rejects_multiple_cta_links() -> None:
    res = client.post(
        "/posting",
        json={"message": "Two links https://example.com and https://example.org are not allowed."},
    )
    assert res.status_code == 422
