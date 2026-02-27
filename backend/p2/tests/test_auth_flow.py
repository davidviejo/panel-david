import unittest
import json
import os
import sys

# Add the project root to the path so we can import apps
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from apps import create_app
from config import Config

class TestConfig(Config):
    TESTING = True
    CLIENTS_AREA_PASSWORD_HASH = "$2b$12$UrK55Xs7tLqH0z0cu6oRZ.JN/pqHYreLfzR8H2ZATNw3pBVPHNJJm" # client123
    OPERATOR_PASSWORD_HASH = "$2b$12$ooQyy7v8onO36nwowL383OPBgGddCIzt61fYAVmB5b7pS3.kjIusu" # operator123
    JWT_SECRET = "test_secret"

class AuthTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    def test_health(self):
        response = self.client.get('/api/health')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['status'], 'ok')

    def test_clients_area_login(self):
        # Fail
        response = self.client.post('/api/auth/clients-area', json={'password': 'wrong'})
        self.assertEqual(response.status_code, 401)

        # Success
        response = self.client.post('/api/auth/clients-area', json={'password': 'client123'})
        self.assertEqual(response.status_code, 200)
        self.assertIn('token', response.json)
        self.assertEqual(response.json['role'], 'clients_area')
        return response.json['token']

    def test_operator_login(self):
        response = self.client.post('/api/auth/operator', json={'password': 'operator123'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['role'], 'operator')
        return response.json['token']

    def test_project_login(self):
        # Need to be clients_area first
        client_token = self.test_clients_area_login()
        headers = {'Authorization': f'Bearer {client_token}'}

        # Test project login
        # ID 100 has hash for 'project123'
        response = self.client.post('/api/auth/project/100', json={'password': 'project123'}, headers=headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json['role'], 'project')
        self.assertEqual(response.json['scope'], '100')
        return response.json['token']

    def test_protected_routes(self):
        client_token = self.test_clients_area_login()
        project_token = self.test_project_login()
        operator_token = self.test_operator_login()

        # 1. GET /api/clients (requires clients_area)
        # Without token
        res = self.client.get('/api/clients')
        self.assertEqual(res.status_code, 401)

        # With client token
        res = self.client.get('/api/clients', headers={'Authorization': f'Bearer {client_token}'})
        self.assertEqual(res.status_code, 200)
        self.assertTrue(len(res.json) > 0)

        # 2. GET /api/<slug>/overview (requires project role and scope)
        # With project token for 100
        res = self.client.get('/api/100/overview', headers={'Authorization': f'Bearer {project_token}'})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json['project']['id'], '100')

        # With project token for 100 but accessing 101 (mock scenario, if we had another project)
        res = self.client.get('/api/999/overview', headers={'Authorization': f'Bearer {project_token}'})
        self.assertEqual(res.status_code, 403) # Scope mismatch

        # With operator token (superuser)
        res = self.client.get('/api/100/overview', headers={'Authorization': f'Bearer {operator_token}'})
        self.assertEqual(res.status_code, 200)

        # 3. POST /api/tools/run (requires operator)
        # With client token
        res = self.client.post('/api/tools/run/audit', headers={'Authorization': f'Bearer {client_token}'})
        self.assertEqual(res.status_code, 403)

        # With operator token
        res = self.client.post('/api/tools/run/audit', headers={'Authorization': f'Bearer {operator_token}'})
        self.assertEqual(res.status_code, 200)

if __name__ == '__main__':
    unittest.main()
