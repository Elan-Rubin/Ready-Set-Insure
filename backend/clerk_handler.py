import httpx
from clerk_backend_api import Clerk
from clerk_backend_api.jwks_helpers import authenticate_request, AuthenticateRequestOptions

class ClerkMod:
    def __init__(self,env_key):
        self.key = env_key
        