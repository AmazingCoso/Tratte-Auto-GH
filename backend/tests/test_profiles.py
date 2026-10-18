# Iteration 8: /api/profiles CRUD + X-Profile-Id scoping of trips & monthly reports; places per-profile (iter 9)
import io
import os
import pytest
import requests
from openpyxl import load_workbook

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"
REAL_ID = "6ad4eb31f0ed23cc2788c0bc"
MONTH = "2032-05"


def mk_profile(name):
    r = requests.post(f"{API}/profiles", json={"name": name})
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture(scope="module")
def two():
    a, b = mk_profile("TEST_A"), mk_profile("TEST_B")
    yield a, b
    for p in (a, b):
        requests.delete(f"{API}/profiles/{p['id']}")


def H(p):
    return {"X-Profile-Id": p["id"]}


@pytest.fixture(scope="module")
def trip_a(two):
    a, _ = two
    r = requests.post(f"{API}/trips", headers=H(a), json={
        "name": "TEST_tripA", "origin": "45.4642,9.19", "destination": "44.4949,11.3426",
        "date": f"{MONTH}-10"}, timeout=60)
    assert r.status_code == 200, r.text
    t = r.json()
    assert t["profile_id"] == a["id"]
    return t


# --- profiles CRUD ---
def test_create_strips_and_listed_sorted(two):
    a, b = two
    p = mk_profile("  TEST_strip  ")
    try:
        assert p["name"] == "TEST_strip" and isinstance(p["id"], str)
        lst = requests.get(f"{API}/profiles").json()
        ids = [x["id"] for x in lst]
        assert ids.index(a["id"]) < ids.index(b["id"]) < ids.index(p["id"])
        assert "_id" not in lst[0]
        created = [x["created_at"] for x in lst]
        assert created == sorted(created)
    finally:
        requests.delete(f"{API}/profiles/{p['id']}")


@pytest.mark.parametrize("name", ["", "   ", "x" * 41])
def test_create_invalid_422(name):
    assert requests.post(f"{API}/profiles", json={"name": name}).status_code == 422


def test_rename_and_persist():
    p = mk_profile("TEST_ren")
    try:
        r = requests.put(f"{API}/profiles/{p['id']}", json={"name": "TEST_ren2"})
        assert r.status_code == 200 and r.json()["name"] == "TEST_ren2"
        assert any(x["name"] == "TEST_ren2" for x in requests.get(f"{API}/profiles").json())
        assert requests.put(f"{API}/profiles/{p['id']}", json={"name": " "}).status_code == 422
    finally:
        requests.delete(f"{API}/profiles/{p['id']}")


def test_rename_delete_unknown_404():
    assert requests.put(f"{API}/profiles/000000000000000000000000", json={"name": "x"}).status_code == 404
    assert requests.delete(f"{API}/profiles/000000000000000000000000").status_code == 404
    assert requests.delete(f"{API}/profiles/bad").status_code == 404


def test_delete_profile_deletes_its_trips():
    p = mk_profile("TEST_del")
    t = requests.post(f"{API}/trips", headers=H(p), json={"name": "TEST_x", "origin": "Milano", "destination": "Roma"}, timeout=60).json()
    assert requests.delete(f"{API}/profiles/{p['id']}").status_code == 200
    assert all(x["id"] != p["id"] for x in requests.get(f"{API}/profiles").json())
    # profile gone -> header unknown -> 404; also check trip not visible to anyone
    assert requests.get(f"{API}/trips/{t['id']}", headers=H(p)).status_code == 404


# --- header enforcement ---
@pytest.mark.parametrize("method,path", [
    ("get", "/trips"), ("get", "/trips/000000000000000000000000"), ("post", "/trips"),
    ("delete", "/trips/000000000000000000000000"), ("get", f"/reports/monthly?month={MONTH}"),
    ("get", f"/reports/monthly/excel?month={MONTH}"),
])
def test_missing_header_400_unknown_404(method, path):
    r = requests.request(method, f"{API}{path}", json={"name": "n", "origin": "a", "destination": "b"})
    assert r.status_code == 400, r.text
    for bad in ("000000000000000000000000", "not-an-id"):
        r = requests.request(method, f"{API}{path}", headers={"X-Profile-Id": bad}, json={"name": "n", "origin": "a", "destination": "b"})
        assert r.status_code == 404, (bad, r.text)


# --- scoping ---
def test_list_scoped(two, trip_a):
    a, b = two
    assert any(t["id"] == trip_a["id"] for t in requests.get(f"{API}/trips", headers=H(a)).json())
    lb = requests.get(f"{API}/trips", headers=H(b)).json()
    assert lb == []


