from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import logging

from django.contrib.auth import authenticate, login
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from functools import wraps

from .models import (
    CustomUser, Shelter, Pet, Adoption, Donation,
    Veterinarian, VetAppointment, MedicalRecord
)


# ---------------------------------------------------
# AUTH DECORATORS
# ---------------------------------------------------

def _authenticate_request(request):
    """
    Ensure request.user is populated either from Django session
    or from a JWT access token sent via Authorization header.
    """
    if request.user.is_authenticated:
        return request.user

    auth_header = request.META.get("HTTP_AUTHORIZATION", "")
    if auth_header.lower().startswith("bearer "):
        token_str = auth_header.split(" ", 1)[1].strip()
        if token_str:
            try:
                access_token = AccessToken(token_str)
                user_id = access_token.get("user_id")
                user = CustomUser.objects.get(id=user_id)
                request.user = user
                return user
            except Exception as exc:
                logging.getLogger(__name__).warning("Token authentication failed: %s", exc)
                return None
    return None


def login_required_api(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        user = _authenticate_request(request)
        if not user:
            return JsonResponse({"error": "Authentication required"}, status=401)
        return view_func(request, *args, **kwargs)
    return wrapper


def admin_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        user = _authenticate_request(request)
        if not user:
            return JsonResponse({"error": "Authentication required"}, status=401)

        # Accept users that either have the role flag set to ADMIN
        # or have Django staff/superuser flags. Some deployments may
        # create admin users via Django admin (which sets is_staff/is_superuser)
        # instead of populating the custom `role` field. Allow both so
        # admin accounts work even if model-level permissions haven't
        # been explicitly assigned.
        try:
            is_admin_role = str(user.role).upper() == "ADMIN"
        except Exception:
            is_admin_role = False

        if not (is_admin_role or getattr(user, "is_staff", False) or getattr(user, "is_superuser", False)):
            return JsonResponse({"error": "Admin access only"}, status=403)

        return view_func(request, *args, **kwargs)
    return wrapper


# ---------------------------------------------------
# AUTH ENDPOINTS
# ---------------------------------------------------

@csrf_exempt
def register(request):
    if request.method == "POST":
        data = json.loads(request.body)

        username = data.get("username")
        password = data.get("password")
        email = data.get("email")

        if CustomUser.objects.filter(username=username).exists():
            return JsonResponse({"error": "Username already exists"}, status=400)

        user = CustomUser.objects.create_user(
            username=username,
            email=email,
            password=password,
            role="ADOPTER"  # default role
        )

        return JsonResponse({"message": "Registration successful"})


@csrf_exempt
def user_login(request):
    if request.method == "POST":
        data = json.loads(request.body)

        username = data.get("username")
        password = data.get("password")

        user = authenticate(username=username, password=password)

        if user is None:
            return JsonResponse({"error": "Invalid username or password"}, status=400)

        # Create JWT tokens for the authenticated user
        refresh = RefreshToken.for_user(user)

        # Optionally also log in the user to create a session cookie
        login(request, user)

        return JsonResponse({
            "message": "Login successful",
            "role": user.role,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        })


# ---------------------------------------------------
# USER READ-ONLY ENDPOINTS
# ---------------------------------------------------

@csrf_exempt
def shelters_view(request):
    if request.method == "GET":
        return JsonResponse(list(Shelter.objects.values()), safe=False)


@csrf_exempt
def shelter_view(request, id):
    try:
        shelter = Shelter.objects.get(id=id)
    except Shelter.DoesNotExist:
        return JsonResponse({"error": "Shelter not found"}, status=404)

    if request.method == "GET":
        return JsonResponse({
            "id": shelter.id,
            "Name": shelter.Name,
            "Location": shelter.Location,
            "Contact": shelter.Contact,
        })


@csrf_exempt
def pets(request):
    if request.method == "GET":
        return JsonResponse(list(Pet.objects.values()), safe=False)


@csrf_exempt
def pet_detail(request, id):
    try:
        pet = Pet.objects.get(id=id)
    except Pet.DoesNotExist:
        return JsonResponse({"error": "Pet not found"}, status=404)

    if request.method == "GET":
        return JsonResponse({
            "id": pet.id,
            "Name": pet.Name,
            "Species": pet.Species,
            "Breed": pet.Breed,
            "Age": pet.Age,
            "Gender": pet.Gender,
            "Status": pet.Status,
            "Shelter": pet.Shelter_id,
        })


# ---------------------------------------------------
# USER ACTION ENDPOINTS
# ---------------------------------------------------

@csrf_exempt
@login_required_api
def adoptions(request):
    if request.method == "GET":
        if request.user.role == "ADMIN":
            data = list(Adoption.objects.values())
        else:
            data = list(Adoption.objects.filter(Adopter=request.user).values())

        return JsonResponse(data, safe=False)

    if request.method == "POST":
        data = json.loads(request.body)

        adoption = Adoption.objects.create(
            Pet_id=data.get("Pet"),
            Adopter=request.user,
            Status="pending"
        )

        return JsonResponse({"message": "Adoption request created", "id": adoption.id})


@csrf_exempt
@admin_required
def adoption_detail_admin(request, id):
    try:
        adoption = Adoption.objects.get(id=id)
    except Adoption.DoesNotExist:
        return JsonResponse({"error": "Adoption not found"}, status=404)

    if request.method == "GET":
        return JsonResponse({
            "id": adoption.id,
            "Pet": adoption.Pet_id,
            "Adopter": adoption.Adopter_id,
            "Status": adoption.Status,
            "AdoptionDate": adoption.AdoptionDate,
        })

    if request.method == "PUT":
        data = json.loads(request.body or "{}")
        status_value = data.get("Status") or data.get("status")
        if status_value:
            adoption.Status = status_value
            adoption.save()
            if status_value.lower() == "approved":
                pet = adoption.Pet
                pet.Status = "adopted"
                pet.save()
        return JsonResponse({"message": "Adoption updated"})

    if request.method == "DELETE":
        adoption.delete()
        return JsonResponse({"message": "Adoption deleted"})

    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
@login_required_api
def donations(request):
    if request.method == "GET":
        if request.user.role == "ADMIN":
            data = list(Donation.objects.values())
        else:
            data = list(Donation.objects.filter(User=request.user).values())

        return JsonResponse(data, safe=False)

    if request.method == "POST":
        data = json.loads(request.body)

        donation = Donation.objects.create(
            Shelter_id=data.get("Shelter"),
            User=request.user,
            Amount=data.get("Amount")
        )

        return JsonResponse({"message": "Donation recorded", "id": donation.id})


# ---------------------------------------------------
# USER VIEW: VETS
# ---------------------------------------------------

@csrf_exempt
def vets_view(request):
    if request.method == "GET":
        return JsonResponse(list(Veterinarian.objects.values()), safe=False)


# ---------------------------------------------------
# USER VIEW: THEIR APPOINTMENTS
# ---------------------------------------------------

@csrf_exempt
@login_required_api
def my_appointments(request):
    if request.method == "GET":

        user_pet_ids = Adoption.objects.filter(
            Adopter=request.user,
            Status="approved"
        ).values_list("Pet_id", flat=True)

        data = list(
            VetAppointment.objects.filter(Pet_id__in=user_pet_ids).values()
        )

        return JsonResponse(data, safe=False)


# ---------------------------------------------------
# USER VIEW: THEIR MEDICAL RECORDS
# ---------------------------------------------------

@csrf_exempt
@login_required_api
def my_medical_records(request):
    if request.method == "GET":

        user_pet_ids = Adoption.objects.filter(
            Adopter=request.user,
            Status="approved"
        ).values_list("Pet_id", flat=True)

        data = list(
            MedicalRecord.objects.filter(Pet_id__in=user_pet_ids).values()
        )

        return JsonResponse(data, safe=False)


# ---------------------------------------------------
# ADMIN-ONLY CRUD ENDPOINTS
# ---------------------------------------------------

# ---------- Shelters (Admin) ----------

@csrf_exempt
@admin_required
def shelters_admin(request):
    if request.method == "GET":
        return JsonResponse(list(Shelter.objects.values()), safe=False)

    if request.method == "POST":
        data = json.loads(request.body)
        shelter = Shelter.objects.create(**data)
        return JsonResponse({"message": "Shelter created", "id": shelter.id})


@csrf_exempt
@admin_required
def shelter_detail_admin(request, id):
    try:
        shelter = Shelter.objects.get(id=id)
    except Shelter.DoesNotExist:
        return JsonResponse({"error": "Shelter not found"}, status=404)

    if request.method == "PUT":
        data = json.loads(request.body)
        for k, v in data.items():
            setattr(shelter, k, v)
        shelter.save()
        return JsonResponse({"message": "Shelter updated"})

    if request.method == "DELETE":
        shelter.delete()
        return JsonResponse({"message": "Shelter deleted"})


# ---------- Pets (Admin) ----------

@csrf_exempt
@admin_required
def pets_admin(request):
    if request.method == "GET":
        return JsonResponse(list(Pet.objects.values()), safe=False)

    if request.method == "POST":
        data = json.loads(request.body or "{}")
        pet_data = {
            "Name": data.get("Name") or data.get("name") or "",
            "Species": data.get("Species") or data.get("species") or "",
            "Breed": data.get("Breed") or data.get("breed") or "",
            "Gender": data.get("Gender") or data.get("gender") or "Unknown",
            "Status": data.get("Status") or data.get("status") or "available",
        }
        age_value = data.get("Age") or data.get("age")
        try:
            pet_data["Age"] = int(age_value)
        except (TypeError, ValueError):
            pet_data["Age"] = 0
        shelter_id = data.get("Shelter_id") or data.get("Shelter") or data.get("shelter_id") or data.get("shelter")
        if shelter_id:
            try:
                pet_data["Shelter_id"] = int(shelter_id)
            except (TypeError, ValueError):
                pet_data["Shelter_id"] = shelter_id
        pet = Pet.objects.create(**pet_data)
        return JsonResponse({"message": "Pet created", "id": pet.id})

    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
@admin_required
def pet_detail_admin(request, id):
    try:
        pet = Pet.objects.get(id=id)
    except Pet.DoesNotExist:
        return JsonResponse({"error": "Pet not found"}, status=404)

    if request.method == "GET":
        return JsonResponse({
            "id": pet.id,
            "Name": pet.Name,
            "Species": pet.Species,
            "Breed": pet.Breed,
            "Age": pet.Age,
            "Gender": pet.Gender,
            "Status": pet.Status,
            "Shelter": pet.Shelter_id,
        })

    if request.method == "PUT":
        data = json.loads(request.body or "{}")
        for k, v in data.items():
            if k in {"Shelter", "shelter", "Shelter_id", "shelter_id"}:
                setattr(pet, "Shelter_id", v)
            elif k in {"Age", "age"}:
                try:
                    setattr(pet, "Age", int(v))
                except (TypeError, ValueError):
                    continue
            else:
                setattr(pet, k, v)
        pet.save()
        return JsonResponse({"message": "Pet updated"})

    if request.method == "DELETE":
        pet.delete()
        return JsonResponse({"message": "Pet deleted"})

    return JsonResponse({"error": "Method not allowed"}, status=405)


# ---------- Veterinarians (Admin) ----------

@csrf_exempt
@admin_required
def vets(request):
    if request.method == "GET":
        return JsonResponse(list(Veterinarian.objects.values()), safe=False)

    if request.method == "POST":
        data = json.loads(request.body)
        vet = Veterinarian.objects.create(**data)
        return JsonResponse({"message": "Vet created", "id": vet.id})


# ---------- Appointments (Admin) ----------

@csrf_exempt
@admin_required
def appointments(request):
    if request.method == "GET":
        return JsonResponse(list(VetAppointment.objects.values()), safe=False)

    if request.method == "POST":
        data = json.loads(request.body)
        app = VetAppointment.objects.create(**data)
        return JsonResponse({"message": "Appointment created", "id": app.id})


# ---------- Medical Records (Admin) ----------

@csrf_exempt
@admin_required
def medical_records(request):
    if request.method == "GET":
        return JsonResponse(list(MedicalRecord.objects.values()), safe=False)

    if request.method == "POST":
        data = json.loads(request.body)
        record = MedicalRecord.objects.create(**data)
        return JsonResponse({"message": "Medical record created", "id": record.id})
