"""
Pytest configuration and shared fixtures for BisaFit backend tests
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://bisafit-rebrand.preview.emergentagent.com').rstrip('/')


@pytest.fixture(scope="session")
def api_client():
    """Shared requests session for all tests"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="session")
def base_url():
    """Return the base URL for API calls"""
    return BASE_URL
