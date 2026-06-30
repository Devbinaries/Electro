from rest_framework.throttling import SimpleRateThrottle

class VoteThrottle(SimpleRateThrottle):
    scope = "vote"
    
    def get_cache_key(self, request, view):
        if not request.user:
            return None
        
        return self.cache_format % {
            "scope" : self.scope,
            "ident" : request.user.id
        }
        