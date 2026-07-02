from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from elections.models import Election, ElectionStatus, Position, Candidate
from elections.services import sync_election_status
from voters.models import ElectionVoter, VotingSession

User = get_user_model()


class ElectionLifecycleTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.officer = User.objects.create_user(
            email="officer@test.com",
            username="officer",
            password="password",
            role="ELECTORAL_OFFICER",
        )
        self.election = Election.objects.create(
            title="Lifecycle Election",
            description="Test election",
            status=ElectionStatus.DRAFT,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=1),
            electoral_officer=self.officer,
        )
        self.position = Position.objects.create(election=self.election, name="President")
        self.candidate = Candidate.objects.create(
            election=self.election,
            position=self.position,
            name="Alice",
        )

    def test_active_election_is_not_mutable(self):
        election = Election.objects.create(
            title="Active Election",
            description="Test election",
            status=ElectionStatus.ACTIVE,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=1),
        )

        self.assertFalse(election.can_accept_changes())

    def test_public_active_election_includes_share_link(self):
        Election.objects.create(
            title="Active Election",
            description="Test election",
            status=ElectionStatus.ACTIVE,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=1),
        )

        response = self.client.get(reverse("public-active-election"))

        self.assertEqual(response.status_code, 200)
        self.assertIn("share_link", response.data)
        self.assertIn("/vote/", response.data["share_link"])

    def test_locked_election_remains_locked_until_manually_activated(self):
        now = timezone.now()
        start_time = now - timedelta(minutes=5)
        end_time = now + timedelta(hours=1)

        election = Election.objects.create(
            title="Timed Start Election",
            description="Test election",
            status=ElectionStatus.LOCKED,
            start_date=start_time,
            end_date=end_time,
            electoral_officer=self.officer,
        )

        # Syncing schedule should NOT auto-activate
        sync_election_status(election, now=now)
        election.refresh_from_db()
        self.assertEqual(election.status, ElectionStatus.LOCKED)

        # Manual activation should succeed and transition to ACTIVE
        election.activate_election(require_validations=False)
        election.refresh_from_db()
        self.assertEqual(election.status, ElectionStatus.ACTIVE)

    def test_locked_election_does_not_jump_to_closed_when_already_past_end_time(self):
        """A LOCKED election should never auto-close; it can only auto-activate (LOCKED->ACTIVE) when now < end_date."""
        now = timezone.now()
        start_time = now - timedelta(days=2)
        end_time = now - timedelta(days=1)

        election = Election.objects.create(
            title="Timed Window Skipping Election",
            description="Test election",
            status=ElectionStatus.LOCKED,
            start_date=start_time,
            end_date=end_time,
            electoral_officer=self.officer,
        )

        sync_election_status(election, now=now)
        election.refresh_from_db()

        # Must not become CLOSED directly from LOCKED
        self.assertEqual(election.status, ElectionStatus.LOCKED)

    def test_active_election_remains_active_until_manually_closed(self):
        end_time = timezone.now() - timedelta(minutes=5)

        election = Election.objects.create(
            title="Timed End Election",
            description="Test election",
            status=ElectionStatus.ACTIVE,
            start_date=end_time - timedelta(days=1),
            end_date=end_time,
            electoral_officer=self.officer,
        )

        # Syncing schedule should NOT auto-close
        sync_election_status(election, now=timezone.now())
        election.refresh_from_db()
        self.assertEqual(election.status, ElectionStatus.ACTIVE)

        # Manual close should succeed and transition to CLOSED
        election.close_election(require_validations=False)
        election.refresh_from_db()
        self.assertEqual(election.status, ElectionStatus.CLOSED)

    def test_scenario_1_current_time_before_start_date(self):
        """Current time is before start_date. Expected: LOCKED"""
        now = timezone.now()
        start_time = now + timedelta(hours=1)
        end_time = now + timedelta(hours=2)

        election = Election.objects.create(
            title="Before Start Election",
            description="Test election",
            status=ElectionStatus.LOCKED,
            start_date=start_time,
            end_date=end_time,
            electoral_officer=self.officer,
        )

        sync_election_status(election, now=now)
        election.refresh_from_db()
        self.assertEqual(election.status, ElectionStatus.LOCKED)

    def test_scenario_2_current_time_between_start_and_end(self):
        """Current time is between start_date and end_date. Expected: LOCKED"""
        now = timezone.now()
        start_time = now - timedelta(hours=1)
        end_time = now + timedelta(hours=1)

        election = Election.objects.create(
            title="Between Dates Election",
            description="Test election",
            status=ElectionStatus.LOCKED,
            start_date=start_time,
            end_date=end_time,
            electoral_officer=self.officer,
        )

        sync_election_status(election, now=now)
        election.refresh_from_db()
        self.assertEqual(election.status, ElectionStatus.LOCKED)

    def test_scenario_3_current_time_after_end_date(self):
        """Current time is after end_date. Expected: ACTIVE"""
        now = timezone.now()
        start_time = now - timedelta(hours=2)
        end_time = now - timedelta(hours=1)

        election = Election.objects.create(
            title="After End Date Election",
            description="Test election",
            status=ElectionStatus.ACTIVE,
            start_date=start_time,
            end_date=end_time,
            electoral_officer=self.officer,
        )

        sync_election_status(election, now=now)
        election.refresh_from_db()
        self.assertEqual(election.status, ElectionStatus.ACTIVE)

    def test_scenario_4_cannot_transition_locked_or_draft_to_closed(self):
        """Ensure no election can transition LOCKED -> CLOSED or DRAFT -> CLOSED under any circumstances."""
        now = timezone.now()
        start_time = now - timedelta(hours=2)
        end_time = now - timedelta(hours=1)

        # 1. Test LOCKED -> CLOSED skip
        locked_election = Election.objects.create(
            title="LOCKED skip test",
            status=ElectionStatus.LOCKED,
            start_date=start_time,
            end_date=end_time,
            electoral_officer=self.officer,
        )
        sync_election_status(locked_election, now=now)
        locked_election.refresh_from_db()
        self.assertEqual(locked_election.status, ElectionStatus.LOCKED)

        # 2. Test DRAFT -> CLOSED skip
        draft_election = Election.objects.create(
            title="DRAFT skip test",
            status=ElectionStatus.DRAFT,
            start_date=start_time,
            end_date=end_time,
            electoral_officer=self.officer,
        )
        sync_election_status(draft_election, now=now)
        draft_election.refresh_from_db()
        self.assertEqual(draft_election.status, ElectionStatus.DRAFT)

    def test_date_validation_rejects_invalid_dates(self):
        """Reject identical start and end times, or end time before start time."""
        now = timezone.now()
        from django.core.exceptions import ValidationError

        # Identical
        with self.assertRaises(ValidationError):
            Election.objects.create(
                title="Identical Date Test",
                status=ElectionStatus.DRAFT,
                start_date=now,
                end_date=now,
                electoral_officer=self.officer,
            )

        # Reversed
        with self.assertRaises(ValidationError):
            Election.objects.create(
                title="Reversed Date Test",
                status=ElectionStatus.DRAFT,
                start_date=now + timedelta(hours=1),
                end_date=now,
                electoral_officer=self.officer,
            )

    def test_candidate_create_blocked_when_locked(self):
        self.election.status = ElectionStatus.LOCKED
        self.election.is_locked = True
        self.election.save()

        self.client.force_authenticate(user=self.officer)
        response = self.client.post(
            "/api/elections/candidates/",
            {
                "election": self.election.id,
                "position": self.position.id,
                "name": "Bob",
            },
        )

        self.assertEqual(response.status_code, 403)

    def test_position_destroy_blocked_when_active(self):
        self.election.status = ElectionStatus.ACTIVE
        self.election.save()

        self.client.force_authenticate(user=self.officer)
        response = self.client.delete(f"/api/elections/positions/{self.position.id}/")

        self.assertEqual(response.status_code, 403)

    def test_public_observer_returns_message_for_locked_election(self):
        self.election.status = ElectionStatus.LOCKED
        self.election.is_locked = True
        self.election.save()

        response = self.client.get(
            reverse("public-election-observer", kwargs={"election_id": self.election.election_id})
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("message", response.data)

    def test_verify_student_id_accepts_imported_variable_length_id(self):
        self.election.status = ElectionStatus.ACTIVE
        self.election.save()
        ElectionVoter.objects.create(
            election=self.election,
            student_id="2451",
            first_name="Test",
            last_name="Voter",
            email="voter@test.com",
            department="Science",
        )

        response = self.client.post(
            reverse("verify-student-id"),
            {
                "studentId": "2451",
                "electionId": str(self.election.election_id),
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["valid"])

    def test_verify_student_id_rejects_non_imported_id_even_without_length_rule(self):
        self.election.status = ElectionStatus.ACTIVE
        self.election.save()
        ElectionVoter.objects.create(
            election=self.election,
            student_id="2024-ENG-000123",
            first_name="Exact",
            last_name="Match",
            email="exact@test.com",
            department="Engineering",
        )

        response = self.client.post(
            reverse("verify-student-id"),
            {
                "studentId": "1234567890",
                "electionId": str(self.election.election_id),
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["valid"])

    def test_public_verify_generates_otp_for_active_voter(self):
        self.election.status = ElectionStatus.ACTIVE
        self.election.save()
        voter = ElectionVoter.objects.create(
            election=self.election,
            student_id="2451",
            first_name="Test",
            last_name="Voter",
            email="otp@test.com",
            department="Science",
        )

        response = self.client.post(
            reverse("public-verify-voter"),
            {
                "electionId": str(self.election.election_id),
                "studentId": voter.student_id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["voter_id"], str(voter.voter_id))
        self.assertEqual(len(response.data["verification_code"]), 6)

    def test_public_verify_otp_returns_session_token(self):
        self.election.status = ElectionStatus.ACTIVE
        self.election.save()
        voter = ElectionVoter.objects.create(
            election=self.election,
            student_id="2024-ENG-000123",
            first_name="Exact",
            last_name="Match",
            email="verifyotp@test.com",
            department="Engineering",
        )

        verify_response = self.client.post(
            reverse("public-verify-voter"),
            {
                "electionId": str(self.election.election_id),
                "studentId": voter.student_id,
            },
            format="json",
        )

        otp_response = self.client.post(
            reverse("public-verify-otp"),
            {
                "electionId": str(self.election.election_id),
                "voterId": str(voter.voter_id),
                "otp": verify_response.data["verification_code"],
            },
            format="json",
        )

        self.assertEqual(otp_response.status_code, 200)
        self.assertTrue(otp_response.data["success"])
        self.assertTrue(VotingSession.objects.filter(voter=voter, is_active=True).exists())

    def test_vote_submission_returns_receipt_and_invalidates_session(self):
        self.election.status = ElectionStatus.ACTIVE
        self.election.save()
        voter = ElectionVoter.objects.create(
            election=self.election,
            student_id="7777",
            first_name="Vote",
            last_name="Caster",
            email="vote@test.com",
            department="Science",
            is_verified=True,
        )
        session = VotingSession.objects.create(
            voter=voter,
            expires_at=timezone.now() + timedelta(minutes=30),
        )

        response = self.client.post(
            "/api/elections/votes/",
            {
                "session_token": str(session.session_token),
                "election_id": str(self.election.election_id),
                "votes": [
                    {
                        "position_id": self.position.id,
                        "candidate_id": self.candidate.id,
                    }
                ],
            },
            format="json",
        )

        session.refresh_from_db()
        voter.refresh_from_db()

        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data["success"])
        self.assertIn("receipt_id", response.data)
        self.assertFalse(session.is_active)
        self.assertTrue(voter.has_voted)