def test_b_cannot_touch_a(two, trip_a):
    a, b = two
    tid = trip_a["id"]
    body = {"name": "TEST_hacked", "origin": "Milano", "destination": "Roma"}
    assert requests.get(f"{API}/trips/{tid}", headers=H(b)).status_code == 404
    assert requests.put(f"{API}/trips/{tid}", headers=H(b), json=body, timeout=60).status_code == 404
    assert requests.patch(f"{API}/trips/{tid}/dates", headers=H(b), json={"date": "2032-01-01"}).status_code == 404
    assert requests.post(f"{API}/trips/{tid}/duplicate", headers=H(b)).status_code == 404
    assert requests.delete(f"{API}/trips/{tid}", headers=H(b)).status_code == 404
    got = requests.get(f"{API}/trips/{tid}", headers=H(a)).json()
    assert got["name"] == "TEST_tripA" and got["date"] == f"{MONTH}-10"


def test_duplicate_stays_in_profile(two, trip_a):
    a, b = two
    d = requests.post(f"{API}/trips/{trip_a['id']}/duplicate", headers=H(a)).json()
    assert d["profile_id"] == a["id"]
    assert requests.get(f"{API}/trips/{d['id']}", headers=H(b)).status_code == 404
    assert requests.delete(f"{API}/trips/{d['id']}", headers=H(a)).status_code == 200


def test_monthly_report_scoped(two, trip_a):
    a, b = two
    ra = requests.get(f"{API}/reports/monthly", params={"month": MONTH}, headers=H(a)).json()
    rb = requests.get(f"{API}/reports/monthly", params={"month": MONTH}, headers=H(b)).json()
    assert ra["trips"] == 1 and ra["total_km"] > 100
    assert rb["trips"] == 0 and rb["total_km"] == 0


def test_monthly_excel_title_has_profile_name(two, trip_a):
    a, b = two
    r = requests.get(f"{API}/reports/monthly/excel", params={"month": MONTH}, headers=H(a))
    assert r.status_code == 200
    ws = load_workbook(io.BytesIO(r.content)).active
    texts = " ".join(str(c.value) for row in ws.iter_rows(max_row=3) for c in row if c.value)
    assert "TEST_A" in texts
    rb = requests.get(f"{API}/reports/monthly/excel", params={"month": MONTH}, headers=H(b))
    wsb = load_workbook(io.BytesIO(rb.content)).active
    assert "TEST_B" in " ".join(str(c.value) for row in wsb.iter_rows(max_row=3) for c in row if c.value)


# --- shared / unaffected ---
def test_places_scoped_per_profile(two):
    a, b = two
    r = requests.post(f"{API}/places", headers=H(a), json={"name": "TEST_placeA", "address": "Milano"})
    assert r.status_code == 200 and r.json()["profile_id"] == a["id"]
    pid = r.json()["id"]
    assert any(p["id"] == pid for p in requests.get(f"{API}/places", headers=H(a)).json())
    assert all(p["id"] != pid for p in requests.get(f"{API}/places", headers=H(b)).json())
    assert requests.put(f"{API}/places/{pid}", headers=H(b), json={"name": "hack", "address": "x"}).status_code == 404
    assert requests.delete(f"{API}/places/{pid}", headers=H(b)).status_code == 404
    assert next(p for p in requests.get(f"{API}/places", headers=H(a)).json() if p["id"] == pid)["name"] == "TEST_placeA"
    rb = requests.post(f"{API}/places", headers=H(b), json={"name": "TEST_placeB", "address": "Roma"})
    assert all(p["id"] != rb.json()["id"] for p in requests.get(f"{API}/places", headers=H(a)).json())


@pytest.mark.parametrize("method,path", [("get", "/places"), ("post", "/places"), ("put", "/places/000000000000000000000000"), ("delete", "/places/000000000000000000000000")])
def test_places_header_required(method, path):
    body = {"name": "TEST_x", "address": "y"} if method in ("post", "put") else None
    assert getattr(requests, method)(f"{API}{path}", json=body).status_code == 400
    assert getattr(requests, method)(f"{API}{path}", json=body, headers={"X-Profile-Id": "000000000000000000000000"}).status_code == 404
    assert getattr(requests, method)(f"{API}{path}", json=body, headers={"X-Profile-Id": "bad"}).status_code == 404


def test_delete_profile_deletes_its_places():
    p = mk_profile("TEST_delplaces")
    pl = requests.post(f"{API}/places", headers=H(p), json={"name": "TEST_gone", "address": "Milano"}).json()
    assert requests.delete(f"{API}/profiles/{p['id']}").status_code == 200
    q = mk_profile("TEST_probe")
    try:
        assert requests.delete(f"{API}/places/{pl['id']}", headers=H(q)).status_code == 404
    finally:
        requests.delete(f"{API}/profiles/{q['id']}")


def test_route_legs_no_header():
    r = requests.post(f"{API}/route/legs", json={"origin": "45.4642,9.19", "destination": "44.4949,11.3426", "waypoints": [], "mode": "driving"}, timeout=60)
    assert r.status_code == 200 and r.json()["total_km"] > 100


def test_real_profile_untouched():
    if not any(p["id"] == REAL_ID for p in requests.get(f"{API}/profiles").json()):
        pytest.skip("real profile not present in DB")
    trips = requests.get(f"{API}/trips", headers={"X-Profile-Id": REAL_ID}).json()
    assert len(trips) >= 1 and all(t["profile_id"] == REAL_ID for t in trips)
