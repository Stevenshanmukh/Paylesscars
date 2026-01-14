
import os
import sys
import django
import json
import random
import time
from decimal import Decimal
from datetime import timedelta

# Setup Django Environment
# Script is now in backend/scripts/
# BASE_DIR should be backend/
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)
print(f"DEBUG: sys.path: {sys.path}")

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
try:
    django.setup()
except Exception as e:
    print(f"DEBUG: Django setup failed: {e}")
    # Try adding parent dir just in case
    sys.path.append(os.path.dirname(BASE_DIR))
    django.setup()

from django.contrib.auth import get_user_model
from apps.dealers.models import Dealer
from apps.vehicles.models import Vehicle, VehicleImage
from apps.negotiations.models import Negotiation
from rest_framework.test import APIClient
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile

User = get_user_model()

class ConsoleColors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def log(message, type="INFO"):
    prefix = "[INFO]"
    color = ConsoleColors.OKBLUE
    if type == "SUCCESS":
        prefix = "[SUCCESS]"
        color = ConsoleColors.OKGREEN
    elif type == "ERROR":
        prefix = "[ERROR]"
        color = ConsoleColors.FAIL
    elif type == "WARNING":
        prefix = "[WARNING]"
        color = ConsoleColors.WARNING
    elif type == "HEADER":
        prefix = "[Step]"
        color = ConsoleColors.HEADER
    
    # Simple print compatible with Windows terminals if ANSI fails
    print(f"{prefix} {message}")

