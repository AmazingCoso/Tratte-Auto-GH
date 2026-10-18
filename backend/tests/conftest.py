# Shared fixtures: a TEST_ profile (X-Profile-Id) for all trip/report tests, deleted at the end
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")


@pytest.fixture(scope="session")
def profile_id():
    r = requests.post(f"{BASE_URL}/api/profiles", json={"name": "TEST_pytest_profile"})
    assert r.status_code == 200, r.text
    pid = r.json()["id"]
    yield pid
    requests.delete(f"{BASE_URL}/api/profiles/{pid}")
