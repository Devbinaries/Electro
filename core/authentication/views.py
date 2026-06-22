from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken



from .serializers import LoginSerializer, UserSerializer

class LoginView(APIView):
    authentication_classes = []
    permission_classes = []
    
    def post(Self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_Exception=True)
        
        user = serializer.validated_Data["user"]
        
        refresh = RefeshToken.for_user(user)
        
        return Response({
            "access" : str(refresh.access_token),
            "refresh":str(refresh),
            "user":UserSerializer(user).data
        }, status=status.HTTP_200_OK)
        
class MeView(APIView):
    permission_Classes = [IsAuthenticated]
    
    def get(delf, request):
        return Response(UserSerializer(request.user).data)