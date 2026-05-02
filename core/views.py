import json
from django.http import JsonResponse, HttpResponseNotAllowed
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import get_object_or_404
from .models import *
from core.models import CustomUser


# Helper: parse JSON body
def parse_request(request):
    try:
        return json.loads(request.body.decode('utf-8'))
    except:
        return {}

# -------------------- 🐶 PET CRUD --------------------
@csrf_exempt
def pet_list_create(request):
    if request.method == 'GET':
        pets = list(Pet.objects.values())
        return JsonResponse(pets, safe=False)
    
    elif request.method == 'POST':
        data = parse_request(request)
        
        # Handle ForeignKey for Shelter
        shelter_id = data.pop('Shelter', None)
        if shelter_id:
            try:
                shelter = Shelter.objects.get(pk=shelter_id)
                data['Shelter'] = shelter
            except Shelter.DoesNotExist:
                return JsonResponse({'error': 'Shelter not found'}, status=400)

        pet = Pet.objects.create(**data)
        return JsonResponse({'message': 'Pet created', 'id': pet.id})
    
    return HttpResponseNotAllowed(['GET', 'POST'])


@csrf_exempt
def pet_detail(request, pk):
    pet = get_object_or_404(Pet, pk=pk)

    if request.method == 'GET':
        return JsonResponse({
            'id': pet.pk,
            'Name': pet.Name,
            'Breed': pet.Breed,
            'Age': pet.Age,
            'Gender': pet.Gender,
            'Status': pet.Status,
            'Shelter': pet.Shelter.id if pet.Shelter else None
        })

    elif request.method == 'PUT':
        data = parse_request(request)
        for key, value in data.items():
            setattr(pet, key, value)
        pet.save()
        return JsonResponse({'message': 'Pet updated'})

    elif request.method == 'DELETE':
        pet.delete()
        return JsonResponse({'message': 'Pet deleted'})

    return HttpResponseNotAllowed(['GET', 'PUT', 'DELETE'])


# -------------------- 🏠 SHELTER CRUD --------------------
@csrf_exempt
def shelter_list_create(request):
    if request.method == 'GET':
        shelters = list(Shelter.objects.values())
        return JsonResponse(shelters, safe=False)
    elif request.method == 'POST':
        data = parse_request(request)
        shelter = Shelter.objects.create(**data)
        return JsonResponse({'message': 'Shelter created', 'id': shelter.id})
    return HttpResponseNotAllowed(['GET', 'POST'])


@csrf_exempt
def shelter_detail(request, pk):
    shelter = get_object_or_404(Shelter, pk=pk)
    if request.method == 'GET':
        return JsonResponse({'id': shelter.id, 'Name': shelter.Name, 'Location': shelter.Location, 'Contact': shelter.Contact})
    elif request.method == 'PUT':
        data = parse_request(request)
        for key, value in data.items():
            setattr(shelter, key, value)
        shelter.save()
        return JsonResponse({'message': 'Shelter updated'})
    elif request.method == 'DELETE':
        shelter.delete()
        return JsonResponse({'message': 'Shelter deleted'})
    return HttpResponseNotAllowed(['GET', 'PUT', 'DELETE'])


# -------------------- 👤 USER CRUD --------------------
@csrf_exempt
def user_list_create(request):
    if request.method == 'GET':
        users = list(CustomUser.objects.values('id', 'username', 'email', 'Role', 'CreatedAt'))
        return JsonResponse(users, safe=False)
    elif request.method == 'POST':
        data = parse_request(request)
        user = CustomUser.objects.create(**data)
        return JsonResponse({'message': 'User created', 'id': user.id})
    return HttpResponseNotAllowed(['GET', 'POST'])


@csrf_exempt
def user_detail(request, pk):
    user = get_object_or_404(CustomUser, pk=pk)
    if request.method == 'GET':
        return JsonResponse({'id': user.id, 'username': user.username, 'email': user.email, 'Role': user.Role})
    elif request.method == 'PUT':
        data = parse_request(request)
        for key, value in data.items():
            setattr(user, key, value)
        user.save()
        return JsonResponse({'message': 'User updated'})
    elif request.method == 'DELETE':
        user.delete()
        return JsonResponse({'message': 'User deleted'})
    return HttpResponseNotAllowed(['GET', 'PUT', 'DELETE'])


