import firebase_admin
from firebase_admin import credentials
from django.conf import settings

cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS)

firebase_admin.initialize_app(cred)