from django.urls import path

from .views import *

urlpatterns = [
    path("verify-student-id/", VerifyStudentIdView.as_view(), name="verify-student-id"),
    path("verify/", PublicVerifyVoterView.as_view(), name="public-verify-voter"),
    path("verify-otp/", PublicVerifyOTPView.as_view(), name="public-verify-otp"),
    path("voting-session/validate/", ValidateSessionView.as_view(),name="validate-session"),
    path("elections/<uuid:election_id>/import/", ImportVotersView.as_view(), name="import-voters"),
    path("elections/<uuid:election_id>/voters/<uuid:voter_id>/send-otp/", SendOTPView.as_view(), name="send-otp"),
    path("elections/<uuid:election_id>/voters/<uuid:voter_id>/verify-otp/", VerifyOTPNestedView.as_view(), name="verify-otp-nested"),
    path("elections/<uuid:election_id>/voters/<uuid:voter_id>/create-session/", CreateVotingSessionView.as_view(), name="create-session"),
]