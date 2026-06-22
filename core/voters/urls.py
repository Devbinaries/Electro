from django.urls import path

from .views import *

urlpatterns = [
    path("elections/<int:election_id>/voters/<int:voter_id>/send-otp/", SendOTPView.as_view(), name="send-otp"),
    path("elections/<int:election_id>/voters/<int:voter_id>/verify-otp/", VerifyOTPView.as_view(), name="verify-otp"),
    path("elections/<int:election_id>/voters/<int:voter_id>/create-session/", CreateVotingSessionView.as_view(), name="create-voting-session"),  
    path("voting-session/validate/", ValidateSessionView.as_view(),name="validate-session"),
]