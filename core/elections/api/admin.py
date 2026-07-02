from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from authentication.permissions import IsAdmin
from elections.models import Election, ElectionStatus
from elections.services import log_audit
from elections.serializers import (
    AdminCreateElectionSerializer,
    AdminUpdateElectionSerializer,
    AdminElectionDetailSerializer,
)


class AdminElectionCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        serializer = AdminCreateElectionSerializer(data=request.data)
        if serializer.is_valid():
            election = serializer.save()
            return Response(
                AdminElectionDetailSerializer(election).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminElectionDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, election_id):
        try:
            election = Election.objects.select_related("electoral_officer").prefetch_related(
                "auditors"
            ).get(id=election_id)
        except Election.DoesNotExist:
            return Response(
                {"error": "Election not found"}, status=status.HTTP_404_NOT_FOUND
            )

        election.sync_status_from_schedule()
        serializer = AdminElectionDetailSerializer(election)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, election_id):
        try:
            election = Election.objects.get(id=election_id)
        except Election.DoesNotExist:
            return Response(
                {"error": "Election not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Only draft elections can be modified
        if not election.can_accept_changes():
            return Response(
                {"error": election.mutation_block_reason()},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AdminUpdateElectionSerializer(election, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                AdminElectionDetailSerializer(election).data, status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, election_id):
        try:
            election = Election.objects.get(id=election_id)
        except Election.DoesNotExist:
            return Response(
                {"error": "Election not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Only draft elections can be deleted
        if election.status != ElectionStatus.DRAFT:
            return Response(
                {"error": "Only draft elections can be deleted"},
                status=status.HTTP_403_FORBIDDEN,
            )

        election_title = election.title
        election.delete()
        return Response(
            {"message": f"Election '{election_title}' deleted successfully"},
            status=status.HTTP_204_NO_CONTENT,
        )


class AdminElectionStatusView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def put(self, request, election_id):
        try:
            election = Election.objects.select_related("electoral_officer").prefetch_related(
                "auditors"
            ).get(id=election_id)
        except Election.DoesNotExist:
            return Response(
                {"error": "Election not found"}, status=status.HTTP_404_NOT_FOUND
            )

        new_status = request.data.get("status")
        if not new_status:
            return Response(
                {"error": "Status field is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            if new_status == ElectionStatus.LOCKED:
                election.lock_election()
            elif new_status == ElectionStatus.ACTIVE:
                election.activate_election()
            elif new_status == ElectionStatus.CLOSED:
                election.close_election()
            else:
                return Response(
                    {"error": f"Invalid status transition: {new_status}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            return Response(
                AdminElectionDetailSerializer(election).data,
                status=status.HTTP_200_OK,
            )
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class AdminElectionListView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        queryset = Election.objects.select_related("electoral_officer").prefetch_related(
            "auditors"
        ).order_by("-created_at")

        # Filter by status if provided
        status_filter = request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Pagination
        try:
            page_size = min(int(request.query_params.get("page_size", 20)), 100)
        except ValueError:
            page_size = 20

        try:
            page = max(int(request.query_params.get("page", 1)), 1)
        except ValueError:
            page = 1

        start = (page - 1) * page_size
        end = start + page_size

        total = queryset.count()
        elections = list(queryset[start:end])
        for election in elections:
            election.sync_status_from_schedule()
        serializer = AdminElectionDetailSerializer(elections, many=True)
        return Response(
            {
                "count": total,
                "page": page,
                "page_size": page_size,
                "results": serializer.data,
            },
            status=status.HTTP_200_OK,
        )
