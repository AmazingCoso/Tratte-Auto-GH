# Tests for PATCH /api/trips/{id}/dates (date-only autosave, iteration 6)
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")


@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def trip(s):
    r = s.post(f"{BASE_URL}/api/trips", json={
        "name": "TEST_dates", "origin": "Milano", "destination": "Firenze",
        "waypoints": ["Bologna"], "date": "2026-10-10", "leg_dates": []}, timeout=60)
    assert r.status_code == 200
    t = r.json()
    yield t
    s.delete(f"{BASE_URL}/api/trips/{t['id']}")


def month_km(s, m):
    return s.get(f"{BASE_URL}/api/reports/monthly", params={"month": m}).json()


def test_trip_has_legs(trip):
    assert trip["legs"] and len(trip["legs"]) == 2


def test_patch_updates_only_dates(s, trip):
    r = s.patch(f"{BASE_URL}/api/trips/{trip['id']}/dates",
                json={"date": "2026-10-12", "leg_dates": ["", "2026-11-03"]})
    assert r.status_code == 200
    d = r.json()
    assert d["date"] == "2026-10-12" and d["leg_dates"] == ["", "2026-11-03"]
    assert d["legs"] == trip["legs"] and d["total_km"] == trip["total_km"]
    assert d["name"] == "TEST_dates" and d["waypoints"] == ["Bologna"]
    g = s.get(f"{BASE_URL}/api/trips/{trip['id']}").json()
    assert g["date"] == "2026-10-12" and g["leg_dates"] == ["", "2026-11-03"]
    assert "_id" not in g


def test_monthly_report_follows_leg_dates(s, trip):
    s.patch(f"{BASE_URL}/api/trips/{trip['id']}/dates", json={"date": "2031-03-05", "leg_dates": []})
    a = month_km(s, "2031-03")
    s.patch(f"{BASE_URL}/api/trips/{trip['id']}/dates", json={"date": "2031-03-05", "leg_dates": ["", "2031-04-01"]})
    b = month_km(s, "2031-03")
    c = month_km(s, "2031-04")
    leg2 = trip["legs"][1]["distance_km"]
    assert b["legs"] == a["legs"] - 1
    assert round(a["total_km"] - b["total_km"], 2) == round(leg2, 2)
    assert c["legs"] >= 1


def test_invalid_date_422(s, trip):
    r = s.patch(f"{BASE_URL}/api/trips/{trip['id']}/dates", json={"date": "2026-13-40", "leg_dates": []})
    assert r.status_code == 422
    r = s.patch(f"{BASE_URL}/api/trips/{trip['id']}/dates", json={"date": "2026-10-10", "leg_dates": ["bad"]})
    assert r.status_code == 422


def test_unknown_id_404(s):
    assert s.patch(f"{BASE_URL}/api/trips/0123456789abcdef01234567/dates", json={"date": "2026-10-10"}).status_code == 404
    assert s.patch(f"{BASE_URL}/api/trips/notanid/dates", json={"date": "2026-10-10"}).status_code == 404


def test_partial_body_behaviour(s, trip):
    """Documents PATCH semantics: omitted 'date' falls back to today (not preserved)."""
    s.patch(f"{BASE_URL}/api/trips/{trip['id']}/dates", json={"date": "2026-10-12", "leg_dates": ["", "2026-11-03"]})
    r = s.patch(f"{BASE_URL}/api/trips/{trip['id']}/dates", json={"leg_dates": ["", "2026-11-04"]})
    assert r.status_code == 200
    print("date after partial patch:", r.json()["date"])
    assert r.json()["date"] == "2026-10-12", "Omitted date overwritten (not true PATCH semantics)"
