from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse

User = get_user_model()

class UserPasswordChangeTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="testuser@example.com",
            username="testuser",
            password="oldpassword123",
            role="ELECTORAL_OFFICER"
        )
        self.change_password_url = reverse("change-password")

    def test_user_created_with_must_change_password_true(self):
        """Verify new users are created with must_change_password = True by default."""
        self.assertTrue(self.user.must_change_password)

    def test_change_password_success(self):
        """Verify user can successfully change password and must_change_password becomes False."""
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.change_password_url, {
            "current_password": "oldpassword123",
            "new_password": "newpassword123",
            "new_password_confirm": "newpassword123"
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertFalse(self.user.must_change_password)
        self.assertTrue(self.user.check_password("newpassword123"))

    def test_change_password_incorrect_current_password(self):
        """Verify password change fails when current password is incorrect."""
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.change_password_url, {
            "current_password": "wrongpassword",
            "new_password": "newpassword123",
            "new_password_confirm": "newpassword123"
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("current_password", response.data)
        self.user.refresh_from_db()
        self.assertTrue(self.user.must_change_password)

    def test_change_password_mismatched_new_passwords(self):
        """Verify password change fails when new password confirmations do not match."""
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.change_password_url, {
            "current_password": "oldpassword123",
            "new_password": "newpassword123",
            "new_password_confirm": "differentpassword"
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertTrue(self.user.must_change_password)

    def test_change_password_unauthenticated(self):
        """Verify unauthenticated requests to change password endpoint are rejected."""
        response = self.client.post(self.change_password_url, {
            "current_password": "oldpassword123",
            "new_password": "newpassword123",
            "new_password_confirm": "newpassword123"
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
