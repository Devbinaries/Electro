from django.core.management.base import BaseCommand

from elections.models import Election
from elections.services import sync_election_status


class Command(BaseCommand):
    help = "Synchronize election statuses based on their scheduled start and end times"

    def handle(self, *args, **options):
        updated = []
        for election in Election.objects.all().order_by("id"):
            previous_status = election.status
            new_status = sync_election_status(election)
            if new_status != previous_status:
                updated.append((election.id, previous_status, new_status))

        self.stdout.write(
            self.style.SUCCESS(
                f"Processed {Election.objects.count()} elections; updated {len(updated)} election(s)."
            )
        )
        for election_id, previous_status, new_status in updated:
            self.stdout.write(f"Election {election_id}: {previous_status} -> {new_status}")
