# Favourite places CRUD tests (/api/places)
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api/places"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    created = []
    sess.created = created
    yield sess
    for pid in created:
        sess.delete(f"{API}/{pid}")


def _create(s, name, address):
    r = s.post(API, json={"name": name, "address": address})
    if r.status_code == 200:
        s.created.append(r.json()["id"])
    return r


class TestPlaces:
    def test_create_and_list(self, s):
        r = _create(s, "  TEST_Ufficio  ", " Piazza Maggiore, Bologna ")
        assert r.status_code == 200
        d = r.json()
        assert d["name"] == "TEST_Ufficio"
        assert d["address"] == "Piazza Maggiore, Bologna"
        assert isinstance(d["id"], str) and "_id" not in d
        lst = s.get(API).json()
        assert any(p["id"] == d["id"] for p in lst)

    def test_sorted_by_name(self, s):
        _create(s, "TEST_zeta", "Milano")
        _create(s, "TEST_Alfa", "Firenze")
        names = [p["name"] for p in s.get(API).json()]
        lower = [n.lower() for n in names]
        assert lower == sorted(lower), names

    @pytest.mark.parametrize("payload", [{"name": "", "address": "Milano"}, {"name": "TEST_x", "address": ""}, {"name": "TEST_x"}, {}])
    def test_create_validation(self, s, payload):
        assert s.post(API, json=payload).status_code == 422

    def test_whitespace_only_name(self, s):
        r = s.post(API, json={"name": "   ", "address": "Milano"})
        if r.status_code == 200:
            s.created.append(r.json()["id"])
        assert r.status_code == 422, f"whitespace-only name accepted: {r.json()}"

    def test_update_and_verify(self, s):
        pid = _create(s, "TEST_Edit", "Milano").json()["id"]
        r = s.put(f"{API}/{pid}", json={"name": "TEST_Edited", "address": "Firenze"})
        assert r.status_code == 200 and r.json()["name"] == "TEST_Edited"
        p = next(p for p in s.get(API).json() if p["id"] == pid)
        assert p["address"] == "Firenze"

    def test_update_whitespace_name_rejected_and_list_ok(self, s):
        pid = _create(s, "TEST_WS", "Milano").json()["id"]
        assert s.put(f"{API}/{pid}", json={"name": "   ", "address": "Milano"}).status_code == 422
        assert s.get(API).status_code == 200

    def test_update_unknown(self, s):
        assert s.put(f"{API}/000000000000000000000000", json={"name": "a", "address": "b"}).status_code == 404
        assert s.put(f"{API}/bad-id", json={"name": "a", "address": "b"}).status_code == 404

    def test_delete_and_verify(self, s):
        pid = _create(s, "TEST_Del", "Milano").json()["id"]
        assert s.delete(f"{API}/{pid}").status_code == 200
        assert all(p["id"] != pid for p in s.get(API).json())
        assert s.delete(f"{API}/{pid}").status_code == 404

    def test_delete_invalid(self, s):
        assert s.delete(f"{API}/bad-id").status_code == 404