def run_e2e_verification():
    log("Starting Production Readiness E2E Verification", "HEADER")
    
    # 1. Setup Data - Unique suffix to avoid collisions
    run_id = str(int(time.time()))
    dealer_email = f"prod_dealer_{run_id}@example.com"
    buyer_email = f"prod_buyer_{run_id}@example.com"
    password = "SecurePassword123!"
    
    # Initialize Clients
    dealer_client = APIClient()
    buyer_client = APIClient()
    
    # ==========================================
    # SCENARIO 1: Dealer Registration & Login
    # ==========================================
    log("1. Dealer Registration & Setup", "HEADER")
    
    # Register Dealer User
    req_data = {
        "email": dealer_email,
        "password": password,
        "first_name": "Prod",
        "last_name": "Dealer",
        "account_type": "dealer"
    }
    response = dealer_client.post('/api/v1/auth/register/', req_data)
    if response.status_code != 201:
        log(f"Dealer registration failed: {response.data}", "ERROR")
        return False
    log(f"Dealer user registered: {dealer_email}", "SUCCESS")
    
    # Get Tokens
    response = dealer_client.post('/api/v1/auth/login/', {"email": dealer_email, "password": password})
    dealer_token = response.data['access']
    dealer_client.credentials(HTTP_AUTHORIZATION=f'Bearer {dealer_token}')
    log("Dealer logged in", "SUCCESS")
    
    # Verify Profile
    user = User.objects.get(email=dealer_email)
    if not hasattr(user, 'dealer_profile'):
        Dealer.objects.create(user=user, business_name=f"Prod Motors {run_id}", phone="555-0100")
        log("Dealer profile manually created", "WARNING")
    else:
        user.dealer_profile.business_name = f"Prod Motors {run_id}"
        user.dealer_profile.save()
        log("Dealer profile verified", "SUCCESS")

    # ==========================================
    # SCENARIO 2: Bulk Upload (New Logic)
    # ==========================================
    log("2. Bulk Upload Vehicles", "HEADER")
    
    csv_content = f"""vin,make,model,year,price,mileage,features,description,status,image_url
PROD{run_id}001,Honda,Civic,2024,25000,10,Sunroof;Heated Seats,Great commuter car,active,https://via.placeholder.com/300.jpg
PROD{run_id}002,Toyota,Camry,2023,28000,5000,Leather;Nav,Reliable sedan,active,
"""
    # Note: features and description in CSV based on our knowledge of parser
    
    csv_file = SimpleUploadedFile("upload.csv", csv_content.encode('utf-8'), content_type="text/csv")
    
    response = dealer_client.post('/api/v1/vehicles/bulk_upload/', {'csv_file': csv_file}, format='multipart')
    
    if response.status_code != 201:
        log(f"Bulk upload failed: {response.data}", "ERROR")
        return False
    
    results = response.data
    log(f"Bulk upload result: {results['successful']} successful, {results['failed']} failed", "SUCCESS")
    
    if results['successful'] != 2:
        log("Expected 2 vehicles to be created", "ERROR")
        return False
        
    # Verify Vehicle Data
    vehicle_1 = Vehicle.objects.get(vin=f"PROD{run_id}001")
    
    if vehicle_1.specifications.get('description') != "Great commuter car":
        log(f"Description mapping failed. Got: {vehicle_1.specifications.get('description')}", "ERROR")
        return False
    log("Description mapped to specifications correctly", "SUCCESS")

    # ==========================================
    # SCENARIO 3: Buyer Registration & Search
    # ==========================================
    log("3. Buyer Journey", "HEADER")
    
    # Register Buyer
    req_data = {
        "email": buyer_email,
        "password": password,
        "first_name": "Prod",
        "last_name": "Buyer",
        "account_type": "buyer"
    }
    response = buyer_client.post('/api/v1/auth/register/', req_data)
    if response.status_code != 201:
        log(f"Buyer registration failed: {response.data}", "ERROR")
        return False
    
    # Login
    response = buyer_client.post('/api/v1/auth/login/', {"email": buyer_email, "password": password})
    buyer_token = response.data['access']
    buyer_client.credentials(HTTP_AUTHORIZATION=f'Bearer {buyer_token}')
    log("Buyer registered and logged in", "SUCCESS")
    
    # Search
    response = buyer_client.get(f'/api/v1/vehicles/?search=Civic')
    if response.status_code != 200 or len(response.data['results']) == 0:
        log("Buyer search failed to find vehicle", "ERROR")
        return False
    log("Buyer found vehicle via search", "SUCCESS")
    
    # ==========================================
    # SCENARIO 4: Negotiation Cycle
    # ==========================================
    log("4. Negotiation Cycle", "HEADER")
    
    target_vehicle_id = vehicle_1.id
    asking_price = vehicle_1.asking_price
    offer_amount = asking_price * Decimal('0.9') # 90% offer
    
    # 1. Provide Offer
    req_data = {
        "vehicle_id": str(target_vehicle_id),
        "initial_amount": float(offer_amount),
        "message": "I want to buy this car."
    }
    
    response = buyer_client.post('/api/v1/negotiations/', req_data)
    if response.status_code != 201:
        log(f"Make offer failed: {response.data}", "ERROR")
        return False
    
    negotiation_id = response.data['id']
    log(f"Offer created: ID {negotiation_id}", "SUCCESS")
    
    # 2. Dealer View & Accept
    response = dealer_client.get(f'/api/v1/negotiations/{negotiation_id}/')
    if response.status_code != 200:
        log("Dealer could not fetch negotiation", "ERROR")
        return False
        
    # Accept
    response = dealer_client.post(f'/api/v1/negotiations/{negotiation_id}/accept/')
    if response.status_code != 200:
        log(f"Dealer accept failed: {response.data}", "ERROR")
        return False
    log("Offer accepted by Dealer", "SUCCESS")
    
    # 3. Verify Status
    old_status = vehicle_1.status
    vehicle_1.refresh_from_db()
    
    neg = Negotiation.objects.get(id=negotiation_id)
    if neg.status != 'accepted':
         log(f"Negotiation status mismatch. Expected 'accepted', got '{neg.status}'", "ERROR")
         return False

    if vehicle_1.status != 'pending_sale':
        log(f"Vehicle status mismatch. Expected 'pending_sale', got '{vehicle_1.status}' (Was: {old_status})", "ERROR")
        return False
    
    log("Vehicle correctly marked as Pending Sale", "SUCCESS")
    
    # ==========================================
    # SCENARIO 5: Negative Testing (Offer on Pending)
    # ==========================================
    log("5. Negative Test: Offer on Pending Vehicle", "HEADER")
    
    req_data = {
        "vehicle_id": str(target_vehicle_id),
        "initial_amount": float(offer_amount),
        "message": "I will pay more!"
    }
    response = buyer_client.post('/api/v1/negotiations/', req_data)
    
    if response.status_code == 400:
        log("Rejected offer on pending vehicle (Correct 400 Bad Request)", "SUCCESS")
    else:
        log(f"Unexpected status code: {response.status_code}", "ERROR")
        return False

    log("==========================================", "HEADER")
    log("E2E VERIFICATION PASSED SUCCESSFULLY", "SUCCESS")
    log("==========================================", "HEADER")
    return True

if __name__ == "__main__":
    try:
        success = run_e2e_verification()
        if not success:
            sys.exit(1)
    except Exception as e:
        log(f"Fatal Error: {str(e)}", "ERROR")
        import traceback
        traceback.print_exc()
        sys.exit(1)