# -------------------- 🐾 ADOPTION CRUD --------------------
@csrf_exempt
def adoption_list_create(request):
    if request.method == 'GET':
        adoptions = list(Adoption.objects.values())
        return JsonResponse(adoptions, safe=False)
    elif request.method == 'POST':
        data = parse_request(request)
        
        # Handle ForeignKey for Pet
        pet_id = data.pop('Pet', None)
        pet = None # Initialize pet to None
        if pet_id:
            try:
                pet = Pet.objects.get(pk=pet_id)
                data['Pet'] = pet
            except Pet.DoesNotExist:
                return JsonResponse({'error': 'Pet not found'}, status=400)
        
        # Handle ForeignKey for Adopter (User)
        adopter_id = data.pop('Adopter', None)
        if adopter_id:
            try:
                adopter = CustomUser.objects.get(pk=adopter_id)
                data['Adopter'] = adopter
            except CustomUser.DoesNotExist:
                return JsonResponse({'error': 'Adopter (User) not found'}, status=400)

        adoption = Adoption.objects.create(**data)

        # Update pet status to 'adopted'
        if pet:
            pet.Status = 'adopted'
            pet.save()

        return JsonResponse({'message': 'Adoption created', 'id': adoption.id})
    return HttpResponseNotAllowed(['GET', 'POST'])


@csrf_exempt
def adoption_detail(request, pk):
    adoption = get_object_or_404(Adoption, pk=pk)
    if request.method == 'GET':
        return JsonResponse({
            'id': adoption.id, 
            'Pet': adoption.Pet.id, 
            'Adopter': adoption.Adopter.id,
            'AdoptionDate': adoption.AdoptionDate,
            'Status': adoption.Status
        })
    elif request.method == 'PUT':
        data = parse_request(request)
        for key, value in data.items():
            setattr(adoption, key, value)
        if data.get('Status', '').lower() == 'complete':
            pet = adoption.Pet
            pet.Status = 'Adopted'
            pet.save()
        adoption.save()
        return JsonResponse({'message': 'Adoption updated'})
    elif request.method == 'DELETE':
        adoption.delete()
        return JsonResponse({'message': 'Adoption deleted'})
    return HttpResponseNotAllowed(['GET', 'PUT', 'DELETE'])


# -------------------- 🧑‍⚕️ VET CRUD --------------------
@csrf_exempt
def vet_list_create(request):
    if request.method == 'GET':
        vets = list(Veterinarian.objects.values())
        return JsonResponse(vets, safe=False)
    elif request.method == 'POST':
        data = parse_request(request)
        vet = Veterinarian.objects.create(**data)
        return JsonResponse({'message': 'Vet created', 'id': vet.id})
    return HttpResponseNotAllowed(['GET', 'POST'])


@csrf_exempt
def vet_detail(request, pk):
    vet = get_object_or_404(Veterinarian, pk=pk)
    if request.method == 'GET':
        return JsonResponse({'id': vet.id, 'Name': vet.Name, 'Specialization': vet.Specialization, 'Contact': vet.Contact})
    elif request.method == 'PUT':
        data = parse_request(request)
        for key, value in data.items():
            setattr(vet, key, value)
        vet.save()
        return JsonResponse({'message': 'Vet updated'})
    elif request.method == 'DELETE':
        vet.delete()
        return JsonResponse({'message': 'Vet deleted'})
    return HttpResponseNotAllowed(['GET', 'PUT', 'DELETE'])


# -------------------- 🩺 MEDICAL RECORD CRUD --------------------
@csrf_exempt
def medicalrecord_list_create(request):
    if request.method == 'GET':
        records = list(MedicalRecord.objects.values())
        return JsonResponse(records, safe=False)
    elif request.method == 'POST':
        data = parse_request(request)
        
        # Handle ForeignKey for Pet
        pet_id = data.pop('Pet', None)
        if pet_id:
            try:
                pet = Pet.objects.get(pk=pet_id)
                data['Pet'] = pet
            except Pet.DoesNotExist:
                return JsonResponse({'error': 'Pet not found'}, status=400)

        record = MedicalRecord.objects.create(**data)
        return JsonResponse({'message': 'MedicalRecord created', 'id': record.id})
    return HttpResponseNotAllowed(['GET', 'POST'])


