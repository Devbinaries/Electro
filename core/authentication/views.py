from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken



from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

from .serializers import LoginSerializer, UserSerializer, ChangePasswordSerializer

class LoginView(APIView):
    authentication_classes = []
    permission_classes = []
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data["user"]
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            "access" : str(refresh.access_token),
            "refresh":str(refresh),
            "user":UserSerializer(user).data
        }, status=status.HTTP_200_OK)
        
class MeView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        current_password = serializer.validated_data["current_password"]
        new_password = serializer.validated_data["new_password"]

        # Validate current password
        if not user.check_password(current_password):
            return Response(
                {"current_password": ["Incorrect current password."]},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate new password strength
        try:
            validate_password(new_password, user)
        except DjangoValidationError as e:
            return Response(
                {"new_password": list(e.messages)},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.must_change_password = False
        user.save()

        return Response({
            "message": "Password changed successfully.",
            "user": UserSerializer(user).data
        }, status=status.HTTP_200_OK)