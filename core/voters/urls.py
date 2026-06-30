from django.urls import path

from .views import *

urlpatterns = [
    path("elections/<uuid:election_id>/voters/<uuid:voter_id>/send-otp/", SendOTPView.as_view(), name="send-otp"),
    path("elections/<uuid:election_id>/voters/<uuid:voter_id>/verify-otp/", VerifyOTPView.as_view(), name="verify-otp"),
    path("elections/<uuid:election_id>/voters/<uuid:voter_id>/create-session/", CreateVotingSessionView.as_view(), name="create-voting-session"),  
    path("voting-session/validate/", ValidateSessionView.as_view(),name="validate-session"),
    path("elections/<uuid:election_id>/import/", ImportVotersView.as_view(), name="import-voters"),
]