# -------------------- 📅 VET APPOINTMENT CRUD --------------------
@csrf_exempt
def vetappointment_list_create(request):
    if request.method == 'GET':
        appointments = list(VetAppointment.objects.values())
        return JsonResponse(appointments, safe=False)
    elif request.method == 'POST':
        data = parse_request(request)
        
        # Handle ForeignKey for Pet
        pet_id = data.pop('Pet', None)
        if pet_id:
            try:
                pet = Pet.objects.get(pk=pet_id)
                data['Pet'] = pet
            except Pet.DoesNotExist:
                return JsonResponse({'error': 'Pet not found'}, status=400)
        
        # Handle ForeignKey for Vet
        vet_id = data.pop('Vet', None)
        if vet_id:
            try:
                vet = Veterinarian.objects.get(pk=vet_id)
                data['Vet'] = vet
            except Veterinarian.DoesNotExist:
                return JsonResponse({'error': 'Veterinarian not found'}, status=400)

        appointment = VetAppointment.objects.create(**data)
        return JsonResponse({'message': 'VetAppointment created', 'id': appointment.id})
    return HttpResponseNotAllowed(['GET', 'POST'])


@csrf_exempt
def medicalrecord_detail(request, pk):
    record = get_object_or_404(MedicalRecord, pk=pk)
    if request.method == 'GET':
        return JsonResponse({
            'id': record.id,
            'Pet': record.Pet.id,
            'Vaccine': record.Vaccine,
            'Treatment': record.Treatment,
            'RecordDate': record.RecordDate
        })
    elif request.method == 'PUT':
        data = parse_request(request)
        for key, value in data.items():
            setattr(record, key, value)
        record.save()
        return JsonResponse({'message': 'MedicalRecord updated'})
    elif request.method == 'DELETE':
        record.delete()
        return JsonResponse({'message': 'MedicalRecord deleted'})
    return HttpResponseNotAllowed(['GET', 'PUT', 'DELETE'])


@csrf_exempt
def vetappointment_detail(request, pk):
    appointment = get_object_or_404(VetAppointment, pk=pk)
    if request.method == 'GET':
        return JsonResponse({
            'id': appointment.id,
            'Pet': appointment.Pet.id,
            'Vet': appointment.Vet.id,
            'AppointmentDate': appointment.AppointmentDate,
            'Reason': appointment.Reason,
            'Notes': appointment.Notes
        })
    elif request.method == 'PUT':
        data = parse_request(request)
        for key, value in data.items():
            setattr(appointment, key, value)
        appointment.save()
        return JsonResponse({'message': 'VetAppointment updated'})
    elif request.method == 'DELETE':
        appointment.delete()
        return JsonResponse({'message': 'VetAppointment deleted'})
    return HttpResponseNotAllowed(['GET', 'PUT', 'DELETE'])


# -------------------- 💰 DONATION CRUD --------------------
@csrf_exempt
def donation_list_create(request):
    if request.method == 'GET':
        donations = list(Donation.objects.values())
        return JsonResponse(donations, safe=False)
    elif request.method == 'POST':
        data = parse_request(request)
        
        # Handle ForeignKey for Shelter
        shelter_id = data.pop('Shelter', None)
        if shelter_id:
            try:
                shelter = Shelter.objects.get(pk=shelter_id)
                data['Shelter'] = shelter
            except Shelter.DoesNotExist:
                return JsonResponse({'error': 'Shelter not found'}, status=400)
        
        # Handle ForeignKey for User
        user_id = data.pop('User', None)
        if user_id:
            try:
                user = CustomUser.objects.get(pk=user_id)
                data['User'] = user
            except CustomUser.DoesNotExist:
                return JsonResponse({'error': 'User not found'}, status=400)

        donation = Donation.objects.create(**data)
        return JsonResponse({'message': 'Donation created', 'id': donation.id})
    return HttpResponseNotAllowed(['GET', 'POST'])


@csrf_exempt
def donation_detail(request, pk):
    donation = get_object_or_404(Donation, pk=pk)
    if request.method == 'GET':
        return JsonResponse({
            'id': donation.id,
            'Shelter': donation.Shelter.id,
            'User': donation.User.id,
            'Amount': donation.Amount,
            'DonationDate': donation.DonationDate
        })
    elif request.method == 'PUT':
        data = parse_request(request)
        for key, value in data.items():
            setattr(donation, key, value)
        donation.save()
        return JsonResponse({'message': 'Donation updated'})
    elif request.method == 'DELETE':
        donation.delete()
        return JsonResponse({'message': 'Donation deleted'})
    return HttpResponseNotAllowed(['GET', 'PUT', 'DELETE'])